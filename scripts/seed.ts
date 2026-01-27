import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../lib/db/schema";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Create departments
    console.log("Creating departments...");
    const [engineering] = await db
      .insert(schema.departments)
      .values({
        name: "Engineering",
        designations: "Junior Developer,Senior Developer,Tech Lead,Architect",
      })
      .returning();

    const [hr] = await db
      .insert(schema.departments)
      .values({
        name: "Human Resources",
        designations: "HR Executive,HR Manager",
      })
      .returning();

    // Create clients
    console.log("Creating clients...");
    const [acmeClient] = await db
      .insert(schema.clients)
      .values({
        client_name: "Acme Corporation",
      })
      .returning();

    const [techClient] = await db
      .insert(schema.clients)
      .values({
        client_name: "TechStart Inc",
      })
      .returning();

    // Create employees
    console.log("Creating employees...");

    // HR Executive
    const [hrUser] = await db
      .insert(schema.employees)
      .values({
        employee_code: "EMP001",
        ldap_username: "sarah.williams",
        full_name: "Sarah Williams",
        email: "sarah.williams@company.com",
        employee_type: "Full-Time",
        employee_role: "hr_executive",
        employee_design: "HR Manager",
        working_location: "New York",
        department_id: hr.id,
        status: "ACTIVE",
        joined_on: "2024-01-15",
        experience_years: "5.0",
      })
      .returning();

    // Project Manager
    const [pmUser] = await db
      .insert(schema.employees)
      .values({
        employee_code: "EMP002",
        ldap_username: "john.smith",
        full_name: "John Smith",
        email: "john.smith@company.com",
        employee_type: "Full-Time",
        employee_role: "project_manager",
        employee_design: "Senior Project Manager",
        working_location: "New York",
        department_id: engineering.id,
        status: "ACTIVE",
        joined_on: "2023-06-01",
        experience_years: "8.0",
      })
      .returning();

    // Regular Employees
    const [employee1] = await db
      .insert(schema.employees)
      .values({
        employee_code: "EMP003",
        ldap_username: "ravalika.kathroju",
        full_name: "Ravalika Kathroju",
        email: "ravalika.kathroju@company.com",
        employee_type: "Full-Time",
        employee_role: "employee",
        employee_design: "Senior Developer",
        working_location: "Bangalore",
        department_id: engineering.id,
        project_manager_id: pmUser.id,
        status: "ACTIVE",
        joined_on: "2023-03-15",
        experience_years: "4.5",
      })
      .returning();

    const [employee2] = await db
      .insert(schema.employees)
      .values({
        employee_code: "EMP004",
        ldap_username: "lavanya.dev",
        full_name: "Lavanya",
        email: "lavanya@company.com",
        employee_type: "Full-Time",
        employee_role: "employee",
        employee_design: "Full Stack Developer",
        working_location: "Bangalore",
        department_id: engineering.id,
        project_manager_id: pmUser.id,
        status: "ACTIVE",
        joined_on: "2023-08-20",
        experience_years: "3.0",
      })
      .returning();

    // Create skills
    console.log("Creating skills...");
    const [reactSkill] = await db
      .insert(schema.skills)
      .values({
        skill_name: "React",
        department_id: engineering.id,
      })
      .returning();

    const [nodeSkill] = await db
      .insert(schema.skills)
      .values({
        skill_name: "Node.js",
        department_id: engineering.id,
      })
      .returning();

    const [pythonSkill] = await db
      .insert(schema.skills)
      .values({
        skill_name: "Python",
        department_id: engineering.id,
      })
      .returning();

    // Assign skills to employees
    console.log("Assigning skills to employees...");
    await db.insert(schema.employeeSkills).values([
      {
        emp_id: employee1.id,
        skill_id: reactSkill.skill_id,
        proficiency_level: "Expert",
        approved_by: pmUser.id,
        approved_at: "2023-04-01",
      },
      {
        emp_id: employee1.id,
        skill_id: nodeSkill.skill_id,
        proficiency_level: "Advanced",
        approved_by: pmUser.id,
        approved_at: "2023-04-01",
      },
      {
        emp_id: employee2.id,
        skill_id: pythonSkill.skill_id,
        proficiency_level: "Intermediate",
        approved_by: pmUser.id,
        approved_at: "2023-09-01",
      },
    ]);

    // Create projects
    console.log("Creating projects...");
    const [project1] = await db
      .insert(schema.projects)
      .values({
        project_code: "PROJ001",
        project_name: "E-Commerce Platform",
        client_id: acmeClient.id,
        short_description: "Modern e-commerce platform with React and Node.js",
        project_manager_id: pmUser.id,
        status: "ACTIVE",
        started_on: "2024-01-01",
      })
      .returning();

    const [project2] = await db
      .insert(schema.projects)
      .values({
        project_code: "PROJ002",
        project_name: "Mobile App Development",
        client_id: techClient.id,
        short_description: "Cross-platform mobile application",
        project_manager_id: pmUser.id,
        status: "ACTIVE",
        started_on: "2024-02-01",
      })
      .returning();

    // Create project allocations
    console.log("Creating project allocations...");
    await db.insert(schema.projectAllocation).values([
      {
        emp_id: employee1.id,
        project_id: project1.id,
        role: "Senior Developer",
        allocation_percentage: "80.00",
        start_date: "2024-01-01",
        billability: true,
        is_critical_resource: true,
        assigned_by: pmUser.id,
      },
      {
        emp_id: employee2.id,
        project_id: project1.id,
        role: "Full Stack Developer",
        allocation_percentage: "50.00",
        start_date: "2024-01-15",
        billability: true,
        is_critical_resource: false,
        assigned_by: pmUser.id,
      },
      {
        emp_id: employee2.id,
        project_id: project2.id,
        role: "Full Stack Developer",
        allocation_percentage: "50.00",
        start_date: "2024-02-01",
        billability: true,
        is_critical_resource: false,
        assigned_by: pmUser.id,
      },
    ]);

    // Create tasks
    console.log("Creating tasks...");
    await db.insert(schema.tasks).values([
      {
        owner_id: employee1.id,
        entity_id: project1.id,
        entity_type: "PROJECT",
        description: "Setup project repository and CI/CD pipeline",
        status: "COMPLETED",
        due_on: "2024-01-10",
        assigned_by: pmUser.id,
      },
      {
        owner_id: employee1.id,
        entity_id: project1.id,
        entity_type: "PROJECT",
        description: "Implement user authentication module",
        status: "DUE",
        due_on: "2026-01-28",
        assigned_by: pmUser.id,
      },
      {
        owner_id: employee1.id,
        entity_id: project1.id,
        entity_type: "PROJECT",
        description: "Design database schema for products",
        status: "DUE",
        due_on: "2026-01-30",
        assigned_by: pmUser.id,
      },
      {
        owner_id: employee2.id,
        entity_id: project1.id,
        entity_type: "PROJECT",
        description: "Create API endpoints for product management",
        status: "DUE",
        due_on: "2026-01-29",
        assigned_by: pmUser.id,
      },
      {
        owner_id: employee2.id,
        entity_id: project2.id,
        entity_type: "PROJECT",
        description: "Setup mobile app framework",
        status: "COMPLETED",
        due_on: "2024-02-05",
        assigned_by: pmUser.id,
      },
    ]);

    // Create daily work logs
    console.log("Creating daily work logs...");
    await db.insert(schema.dailyProjectLogs).values([
      {
        emp_id: employee1.id,
        project_id: project1.id,
        log_date: "2026-01-20",
        hours: "8.00",
        notes: "Worked on authentication module",
        locked: false,
      },
      {
        emp_id: employee1.id,
        project_id: project1.id,
        log_date: "2026-01-21",
        hours: "7.50",
        notes: "Database schema design and review",
        locked: false,
      },
      {
        emp_id: employee2.id,
        project_id: project1.id,
        log_date: "2026-01-20",
        hours: "4.00",
        notes: "API development",
        locked: false,
      },
      {
        emp_id: employee2.id,
        project_id: project2.id,
        log_date: "2026-01-20",
        hours: "4.00",
        notes: "Mobile UI components",
        locked: false,
      },
    ]);

    // Create resource demands
    console.log("Creating resource demands...");
    await db.insert(schema.resourceDemands).values([
      {
        project_id: project1.id,
        role_required: "UI/UX Designer",
        skills_required: `${reactSkill.skill_id}`,
        start_date: "2026-02-01",
        requested_by: pmUser.id,
        demand_status: "REQUESTED",
      },
    ]);

    console.log("✅ Database seeded successfully!");
    console.log("\n📋 Test Users:");
    console.log("HR Executive: sarah.williams / test123");
    console.log("Project Manager: john.smith / test123");
    console.log("Employee: ravalika.kathroju / test123");
    console.log("Employee: lavanya.dev / test123");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();
