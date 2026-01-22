// POST /api/demands/approve
// Allowed Roles: hr_executive
// Check JWT role = 'hr_executive', else return 403
// Accept: { id, action: "approve" | "reject" }
// Get demand: SELECT id, demand_status FROM resource_demands WHERE id = ?
// If action = "approve":
//   - UPDATE resource_demands SET demand_status = 'FULFILLED' WHERE id = ?
// If action = "reject":
//   - UPDATE resource_demands SET demand_status = 'CANCELLED' WHERE id = ?
// INSERT audit log with operation='UPDATE', changed_by=current_user_id
// Return: { id, demand_status }
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

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    if (!checkRole(user, ["hr_executive"])) {
      return ErrorResponses.accessDenied();
    }

    const body = await req.json();
    const { id, action } = body;

    // Validate required fields
    const missingFields = validateRequiredFields(body, ["id", "action"]);
    if (missingFields) {
      return ErrorResponses.badRequest(missingFields);
    }

    // Validate action
    if (action !== "approve" && action !== "reject") {
      return ErrorResponses.badRequest('action must be "approve" or "reject"');
    }

    // Get demand
    const [demand] = await db
      .select()
      .from(schema.resourceDemands)
      .where(eq(schema.resourceDemands.id, id));

    if (!demand) {
      return ErrorResponses.notFound("Demand");
    }

    // Determine new status
    const newStatus = action === "approve" ? "FULFILLED" : "CANCELLED";

    // Update demand status
    const [updated] = await db
      .update(schema.resourceDemands)
      .set({
        demand_status: newStatus,
      })
      .where(eq(schema.resourceDemands.id, id))
      .returning();

    // Create audit log
    await createAuditLog({
      entity_type: "DEMAND",
      entity_id: id,
      operation: "UPDATE",
      changed_by: user.id,
      changed_fields: {
        demand_status: {
          old: demand.demand_status,
          new: newStatus,
        },
        action,
      },
    });

    return successResponse({
      id: updated.id,
      demand_status: updated.demand_status,
    });
  } catch (error) {
    console.error("Error approving/rejecting demand:", error);
    return ErrorResponses.internalError();
  }
}
