import mongoose from 'mongoose';
import { commentSchema } from '../../shared/schema';

const commentSchemaMongoose = new mongoose.Schema({
  content: { type: String, required: true },
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now },
}, {
  timestamps: true
});

export const Comment = mongoose.model('Comment', commentSchemaMongoose); 