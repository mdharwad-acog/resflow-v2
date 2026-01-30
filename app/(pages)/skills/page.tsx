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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/pagination-controls";
import { EmptyState } from "@/components/empty-state";
import { RequestSkillModal } from "@/components/forms/request-skill-modal";
import { toast } from "sonner";
import { Plus, Search, FileText } from "lucide-react";
import { LoadingPage } from "@/components/loading-spinner";

interface Skill {
  id: string;
  skill_name: string;
  department_name: string;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
}

export default function SkillsPage() {
  return (
    <ProtectedRoute>
      <SkillsContent />
    </ProtectedRoute>
  );
}

function SkillsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and pagination state
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [selectedDepartment, setSelectedDepartment] = useState<
    string | undefined
  >(undefined);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  // Fetch departments only once
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch skills when filters, search or page changes
  useEffect(() => {
    fetchSkills();
  }, [selectedDepartment, searchQuery, currentPage]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/departments", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const params = new URLSearchParams();

      if (selectedDepartment)
        params.append("department_name", selectedDepartment);
      if (searchQuery) params.append("search", searchQuery);
      params.append("page", currentPage.toString());
      params.append("limit", pageSize.toString());

      const response = await fetch(`/api/skills?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch skills");
      }

      const data = await response.json();
      setSkills(data.skills || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching skills:", error);
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    setRequestModalOpen(true);
  };

  const handleRequestSuccess = () => {
    toast.info("You can view your pending requests in the approvals section");
    fetchSkills();
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Skills Catalog</h1>
              <p className="text-muted-foreground mt-1">
                Browse and request skills for your profile
              </p>
            </div>
            {user?.employee_role === "hr_executive" && (
              <Button onClick={() => router.push("/skills/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Skill
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Skills</CardTitle>
            <CardDescription>
              Click on any skill to request it for your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by skill name or department..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button onClick={handleSearch} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select
                    value={selectedDepartment}
                    onValueChange={(v) =>
                      setSelectedDepartment(v === "all" ? undefined : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Skills Table */}
            {skills.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-10 w-10 text-muted-foreground" />}
                title="No skills found"
                description="Try adjusting your search criteria or add a new skill"
              />
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Skill Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {skills.map((skill) => (
                        <TableRow
                          key={skill.id}
                          className="cursor-pointer"
                          onClick={() => handleRequestSkill(skill)}
                        >
                          <TableCell className="font-medium">
                            {skill.skill_name}
                          </TableCell>
                          <TableCell>{skill.department_name}</TableCell>
                          <TableCell>
                            {new Date(skill.created_at).toLocaleDateString()}
                          </TableCell>
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
                  itemName="skills"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <RequestSkillModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        skill={selectedSkill}
        onSuccess={handleRequestSuccess}
      />
    </div>
  );
}
