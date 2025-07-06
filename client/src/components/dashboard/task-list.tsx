import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TaskCard } from "@/components/ui/task-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { Task, TaskStatus } from "@shared/schema";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface TaskListProps {
  userId?: number;
  projectId?: number;
  limit?: number;
  showFilter?: boolean;
  showAddButton?: boolean;
  onAddTask?: () => void;
  onEditTask?: (task: Task) => void;
}

export function TaskList({
  userId,
  projectId,
  limit = 10,
  showFilter = true,
  showAddButton = true,
  onAddTask,
  onEditTask,
}: TaskListProps) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch tasks with pagination and sorting
  const { data, isLoading } = useQuery<{ tasks: Task[]; total: number; page: number; totalPages: number }>({
    queryKey: ["/api/tasks", { projectId, userId, page, limit, sortBy, sortOrder }],
    queryFn: async () => {
      let url = `/api/tasks?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (projectId) url += `&projectId=${projectId}`;
      if (userId) url += `&assigneeId=${userId}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });
  const tasks: Task[] = data?.tasks || [];
  const totalPages: number = data?.totalPages || 1;

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully",
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "/api/tasks"
      });
      queryClient.refetchQueries({
        predicate: (query) => query.queryKey[0] === "/api/tasks"
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "/api/activities"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the task",
        variant: "destructive",
      });
    },
  });

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") {
      return task.status !== TaskStatus.COMPLETED;
    }
    if (filter === "completed") {
      return task.status === TaskStatus.COMPLETED;
    }
    if (filter === "in_progress") {
      return task.status === TaskStatus.IN_PROGRESS;
    }
    if (filter === "todo") {
      return task.status === TaskStatus.TODO;
    }
    if (filter === "review") {
      return task.status === TaskStatus.REVIEW;
    }
    return true;
  });

  const handleDeleteTask = (taskId: number) => {
    setTaskToDelete(taskId);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete);
      setTaskToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-200">
          <CardTitle className="text-lg font-bold text-gray-700">My Tasks</CardTitle>
          <div className="flex items-center space-x-2">
            {/* Sorting controls */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="text-sm py-1 px-2 h-8 w-[130px] border-gray-200">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="h-8 w-8 text-gray-500 hover:text-gray-700">
              {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </Button>
            {showFilter && (
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="text-sm py-1 px-2 h-8 w-[130px] border-gray-200">
                  <SelectValue placeholder="All Tasks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            )}
            {showAddButton && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onAddTask}
                className="h-8 w-8 text-gray-500 hover:text-gray-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No tasks found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
          {/* Pagination controls */}
          <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={taskToDelete !== null} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              {deleteTaskMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
