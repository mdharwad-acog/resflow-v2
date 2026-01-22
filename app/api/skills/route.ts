import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser, checkRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import {
  checkUniqueness,
  getPMTeamMemberIds,
  isInPMTeam,
  getCount,
} from "@/lib/db-helpers";
import {
  ErrorResponses,
  validateRequiredFields,
  successResponse,
} from "@/lib/api-helpers";
import { eq, and, isNull, sql } from "drizzle-orm";

// POST /api/skills/create - Create new skill
async function handleCreate(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!checkRole(user, ["hr_executive"])) {
    return ErrorResponses.accessDenied();
  }

  const body = await req.json();
  const { skill_name, skill_department } = body;

  // Validate required fields
  const missingFields = validateRequiredFields(body, [
    "skill_name",
    "skill_department",
  ]);
  if (missingFields) {
    return ErrorResponses.badRequest(missingFields);
  }

  // Check uniqueness
  const exists = await checkUniqueness(schema.skills, "skill_name", skill_name);
  if (exists) {
    return ErrorResponses.badRequest("skill_name already exists");
  }

  // Insert skill
  const [skill] = await db
    .insert(schema.skills)
    .values({
      skill_name,
      skill_department,
    })
    .returning();

  // Create audit log
  await createAuditLog({
    entity_type: "SKILL",
    entity_id: skill.skill_id,
    operation: "INSERT",
    changed_by: user.id,
    changed_fields: {
      skill_name,
      skill_department,
    },
  });

  return successResponse(
    {
      skill_id: skill.skill_id,
      skill_name: skill.skill_name,
      skill_department: skill.skill_department,
      created_at: skill.created_at,
    },
    201,
  );
}

// GET /api/skills/list - List all skills with pagination
async function handleList(req: NextRequest) {
  await getCurrentUser(req); // Verify authentication

  const { searchParams } = new URL(req.url);
  const skill_department = searchParams.get("skill_department");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  // Build where clause
  const whereClause = skill_department
    ? eq(schema.skills.skill_department, skill_department)
    : undefined;

  // Get total count
  const total = await getCount(schema.skills, whereClause);

  // Get skills with pagination
  const query = db.select().from(schema.skills).limit(limit).offset(offset);

  const skills = whereClause ? await query.where(whereClause) : await query;

  return successResponse({ skills, total, page, limit });
}

// DELETE /api/skills/delete - Delete skill
async function handleDelete(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!checkRole(user, ["hr_executive"])) {
    return ErrorResponses.accessDenied();
  }

  const body = await req.json();
  const { skill_id } = body;

  // Validate required fields
  const missingFields = validateRequiredFields(body, ["skill_id"]);
  if (missingFields) {
    return ErrorResponses.badRequest(missingFields);
  }

  // Check if skill exists
  const [existingSkill] = await db
    .select()
    .from(schema.skills)
    .where(eq(schema.skills.skill_id, skill_id));

  if (!existingSkill) {
    return ErrorResponses.notFound("Skill");
  }

  // Check if skill is assigned to employees
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.employeeSkills)
    .where(eq(schema.employeeSkills.skill_id, skill_id));

  if (count > 0) {
    return ErrorResponses.badRequest(
      `Cannot delete skill. Assigned to ${count} employees`,
    );
  }

  // Delete skill
  await db.delete(schema.skills).where(eq(schema.skills.skill_id, skill_id));

  // Create audit log
  await createAuditLog({
    entity_type: "SKILL",
    entity_id: skill_id,
    operation: "DELETE",
    changed_by: user.id,
    changed_fields: {},
  });

  return successResponse({ message: "Skill deleted successfully" });
}

export async function POST(req: NextRequest) {
  try {
    return await handleCreate(req);
  } catch (error) {
    console.error("Error creating skill:", error);
    return ErrorResponses.internalError();
  }
}

export async function GET(req: NextRequest) {
  try {
    return await handleList(req);
  } catch (error) {
    console.error("Error fetching skills:", error);
    return ErrorResponses.internalError();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    return await handleDelete(req);
  } catch (error) {
    console.error("Error deleting skill:", error);
    return ErrorResponses.internalError();
  }
}
