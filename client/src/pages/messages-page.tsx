import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function MessagesPage() {
  const { user } = useAuth();

  // Sample conversations for demonstration purposes
  const conversations = [
    {
      id: 1,
      name: "Project Kickoff",
      lastMessage: "Let's discuss the timeline",
      time: "2 minutes ago",
      unread: 3,
    },
    {
      id: 2,
      name: "Design Reviews",
      lastMessage: "I've uploaded the latest mockups",
      time: "2 hours ago",
      unread: 0,
    },
    {
      id: 3,
      name: "Development Team",
      lastMessage: "The new feature is ready for testing",
      time: "Yesterday",
      unread: 0,
    },
  ];

  // Sample messages for demonstration purposes
  const messages = [
    {
      id: 1,
      sender: "Sarah Johnson",
      content: "Hey team, just wanted to check in on the progress for the dashboard component.",
      time: "10:30 AM",
      isMine: false,
    },
    {
      id: 2,
      sender: user?.name || "You",
      content: "I've completed the initial design and pushing the code now.",
      time: "10:32 AM",
      isMine: true,
    },
    {
      id: 3,
      sender: "Mike Peterson",
      content: "Great! I'll review it this afternoon.",
      time: "10:35 AM",
      isMine: false,
    },
    {
      id: 4,
      sender: "Sarah Johnson",
      content: "Thanks for the quick turnaround!",
      time: "10:36 AM",
      isMine: false,
    },
  ];

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
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-gray-500">Communicate with your team in real-time</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 overflow-hidden flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle>Conversations</CardTitle>
              <CardDescription>Your active message threads</CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 p-0">
              <ul className="divide-y">
                {conversations.map((convo) => (
                  <li key={convo.id} className="hover:bg-gray-50 cursor-pointer">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="bg-indigo-100 text-indigo-600">
                          <AvatarFallback>{getUserInitials(convo.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{convo.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[150px]">
                            {convo.lastMessage}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{convo.time}</div>
                        {convo.unread > 0 && (
                          <div className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-1 ml-auto">
                            {convo.unread}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          {/* Message Thread */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle>Project Kickoff</CardTitle>
              <CardDescription>3 participants</CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 p-4 space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex ${message.isMine ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[80%]`}>
                    {!message.isMine && (
                      <Avatar className="bg-indigo-100 text-indigo-600 h-8 w-8 mt-1">
                        <AvatarFallback>{getUserInitials(message.sender)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <div className={`flex items-center gap-2 ${message.isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                        {!message.isMine && <span className="text-sm font-medium">{message.sender}</span>}
                        <span className="text-xs text-gray-500">{message.time}</span>
                      </div>
                      <div 
                        className={`rounded-lg p-3 ${
                          message.isMine 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-gray-100 text-gray-900 rounded-tl-none'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input placeholder="Type a message..." className="flex-1" />
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}