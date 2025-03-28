import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Project, ProjectStatus } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
}

export function NewProjectModal({ isOpen, onClose, project }: NewProjectModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.PLANNING);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Reset form when modal opens or project changes
  useEffect(() => {
    if (isOpen) {
      if (project) {
        setName(project.name);
        setDescription(project.description || "");
        setStatus(project.status as ProjectStatus || ProjectStatus.PLANNING);
        setDeadline(project.deadline ? new Date(project.deadline) : undefined);
      } else {
        setName("");
        setDescription("");
        setStatus(ProjectStatus.PLANNING);
        setDeadline(undefined);
      }
    }
  }, [isOpen, project]);

  // Create or update project mutation
  const projectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      if (project) {
        await apiRequest("PUT", `/api/projects/${project.id}`, projectData);
      } else {
        await apiRequest("POST", "/api/projects", projectData);
      }
    },
    onSuccess: () => {
      toast({
        title: project ? "Project updated" : "Project created",
        description: project ? "The project has been updated successfully" : "A new project has been created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${project ? "update" : "create"} project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Validation error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    const projectData = {
      name,
      description: description.trim() || undefined,
      status,
      deadline: deadline?.toISOString() || undefined,
      owner_id: user?.id || project?.owner_id,
    };

    projectMutation.mutate(projectData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create New Project"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as ProjectStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectStatus.PLANNING}>Planning</SelectItem>
                  <SelectItem value={ProjectStatus.ON_TRACK}>On Track</SelectItem>
                  <SelectItem value={ProjectStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={ProjectStatus.AT_RISK}>At Risk</SelectItem>
                  <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={(date) => {
                      setDeadline(date);
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={projectMutation.isPending}>
              {projectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {project ? "Update Project" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
