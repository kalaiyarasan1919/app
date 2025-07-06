import mongoose from 'mongoose';
import { projectSchema, ProjectStatus } from '../../shared/schema';

const projectSchemaMongoose = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: Object.values(ProjectStatus), default: ProjectStatus.PLANNING },
  deadline: { type: Date },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: true
});

export const Project = mongoose.model('Project', projectSchemaMongoose); 