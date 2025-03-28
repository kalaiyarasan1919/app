import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, CalendarDays, FolderClosed, CheckSquare, Users, MessageSquare, FileBox, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isOpen, setIsOpen, isMobile } = useSidebar();
  
  // Fetch recent projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
    enabled: !!user,
  });
  
  // Get recent projects (limit to 3)
  const recentProjects = projects.slice(0, 3);
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "?";
    const nameParts = user.name.split(" ");
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  // Close sidebar on navigation when on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      setIsOpen(false);
    }
  }, [location, isMobile]);

  const navItems = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { href: "/projects", label: "Projects", icon: <FolderClosed className="mr-3 h-5 w-5" /> },
    { href: "/tasks", label: "My Tasks", icon: <CheckSquare className="mr-3 h-5 w-5" /> },
    { href: "/team", label: "Team", icon: <Users className="mr-3 h-5 w-5" /> },
    { href: "/messages", label: "Messages", icon: <MessageSquare className="mr-3 h-5 w-5" /> },
    { href: "/files", label: "Files", icon: <FileBox className="mr-3 h-5 w-5" /> },
    { href: "/calendar", label: "Calendar", icon: <CalendarDays className="mr-3 h-5 w-5" /> },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  return (
    <aside 
      className={cn(
        "bg-white shadow-lg w-64 transition-all duration-300 flex-shrink-0 z-30 h-screen fixed md:relative md:translate-x-0",
        isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-xl font-bold text-indigo-600 flex items-center cursor-pointer">
                <CheckSquare className="mr-2 h-6 w-6" />
                <span>TaskCollab</span>
              </h1>
            </Link>
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsOpen(false)} 
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10 bg-indigo-100 text-indigo-600">
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-gray-700">{user.name}</div>
              <div className="text-sm text-gray-500">{user.role}</div>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto scrollbar-hide p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center rounded-md py-2 px-3 text-gray-600 hover:bg-gray-100",
                      location === item.href && "bg-indigo-50 text-indigo-600"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
          
          {recentProjects.length > 0 && (
            <div className="mt-8">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Recent Projects
              </div>
              <ul className="space-y-1">
                {recentProjects.map((project) => (
                  <li key={project.id}>
                    <Link href={`/projects/${project.id}`}>
                      <a className="flex items-center rounded-md py-2 px-3 hover:bg-gray-100 text-gray-600">
                        <span 
                          className={cn(
                            "w-2 h-2 rounded-full mr-3",
                            project.status === "on_track" ? "bg-green-500" : 
                            project.status === "at_risk" ? "bg-red-500" : 
                            project.status === "in_progress" ? "bg-orange-500" : 
                            "bg-gray-500"
                          )}
                        />
                        <span className="truncate">{project.name}</span>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <Link href="/settings">
            <a className="flex items-center text-gray-600 hover:text-gray-800 mb-3">
              <Settings className="mr-3 h-5 w-5" />
              <span>Settings</span>
            </a>
          </Link>
          <Button 
            variant="ghost" 
            className="flex items-center text-gray-600 hover:text-gray-800 w-full justify-start px-0"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
