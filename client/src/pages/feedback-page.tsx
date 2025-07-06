import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Send, Heart, UserCheck, Users, Sparkles, Star, LucideIcon, Check, History, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Define the feedback form schema
const feedbackFormSchema = z.object({
  category: z.enum(["team", "project", "process", "leadership", "other"], {
    required_error: "Please select a feedback category",
  }),
  type: z.enum(["suggestion", "praise", "concern"], {
    required_error: "Please select a feedback type",
  }),
  rating: z.enum(["1", "2", "3", "4", "5"], {
    required_error: "Please select a rating",
  }),
  message: z.string().min(10, {
    message: "Feedback message must be at least 10 characters",
  }),
  anonymous: z.boolean().default(true),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

// Feedback submission history interface
interface FeedbackSubmission {
  id: number;
  date: string;
  status: "pending" | "reviewed" | "implemented";
  category: string;
  type: string;
  rating: number;
  preview: string;
}

export default function FeedbackPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [feedbackStats, setFeedbackStats] = useState({
    total: 0,
    implemented: 0,
    reviewed: 0,
    pending: 0,
  });
  
  // Initialize form with react-hook-form
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      category: undefined,
      type: undefined,
      rating: undefined,
      message: "",
      anonymous: true,
    },
  });

  // Fetch feedback data
  const { data: feedbackData = [], isLoading } = useQuery({
    queryKey: ["/api/feedback"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/feedback");
      return res.json();
    },
  });

  // Update stats when feedback data changes
  useEffect(() => {
    if (feedbackData.length > 0) {
      setFeedbackStats({
        total: feedbackData.length,
        implemented: feedbackData.filter((f: any) => f.status === "implemented").length,
        reviewed: feedbackData.filter((f: any) => f.status === "reviewed").length,
        pending: feedbackData.filter((f: any) => f.status === "pending").length,
      });
    }
  }, [feedbackData]);

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (values: FeedbackFormValues) => {
      const res = await apiRequest("POST", "/api/feedback", values);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! It will be reviewed by the team.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      form.reset({
        category: undefined,
        type: undefined,
        rating: undefined,
        message: "",
        anonymous: true,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit feedback: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: FeedbackFormValues) => {
    submitFeedbackMutation.mutate(values);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "implemented":
        return "bg-green-100 text-green-800 border-green-200";
      case "reviewed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string): LucideIcon => {
    switch (category) {
      case "team":
        return Users;
      case "project":
        return Sparkles;
      case "process":
        return Check;
      case "leadership":
        return UserCheck;
      default:
        return Heart;
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Anonymous Feedback</h1>
          <p className="text-gray-500">Share your thoughts, suggestions, and concerns anonymously</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Feedback Form */}
          <Card className="md:col-span-2">
            <Tabs defaultValue="submit">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Feedback Form</CardTitle>
                  <TabsList>
                    <TabsTrigger value="submit">Submit</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription>
                  Your feedback is completely anonymous and helps improve our workspace
                </CardDescription>
              </CardHeader>
              
              <TabsContent value="submit">
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Feedback Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="team">Team Dynamics</SelectItem>
                                  <SelectItem value="project">Project Management</SelectItem>
                                  <SelectItem value="process">Work Processes</SelectItem>
                                  <SelectItem value="leadership">Leadership</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Feedback Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="suggestion">Suggestion</SelectItem>
                                  <SelectItem value="praise">Praise</SelectItem>
                                  <SelectItem value="concern">Concern</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="rating"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Overall Rating</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-1"
                              >
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <FormItem key={value} className="flex flex-col items-center space-y-1">
                                    <FormControl>
                                      <RadioGroupItem
                                        value={value.toString()}
                                        className="sr-only"
                                        id={`rating-${value}`}
                                      />
                                    </FormControl>
                                    <Label
                                      htmlFor={`rating-${value}`}
                                      className="flex flex-col items-center cursor-pointer"
                                    >
                                      <Star className="h-6 w-6 text-gray-300 hover:text-yellow-400" />
                                      <span className="text-xs">{value}</span>
                                    </Label>
                                  </FormItem>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Feedback</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Share your thoughts, suggestions, or concerns..."
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="anonymous"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="mt-1"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Submit anonymously</FormLabel>
                              <p className="text-sm text-gray-500">
                                Your identity will be hidden from the feedback
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={submitFeedbackMutation.isPending}
                      >
                        {submitFeedbackMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Feedback
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="history">
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                  ) : feedbackData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No feedback submitted yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feedbackData.map((feedback: any) => {
                        const CategoryIcon = getCategoryIcon(feedback.category);
                        return (
                          <div key={feedback.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <CategoryIcon className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium capitalize">
                                  {feedback.category}
                                </span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500 capitalize">
                                  {feedback.type}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= feedback.rating
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(feedback.status)}`}>
                                  {feedback.status}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {feedback.message}
                            </p>
                            <p className="text-xs text-gray-400">
                              Submitted on {new Date(feedback.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
          
          {/* Stats Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback Stats</CardTitle>
              <CardDescription>Overview of feedback submissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{feedbackStats.total}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{feedbackStats.implemented}</div>
                  <div className="text-sm text-gray-500">Implemented</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{feedbackStats.reviewed}</div>
                  <div className="text-sm text-gray-500">Reviewed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{feedbackStats.pending}</div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Feedback Categories</h4>
                <div className="space-y-2">
                  {["team", "project", "process", "leadership", "other"].map((category) => {
                    const CategoryIcon = getCategoryIcon(category);
                    const count = feedbackData.filter((f: any) => f.category === category).length;
                    return (
                      <div key={category} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <CategoryIcon className="h-4 w-4 text-gray-500" />
                          <span className="capitalize">{category}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}