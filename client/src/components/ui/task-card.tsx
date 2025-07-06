import { useState } from "react";
import { Task, TaskPriority, TaskStatus } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Folder, MoreHorizontal, Mail, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShareTaskModal } from "@/components/modals/share-task-modal";

type TaskCardProps = {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
};

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { toast } = useToast();
  const [isChecked, setIsChecked] = useState(task.status === TaskStatus.COMPLETED);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Task> }) => {
      await apiRequest("PUT", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === "/api/tasks" || 
          query.queryKey[0] === "/api/activities"
      });
    },
    onError: () => {
      setIsChecked(!isChecked); // Revert checkbox state
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    },
  });

  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    updateTaskMutation.mutate({
              id: task._id,
      data: {
        status: checked ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS,
      },
    });
  };

  const handleShareViaGmail = () => {
    const subject = encodeURIComponent(`Task: ${task.title}`);
    
    let body = `Task Details:\n\n`;
    body += `Title: ${task.title}\n`;
    if (task.description) {
      body += `Description: ${task.description}\n`;
    }
    body += `Status: ${task.status}\n`;
    body += `Priority: ${task.priority}\n`;
    if (task.deadline) {
      body += `Deadline: ${format(new Date(task.deadline), "MMMM d, yyyy")}\n`;
    }
    body += `Project ID: ${task.project_id}\n\n`;
    body += `---\nShared from Collaborative Task Manager`;
    
    const encodedBody = encodeURIComponent(body);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${encodedBody}`;
    
    window.open(gmailUrl, '_blank');
    
    toast({
      title: "Sharing task",
      description: "Opening Gmail to share task details",
    });
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return "bg-red-50 text-red-500 border-red-200";
      case TaskPriority.MEDIUM:
        return "bg-orange-50 text-orange-500 border-orange-200";
      case TaskPriority.LOW:
        return "bg-green-50 text-green-500 border-green-200";
      default:
        return "bg-gray-50 text-gray-500 border-gray-200";
    }
  };

  const priorityBorder = {
    [TaskPriority.HIGH]: "border-l-4 border-red-500",
    [TaskPriority.MEDIUM]: "border-l-4 border-orange-500",
    [TaskPriority.LOW]: "border-l-4 border-green-500",
  };

  return (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors duration-150 ${
        priorityBorder[task.priority]
      } ${isChecked ? "bg-gray-50" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            <Checkbox
              checked={isChecked}
              onCheckedChange={handleCheckboxChange}
              className="h-4 w-4 rounded border-gray-300 text-primary"
            />
          </div>
          <div>
            <h3
              className={`text-base font-medium ${
                isChecked ? "text-gray-400 line-through" : "text-gray-700"
              }`}
            >
              {task.title}
            </h3>
            <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-y-1">
              {task.deadline && (
                <span className="inline-flex items-center mr-3">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  <span>
                    {new Date(task.deadline) < new Date()
                      ? "Overdue"
                      : `Due ${format(new Date(task.deadline), "MMM d")}`}
                  </span>
                </span>
              )}
              <span className="inline-flex items-center">
                <Folder className="h-3.5 w-3.5 mr-1" />
                <span>Project {task.project_id}</span>
              </span>
            </div>
            <div className="mt-2">
              <Select
                value={task.status}
                onValueChange={(value) => {
                  updateTaskMutation.mutate({
                    id: task._id,
                    data: { status: value },
                  });
                  setIsChecked(value === TaskStatus.COMPLETED);
                }}
              >
                <SelectTrigger className="w-40">
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
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className={`text-xs ${getPriorityColor(task.priority)}`}
          >
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </Badge>

          <button
            onClick={handleShareViaGmail}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
            title="Share via Gmail"
          >
            <Mail className="h-4 w-4" />
          </button>

          <button
            onClick={() => setShareModalOpen(true)}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-green-600 transition-colors"
            title="Share with users"
          >
            <UserPlus className="h-4 w-4" />
          </button>

          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-full hover:bg-gray-100">
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleShareViaGmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Share via Gmail
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500"
                      onClick={() => onDelete(task._id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <ShareTaskModal open={shareModalOpen} onOpenChange={setShareModalOpen} task={task} />
    </div>
  );
}
