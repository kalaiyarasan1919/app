# MongoDB Setup Guide

## Getting MongoDB URI

### Option 1: MongoDB Atlas (Recommended for Production)

1. **Sign up** at [MongoDB Atlas](https://cloud.mongodb.com/)
2. **Create a new cluster** (free tier available)
3. **Get connection string:**
   - Go to your cluster
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string

**Example Atlas URI:**
```
mongodb+srv://username:password@cluster.mongodb.net/collaborative_task_manager?retryWrites=true&w=majority
```

### Option 2: Local MongoDB

1. **Install MongoDB Community Server:**
   - **Windows**: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - **macOS**: `brew install mongodb-community`
   - **Linux**: Follow [MongoDB installation guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB service:**
   - **Windows**: MongoDB runs as a service automatically
   - **macOS**: `brew services start mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

3. **Local connection string:**
```
mongodb://localhost:27017/collaborative_task_manager
```

## Environment Setup

Create a `.env` file in your project root:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/collaborative_task_manager?retryWrites=true&w=majority

# For local development
# MONGODB_URI=mongodb://localhost:27017/collaborative_task_manager

# Session Secret
SESSION_SECRET=your-super-secret-key-here

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Node Environment
NODE_ENV=development
```

## Testing the Connection

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Test the database connection:**
   - Visit `http://localhost:5000/api/test-db`
   - You should see a response with user count and users array

3. **Check server logs** for MongoDB connection success message

## Troubleshooting

### Common Issues:

1. **Connection refused:**
   - Make sure MongoDB is running
   - Check if the port 27017 is available

2. **Authentication failed:**
   - Verify username/password in connection string
   - For Atlas, make sure IP whitelist includes your IP

3. **Network timeout:**
   - Check internet connection
   - Verify Atlas cluster is running

### Atlas Setup Tips:

1. **Create Database User:**
   - Go to Atlas → Database Access
   - Add new database user with read/write permissions

2. **Network Access:**
   - Go to Atlas → Network Access
   - Add your IP address or `0.0.0.0/0` for all IPs

3. **Cluster Setup:**
   - Choose M0 (free) tier for development
   - Select your preferred cloud provider and region

## Database Collections

The application will automatically create these collections:
- `users` - User accounts and profiles
- `projects` - Project information
- `tasks` - Task management
- `comments` - Task and project comments
- `activities` - User activity logs
- `files` - Uploaded file metadata
- `feedback` - User feedback submissions

## Migration from PostgreSQL

The application has been migrated from PostgreSQL to MongoDB. All existing data will need to be migrated manually if you have existing data.

## Production Considerations

1. **Use MongoDB Atlas** for production deployments
2. **Set up proper indexes** for performance
3. **Configure backup strategies**
4. **Use environment variables** for all sensitive data
5. **Set up monitoring** and alerts