import mongoose from 'mongoose';
import { feedbackSchema } from '../../shared/schema';

const feedbackSchemaMongoose = new mongoose.Schema({
  category: { type: String, required: true },
  type: { type: String, required: true },
  rating: { type: Number, required: true },
  message: { type: String, required: true },
  anonymous: { type: Boolean, default: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' },
}, {
  timestamps: true
});

export const Feedback = mongoose.model('Feedback', feedbackSchemaMongoose); 