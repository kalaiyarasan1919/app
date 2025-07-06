import mongoose from 'mongoose';
import { userSchema, UserRole } from '../../shared/schema';

const userSchemaMongoose = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.TEAM_MEMBER },
  avatar: { type: String },
  googleId: { type: String },
}, {
  timestamps: true
});

export const User = mongoose.model('User', userSchemaMongoose); 