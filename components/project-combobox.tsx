"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/lib/auth-context";

interface Project {
  id: string;
  project_code: string;
  project_name: string;
}

interface ProjectComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ProjectCombobox({
  value,
  onValueChange,
  placeholder = "Select project...",
  className,
}: ProjectComboboxProps) {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const isPM = user?.employee_role === "project_manager";

  React.useEffect(() => {
    if (open) {
      fetchProjects(true);
    }
  }, [open]);

  const fetchProjects = async (reset = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const currentPage = reset ? 1 : page;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      // If PM, filter to only their projects
      if (isPM && user?.id) {
        params.append("project_manager_id", user.id);
      }

      const response = await fetch(`/api/projects?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const newProjects = data.projects || [];

        if (reset) {
          setProjects(newProjects);
          setPage(1);
        } else {
          setProjects((prev) => [...prev, ...newProjects]);
        }

        setHasMore(newProjects.length === 20);
        if (!reset) {
          setPage((p) => p + 1);
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = React.useCallback(
    (search: string) => {
      setSearchQuery(search);
      setPage(1);
      fetchProjects(true);
    },
    [isPM, user?.id],
  );

  const selectedProject = projects.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {value === "ALL"
            ? "All Projects"
            : selectedProject
              ? `${selectedProject.project_code} - ${selectedProject.project_name}`
              : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search projects..."
            value={searchQuery}
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading..." : "No projects found."}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="ALL"
                onSelect={() => {
                  onValueChange("ALL");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === "ALL" ? "opacity-100" : "opacity-0",
                  )}
                />
                All Projects
              </CommandItem>
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === project.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{project.project_code}</span>
                    <span className="text-sm text-muted-foreground">
                      {project.project_name}
                    </span>
                  </div>
                </CommandItem>
              ))}
              {hasMore && !loading && (
                <CommandItem
                  onSelect={() => fetchProjects(false)}
                  className="justify-center text-primary"
                >
                  Load more...
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
