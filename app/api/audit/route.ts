import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentUser, checkRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { getCount } from "@/lib/db-helpers";
import {
  ErrorResponses,
  validateRequiredFields,
  successResponse,
  getPaginationParams,
  buildAuditFilters,
} from "@/lib/api-helpers";
import { eq, and, desc, sql, gte, lt } from "drizzle-orm";

// GET /api/audit/list
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    // Only HR executives can view audit logs
    if (!checkRole(user, ["hr_executive"])) {
      return ErrorResponses.accessDenied();
    }

    const url = new URL(req.url);
    const { page, limit, offset } = getPaginationParams(url);

    // Build filters from query parameters
    const filters = buildAuditFilters(url.searchParams, {
      eq,
      and,
      gte,
      lt,
      sql,
    });

    // Get total count with filters
    const total = await getCount(
      schema.auditLogs,
      filters.length > 0 ? and(...filters) : undefined,
    );

    // Fetch audit logs with filters, join employees for changed_by_name
    const audits = await db
      .select({
        id: schema.auditLogs.id,
        entity_type: schema.auditLogs.entity_type,
        entity_id: schema.auditLogs.entity_id,
        operation: schema.auditLogs.operation,
        changed_by: schema.auditLogs.changed_by,
        changed_by_name: schema.employees.full_name,
        changed_at: schema.auditLogs.changed_at,
        changed_fields: schema.auditLogs.changed_fields,
      })
      .from(schema.auditLogs)
      .leftJoin(
        schema.employees,
        eq(schema.auditLogs.changed_by, schema.employees.id),
      )
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(schema.auditLogs.changed_at))
      .limit(limit)
      .offset(offset);

    return successResponse({
      audits,
      total,
      page,
      limit,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("token")) {
      return ErrorResponses.unauthorized("Invalid or expired token");
    }
    console.error("Error fetching audit logs:", error);
    return ErrorResponses.internalError();
  }
}

// POST /api/audit/log
// INTERNAL ENDPOINT - Called by other API routes after INSERT/UPDATE/DELETE
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);

    // Must be authenticated (any role can create audit logs internally)
    if (!checkRole(user, ["employee", "project_manager", "hr_executive"])) {
      return ErrorResponses.accessDenied();
    }

    const body = await req.json();
    const { entity_type, entity_id, operation, changed_fields } = body;

    // Validate required fields
    const missingFields = validateRequiredFields(body, [
      "entity_type",
      "entity_id",
      "operation",
    ]);
    if (missingFields) {
      return ErrorResponses.badRequest(missingFields);
    }

    // Validate operation type
    const validOperations = ["INSERT", "UPDATE", "DELETE"];
    if (!validOperations.includes(operation)) {
      return ErrorResponses.badRequest(
        `Invalid operation. Must be one of: ${validOperations.join(", ")}`,
      );
    }

    // Create audit log entry
    const [auditLog] = await db
      .insert(schema.auditLogs)
      .values({
        entity_type,
        entity_id,
        operation,
        changed_by: user.id,
        changed_fields: changed_fields || null,
      })
      .returning();

    return successResponse({
      id: auditLog.id,
      entity_type: auditLog.entity_type,
      entity_id: auditLog.entity_id,
      operation: auditLog.operation,
      changed_by: auditLog.changed_by,
      changed_at: auditLog.changed_at,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("token")) {
      return ErrorResponses.unauthorized("Invalid or expired token");
    }
    console.error("Error creating audit log:", error);
    return ErrorResponses.internalError();
  }
}
