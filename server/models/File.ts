import mongoose from 'mongoose';
import { fileSchema } from '../../shared/schema';

const fileSchemaMongoose = new mongoose.Schema({
  filename: { type: String, required: true },
  filepath: { type: String, required: true },
  size: { type: Number, required: true },
  mimetype: { type: String, required: true },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  uploader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploaded_at: { type: Date, default: Date.now },
}, {
  timestamps: true
});

export const File = mongoose.model('File', fileSchemaMongoose); 