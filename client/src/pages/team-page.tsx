import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { User, UserRole } from "@shared/schema";

export default function TeamPage() {
  const { user } = useAuth();
  
  // Fetch team members
  const { data: teamMembers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!user,
  });

  // Get role badge color
  const getRoleBadgeVariant = (role: string) => {
    switch(role) {
      case UserRole.ADMIN:
        return "destructive";
      case UserRole.TEAM_LEADER:
        return "default";
      case UserRole.TEAM_MEMBER:
        return "secondary";
      case UserRole.CLIENT:
        return "outline";
      default:
        return "secondary";
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return "?";
    const nameParts = name.split(" ");
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Team Members</h1>
          <p className="text-gray-500">Manage and collaborate with your team members</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : teamMembers.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-gray-500 mb-4">No team members found</p>
              </CardContent>
            </Card>
          ) : (
            teamMembers.map((member) => (
              <Card key={member.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    {member.name}
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role}
                    </Badge>
                  </CardTitle>
                  <CardDescription>@{member.username}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10 bg-indigo-100 text-indigo-600">
                      {member.avatar ? (
                        <AvatarImage src={member.avatar} alt={member.name} />
                      ) : (
                        <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="text-gray-500">{member.email}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}