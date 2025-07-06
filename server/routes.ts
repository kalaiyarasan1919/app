import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { handleChatRequest } from "./chatbot";
import {
  // projectSchema, // If needed for validation, otherwise remove
  // commentSchema, // If needed for validation, otherwise remove
  // activitySchema, // If needed for validation, otherwise remove
  // feedbackSchema, // If needed for validation, otherwise remove
  TaskStatus,
  ProjectStatus,
  UserRole
} from "@shared/schema";
import passport from "passport";
import { User, Project, Task, Comment, Activity, File, Feedback } from './models/index';

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      cb(null, uploadDir);
    },
    filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Role check middleware
function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }

    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Auth routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  app.get("/api/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), async (req, res, next) => {
    try {
      // The user should already be authenticated by passport
      if (!req.user) {
        return res.redirect("/login");
      }

      // req.user should contain the user data from passport
      const user = req.user as any;
      
      // Store MongoDB _id in session
      (req.session as any).userId = user._id.toString();
      
      // Save session before redirect
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.redirect("/login");
        }
        res.redirect("/");
      });
    } catch (err) {
      console.error("Google callback error:", err);
      res.redirect("/login");
    }
  });

  // Auth check endpoint
  app.get("/api/user", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await User.find({});
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    const { username, password, name, email, role, avatar } = req.body;
    try {
      const user = await User.create({
        username,
        password,
        name,
        email,
        role,
        avatar
      });
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  });

  // PATCH /api/user - update profile
  app.patch("/api/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { name, username, email } = req.body;
      const user = await User.findByIdAndUpdate(userId, { name, username, email }, { new: true });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // PATCH /api/user/notifications - update notification preferences
  app.patch("/api/user/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      // TODO: Add notification preferences field to User model
      return res.status(501).json({ message: "Not implemented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // PATCH /api/user/password - change password
  app.patch("/api/user/password", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }
      // TODO: Implement password hashing and verification
      const user = await User.findByIdAndUpdate(userId, { password: newPassword }, { new: true });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

      // Only fetch tasks where user is creator, assignee, or in shared_with
      const query = {
        $or: [
          { creator_id: userId },
          { assignee_id: userId },
          { shared_with: userId }
        ]
      };

      const total = await Task.countDocuments(query);
      const tasks = await Task.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('assignee_id', 'name email')
        .populate('creator_id', 'name email');

      res.json({
        tasks,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const task = await Task.findById(id).populate('assignee_id', 'name email').populate('creator_id', 'name email');
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    const { title, description, status, priority, deadline, project_id, assignee_id } = req.body;
    const creator_id = (req.session as any).userId;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    
    try {
      const task = await Task.create({
        title,
        description,
        status,
        priority,
        deadline,
        project_id,
        assignee_id,
        creator_id
      });
      
      // Populate the creator and assignee information
      const populatedTask = await Task.findById(task._id)
        .populate('creator_id', 'name email')
        .populate('assignee_id', 'name email');
      
      res.status(201).json(populatedTask);
    } catch (error) {
      console.error("Task creation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Error creating task" });
      }
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
      // Only allow updating shared_with, status, priority, deadline, title, description, assignee_id, project_id
      const allowedFields = [
        "shared_with", "status", "priority", "deadline", "title", "description", "assignee_id", "project_id"
      ];
      const update: any = {};
      for (const key of allowedFields) {
        if (updateData[key] !== undefined) update[key] = updateData[key];
      }
      const task = await Task.findByIdAndUpdate(id, update, { new: true });
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Error updating task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const task = await Task.findByIdAndDelete(id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json({ message: "Task deleted" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting task" });
    }
  });

  // Comments routes
  app.get("/api/tasks/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const comments = await Comment.find({ task_id: id }).populate('user_id', 'name email');
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/tasks/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = (req.session as any).userId;
      
      const comment = await Comment.create({
        content,
        task_id: id,
        user_id: userId
      });
      
      const populatedComment = await Comment.findById(comment._id).populate('user_id', 'name email');
      res.status(201).json(populatedComment);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create comment" });
      }
    }
  });

  // File uploads routes
  app.post("/api/files/upload", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { taskId, projectId } = req.body;
      if (!taskId && !projectId) {
        return res.status(400).json({ message: "Either taskId or projectId must be provided" });
      }
      
      const userId = (req.session as any).userId;
      const file = await File.create({
        filename: req.file.filename,
        filepath: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        project_id: projectId,
        task_id: taskId,
        uploader_id: userId
      });
      
      res.status(201).json(file);
    } catch (error) {
      console.error("File upload error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to upload file" });
      }
    }
  });

  app.get("/api/files", isAuthenticated, async (req, res) => {
    try {
      const files = await File.find({}).populate('uploader_id', 'name email');
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get("/api/files/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const file = await File.findById(id).populate('uploader_id', 'name email');
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.delete("/api/files/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const file = await File.findByIdAndDelete(id);
      if (!file) return res.status(404).json({ message: "File not found" });
      res.json({ message: "File deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const activities = await Activity.find({}).populate('user_id', 'name email');
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.delete("/api/activities/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const activity = await Activity.findByIdAndDelete(id);
      if (!activity) return res.status(404).json({ message: "Activity not found" });
      res.json({ message: "Activity deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // Health check endpoint for deployment platforms
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // Database test endpoint
  app.get("/api/test-db", async (req, res) => {
    try {
      console.log("Testing database connection...");
      const userCount = await User.countDocuments();
      const users = await User.find({}).limit(5);
      res.json({
        success: true,
        userCount,
        users
      });
    } catch (error: any) {
      console.error("Database test failed:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // API for AI chatbot
  app.post("/api/chatbot", isAuthenticated, handleChatRequest);
  
  // API for anonymous feedback
  app.post("/api/feedback", isAuthenticated, async (req, res) => {
    try {
      const { category, type, rating, message, anonymous } = req.body;
      const userId = anonymous ? undefined : (req.session as any).userId;
      
      const feedback = await Feedback.create({
        category,
        type,
        rating,
        message,
        anonymous,
        user_id: userId
      });
      
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Feedback submission error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to submit feedback" });
      }
    }
  });



  app.get("/api/feedback", isAuthenticated, async (req, res) => {
    try {
      const feedback = await Feedback.find({}).populate('user_id', 'name email');
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);

  return httpServer;
}