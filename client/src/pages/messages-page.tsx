import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send, PlusCircle, Paperclip, Search, Smile, Image, Settings, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Message type definition
interface Message {
  id: number;
  sender: string;
  content: string;
  time: string;
  isMine: boolean;
}

// Conversation type definition
interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
}

// Messages map type
interface MessagesMap {
  [key: number]: Message[];
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessageText, setNewMessageText] = useState("");
  const [activeConversation, setActiveConversation] = useState(1);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [newConversationName, setNewConversationName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Start with empty conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Start with empty messages
  const [messagesMap, setMessagesMap] = useState<MessagesMap>({});
  
  // Get active conversation name
  const activeConversationData = conversations.find(c => c.id === activeConversation);
  
  // Get messages for active conversation
  const messages = messagesMap[activeConversation] || [];
  
  // Check if there are any conversations
  const hasConversations = conversations.length > 0;
  
  // Function to handle sending a new message
  const handleSendMessage = () => {
    if (!newMessageText.trim()) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newMessage = {
      id: messages.length + 1,
      sender: user?.name || "You",
      content: newMessageText,
      time: timeString,
      isMine: true,
    };
    
    // Update messages for the active conversation
    setMessagesMap(prev => ({
      ...prev,
      [activeConversation]: [...(prev[activeConversation] || []), newMessage],
    }));
    
    // Update last message in conversation list
    setConversations(prev => 
      prev.map(convo => 
        convo.id === activeConversation 
          ? { ...convo, lastMessage: newMessageText, time: "Just now", unread: 0 } 
          : convo
      )
    );
    
    // Clear input
    setNewMessageText("");
  };
  
  // Function to create a new conversation
  const handleCreateConversation = () => {
    if (!newConversationName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a conversation name",
        variant: "destructive",
      });
      return;
    }
    
    const newId = Math.max(...conversations.map(c => c.id)) + 1;
    
    const newConversation = {
      id: newId,
      name: newConversationName,
      lastMessage: "Conversation created",
      time: "Just now",
      unread: 0,
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setMessagesMap(prev => ({
      ...prev,
      [newId]: [],
    }));
    
    setActiveConversation(newId);
    setIsNewConversationOpen(false);
    setNewConversationName("");
    
    toast({
      title: "Success",
      description: "New conversation created successfully",
    });
  };
  
  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(convo => 
    convo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    convo.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Messages</h1>
            <p className="text-gray-500">Communicate with your team in real-time</p>
          </div>
          <Button 
            onClick={() => setIsNewConversationOpen(true)}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>New Conversation</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 overflow-hidden flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Conversations</CardTitle>
                  <CardDescription>Your active message threads</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => setIsNewConversationOpen(true)}>
                        <PlusCircle className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create New Conversation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            
            <div className="px-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Search conversations..." 
                  className="pl-9" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <CardContent className="overflow-y-auto flex-1 p-0">
              {!hasConversations ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No conversations yet</p>
                  <p className="text-sm">Create your first conversation to start messaging with your team</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p>No conversations found</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {filteredConversations.map((convo) => (
                    <li 
                      key={convo.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${activeConversation === convo.id ? 'bg-indigo-50' : ''}`}
                      onClick={() => {
                        setActiveConversation(convo.id);
                        // Mark as read when clicked
                        if (convo.unread > 0) {
                          setConversations(prev => 
                            prev.map(c => c.id === convo.id ? {...c, unread: 0} : c)
                          );
                        }
                      }}
                    >
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
              )}
            </CardContent>
          </Card>
          
          {/* Message Thread */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col">
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{activeConversationData?.name || "Select a conversation"}</CardTitle>
                  <CardDescription>{messages.length} messages</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <Settings className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Conversation Settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            
            <CardContent className="overflow-y-auto flex-1 p-4 space-y-4">
              {!activeConversationData ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-center">Select a conversation or create a new one to start messaging</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-center">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
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
                ))
              )}
            </CardContent>
            
            <div className="p-4 border-t">
              <div className="flex gap-2 items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="rounded-full" disabled={!activeConversationData}>
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Attach File</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Input 
                  placeholder={activeConversationData ? "Type a message..." : "Select a conversation to start messaging"}
                  className="flex-1" 
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!activeConversationData}
                />
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="rounded-full" disabled={!activeConversationData}>
                        <Smile className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add Emoji</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Button 
                  size="icon" 
                  onClick={handleSendMessage}
                  disabled={!newMessageText.trim() || !activeConversationData}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* New Conversation Dialog */}
      <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Conversation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Conversation Name</Label>
                <Input
                  id="name"
                  placeholder="Enter conversation name"
                  value={newConversationName}
                  onChange={(e) => setNewConversationName(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewConversationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateConversation}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}