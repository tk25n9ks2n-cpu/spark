# API Documentation

## Authentication

All endpoints (except `/api/auth/signup` and `/api/auth/login`) require a Firebase ID token in the `Authorization` header.

### Request Format
```
Authorization: Bearer <firebase-id-token>
```

### Get Firebase ID Token (Frontend)

```javascript
import { getIdToken } from 'firebase/auth';
import { auth } from './firebase';

const token = await getIdToken(auth.currentUser);
```

---

## Endpoints

### Authentication

#### Get Current User Profile
- **URL**: `GET /api/auth/profile`
- **Auth**: Required
- **Response**:
  ```json
  {
    "uid": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  }
  ```

---

### User Management

#### Get User Profile by ID
- **URL**: `GET /api/user/profile/:userId`
- **Auth**: Required
- **Params**:
  - `userId` (string) - The user's UID

- **Response**:
  ```json
  {
    "uid": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "bio": "Love hiking",
    "age": 26,
    "location": "San Francisco",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```

#### Create/Update User Profile
- **URL**: `POST /api/user/profile`
- **Auth**: Required
- **Body**:
  ```json
  {
    "name": "John Doe",
    "bio": "Love hiking and coffee",
    "age": 26,
    "location": "San Francisco"
  }
  ```

- **Response**:
  ```json
  {
    "success": true
  }
  ```

---

### Cloud Storage

#### Get Upload URL for File
- **URL**: `POST /api/storage/upload-url`
- **Auth**: Required
- **Description**: Get a signed URL to upload a file to Cloud Storage
- **Body**:
  ```json
  {
    "filename": "profile-pic.jpg",
    "contentType": "image/jpeg"
  }
  ```

- **Response**:
  ```json
  {
    "url": "https://firebasestorage.googleapis.com/...",
    "path": "profile-pictures/user-id/profile-pic.jpg"
  }
  ```

- **Usage**:
  ```javascript
  // Get signed URL
  const res = await fetch('/api/storage/upload-url', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: 'photo.jpg',
      contentType: 'image/jpeg'
    })
  });
  const { url, path } = await res.json();

  // Upload file to the signed URL
  await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/jpeg'
    },
    body: file
  });
  ```

#### Get Download URL for File
- **URL**: `POST /api/storage/download-url`
- **Auth**: Required
- **Description**: Get a signed URL to download/view a file from Cloud Storage
- **Body**:
  ```json
  {
    "path": "profile-pictures/user-id/profile-pic.jpg"
  }
  ```

- **Response**:
  ```json
  {
    "url": "https://firebasestorage.googleapis.com/..."
  }
  ```

---

### Real-time Messaging (Socket.IO)

#### Connect to Socket
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');
```

#### Join a Match Room
```javascript
socket.emit('join_match', 'match-id');
```

#### Send a Message
```javascript
socket.emit('send_message', {
  matchId: 'match-id',
  content: 'Hello!',
  senderId: 'user-id'
});
```

#### Listen for New Messages
```javascript
socket.on('new_message', (message) => {
  console.log(message);
  // {
  //   matchId: 'match-id',
  //   content: 'Hello!',
  //   senderId: 'user-id',
  //   sentAt: '2024-01-01T00:00:00.000Z'
  // }
});
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Server Error

### Example Error Response

```json
{
  "error": "Invalid Firebase ID token"
}
```

---

## Examples

### Sign Up and Update Profile

```javascript
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

// 1. Sign up
const { user } = await createUserWithEmailAndPassword(auth, 'user@example.com', 'password123');

// 2. Get ID token
const token = await getIdToken(user);

// 3. Create user profile in backend
const res = await fetch('/api/user/profile', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    bio: 'Love hiking',
    age: 26,
    location: 'San Francisco'
  })
});

const result = await res.json();
console.log(result); // { success: true }
```

### Upload Profile Picture

```javascript
import { getIdToken } from 'firebase/auth';

const token = await getIdToken(auth.currentUser);
const file = /* File object from input */;

// Get upload URL
const uploadRes = await fetch('/api/storage/upload-url', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    filename: Date.now() + '.jpg',
    contentType: file.type
  })
});

const { url, path } = await uploadRes.json();

// Upload file
await fetch(url, {
  method: 'PUT',
  headers: { 'Content-Type': file.type },
  body: file
});

console.log('Uploaded to:', path);
```

### Get User Profile

```javascript
const token = await getIdToken(auth.currentUser);

const res = await fetch('/api/user/profile/user-id', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const profile = await res.json();
console.log(profile);
// {
//   uid: 'user-id',
//   name: 'John Doe',
//   bio: 'Love hiking',
//   age: 26,
//   location: 'San Francisco'
// }
```

### Real-time Chat with Firestore Persistence

Messages are automatically saved to Firestore and will persist. The Chat component handles:
- Real-time listening to new messages
- Automatic timestamp handling
- Sender identification
- Message ordering

```javascript
import { Chat } from './components/Chat';

<Chat matchId="match-123" otherUserId="other-user-id" />
```

---

## Rate Limiting

Currently, no rate limiting is implemented. For production, consider adding:
- `npm install express-rate-limit` (already in dependencies)
- Implement rate limiting on auth endpoints
- Implement rate limiting on storage endpoints

Example:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Security Notes

1. **Always use HTTPS in production** - Firebase Auth tokens should only be transmitted over HTTPS
2. **Never expose service account keys** - Keep `FIREBASE_SERVICE_ACCOUNT_KEY` secret
3. **Validate all user inputs** - Even with client-side validation
4. **Enable Security Rules** - Set appropriate Firestore and Storage rules
5. **Use environment variables** - Never hardcode credentials
6. **Implement CORS** - Already configured in the backend
7. **Add rate limiting** - Prevent abuse and DDoS attacks

---

## Deployment

### Frontend (Firebase Hosting)
```bash
npm run build
firebase deploy --only hosting
```

### Backend (Cloud Functions, Vercel, etc.)
Choose your hosting platform and follow their deployment guide. The backend requires:
- Node.js 18+
- Environment variables configured
- CORS enabled for frontend origin

---

## Troubleshooting

### Token is expired
- Call `getIdToken(auth.currentUser, true)` to force refresh
- Automatically handled by Firebase SDK on most operations

### CORS errors
- Check CORS configuration in `backend/src/app.ts`
- Ensure frontend URL is in the allowed origins

### Firestore permission denied
- Check Security Rules in Firebase Console
- Ensure user is authenticated
- Verify rule conditions match your data

### Storage upload fails
- Check Storage Security Rules
- Verify file size limits
- Check bucket quota

---

For more information, see:
- [Firebase API Docs](https://firebase.google.com/docs)
- [Socket.IO Docs](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/)
