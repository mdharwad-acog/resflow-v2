// PATCH /api/tasks/complete
// Allowed Roles: employee, project_manager, hr_executive
// Accept: { id }
// Get task: SELECT owner_id, status FROM tasks WHERE id = ?
// Validation:
//   - employee/project_manager: Can complete WHERE owner_id = current_user_id, else return 403 "Not your task"
//   - hr_executive: Can complete any task
//   - status must be 'DUE', else return 400 "Task already completed"
// UPDATE tasks SET status = 'COMPLETED' WHERE id = ?
// INSERT audit log with operation='UPDATE', entity_type='TASK', changed_by=current_user_id
// Return: { id, status }
// Error 403 if access denied

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser, checkRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import {
  ErrorResponses,
  validateRequiredFields,
  successResponse,
} from "@/lib/api-helpers";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    const body = await req.json();
    const { id } = body;

    // Validate required fields
    const missingFields = validateRequiredFields(body, ["id"]);
    if (missingFields) {
      return ErrorResponses.badRequest(missingFields);
    }

    // Get task
    const [task] = await db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, id));

    if (!task) {
      return ErrorResponses.notFound("Task");
    }

    // Check if already completed
    if (task.status === "COMPLETED") {
      return ErrorResponses.badRequest("Task already completed");
    }

    // Check access based on role
    if (checkRole(user, ["employee", "project_manager"])) {
      // Employee/PM can only complete their own tasks
      if (task.owner_id !== user.id) {
        return ErrorResponses.badRequest("Not your task");
      }
    }
    // hr_executive can complete any task

    // Update task status
    const [updated] = await db
      .update(schema.tasks)
      .set({ status: "COMPLETED" })
      .where(eq(schema.tasks.id, id))
      .returning();

    // Create audit log
    await createAuditLog({
      entity_type: "TASK",
      entity_id: id,
      operation: "UPDATE",
      changed_by: user.id,
      changed_fields: {
        status: "COMPLETED",
      },
    });

    return successResponse({
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error("Error completing task:", error);
    return ErrorResponses.internalError();
  }
}
