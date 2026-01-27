"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingPage } from "@/components/loading-spinner";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  CheckCircle2,
  FileText,
  FolderOpen,
  ArrowRight,
  Clock,
  AlertCircle,
  Plus,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DashboardMetrics {
  pendingTasks: number;
  completedTasks: number;
  activeProjects: number;
  missingReports: number;
  weeklyHours: number;
}

interface Task {
  id: string;
  description: string;
  due_on: string;
  status: string;
  entity_type: string;
  entity_id: string;
  owner_name?: string;
  project_name?: string;
}

interface DashboardData {
  metrics: DashboardMetrics;
  tasks: Task[];
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/dashboard/metrics", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getQuickActions = () => {
    if (!user) return [];

    switch (user.employee_role) {
      case "hr_executive":
        return [
          { label: "Add Employee", href: "/employees/new", icon: Plus },
          { label: "View Demands", href: "/demands", icon: FileText },
          { label: "Review Approvals", href: "/approvals", icon: CheckCircle2 },
        ];
      case "project_manager":
        return [
          { label: "Create Project", href: "/projects/new", icon: Plus },
          { label: "Assign Tasks", href: "/tasks/new", icon: Plus },
          { label: "View Allocations", href: "/allocations", icon: Calendar },
        ];
      default:
        return [
          { label: "View Tasks", href: "/tasks", icon: FileText },
          { label: "Submit Report", href: "/reports", icon: FileText },
          { label: "Log Hours", href: "/logs", icon: Clock },
        ];
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Failed to load dashboard data"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { metrics, tasks } = data;
  const quickActions = getQuickActions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.full_name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Tasks
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasks due soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Tasks
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasks finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Projects in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user?.employee_role === "employee"
                ? "Missing Reports"
                : "Pending Approvals"}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.missingReports}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {user?.employee_role === "employee"
                ? "Reports to submit"
                : "Requires action"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Tasks</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <EmptyState
                title="No tasks"
                description="You don't have any tasks assigned"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.slice(0, 5).map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {task.description}
                      </TableCell>
                      <TableCell>{task.project_name || "-"}</TableCell>
                      <TableCell>{formatDate(task.due_on)}</TableCell>
                      <TableCell>
                        <StatusBadge type="task" status={task.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href={action.href}>
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {user?.employee_role === "employee" && (
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{metrics.weeklyHours}h</p>
                  <p className="text-sm text-muted-foreground">Hours logged</p>
                </div>
              </div>
              <div className="flex-1" />
              <Button variant="outline" asChild>
                <Link href="/logs">Log Hours</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
