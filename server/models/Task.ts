import mongoose from 'mongoose';
import { taskSchema, TaskStatus, TaskPriority } from '../../shared/schema';

const taskSchemaMongoose = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.TODO },
  priority: { type: String, enum: Object.values(TaskPriority), default: TaskPriority.MEDIUM },
  deadline: { type: Date },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  assignee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  creator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shared_with: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  completed_at: { type: Date },
}, {
  timestamps: true
});

export const Task = mongoose.model('Task', taskSchemaMongoose); 