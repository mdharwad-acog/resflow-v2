import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser, checkRole } from "@/lib/auth";
import { checkUniqueness } from "@/lib/db-helpers";
import {
  ErrorResponses,
  validateRequiredFields,
  successResponse,
} from "@/lib/api-helpers";

// GET /api/departments
export async function GET(req: NextRequest) {
  return handleListDepartments(req);
}

// POST /api/departments
export async function POST(req: NextRequest) {
  return handleCreateDepartment(req);
}

/**
 * GET /api/departments/list
 * List all departments
 */
async function handleListDepartments(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    // All authenticated users can view departments
    if (!checkRole(user, ["employee", "project_manager", "hr_executive"])) {
      return ErrorResponses.accessDenied();
    }

    // Fetch all departments
    const departments = await db
      .select({
        id: schema.departments.id,
        name: schema.departments.name,
        designations: schema.departments.designations,
      })
      .from(schema.departments)
      .orderBy(schema.departments.name);

    return successResponse({ departments });
  } catch (error) {
    if (error instanceof Error && error.message.includes("token")) {
      return ErrorResponses.unauthorized("Invalid or expired token");
    }
    console.error("Error fetching departments:", error);
    return ErrorResponses.internalError();
  }
}

/**
 * POST /api/departments/create
 * Create new department
 */
async function handleCreateDepartment(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    // Only HR executives can create departments
    if (!checkRole(user, ["hr_executive"])) {
      return ErrorResponses.accessDenied();
    }

    const body = await req.json();
    const { name, designations } = body;

    // Validate required fields
    const missingFields = validateRequiredFields(body, ["name"]);
    if (missingFields) {
      return ErrorResponses.badRequest(missingFields);
    }

    // Check name uniqueness
    const isUnique = await checkUniqueness(schema.departments, "name", name);

    if (!isUnique) {
      return ErrorResponses.conflict("Department name already exists");
    }

    // Insert new department
    const [newDepartment] = await db
      .insert(schema.departments)
      .values({
        name,
        designations: designations || null,
      })
      .returning();

    return successResponse(
      {
        id: newDepartment.id,
        name: newDepartment.name,
        designations: newDepartment.designations,
      },
      201,
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("token")) {
      return ErrorResponses.unauthorized("Invalid or expired token");
    }
    console.error("Error creating department:", error);
    return ErrorResponses.internalError();
  }
}
