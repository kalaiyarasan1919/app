import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Task, TaskPriority, TaskStatus } from "@shared/schema";

import { Loader2, Calendar, Upload, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Define interface for task data sent to API
interface TaskSubmitData extends Omit<Partial<Task>, 'deadline'> {
  deadline?: string | null;
}

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: Task;
}

export function NewTaskModal({ isOpen, onClose, initialTask }: NewTaskModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Create/Update task mutation
  const mutation = useMutation({
    mutationFn: async (taskData: TaskSubmitData) => {
      if (initialTask) {
        // Update existing task
        const res = await apiRequest("PATCH", `/api/tasks/${initialTask._id}`, taskData);
        return res.json();
      } else {
        // Create new task
        const res = await apiRequest("POST", "/api/tasks", taskData);
        const createdTask = await res.json();
        
        // If a file is selected, upload it
        if (selectedFile && createdTask?._id) {
          setIsUploading(true);
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("taskId", createdTask._id.toString());
          const uploadRes = await fetch("/api/files/upload", {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          setIsUploading(false);
          if (!uploadRes.ok) {
            const errorData = await uploadRes.json();
            toast({
              title: "File upload error",
              description: errorData.message || "Failed to upload file.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "File uploaded",
              description: "File uploaded successfully.",
            });
          }
        }
        
        return createdTask;
      }
    },
    onSuccess: (data) => {
      console.log("Task mutation successful:", data);
      // Invalidate all related queries to ensure everything updates
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === "/api/tasks" || 
          query.queryKey[0] === "/api/activities" || 
          query.queryKey[0] === "/api/users" ||
          query.queryKey[0] === "/api/files"
      });
      toast({
        title: initialTask ? "Task updated" : "Task created",
        description: initialTask 
          ? "The task has been updated successfully." 
          : "The new task has been created successfully.",
      });
      handleClose();
    },
    onError: (error) => {
      console.error("Task mutation error:", error);
      setIsUploading(false);
      toast({
        title: "Error",
        description: `Failed to ${initialTask ? "update" : "create"} task: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Set form values when editing a task
  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || "");
      setPriority(initialTask.priority as TaskPriority);
      setStatus(initialTask.status as TaskStatus);
      setDueDate(initialTask.deadline ? new Date(initialTask.deadline) : undefined);
    } else {
      // Default values for new task
      setTitle("");
      setDescription("");
      setPriority(TaskPriority.MEDIUM);
      setStatus(TaskStatus.TODO);
      setDueDate(undefined);
    }
  }, [initialTask, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a task title.",
        variant: "destructive",
      });
      return;
    }

    const taskData: TaskSubmitData = {
      title,
      description: description || null,
      priority,
      status,
      deadline: dueDate ? dueDate.toISOString() : null,
      creator_id: initialTask?.creator_id || user?.id,
      assignee_id: initialTask?.assignee_id || user?.id,
    };
    
    // Use the mutation to create/update the task
    mutation.mutate(taskData);
  };

  const handleClose = () => {
    setIsUploading(false);
    setSelectedFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{initialTask ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task..."
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaskStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TaskStatus.REVIEW}>In Review</SelectItem>
                  <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="due-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date);
                      setDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* File upload input */}
            {!initialTask && (
              <div className="space-y-2">
                <Label htmlFor="file">Attach File (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="flex-1"
                    disabled={mutation.isPending || isUploading}
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{selectedFile.name}</span>
                      <span className="ml-2">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="h-6 w-6"
                        disabled={mutation.isPending || isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending || isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || isUploading}>
              {(mutation.isPending || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialTask ? "Update Task" : isUploading ? "Uploading..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}