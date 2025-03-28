import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { TaskList } from "@/components/dashboard/task-list";
import { NewTaskModal } from "@/components/modals/new-task-modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Task, TaskStatus } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function TasksPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);

  const openNewTaskModal = () => {
    setTaskToEdit(undefined);
    setNewTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setTaskToEdit(task);
    setNewTaskModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-700">My Tasks</h1>
          <Button 
            onClick={openNewTaskModal}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white mt-3 md:mt-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="todo">To Do</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="review">In Review</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <TaskList 
        userId={user?.id}
        showFilter={false}
        onAddTask={openNewTaskModal}
        onEditTask={openEditTaskModal}
      />

      <NewTaskModal 
        isOpen={newTaskModalOpen} 
        onClose={() => setNewTaskModalOpen(false)} 
        initialTask={taskToEdit}
      />
    </MainLayout>
  );
}
