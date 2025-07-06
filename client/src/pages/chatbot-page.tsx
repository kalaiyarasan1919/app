import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Send, Bot, Loader2, ChevronDown, Lightbulb, Target, Users, Clock, Zap, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  topic?: string;
  confidence?: number;
};

type QuickQuestion = {
  id: string;
  text: string;
  icon: React.ReactNode;
  category: string;
};

export default function ChatbotPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Quick questions for doubt clearing
  const quickQuestions: QuickQuestion[] = [
    {
      id: "prioritize",
      text: "How should I prioritize my tasks?",
      icon: <Target className="h-4 w-4" />,
      category: "task_prioritization"
    },
    {
      id: "productivity",
      text: "I'm feeling overwhelmed, any productivity tips?",
      icon: <Zap className="h-4 w-4" />,
      category: "productivity"
    },
    {
      id: "team",
      text: "How can I improve team collaboration?",
      icon: <Users className="h-4 w-4" />,
      category: "team_collaboration"
    },
    {
      id: "timeline",
      text: "How do I estimate project timelines?",
      icon: <Clock className="h-4 w-4" />,
      category: "time_estimation"
    },
    {
      id: "technical",
      text: "I'm stuck on a technical issue",
      icon: <HelpCircle className="h-4 w-4" />,
      category: "technical_implementation"
    },
    {
      id: "motivation",
      text: "I need motivation to complete tasks",
      icon: <Lightbulb className="h-4 w-4" />,
      category: "motivation"
    }
  ];
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to AI API
  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: textToSend,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    
    try {
      // Call the AI API
      const response = await apiRequest("POST", "/api/chatbot", {
        message: textToSend
      });
      
      const data = await response.json();
      
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        content: data.response,
        sender: "ai",
        timestamp: new Date(),
        topic: data.topic,
        confidence: data.confidence,
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Chat API error:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      
      // Fallback response
      const fallbackResponse: Message = {
        id: `ai-${Date.now()}`,
        content: "I'm having trouble processing your request right now. Please try again in a moment.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Handle quick question click
  const handleQuickQuestionClick = (question: QuickQuestion) => {
    handleSendMessage(question.text);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "?";
    const nameParts = user.name.split(" ");
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  // Get topic badge color
  const getTopicBadgeColor = (topic?: string) => {
    switch (topic) {
      case "task_prioritization":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "productivity":
        return "bg-green-100 text-green-800 border-green-200";
      case "team_collaboration":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "project_management":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "technical_implementation":
        return "bg-red-100 text-red-800 border-red-200";
      case "time_estimation":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "motivation":
        return "bg-pink-100 text-pink-800 border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Assistant</h1>
          <p className="text-gray-500">Get intelligent help to clear your doubts about tasks, projects, and team collaboration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Chat Area - Takes 3/4 of the width on larger screens */}
          <Card className="md:col-span-3 flex flex-col h-[calc(100vh-200px)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Avatar className="h-8 w-8 mr-2 bg-indigo-100">
                  <AvatarFallback className="text-indigo-600">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                My To Do AI
              </CardTitle>
              <CardDescription>
                Your intelligent assistant for clearing doubts about task management and productivity
              </CardDescription>
            </CardHeader>
            
            {/* Messages Container */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex ${message.sender === "user" ? "flex-row-reverse" : "flex-row"} items-start gap-2 max-w-[80%]`}>
                    {message.sender === "ai" ? (
                      <Avatar className="h-8 w-8 mt-1 bg-indigo-100">
                        <AvatarFallback className="text-indigo-600">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-8 w-8 mt-1 bg-indigo-100 text-indigo-600">
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 ${
                        message.sender === "user"
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-gray-100 text-gray-900 rounded-tl-none"
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div>{message.content}</div>
                        {message.sender === "ai" && message.topic && (
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${getTopicBadgeColor(message.topic)}`}>
                              {message.topic.replace(/_/g, " ")}
                            </Badge>
                            {message.confidence && (
                              <span className="text-xs text-gray-500">
                                Confidence: {Math.round(message.confidence * 100)}%
                              </span>
                            )}
                          </div>
                        )}
                        <div className={`text-xs ${message.sender === "user" ? "text-indigo-200" : "text-gray-500"}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* AI Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2 max-w-[80%]">
                    <Avatar className="h-8 w-8 mt-1 bg-indigo-100">
                      <AvatarFallback className="text-indigo-600">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 bg-gray-100 text-gray-900 rounded-tl-none">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </CardContent>
            
            {/* Input Area */}
            <div className="p-4 border-t mt-auto">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything about tasks, projects, or productivity..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleSendMessage()} 
                  disabled={!inputMessage.trim() || isTyping}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Questions Sidebar */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Questions</CardTitle>
              <CardDescription>
                Common doubts and questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={`space-y-2 ${isExpanded ? '' : 'max-h-96 overflow-hidden'}`}>
                {quickQuestions.map((question) => (
                  <Button
                    key={question.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleQuickQuestionClick(question)}
                    disabled={isTyping}
                  >
                    <div className="flex items-center gap-2">
                      {question.icon}
                      <span className="text-sm">{question.text}</span>
                    </div>
                  </Button>
                ))}
              </div>
              
              {quickQuestions.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full"
                >
                  {isExpanded ? "Show Less" : "Show More"}
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}