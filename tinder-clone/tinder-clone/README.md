# 🔥 Firebase Tinder Clone - Complete Setup

This is a fully functional Tinder clone with **complete Firebase integration** including authentication, real-time database, cloud storage, and hosting.

## ✨ Features

### 🔐 Authentication
- Email/Password sign-up and login
- Firebase Auth with persistent sessions
- Secure token-based backend communication

### 👤 User Profiles
- Create and update profile information (name, bio, age, location)
- Upload profile pictures to Firebase Cloud Storage
- View other users' profiles with real-time data from Firestore

### 💬 Messaging
- Real-time chat with Socket.IO
- Messages automatically saved to Firestore
- Persistent message history
- Real-time typing and delivery indicators

### 🎴 Swipe Feature
- Beautiful swipe cards with animations (Framer Motion)
- Swipe left/right with smooth interactions
- Mock profile data for demo

### 🌐 Hosting
- Ready for Firebase Hosting deployment
- Optimized production build
- Tailwind CSS for styling

## 📂 Project Structure

```
tinder-clone/
├── frontend/               # React + Vite + Firebase
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── AuthForm.tsx       # Sign up/Login
│   │   │   ├── Chat.tsx           # Real-time chat
│   │   │   ├── ProfileUpload.tsx  # Image upload to Storage
│   │   │   └── SwipeCard.tsx      # Swipe cards
│   │   ├── services/
│   │   │   └── api.ts            # Backend API client
│   │   ├── firebase.ts           # Firebase Auth config
│   │   ├── firestore.ts          # Firestore config
│   │   ├── storage.ts            # Cloud Storage config
│   │   ├── App.tsx               # Main app with tabs
│   │   └── main.tsx
│   ├── .env                      # Firebase config (VITE_*)
│   ├── .env.example              # Template
│   ├── firebase.json             # Hosting config
│   ├── .firebaserc               # Project reference
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                # Express + Firebase Admin SDK
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/            # Authentication routes
│   │   │   │   ├── authMiddleware.ts
│   │   │   │   └── authRoutes.ts
│   │   │   ├── user/            # User profile routes
│   │   │   │   └── userRoutes.ts
│   │   │   └── storage/         # Storage signed URLs
│   │   │       └── storageRoutes.ts
│   │   ├── firebaseAdmin.ts     # Firebase Admin init
│   │   ├── app.ts               # Express app setup
│   │   └── server.ts            # Server entry point
│   ├── .env                     # Firebase Admin credentials
│   ├── .env.example             # Template
│   ├── package.json
│   └── tsconfig.json
│
├── FIREBASE_SETUP.md            # Detailed Firebase setup guide
├── API.md                       # Complete API documentation
└── README.md                    # This file
```

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd tinder-clone
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure Firebase

Follow the detailed guide in `FIREBASE_SETUP.md` to:
- Create a Firebase project
- Enable authentication
- Set up Firestore
- Set up Cloud Storage
- Get credentials

### 3. Add Environment Variables

**Frontend** (`frontend/.env`):
```env
VITE_API_URL="http://localhost:3000"
VITE_FIREBASE_API_KEY="your-key"
VITE_FIREBASE_AUTH_DOMAIN="your-domain"
VITE_FIREBASE_PROJECT_ID="your-project"
VITE_FIREBASE_STORAGE_BUCKET="your-bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

**Backend** (`backend/.env`):
```env
FIREBASE_ADMIN_PROJECT_ID="your-project"
FIREBASE_ADMIN_CLIENT_EMAIL="your-email"
FIREBASE_ADMIN_PRIVATE_KEY="your-key"
FRONTEND_URL="http://localhost:5173"
```

### 4. Run Development Servers

Terminal 1 - Backend:
```bash
cd backend
npm run dev
# Server at http://localhost:3000
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
# App at http://localhost:5173
```

### 5. Test It Out

1. Visit http://localhost:5173
2. Sign up with email & password
3. Upload a profile picture
4. Browse profile, swipe cards, and chat in real-time!

## 📚 API Documentation

See `API.md` for complete endpoint documentation including:
- Authentication endpoints
- User profile management
- Cloud Storage signed URLs
- Socket.IO real-time messaging
- Error handling
- Code examples

### Key Endpoints

```
GET  /api/auth/profile              # Get current user
GET  /api/user/profile/:userId      # Get user profile
POST /api/user/profile              # Update profile
POST /api/storage/upload-url        # Get file upload URL
POST /api/storage/download-url      # Get file download URL
```

## 🔒 Security Features

- ✅ Firebase Auth tokens for API calls
- ✅ Firestore Security Rules
- ✅ Cloud Storage Security Rules
- ✅ CORS configured
- ✅ Environment variables for sensitive data
- ✅ Signed URLs for file access

## 📦 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Firebase SDK** - Auth, Firestore, Storage
- **Socket.IO Client** - Real-time events

### Backend
- **Express.js** - Web framework
- **Node.js** - Runtime
- **TypeScript** - Type safety
- **Firebase Admin SDK** - Server auth & database
- **Socket.IO** - Real-time messaging
- **CORS** - Cross-origin requests

### Database & Storage
- **Firestore** - Real-time NoSQL database
- **Cloud Storage** - File uploads
- **Firebase Auth** - User authentication

## 🎯 Features Deep Dive

### Authentication Flow
1. User signs up with email/password (Firebase Auth)
2. Firebase generates ID token
3. Token is automatically refreshed by Firebase SDK
4. Token is sent with API requests in `Authorization` header
5. Backend verifies token with Firebase Admin SDK
6. User data is returned or stored in Firestore

### Profile Picture Upload
1. Frontend requests upload URL from backend
2. Backend generates signed URL (15-min expiry)
3. Frontend uploads file directly to Cloud Storage
4. File is stored at `profile-pictures/{userId}/{filename}`
5. Frontend can request download URL for later

### Real-time Chat
1. Users join a match room via Socket.IO
2. Messages are sent to backend via Socket.IO
3. Backend stores message in Firestore
4. Message is broadcast to all users in the room
5. Firestore listener updates UI in real-time

### Swipe Cards
- Draggable cards with Framer Motion
- Horizontal drag for left/right swipe
- Vertical drag for up swipe
- Smooth animations and transitions

## 🚢 Deployment

### Frontend - Firebase Hosting

```bash
cd frontend
npm run build              # Creates optimized build
firebase deploy --only hosting
```

Your app will be live at: `https://your-project-id.web.app`

