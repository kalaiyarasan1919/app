import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DownloadCloud, FileText, Image, FileIcon, FileArchive, Film, Upload, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function FilesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Sample files for demonstration purposes
  const files = [
    {
      id: 1,
      name: "Project Requirements.pdf",
      type: "pdf",
      size: "2.4 MB",
      uploadedBy: "Sarah Johnson",
      uploaded: "2 days ago",
      project: "Website Redesign",
    },
    {
      id: 2,
      name: "Design Mockups.png",
      type: "image",
      size: "4.8 MB",
      uploadedBy: "Mike Peterson",
      uploaded: "Yesterday",
      project: "Mobile App",
    },
    {
      id: 3,
      name: "Meeting Notes.docx",
      type: "document",
      size: "1.2 MB",
      uploadedBy: "Alex Rodriguez",
      uploaded: "5 hours ago",
      project: "Website Redesign",
    },
    {
      id: 4,
      name: "Project Timeline.xlsx",
      type: "spreadsheet",
      size: "3.1 MB",
      uploadedBy: "Jessica Chen",
      uploaded: "1 hour ago",
      project: "CRM Integration",
    },
    {
      id: 5,
      name: "Product Demo.mp4",
      type: "video",
      size: "68.3 MB",
      uploadedBy: "David Williams",
      uploaded: "Just now",
      project: "Mobile App",
    },
  ];

  // Filter files based on search query
  const filteredFiles = files.filter(file => 
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
        return <Image className="h-5 w-5 text-blue-500" />;
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

  return (
    <MainLayout>
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
          <Button className="w-full md:w-auto">
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
                      filteredFiles.map((file) => (
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
                  <Image className="h-12 w-12 mb-4 text-gray-300" />
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