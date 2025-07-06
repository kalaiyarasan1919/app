import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Load .env

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.DATABASE_URL;
    
    if (!mongoURI) {
      throw new Error('MongoDB connection string not found in environment variables');
    }

    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB; 