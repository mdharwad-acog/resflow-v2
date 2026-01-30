"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/pagination-controls";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { Plus, Pencil, Search, FileText } from "lucide-react";
import { LoadingPage } from "@/components/loading-spinner";

interface Project {
  id: string;
  project_code: string;
  project_name: string;
  client_id: string;
  client_name: string;
  project_manager_id: string;
  project_manager_name: string;
  status: string;
  started_on: string;
  closed_on?: string;
}

interface Manager {
  id: string;
  full_name: string;
}

export default function ProjectsListPage() {
  return (
    <ProtectedRoute>
      <ProjectsListContent />
    </ProtectedRoute>
  );
}

function ProjectsListContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [managerFilter, setManagerFilter] = useState<string | undefined>(
    undefined,
  );

  const isHR = user?.employee_role === "hr_executive";
  const isPM = user?.employee_role === "project_manager";

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, managerFilter, searchQuery]);

  useEffect(() => {
    fetchManagers();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [currentPage, statusFilter, managerFilter, searchQuery]);

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/employees?limit=1000&role=PM", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setManagers(data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const params = new URLSearchParams();

      if (statusFilter) params.append("status", statusFilter);
      if (managerFilter) params.append("project_manager_id", managerFilter);
      if (searchQuery) params.append("search", searchQuery);
      params.append("page", currentPage.toString());
      params.append("limit", pageSize.toString());

      const response = await fetch(`/api/projects?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const result = await response.json();
      setProjects(result.projects || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleRowClick = (project: Project) => {
    router.push(`/projects/${project.id}`);
  };

  const handleEdit = (project: Project) => {
    router.push(`/projects/${project.id}/edit`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "DRAFT":
        return "secondary";
      case "ON_HOLD":
        return "outline";
      case "COMPLETED":
        return "default";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Projects</h1>
              <p className="text-muted-foreground mt-1">
                Manage projects and track progress
              </p>
            </div>
            {isHR && (
              <Button onClick={() => router.push("/projects/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Projects List</CardTitle>
            <CardDescription>
              View and manage all projects in the organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters - All in one line */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by project name, code, or client..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button onClick={handleSearch} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-48 space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project Manager Filter */}
              <div className="w-full md:w-64 space-y-2">
                <label className="text-sm font-medium">Project Manager</label>
                <Select
                  value={managerFilter}
                  onValueChange={(value) =>
                    setManagerFilter(value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All managers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Managers</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Projects Table */}
            {projects.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-10 w-10 text-muted-foreground" />}
                title="No projects found"
                description="Try adjusting your search criteria or create a new project"
              />
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Code</TableHead>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Project Manager</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started On</TableHead>
                        {(isHR || isPM) && (
                          <TableHead className="w-[50px]">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow
                          key={project.id}
                          className="cursor-pointer"
                          onClick={() => handleRowClick(project)}
                        >
                          <TableCell>{project.project_code}</TableCell>
                          <TableCell>{project.project_name}</TableCell>
                          <TableCell>{project.client_name}</TableCell>
                          <TableCell>{project.project_manager_name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusColor(project.status) as any}
                            >
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {project.started_on
                              ? new Date(
                                  project.started_on,
                                ).toLocaleDateString()
                              : "Not set"}
                          </TableCell>
                          {(isHR || isPM) && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(project);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls
                  currentPage={currentPage}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setCurrentPage}
                  itemName="projects"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
