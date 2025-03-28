import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { User, Project, Task, TaskPriority, TaskStatus } from "@shared/schema";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: Task;
  projectId?: number;
}

export function NewTaskModal({ isOpen, onClose, initialTask, projectId }: NewTaskModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Get projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  // Get users for assignee dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Reset form when modal opens or initialTask changes
  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description || "");
        setSelectedProjectId(initialTask.project_id);
        setPriority(initialTask.priority as TaskPriority);
        setAssigneeId(initialTask.assignee_id || null);
        setDeadline(initialTask.deadline ? new Date(initialTask.deadline) : undefined);
      } else {
        setTitle("");
        setDescription("");
        setSelectedProjectId(projectId || null);
        setPriority(TaskPriority.MEDIUM);
        setAssigneeId(null);
        setDeadline(undefined);
      }
    }
  }, [isOpen, initialTask, projectId]);

  // Create or update task mutation
  const taskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      if (initialTask) {
        await apiRequest("PUT", `/api/tasks/${initialTask.id}`, taskData);
      } else {
        await apiRequest("POST", "/api/tasks", taskData);
      }
    },
    onSuccess: () => {
      toast({
        title: initialTask ? "Task updated" : "Task created",
        description: initialTask ? "The task has been updated successfully" : "A new task has been created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${initialTask ? "update" : "create"} task: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Validation error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProjectId) {
      toast({
        title: "Validation error",
        description: "Please select a project",
        variant: "destructive",
      });
      return;
    }

    const taskData = {
      title,
      description: description.trim() || undefined,
      project_id: selectedProjectId,
      priority,
      assignee_id: assigneeId || undefined,
      deadline: deadline?.toISOString() || undefined,
      status: initialTask?.status || TaskStatus.TODO,
    };

    taskMutation.mutate(taskData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialTask ? "Edit Task" : "Add New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-project">Project</Label>
              <Select
                value={selectedProjectId?.toString() || ""}
                onValueChange={(value) => setSelectedProjectId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <Select
                value={assigneeId?.toString() || ""}
                onValueChange={(value) => value ? setAssigneeId(parseInt(value)) : setAssigneeId(null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">
                Drag files here or click to browse
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Browse Files
              </Button>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={taskMutation.isPending}>
              {taskMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {initialTask ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
