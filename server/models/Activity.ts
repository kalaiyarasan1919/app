import mongoose from 'mongoose';
import { activitySchema } from '../../shared/schema';

const activitySchemaMongoose = new mongoose.Schema({
  action: { type: String, required: true },
  description: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  created_at: { type: Date, default: Date.now },
}, {
  timestamps: true
});

export const Activity = mongoose.model('Activity', activitySchemaMongoose); 