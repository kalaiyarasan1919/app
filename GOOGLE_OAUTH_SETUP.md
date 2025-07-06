# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Collaborative Task Manager app.

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" → "OAuth 2.0 Client IDs"
6. Choose "Web application" as the application type
7. Add the following authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)
8. Note down your Client ID and Client Secret

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory with the following content:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret

# Session Secret (change this in production)
SESSION_SECRET=your-secure-session-secret
```

Replace `your-actual-google-client-id` and `your-actual-google-client-secret` with the credentials you obtained from Google Cloud Console.

## Step 3: Update Database Schema

If you're using a database, you'll need to add the `google_id` column to your users table:

```sql
ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
```

## Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the login page
3. Click "Continue with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you should be redirected back to your app and logged in

## Features

- **Automatic Account Creation**: New users will have accounts created automatically when they first sign in with Google
- **Email Linking**: If a user already exists with the same email address, their account will be linked to their Google account
- **Profile Information**: User's name and profile picture from Google will be imported automatically
- **Role Assignment**: New Google users are assigned the "Team Member" role by default

## Security Notes

- Always use HTTPS in production
- Keep your Client Secret secure and never commit it to version control
- Use a strong, unique Session Secret in production
- Consider implementing additional security measures like email verification

## Troubleshooting

- **"Invalid redirect URI"**: Make sure the redirect URI in Google Cloud Console matches exactly
- **"Client ID not found"**: Verify your Client ID is correct in the .env file
- **Session issues**: Check that your Session Secret is set correctly 