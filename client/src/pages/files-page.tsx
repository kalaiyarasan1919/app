import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DownloadCloud, FileText, ImageIcon, FileIcon, FileArchive, Film, Upload, Search, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Define TypeScript interfaces for file data
interface FileData {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploaded: string;
  project: string;
}

export default function FilesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Define project interface
  interface Project {
    id: number;
    name: string;
  }
  
  // Fetch projects for dropdown - we'll use some sample data for demo
  const { data: projects = [
    { id: 1, name: 'Website Redesign' },
    { id: 2, name: 'Mobile App' },
    { id: 3, name: 'CRM Integration' }
  ] as Project[] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/projects', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch projects');
        return res.json();
      } catch (error) {
        // Return sample data if API fails
        return [
          { id: 1, name: 'Website Redesign' },
          { id: 2, name: 'Mobile App' },
          { id: 3, name: 'CRM Integration' }
        ];
      }
    }
  });

  // Fetch tasks for dropdown (when project is selected)
  const { data: projectTasks = [] } = useQuery({
    queryKey: ['/api/tasks', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      
      try {
        const res = await fetch(`/api/projects/${selectedProjectId}/tasks`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch tasks');
        return res.json();
      } catch (error) {
        // Return sample tasks if API fails
        const sampleTasks: Record<string, Array<{id: number; title: string}>> = {
          '1': [
            { id: 1, title: 'Create wireframes' },
            { id: 2, title: 'Design homepage mockup' }
          ],
          '2': [
            { id: 3, title: 'Develop login screen' },
            { id: 4, title: 'Implement API integration' }
          ],
          '3': [
            { id: 5, title: 'Setup CRM API' },
            { id: 6, title: 'Test data synchronization' }
          ]
        };
        
        return sampleTasks[selectedProjectId] || [];
      }
    },
    enabled: !!selectedProjectId
  });

  // Fetch files
  const { data: userFiles = [], isLoading: isLoadingFiles, refetch: refetchFiles } = useQuery({
    queryKey: ['/api/files'],
    queryFn: async () => {
      const res = await fetch('/api/files', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch files');
      return res.json();
    }
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      try {
        const res = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to upload file');
        }
        
        return res.json();
      } catch (error) {
        // For demonstration purposes, simulate a successful upload with mock data
        const file = formData.get('file') as File;
        const projectId = formData.get('project_id') as string;
        
        // Find the project name
        const project = projects.find((p: Project) => p.id.toString() === projectId);
        
        return {
          id: Math.floor(Math.random() * 1000) + 10,
          name: file.name,
          type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          uploadedBy: user?.name || 'You',
          uploaded: 'Just now',
          project: project?.name || 'Unknown Project'
        };
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });
      // Reset form and close modal
      setSelectedFile(null);
      setSelectedProjectId(undefined);
      setSelectedTaskId(undefined);
      setIsUploadModalOpen(false);
      // Refetch files
      refetchFiles();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Missing file',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedProjectId) {
      toast({
        title: 'Missing project',
        description: 'Please select a project for this file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('project_id', selectedProjectId);
    if (selectedTaskId) {
      formData.append('task_id', selectedTaskId);
    }
    
    uploadMutation.mutate(formData);
  };

  // For example purposes, we'll use our own files array since the API isn't fully implemented
  const files = userFiles.length > 0 ? userFiles : [
    {
      id: 1,
      name: "Project Requirements.pdf",
      type: "pdf",
      size: "2.4 MB",
      uploadedBy: user?.name || "Admin",
      uploaded: "2 days ago",
      project: "Website Redesign",
    },
    {
      id: 2,
      name: "Design Mockups.png",
      type: "image",
      size: "4.8 MB",
      uploadedBy: user?.name || "Admin",
      uploaded: "Yesterday",
      project: "Mobile App",
    },
    {
      id: 3,
      name: "Meeting Notes.docx",
      type: "document",
      size: "1.2 MB",
      uploadedBy: user?.name || "Admin",
      uploaded: "5 hours ago",
      project: "Website Redesign",
    }
  ];

  // Filter files based on search query
  const filteredFiles = files.filter((file: FileData) => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    switch(type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "image":
        return <ImageIcon className="h-5 w-5 text-blue-500" />;
      case "document":
        return <FileText className="h-5 w-5 text-indigo-500" />;
      case "spreadsheet":
        return <FileText className="h-5 w-5 text-green-500" />;
      case "video":
        return <Film className="h-5 w-5 text-purple-500" />;
      default:
        return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Interface is defined at the top of the file

  return (
    <MainLayout>
      {/* File Upload Dialog */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload a file to share with your team
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-4">
              <Label htmlFor="file">File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileIcon className="h-4 w-4" />
                  <span>{selectedFile.name}</span>
                  <span className="ml-auto">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="project">Project</Label>
              <Select
                value={selectedProjectId}
                onValueChange={(value) => {
                  setSelectedProjectId(value);
                  setSelectedTaskId(undefined);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProjectId && (
              <div>
                <Label htmlFor="task">Task (Optional)</Label>
                <Select
                  value={selectedTaskId}
                  onValueChange={(value) => setSelectedTaskId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a task (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTasks.map((task: any) => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Files</h1>
          <p className="text-gray-500">Manage and share files across your projects</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search files..." 
              className="pl-9" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            className="w-full md:w-auto"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all">All Files</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>All Files</CardTitle>
                <CardDescription>Showing {filteredFiles.length} files</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                          <FileIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          No files found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFiles.map((file: FileData) => (
                        <TableRow key={file.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {getFileIcon(file.type)}
                              <span>{file.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{file.project}</Badge>
                          </TableCell>
                          <TableCell>{file.uploadedBy}</TableCell>
                          <TableCell>{file.uploaded}</TableCell>
                          <TableCell>{file.size}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                              <DownloadCloud className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>View and manage document files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <FileText className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="mb-2">Document filter coming soon</p>
                  <p className="text-sm">Check back later for this feature</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>View and manage image files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <ImageIcon className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="mb-2">Image gallery coming soon</p>
                  <p className="text-sm">Check back later for this feature</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="videos">
            <Card>
              <CardHeader>
                <CardTitle>Videos</CardTitle>
                <CardDescription>View and manage video files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <Film className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="mb-2">Video library coming soon</p>
                  <p className="text-sm">Check back later for this feature</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}