import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TaskList } from "@/components/dashboard/task-list";
import { NewTaskModal } from "@/components/modals/new-task-modal";
import { NewProjectModal } from "@/components/modals/new-project-modal";
import { Loader2, PlusIcon, Calendar, CheckCircle, AlertTriangle, Users, FileText } from "lucide-react";
import { Task, Project, ProjectStatus, TaskStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ProjectWithMembers } from "@/lib/types";
import { format } from "date-fns";

export default function ProjectPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("overview");

  // All projects query for the projects list view
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  // Single project query when viewing a specific project
  const { data: project, isLoading: projectLoading } = useQuery<ProjectWithMembers>({
    queryKey: ["/api/projects", id],
    queryFn: async () => {
      if (!id) throw new Error("No project ID provided");
      const res = await fetch(`/api/projects/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
    enabled: !!id,
  });

  // Project members query
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["/api/projects", id, "members"],
    queryFn: async () => {
      if (!id) throw new Error("No project ID provided");
      const res = await fetch(`/api/projects/${id}/members`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch project members");
      return res.json();
    },
    enabled: !!id,
  });

  // Project tasks query
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { projectId: id ? parseInt(id) : undefined }],
    queryFn: async () => {
      if (!id) throw new Error("No project ID provided");
      const res = await fetch(`/api/tasks?projectId=${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: !!id,
  });

  // Calculate project stats
  const projectStats = project ? {
    taskCount: tasks.length,
    completedTaskCount: tasks.filter(task => task.status === TaskStatus.COMPLETED).length,
    memberCount: members.length,
    progress: tasks.length > 0 
      ? Math.round((tasks.filter(task => task.status === TaskStatus.COMPLETED).length / tasks.length) * 100) 
      : 0
  } : null;

  const openNewTaskModal = () => {
    setTaskToEdit(undefined);
    setNewTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setTaskToEdit(task);
    setNewTaskModalOpen(true);
  };

  const openEditProjectModal = () => {
    setEditProjectModalOpen(true);
  };

  // Get status badge color
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ON_TRACK:
        return "bg-green-100 text-green-800 border-green-200";
      case ProjectStatus.AT_RISK:
        return "bg-red-100 text-red-800 border-red-200";
      case ProjectStatus.IN_PROGRESS:
        return "bg-orange-100 text-orange-800 border-orange-200";
      case ProjectStatus.COMPLETED:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case ProjectStatus.PLANNING:
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (id && (projectLoading || tasksLoading || membersLoading)) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </MainLayout>
    );
  }

  // Projects list view
  if (!id) {
    return (
      <MainLayout>
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-700">Projects</h1>
            
            <Button 
              onClick={() => setEditProjectModalOpen(true)}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white mt-3 md:mt-0"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              <span>New Project</span>
            </Button>
          </div>
        </div>

        {projectsLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{project.name}</CardTitle>
                    <Badge variant="outline" className={getStatusColor(project.status as ProjectStatus)}>
                      {project.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </Badge>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {project.deadline && (
                    <div className="text-sm text-gray-500 mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due: {format(new Date(project.deadline), "MMM dd, yyyy")}
                    </div>
                  )}
                  <Button variant="link" className="px-0 text-indigo-600">
                    View Project
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <NewProjectModal 
          isOpen={editProjectModalOpen} 
          onClose={() => setEditProjectModalOpen(false)} 
        />
      </MainLayout>
    );
  }

  // Single project view
  return (
    <MainLayout>
      {project && (
        <>
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-700">{project.name}</h1>
                  <Badge variant="outline" className={getStatusColor(project.status as ProjectStatus)}>
                    {project.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </Badge>
                </div>
                {project.description && (
                  <p className="text-gray-500 mt-1">{project.description}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2 mt-3 md:mt-0">
                <Button 
                  onClick={openNewTaskModal}
                  className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  <span>Add Task</span>
                </Button>
                <Button 
                  onClick={openEditProjectModal}
                  variant="outline" 
                  className="inline-flex items-center border-gray-200 text-gray-700"
                >
                  Edit Project
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 font-medium">Tasks</div>
                    <div className="text-2xl font-bold text-gray-800">{projectStats?.taskCount || 0}</div>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-600">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 font-medium">Completed</div>
                    <div className="text-2xl font-bold text-gray-800">{projectStats?.completedTaskCount || 0}</div>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center text-green-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 font-medium">Progress</div>
                    <div className="text-2xl font-bold text-gray-800">{projectStats?.progress || 0}%</div>
                  </div>
                  <div className="w-10 h-10 bg-orange-100 rounded-md flex items-center justify-center text-orange-600">
                    <Progress value={projectStats?.progress || 0} className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 font-medium">Team Members</div>
                    <div className="text-2xl font-bold text-gray-800">{projectStats?.memberCount || 0}</div>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-600">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TaskList 
                    projectId={parseInt(id)} 
                    limit={5} 
                    onAddTask={openNewTaskModal} 
                    onEditTask={openEditTaskModal} 
                  />
                </div>
                
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {members.length === 0 ? (
                        <p className="text-gray-500 text-sm">No team members yet</p>
                      ) : (
                        <div className="space-y-3">
                          {members.map((member) => (
                            <div key={member.id} className="flex items-center space-x-3">
                              <Avatar>
                                {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                                <AvatarFallback>{member.name?.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-sm text-gray-500">{member.role}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {project.deadline && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Deadline</div>
                          <div className="flex items-center mt-1">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            <span>{format(new Date(project.deadline), "MMMM d, yyyy")}</span>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <div className="text-sm font-medium text-gray-500">Status</div>
                        <div className="mt-1">
                          <Badge variant="outline" className={getStatusColor(project.status as ProjectStatus)}>
                            {project.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-500">Progress</div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                            <div 
                              className="bg-indigo-600 h-2.5 rounded-full" 
                              style={{ width: `${projectStats?.progress || 0}%` }}
                            ></div>
                          </div>
                          <div className="text-sm text-gray-500">{projectStats?.progress || 0}% complete</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="tasks">
              <TaskList 
                projectId={parseInt(id)} 
                showAddButton={true}
                onAddTask={openNewTaskModal} 
                onEditTask={openEditTaskModal} 
              />
            </TabsContent>
            
            <TabsContent value="team">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Team Members</CardTitle>
                  <Button size="sm" variant="outline">Add Member</Button>
                </CardHeader>
                <CardContent>
                  {members.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <h3 className="text-lg font-medium text-gray-700">No team members yet</h3>
                      <p className="text-gray-500 max-w-md mx-auto mt-1">
                        Add team members to collaborate on this project.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between py-4">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                              <AvatarFallback>{member.name?.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-gray-500">{member.role}</div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="files">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Files & Documents</CardTitle>
                  <Button size="sm" variant="outline">Upload File</Button>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <h3 className="text-lg font-medium text-gray-700">No files yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mt-1">
                      Upload files to share with your team.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
      
      {/* Modals */}
      <NewTaskModal 
        isOpen={newTaskModalOpen} 
        onClose={() => setNewTaskModalOpen(false)} 
        initialTask={taskToEdit}
        projectId={id ? parseInt(id) : undefined}
      />
      
      <NewProjectModal 
        isOpen={editProjectModalOpen} 
        onClose={() => setEditProjectModalOpen(false)} 
        project={project}
      />
    </MainLayout>
  );
}
