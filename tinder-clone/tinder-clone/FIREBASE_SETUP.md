# Firebase Setup Guide

## Overview

This Tinder clone application is fully integrated with Firebase including:
- **Authentication** - Email/password sign-in via Firebase Auth
- **Firestore** - Real-time database for user profiles and messages
- **Cloud Storage** - Profile picture uploads
- **Hosting** - Deploy the frontend to Firebase Hosting

## Prerequisites

1. A Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)
2. Firebase CLI installed: `npm install -g firebase-tools`
3. Node.js and npm installed

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name it (e.g., "tinder-clone")
4. Continue through the setup
5. Once created, note your **Project ID**

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password**
3. Go to **Users** tab and add test users or let them sign up

## Step 3: Set Up Firestore

1. Go to **Firestore Database** and create a new database
2. Choose **production mode**
3. Select your region
4. Create the following collections:
   - `users` - stores user profiles
   - `messages` - stores chat messages

### Firestore Security Rules

Go to **Firestore** > **Rules** and paste:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth.uid == userId || request.auth != null;
      allow write: if request.auth.uid == userId;
      allow create: if request.auth.uid == userId;
    }
    
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.data.senderId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.senderId == request.auth.uid;
    }
  }
}
```

Click **Publish** to apply.

## Step 4: Set Up Cloud Storage

1. Go to **Storage** and create a bucket
2. Choose the same region as your Firestore database
3. Go to **Rules** and paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-pictures/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

Click **Publish** to apply.

## Step 5: Get Your Credentials

### Frontend Credentials

1. Go to **Project Settings** (gear icon) > **General**
2. Under "Your apps", select your web app or create one
3. Copy the Firebase config:
   ```javascript
   {
     "apiKey": "...",
     "authDomain": "...",
     "projectId": "...",
     "storageBucket": "...",
     "messagingSenderId": "...",
     "appId": "..."
   }
   ```

### Backend Credentials (Admin SDK)

1. Go to **Project Settings** > **Service Accounts**
2. Click **Generate New Private Key**
3. Save the JSON file (keep it secure!)

## Step 6: Configure Environment Variables

### Frontend (`frontend/.env`)

```env
VITE_API_URL="http://localhost:3000"
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

### Backend (`backend/.env`)

Option A: Use service account JSON:
```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
FIREBASE_ADMIN_PROJECT_ID="your-project-id"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk@...iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

Option B: Use individual fields (more secure):
```env
FIREBASE_ADMIN_PROJECT_ID="your-project-id"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk@...iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

## Step 7: Run Development Servers

### Terminal 1 - Backend
```bash
cd backend
npm install
npm run dev
# Server running on http://localhost:3000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
# App running on http://localhost:5173
```

## Step 8: Test the Integration

1. Visit `http://localhost:5173`
2. Sign up with an email and password
3. Upload a profile picture
4. Click "Fetch backend profile" to test authentication
5. Join a match and start chatting (messages saved to Firestore)

## Step 9: Deploy to Firebase Hosting

### Update `.firebaserc`

Replace the project ID in `frontend/.firebaserc`:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### Login to Firebase

```bash
firebase login
```

### Build and Deploy

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

Your frontend will be live at: `https://your-project-id.web.app`

### Deploy Backend (Optional - Requires Firebase Cloud Functions)

For production backend deployment, you can use [Firebase Cloud Functions](https://firebase.google.com/docs/functions) or deploy to another service like Vercel, Render, or Railway.

## API Endpoints

All backend API endpoints require Firebase ID token in the `Authorization` header:
```
Authorization: Bearer <firebase-id-token>
```

### Auth
- `GET /api/auth/profile` - Get current user's Firebase profile

### User
- `GET /api/user/profile/:userId` - Get user profile from Firestore
- `POST /api/user/profile` - Create/update user profile

Body for POST:
```json
{
  "name": "John Doe",
  "bio": "Love hiking and coffee",
  "age": 26,
  "location": "San Francisco"
}
```

### Storage
- `POST /api/storage/upload-url` - Get signed URL to upload file
- `POST /api/storage/download-url` - Get signed URL to download file

Upload URL body:
```json
{
  "filename": "profile.jpg",
  "contentType": "image/jpeg"
}
```

Download URL body:
```json
{
  "path": "profile-pictures/user-id/profile.jpg"
}
```

## Firestore Data Structure

### users Collection
```json
{
  "uid": "user-id",
  "email": "user@example.com",
  "name": "John Doe",
  "bio": "Love hiking and coffee",
  "age": 26,
  "location": "San Francisco",
  "profilePicture": "profile-pictures/user-id/...",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### messages Collection
```json
{
  "matchId": "match-id",
  "senderId": "user-id",
  "content": "Hey there!",
  "sentAt": "2024-01-01T00:00:00Z"
}
```

## Troubleshooting

### "Authentication required" error
- Make sure Firebase ID token is included in headers
- Check that `Authorization: Bearer <token>` format is correct
- Token might be expired, refresh it

### Firestore permission denied
- Check Security Rules are published
- User must be authenticated
- Check rule conditions match your data structure

### Storage upload fails
- Verify bucket exists
- Check Storage Rules are correct
- File size limits apply (see Firebase docs)

### Deployment fails
- Run `firebase logout` and `firebase login` again
- Check Node.js version compatibility
- Ensure you're in the correct directory

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Cloud Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
