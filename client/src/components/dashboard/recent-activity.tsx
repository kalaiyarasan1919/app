import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckSquare, Clock, User, Plus, Edit, Trash2, Calendar, Folder, Users, Target } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type ActivityWithUser = {
  id: number;
  action: string;
  description: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  task_id?: number;
  project_id?: number;
};

export function RecentActivity({ limit = 5 }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingActivityId, setDeletingActivityId] = useState<number | null>(null);

  // Fetch recent activities
  const { data: activities = [], isLoading } = useQuery<ActivityWithUser[]>({
    queryKey: ["/api/activities"],
    queryFn: async () => {
      const res = await fetch(`/api/activities?limit=${limit}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });

  // Delete activity mutation
  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: number) => {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        // Try to parse error message if possible
        let message = "Failed to delete activity";
        try {
          const data = await res.json();
          if (data && data.message) message = data.message;
        } catch {}
        throw new Error(message);
      }
      // Only parse JSON if there is content
      if (res.status !== 204) {
        return res.json();
      }
      return null;
    },
    onSuccess: () => {
      toast({
        title: "Activity deleted",
        description: "The activity has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setDeletingActivityId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete activity: ${error.message}`,
        variant: "destructive",
      });
      setDeletingActivityId(null);
    },
  });

  const handleDeleteActivity = (activityId: number) => {
    setDeletingActivityId(activityId);
    deleteActivityMutation.mutate(activityId);
  };

  // Get initials from name
  const getInitials = (name: string = "") => {
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Generate a color based on name/username
  const getAvatarColor = (name: string = "") => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Get activity icon based on action
  const getActivityIcon = (action: string) => {
    switch (action) {
      // Task actions
      case "create_task":
        return <Plus className="h-4 w-4 text-green-600" />;
      case "update_task":
        return <Edit className="h-4 w-4 text-blue-600" />;
      case "delete_task":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case "complete_task":
        return <CheckSquare className="h-4 w-4 text-green-600" />;
      case "assign_task":
        return <User className="h-4 w-4 text-purple-600" />;
      case "set_deadline":
        return <Calendar className="h-4 w-4 text-orange-600" />;
      
      // Project actions
      case "create_project":
        return <Folder className="h-4 w-4 text-indigo-600" />;
      case "update_project":
        return <Edit className="h-4 w-4 text-blue-600" />;
      case "delete_project":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case "add_member":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "remove_member":
        return <User className="h-4 w-4 text-gray-600" />;
      case "set_project_deadline":
        return <Calendar className="h-4 w-4 text-orange-600" />;
      case "update_project_status":
        return <Target className="h-4 w-4 text-blue-600" />;
      
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get activity color based on action
  const getActivityColor = (action: string) => {
    switch (action) {
      // Task actions
      case "create_task":
        return "bg-green-50 border-green-200";
      case "update_task":
        return "bg-blue-50 border-blue-200";
      case "delete_task":
        return "bg-red-50 border-red-200";
      case "complete_task":
        return "bg-green-50 border-green-200";
      case "assign_task":
        return "bg-purple-50 border-purple-200";
      case "set_deadline":
        return "bg-orange-50 border-orange-200";
      
      // Project actions
      case "create_project":
        return "bg-indigo-50 border-indigo-200";
      case "update_project":
        return "bg-blue-50 border-blue-200";
      case "delete_project":
        return "bg-red-50 border-red-200";
      case "add_member":
        return "bg-purple-50 border-purple-200";
      case "remove_member":
        return "bg-gray-50 border-gray-200";
      case "set_project_deadline":
        return "bg-orange-50 border-orange-200";
      case "update_project_status":
        return "bg-blue-50 border-blue-200";
      
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  // Format activity description
  const formatActivityDescription = (description: string) => {
    // Remove common prefixes and make it more readable
    return description
      .replace(/^(created|updated|deleted|completed|assigned)\s+/i, "")
      .replace(/^(task|project):\s*/i, "")
      .replace(/^(to|from)\s+/i, "");
  };

  // Get activity type for better display
  const getActivityType = (action: string) => {
    if (action.includes("project")) {
      return "project";
    } else if (action.includes("task")) {
      return "task";
    } else if (action.includes("member")) {
      return "team";
    }
    return "general";
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="p-4 border-b border-gray-200">
        <CardTitle className="text-lg font-bold text-gray-700 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-gray-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No recent activities</p>
            <p className="text-xs text-gray-400 mt-1">Start creating tasks and projects to see activity here</p>
          </div>
        ) : (
          activities.map((activity) => {
            const activityType = getActivityType(activity.action);
            return (
              <div 
                key={activity.id} 
                className={`p-4 hover:bg-gray-50 transition-colors group ${getActivityColor(activity.action)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Avatar className={`h-8 w-8 ${getAvatarColor(activity.user?.name || "")}`}>
                      <AvatarFallback>
                        {getInitials(activity.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getActivityIcon(activity.action)}
                      <span className="text-sm font-medium text-gray-700">
                        {activity.user?.name || "Unknown User"}
                      </span>
                      {activityType !== "general" && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          activityType === "project" 
                            ? "bg-indigo-100 text-indigo-700" 
                            : activityType === "task"
                            ? "bg-green-100 text-green-700"
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          {activityType}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatActivityDescription(activity.description)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {activity.created_at &&
                        formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          disabled={deletingActivityId === activity.id}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this activity? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
