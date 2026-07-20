import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import authRouter from './features/auth/authRoutes';
import { verifyFirebaseIdToken } from './features/auth/authMiddleware';
import userRouter from './features/user/userRoutes';
import storageRouter from './features/storage/storageRoutes';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ["GET", "POST"] }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/user', verifyFirebaseIdToken, userRouter);
app.use('/api/storage', verifyFirebaseIdToken, storageRouter);

app.get('/', (req, res) => {
  res.send('Tinder Clone API is running!');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_match', (matchId) => {
    socket.join(matchId);
  });

  socket.on('send_message', ({ matchId, content, senderId }) => {
    io.to(matchId).emit('new_message', { matchId, content, senderId, sentAt: new Date() });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

export { app, server, io };
