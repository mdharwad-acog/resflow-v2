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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingPage, LoadingSpinner } from "@/components/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  User,
  Building2,
  Users,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  GraduationCap,
  FileText,
  Pencil,
  Percent,
  Save,
  X,
} from "lucide-react";
import { DepartmentsTab } from "@/components/settings/departments-tab";
import { ClientsTab } from "@/components/settings/clients-tab";

interface UserProfile {
  id: string;
  employee_code: string;
  ldap_username: string;
  full_name: string;
  email: string;
  gender: string | null;
  employee_type: string;
  employee_role: string;
  employee_design: string;
  working_location: string;
  department_id: string;
  department_name?: string;
  reporting_manager_id: string | null;
  reporting_manager_name: string | null;
  experience_years: number;
  resume_url: string | null;
  college: string | null;
  degree: string | null;
  educational_stream: string | null;
  status: string;
  joined_on: string;
  exited_on: string | null;
}

interface Allocation {
  id: string;
  project_id: string;
  project_code: string;
  project_name: string;
  role: string;
  allocation_percentage: number;
  is_billable: boolean;
  start_date: string;
  end_date?: string;
  status: string;
}

interface Skill {
  id: string;
  skill_id: string;
  skill_name: string;
  department_name: string;
  proficiency_level: string;
  status: string;
  approved_at?: string;
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocationsLoading, setAllocationsLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [resumeUrl, setResumeUrl] = useState("");
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("");
  const [educationalStream, setEducationalStream] = useState("");

