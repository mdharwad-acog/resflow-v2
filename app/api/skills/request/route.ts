// POST /api/skills/request
// Allowed Roles: employee, project_manager, hr_executive
// Accept: { emp_id, skill_id, proficiency_level }
// Validation:
//   - employee/project_manager: Can request WHERE emp_id = current_user_id, else return 403
//   - hr_executive: Can request for any employee
// Check if already exists: SELECT 1 FROM employee_skills WHERE emp_id = ? AND skill_id = ?
// If exists, return 400 "Skill already requested or approved for this employee"
// INSERT INTO employee_skills (skill_id, emp_id, proficiency_level, approved_by, approved_at) VALUES (?, ?, ?, NULL, NULL)
// Return: { id, emp_id, skill_id, proficiency_level, status: 'PENDING', created_at }

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser, checkRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import {
  ErrorResponses,
  validateRequiredFields,
  successResponse,
} from "@/lib/api-helpers";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    const body = await req.json();
    const { emp_id, skill_id, proficiency_level } = body;

    // Validate required fields
    const missingFields = validateRequiredFields(body, [
      "emp_id",
      "skill_id",
      "proficiency_level",
    ]);
    if (missingFields) {
      return ErrorResponses.badRequest(missingFields);
    }

    // Validation: employee/project_manager can only request for themselves
    if (
      checkRole(user, ["employee", "project_manager"]) &&
      emp_id !== user.id
    ) {
      return ErrorResponses.accessDenied();
    }

    // Check if skill already requested or approved
    const [existing] = await db
      .select()
      .from(schema.employeeSkills)
      .where(
        and(
          eq(schema.employeeSkills.emp_id, emp_id),
          eq(schema.employeeSkills.skill_id, skill_id),
        ),
      );

    if (existing) {
      return ErrorResponses.badRequest(
        "Skill already requested or approved for this employee",
      );
    }

    // Insert employee skill
    const [employeeSkill] = await db
      .insert(schema.employeeSkills)
      .values({
        emp_id,
        skill_id,
        proficiency_level,
        approved_by: null,
        approved_at: null,
      })
      .returning();

    // Create audit log
    await createAuditLog({
      entity_type: "EMPLOYEE_SKILL",
      entity_id: employeeSkill.id,
      operation: "INSERT",
      changed_by: user.id,
      changed_fields: {
        emp_id,
        skill_id,
        proficiency_level,
      },
    });

    return successResponse(
      {
        id: employeeSkill.id,
        emp_id: employeeSkill.emp_id,
        skill_id: employeeSkill.skill_id,
        proficiency_level: employeeSkill.proficiency_level,
        status: "PENDING",
        created_at: employeeSkill.created_at,
      },
      201,
    );
  } catch (error) {
    console.error("Error requesting skill:", error);
    return ErrorResponses.internalError();
  }
}
