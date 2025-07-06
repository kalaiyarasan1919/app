import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@shared/schema";
import { useState } from "react";
import { Camera, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // User profile form state
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || UserRole.TEAM_MEMBER);
  
  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskAssignments, setTaskAssignments] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [teamMessages, setTeamMessages] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "?";
    const nameParts = user.name.split(" ");
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      const res = await apiRequest("PATCH", "/api/user", { name, username, email });
      if (res.ok) {
        toast({ title: "Profile updated", description: "Your profile has been updated." });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to update profile.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update profile.", variant: "destructive" });
    }
  };

  // Save notification preferences
  const handleSaveNotifications = async () => {
    try {
      const res = await apiRequest("PATCH", "/api/user/notifications", {
        emailNotifications,
        taskAssignments,
        projectUpdates,
        deadlineReminders,
        teamMessages
      });
      if (res.ok) {
        toast({ title: "Preferences updated", description: "Your notification preferences have been updated." });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to update preferences.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update preferences.", variant: "destructive" });
    }
  };

  // Save password change
  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Error", description: "All password fields are required.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    try {
      const res = await apiRequest("PATCH", "/api/user/password", { currentPassword, newPassword });
      if (res.ok) {
        toast({ title: "Password updated", description: "Your password has been changed." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to update password.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update password.", variant: "destructive" });
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-500">Manage your account and preferences</p>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="password">Password & Security</TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details and profile picture</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-2 border-white shadow-md">
                      {user?.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.name} />
                      ) : (
                        <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-600">
                          {getUserInitials()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                          />
                          {user.googleId && (
                            <span className="text-xs text-gray-400">({user.googleId})</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username" 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Button onClick={handleSaveProfile}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
                    </div>
                    <Switch 
                      checked={emailNotifications} 
                      onCheckedChange={setEmailNotifications} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Task Assignments</p>
                      <p className="text-sm text-gray-500">Get notified when you are assigned to a task</p>
                    </div>
                    <Switch 
                      checked={taskAssignments} 
                      onCheckedChange={setTaskAssignments} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Project Updates</p>
                      <p className="text-sm text-gray-500">Receive notifications for project status changes</p>
                    </div>
                    <Switch 
                      checked={projectUpdates} 
                      onCheckedChange={setProjectUpdates} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Deadline Reminders</p>
                      <p className="text-sm text-gray-500">Get reminders for upcoming task deadlines</p>
                    </div>
                    <Switch 
                      checked={deadlineReminders} 
                      onCheckedChange={setDeadlineReminders} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Team Messages</p>
                      <p className="text-sm text-gray-500">Receive notifications for new team messages</p>
                    </div>
                    <Switch 
                      checked={teamMessages} 
                      onCheckedChange={setTeamMessages} 
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button onClick={handleSaveNotifications}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Password Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
                <CardDescription>Update your password and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button onClick={handleUpdatePassword}>Update Password</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}