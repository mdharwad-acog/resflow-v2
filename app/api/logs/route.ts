// DAILY PROJECT LOGS API
// Database: daily_project_logs table
// Purpose: Track daily work hours BEFORE weekly report submission
// After weekly report is submitted, corresponding daily logs are locked (locked = true)

// POST /api/logs/create
// Allowed Roles: employee, project_manager, hr_executive
// Accept: { project_id, log_date, hours, notes }
// Validation:
//   - hours must be decimal(4,2) format, > 0
//   - log_date must be valid date
//   - Check if project exists
//   - Check if log already exists for (emp_id, project_id, log_date)
//   - Check if log is locked: SELECT locked FROM daily_project_logs WHERE emp_id = ? AND project_id = ? AND log_date = ?
//   - If locked = true, return 400 "Cannot modify locked logs. Already submitted in weekly report"
// INSERT into daily_project_logs with emp_id = current_user_id
// Return: { id, emp_id, project_id, log_date, hours, notes, locked, created_at }

// GET /api/logs/list
// Allowed Roles: employee, project_manager, hr_executive
// Query params: project_id, start_date, end_date, locked, page, limit
// Data Filtering:
//   - employee: Returns WHERE emp_id = current_user_id
//   - project_manager: Returns WHERE project_id IN (SELECT id FROM projects WHERE project_manager_id = current_user_id)
//   - hr_executive: Returns all logs
// SELECT * FROM daily_project_logs WHERE filters applied
// JOIN projects table to get project_code, project_name
// Apply pagination using LIMIT and OFFSET
// Return: { logs: [{ id, emp_id, project_id, project_code, project_name, log_date, hours, notes, locked, created_at }], total, page, limit }

// PUT /api/logs/update
// Allowed Roles: employee (owner only)
// Accept: { id, hours, notes }
// Get log: SELECT emp_id, locked FROM daily_project_logs WHERE id = ?
// Validation:
//   - emp_id must equal current_user_id, else return 403 "Access denied"
//   - locked must be false, else return 400 "Cannot modify locked logs"
// UPDATE daily_project_logs SET hours = ?, notes = ? WHERE id = ?
// Return: { id, hours, notes }

// GET /api/logs/aggregate
// Allowed Roles: employee (for own data), project_manager (for team), hr_executive (all)
// Query params: emp_id (optional), start_date (required), end_date (required)
// Purpose: Get aggregated hours by project for weekly report creation
// Data Filtering:
//   - employee: Must query own data (emp_id = current_user_id)
//   - project_manager: Can query team members
//   - hr_executive: Can query any employee
// SELECT project_id, SUM(hours) as total_hours FROM daily_project_logs
// WHERE emp_id = ? AND log_date BETWEEN ? AND ? AND locked = false
// GROUP BY project_id
// JOIN projects to get project_code
// Return: { weekly_hours: { "PR-001": 40, "PR-002": 10 }, start_date, end_date }

// NOTE: When a weekly report is submitted via POST /api/reports/create:
//   1. The report submission endpoint should lock corresponding daily logs
//   2. UPDATE daily_project_logs SET locked = true WHERE emp_id = ? AND log_date BETWEEN report_start_date AND report_end_date
//   3. This prevents modification of logs that are already aggregated into a report
