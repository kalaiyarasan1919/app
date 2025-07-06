import { z } from "zod";

// User roles
export enum UserRole {
  ADMIN = "admin",
  TEAM_MEMBER = "team_member",
  CLIENT = "client"
}

// Task statuses
export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  REVIEW = "review",
  COMPLETED = "completed"
}

// Task priorities
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

// Project statuses
export enum ProjectStatus {
  PLANNING = "planning",
  ON_TRACK = "on_track",
  AT_RISK = "at_risk",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed"
}

// MongoDB-compatible Zod schemas
export const userSchema = z.object({
  username: z.string(),
  password: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole).default(UserRole.TEAM_MEMBER),
  avatar: z.string().optional(),
  googleId: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
  deadline: z.date().optional(),
  owner_id: z.string(), // MongoDB ObjectId as string
  members: z.array(z.string()).optional(), // Array of MongoDB ObjectIds
});

export const taskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  deadline: z.date().optional(),
  project_id: z.string().optional(), // MongoDB ObjectId as string
  assignee_id: z.string().optional(), // MongoDB ObjectId as string
  creator_id: z.string(), // MongoDB ObjectId as string
  shared_with: z.array(z.string()).optional(), // Array of MongoDB ObjectIds
  completed_at: z.date().optional(),
});

export const commentSchema = z.object({
  content: z.string(),
  task_id: z.string().optional(), // MongoDB ObjectId as string
  project_id: z.string().optional(), // MongoDB ObjectId as string
  user_id: z.string(), // MongoDB ObjectId as string
  created_at: z.date().default(() => new Date()),
});

export const activitySchema = z.object({
  action: z.string(),
  description: z.string(),
  user_id: z.string(), // MongoDB ObjectId as string
  project_id: z.string().optional(), // MongoDB ObjectId as string
  task_id: z.string().optional(), // MongoDB ObjectId as string
  created_at: z.date().default(() => new Date()),
});

export const fileSchema = z.object({
  filename: z.string(),
  filepath: z.string(),
  size: z.number(),
  mimetype: z.string(),
  project_id: z.string().optional(), // MongoDB ObjectId as string
  task_id: z.string().optional(), // MongoDB ObjectId as string
  uploader_id: z.string(), // MongoDB ObjectId as string
  uploaded_at: z.date().default(() => new Date()),
});

export const feedbackSchema = z.object({
  category: z.string(),
  type: z.string(),
  rating: z.number(),
  message: z.string(),
  anonymous: z.boolean().default(true),
  user_id: z.string().optional(), // MongoDB ObjectId as string
  created_at: z.date().default(() => new Date()),
  status: z.string().default("pending"),
});

// Type definitions for MongoDB documents
export type User = z.infer<typeof userSchema> & { _id?: string };
export type Project = z.infer<typeof projectSchema> & { _id?: string };
export type Task = z.infer<typeof taskSchema> & { _id?: string };
export type Comment = z.infer<typeof commentSchema> & { _id?: string };
export type Activity = z.infer<typeof activitySchema> & { _id?: string };
export type File = z.infer<typeof fileSchema> & { _id?: string };
export type Feedback = z.infer<typeof feedbackSchema> & { _id?: string };

// Insert types (without _id)
export type InsertUser = z.infer<typeof userSchema>;
export type InsertProject = z.infer<typeof projectSchema>;
export type InsertTask = z.infer<typeof taskSchema>;
export type InsertComment = z.infer<typeof commentSchema>;
export type InsertActivity = z.infer<typeof activitySchema>;
export type InsertFile = z.infer<typeof fileSchema>;
export type InsertFeedback = z.infer<typeof feedbackSchema>; 