  useEffect(() => {
    fetchProfile();
    fetchAllocations();
    fetchSkills();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("auth_token");

      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch profile");

      const data = await response.json();
      setProfile(data);
      setResumeUrl(data.resume_url || "");
      setCollege(data.college || "");
      setDegree(data.degree || "");
      setEducationalStream(data.educational_stream || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocations = async () => {
    try {
      setAllocationsLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/allocations?employee_id=${user?.id}&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.ok) {
        const data = await response.json();
        setAllocations(data.allocations || []);
      }
    } catch (error) {
      console.error("Error fetching allocations:", error);
    } finally {
      setAllocationsLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      setSkillsLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/employee-skills?emp_id=${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSkills(data.employee_skills || []);
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      const response = await fetch("/api/employees", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: profile?.id,
          resume_url: resumeUrl || null,
          college: college || null,
          degree: degree || null,
          educational_stream: educationalStream || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setResumeUrl(profile?.resume_url || "");
    setCollege(profile?.college || "");
    setDegree(profile?.degree || "");
    setEducationalStream(profile?.educational_stream || "");
    setIsEditing(false);
  };

  // Separate allocations
  const today = new Date();
  const currentAllocations = allocations.filter((a) => {
    const endDate = a.end_date ? new Date(a.end_date) : null;
    return !endDate || endDate >= today;
  });

  const pastAllocations = allocations.filter((a) => {
    const endDate = a.end_date ? new Date(a.end_date) : null;
    return endDate && endDate < today;
  });

  const totalCurrentAllocation = currentAllocations.reduce(
    (sum, a) => sum + a.allocation_percentage,
    0,
  );

  if (loading) return <LoadingPage />;

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Failed to load profile"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">My Profile</h1>
              <p className="text-muted-foreground mt-1">
                View and manage your professional profile
              </p>
            </div>
            <Badge
              variant={profile.status === "ACTIVE" ? "default" : "secondary"}
            >
              {profile.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">
              <User className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="projects">
              <Briefcase className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="skills">
              <GraduationCap className="h-4 w-4 mr-2" />
              Skills
            </TabsTrigger>
            {user?.employee_role === "hr_executive" && (
              <>
                <TabsTrigger value="departments">
                  <Building2 className="h-4 w-4 mr-2" />
                  Departments
                </TabsTrigger>
                <TabsTrigger value="clients">
                  <Users className="h-4 w-4 mr-2" />
                  Clients
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Employee Code
                      </p>
                      <p className="font-medium">{profile.employee_code}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{profile.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        LDAP Username
                      </p>
                      <p className="font-medium">{profile.ldap_username}</p>
                    </div>
                  </div>
                  {profile.gender && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="font-medium">{profile.gender}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Employment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Employee Type
                      </p>
                      <p className="font-medium">{profile.employee_type}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium">
                        {profile.employee_role.replace("_", " ").toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Designation
                      </p>
                      <p className="font-medium">{profile.employee_design}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{profile.working_location}</p>
                    </div>
                  </div>
                  {profile.department_name && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Department
                        </p>
                        <p className="font-medium">{profile.department_name}</p>
                      </div>
                    </div>
                  )}
                  {profile.reporting_manager_name && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Reporting Manager
                        </p>
                        <p className="font-medium">
                          {profile.reporting_manager_name}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Experience
                      </p>
                      <p className="font-medium">
                        {profile.experience_years} years
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Joined On</p>
                      <p className="font-medium">
                        {new Date(profile.joined_on).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editable Professional Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Professional Information</CardTitle>
                  <CardDescription>
                    Update your educational details
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="resume_url">Resume URL</Label>
                  {isEditing ? (
                    <Input
                      id="resume_url"
                      type="url"
                      placeholder="https://example.com/resume.pdf"
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm">
                      {profile.resume_url ? (
                        <a
                          href={profile.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {profile.resume_url}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">
                          Not provided
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="college">College/University</Label>
                  {isEditing ? (
                    <Input
                      id="college"
                      type="text"
                      placeholder="e.g., MIT, Stanford"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm">
                      {profile.college || (
                        <span className="text-muted-foreground">
                          Not provided
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="degree">Degree</Label>
                  {isEditing ? (
                    <Input
                      id="degree"
                      type="text"
                      placeholder="e.g., B.S. Computer Science"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm">
                      {profile.degree || (
                        <span className="text-muted-foreground">
                          Not provided
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="educational_stream">Educational Stream</Label>
                  {isEditing ? (
                    <Input
                      id="educational_stream"
                      type="text"
                      placeholder="e.g., Computer Science, IT"
                      value={educationalStream}
                      onChange={(e) => setEducationalStream(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm">
                      {profile.educational_stream || (
                        <span className="text-muted-foreground">
                          Not provided
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects & Allocations Tab */}
          <TabsContent value="projects" className="space-y-6">
            {/* Current Allocations */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Current Projects ({currentAllocations.length})
                </CardTitle>
                <CardDescription>
                  Total Allocation: {totalCurrentAllocation}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allocationsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : currentAllocations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No current allocations
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Allocation</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Billable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentAllocations.map((allocation) => (
                        <TableRow
                          key={allocation.id}
                          className="cursor-pointer"
                          onClick={() =>
                            router.push(`/projects/${allocation.project_id}`)
                          }
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {allocation.project_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {allocation.project_code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{allocation.role}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Percent className="h-4 w-4 text-muted-foreground" />
                              {allocation.allocation_percentage}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(
                                allocation.start_date,
                              ).toLocaleDateString()}
                              {allocation.end_date && (
                                <>
                                  {" "}
                                  -{" "}
                                  {new Date(
                                    allocation.end_date,
                                  ).toLocaleDateString()}
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                allocation.is_billable ? "default" : "secondary"
                              }
                            >
                              {allocation.is_billable
                                ? "Billable"
                                : "Non-Billable"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Past Allocations */}
            <Card>
              <CardHeader>
                <CardTitle>Past Projects ({pastAllocations.length})</CardTitle>
                <CardDescription>Completed project assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {allocationsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : pastAllocations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No past allocations
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Allocation</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Billable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastAllocations.map((allocation) => (
                        <TableRow
                          key={allocation.id}
                          className="cursor-pointer"
                          onClick={() =>
                            router.push(`/projects/${allocation.project_id}`)
                          }
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {allocation.project_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {allocation.project_code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{allocation.role}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Percent className="h-4 w-4 text-muted-foreground" />
                              {allocation.allocation_percentage}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(
                                allocation.start_date,
                              ).toLocaleDateString()}
                              {allocation.end_date && (
                                <>
                                  {" "}
                                  -{" "}
                                  {new Date(
                                    allocation.end_date,
                                  ).toLocaleDateString()}
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                allocation.is_billable ? "default" : "secondary"
                              }
                            >
                              {allocation.is_billable
                                ? "Billable"
                                : "Non-Billable"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Skills ({skills.length})</CardTitle>
                <CardDescription>
                  Your approved and pending skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                {skillsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : skills.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No skills added yet
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => router.push("/skills")}
                    >
                      Browse Skills
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Skill Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Proficiency</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Approved On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {skills.map((skill) => (
                        <TableRow key={skill.id}>
                          <TableCell className="font-medium">
                            {skill.skill_name}
                          </TableCell>
                          <TableCell>{skill.department_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {skill.proficiency_level}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                skill.status === "APPROVED"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {skill.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {skill.approved_at ? (
                              new Date(skill.approved_at).toLocaleDateString()
                            ) : (
                              <span className="text-muted-foreground">
                                Pending
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* HR Tabs */}
          {user?.employee_role === "hr_executive" && (
            <>
              <TabsContent value="departments">
                <DepartmentsTab />
              </TabsContent>
              <TabsContent value="clients">
                <ClientsTab />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}
