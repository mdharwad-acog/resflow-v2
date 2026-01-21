/**
 * Database validation helpers
 */

import { db, schema } from "./db";
import { eq, and, sql } from "drizzle-orm";

/**
 * Check if a field value is unique in a table
 */
export async function checkUniqueness(
  table: any,
  field: any,
  value: string,
  excludeId?: string,
): Promise<boolean> {
  const conditions = excludeId
    ? and(eq(field, value), sql`${table.id} != ${excludeId}`)
    : eq(field, value);

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(table)
    .where(conditions);

  return Number(result.count) === 0;
}

/**
 * Get total count for a query
 */
export async function getCount(table: any, whereClause?: any): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(table)
    .where(whereClause);

  return Number(result.count);
}

/**
 * Check if an employee is in a project manager's team
 */
export async function isInPMTeam(
  empId: string,
  projectManagerId: string,
): Promise<boolean> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.projectAllocation)
    .innerJoin(
      schema.projects,
      eq(schema.projectAllocation.project_id, schema.projects.id),
    )
    .where(
      and(
        eq(schema.projectAllocation.emp_id, empId),
        eq(schema.projects.project_manager_id, projectManagerId),
      ),
    );

  return Number(result.count) > 0;
}