### Backend - Alternative Hosting

The backend can be deployed to:
- **Firebase Cloud Functions** (easiest, part of Firebase)
- **Vercel** (great for Node.js)
- **Render** (generous free tier)
- **Railway** (simple deployment)
- **AWS Lambda** (with custom layers)
- **DigitalOcean** (VPS hosting)
- **Heroku** (legacy but still works)

### Database & Storage

Already hosted on Firebase (no additional setup needed):
- ✅ Firestore automatically scales
- ✅ Cloud Storage included in Firebase
- ✅ Automatic backups and replication

## 📊 Database Schema

### Users Collection
```firestore
/users/{uid}
  ├── uid: string
  ├── email: string
  ├── name: string
  ├── bio: string
  ├── age: number
  ├── location: string
  ├── profilePicture: string (path to Cloud Storage file)
  └── updatedAt: timestamp
```

### Messages Collection
```firestore
/messages/{messageId}
  ├── matchId: string
  ├── senderId: string
  ├── content: string
  └── sentAt: timestamp
```

## 🔧 Environment Variables

### Frontend Variables (Vite)
```
VITE_API_URL              # Backend API URL
VITE_FIREBASE_API_KEY     # Firebase API key
VITE_FIREBASE_AUTH_DOMAIN # Firebase auth domain
VITE_FIREBASE_PROJECT_ID  # Firebase project ID
VITE_FIREBASE_STORAGE_BUCKET  # Cloud Storage bucket
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Backend Variables (Node.js)
```
FIREBASE_ADMIN_PROJECT_ID      # Firebase project ID
FIREBASE_ADMIN_CLIENT_EMAIL    # Service account email
FIREBASE_ADMIN_PRIVATE_KEY     # Private key from service account
FIREBASE_SERVICE_ACCOUNT_KEY   # Entire JSON as string (alternative)
FRONTEND_URL                   # Frontend origin for CORS
DATABASE_URL                   # (For future database integration)
JWT_ACCESS_SECRET              # (For JWT tokens, optional)
JWT_REFRESH_SECRET             # (For JWT refresh, optional)
```

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Firebase credentials not working
- Check `.env` files have correct values
- Verify service account has necessary permissions
- Restart dev server after changing .env

### Firestore permission denied
- Check Security Rules in Firebase Console
- Ensure authenticated user exists
- Check rule conditions match data structure

### Storage upload fails
- Verify Cloud Storage bucket exists
- Check Security Rules allow the operation
- Check file size (limits apply)
- Verify `contentType` is correct

### Frontend can't reach backend
- Check backend is running on port 3000
- Verify `VITE_API_URL` is correct
- Check CORS configuration
- Check firewall/network

### Build errors
- Clear `.next` or `dist` directory
- Delete `node_modules` and reinstall
- Check TypeScript errors with `npm run build`
- Check Node.js version (18+ recommended)

## 📖 Documentation Files

- **`FIREBASE_SETUP.md`** - Complete Firebase configuration guide
- **`API.md`** - API endpoint documentation with examples
- **`README.md`** - This file

## 🎓 Learning Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Socket.IO Documentation](https://socket.io/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 📝 Scripts

### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

### Backend
```bash
npm run dev      # Start with hot reload
npm run build    # Compile TypeScript
npm start        # Run compiled code
```

## 🤝 Contributing

This is a starter template! Feel free to:
- Add more features (swipe matching algorithm, notifications, etc.)
- Improve UI/UX
- Add tests
- Optimize performance
- Deploy to production
- Share your improvements

## 📄 License

MIT - Feel free to use this for learning, building, and sharing!

## 🎉 Next Steps

1. ✅ Follow `FIREBASE_SETUP.md` to configure Firebase
2. ✅ Set up environment variables
3. ✅ Run dev servers and test the app
4. ✅ Explore the API endpoints in `API.md`
5. ✅ Deploy to Firebase Hosting when ready
6. ✅ Add your own features and customizations

## 💬 Support

For issues:
1. Check `FIREBASE_SETUP.md` troubleshooting section
2. Check `API.md` for endpoint examples
3. Review Firebase Console for errors
4. Check browser console for client-side errors
5. Check terminal for server-side errors

---

**Happy building! 🚀**
