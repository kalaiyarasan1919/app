import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function ShareTaskModal({ open, onOpenChange, task }) {
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>(task.shared_with || []);

  // Fetch all users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Update shared_with mutation
  const updateMutation = useMutation({
    mutationFn: async (shared_with: string[]) => {
      await apiRequest("PATCH", `/api/tasks/${task._id}`, { shared_with });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/tasks" });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    setSelectedUsers(task.shared_with || []);
  }, [task]);

  const filteredUsers = users.filter(
    (u) =>
      u._id !== task.creator_id &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleToggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = () => {
    updateMutation.mutate(selectedUsers);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Task</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <Input
            placeholder="Search users by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div key={user._id} className="flex items-center justify-between p-2 border rounded">
              <span>{user.name} <span className="text-xs text-gray-400">({user.email})</span></span>
              <Button
                size="sm"
                variant={selectedUsers.includes(user._id) ? "default" : "outline"}
                onClick={() => handleToggleUser(user._id)}
              >
                {selectedUsers.includes(user._id) ? "Shared" : "Share"}
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 