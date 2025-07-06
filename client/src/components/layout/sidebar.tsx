import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, CalendarDays, CheckSquare, MessageSquare, FileBox, Settings, LogOut, LayoutDashboard, Bot, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isOpen, setIsOpen, isMobile } = useSidebar();
  
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
    { href: "/tasks", label: "My Tasks", icon: <CheckSquare className="mr-3 h-5 w-5" /> },

    { href: "/messages", label: "Messages", icon: <MessageSquare className="mr-3 h-5 w-5" /> },
    { href: "/files", label: "Files", icon: <FileBox className="mr-3 h-5 w-5" /> },
    { href: "/calendar", label: "Calendar", icon: <CalendarDays className="mr-3 h-5 w-5" /> },
    { href: "/chatbot", label: "AI Assistant", icon: <Bot className="mr-3 h-5 w-5" /> },
    { href: "/feedback", label: "Feedback", icon: <MessageCircle className="mr-3 h-5 w-5" /> },
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
                <span>My To Do</span>
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
              <div className="font-medium text-gray-700">
                {user.name}
                {user.googleId && (
                  <span className="text-xs text-gray-400 ml-1">({user.googleId})</span>
                )}
              </div>
              <div className="text-sm text-gray-500">{user.role}</div>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto scrollbar-hide p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center rounded-md py-2 px-3 text-gray-600 hover:bg-gray-100 cursor-pointer",
                      location === item.href && "bg-indigo-50 text-indigo-600"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <Link href="/settings">
            <div className="flex items-center text-gray-600 hover:text-gray-800 mb-3 cursor-pointer">
              <Settings className="mr-3 h-5 w-5" />
              <span>Settings</span>
            </div>
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
