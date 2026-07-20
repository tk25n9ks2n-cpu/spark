import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import authRoutes from './features/auth/auth.routes';
import postsRoutes from './features/posts/posts.routes';
import userRoutes from './features/user/user.routes';
import chatRoutes from './features/chat/chat.routes';
import searchRoutes from './features/search/search.routes';
import discoverRoutes from './features/discover/discover.routes';
import notificationsRoutes from './features/notifications/notifications.routes';
import { prisma } from './config/database';

const app = express();
const server = createServer(app);
// Allow any origin on the local network (LAN access from phones etc.) + localhost
const isAllowedOrigin = (origin: string | undefined) => {
  if (!origin) return true; // same-origin / server-to-server
  const allowed = [
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
    /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
    /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
    /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/,
  ];
  return allowed.some(re => re.test(origin));
};

const io = new Server(server, {
  cors: { origin: isAllowedOrigin, methods: ["GET", "POST"], credentials: true }
});

app.use(cors({
  origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/', (req, res) => res.send('Tinder Clone API is running!'));

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'super_secret_access_key') as any;
    (socket as any).userId = decoded.userId;
    next();
  } catch (err) { next(new Error('Authentication error')); }
});

// Track which users are currently connected (for presence dots)
const onlineUsers = new Map<string, number>(); // userId -> socket count
const broadcastPresence = () => io.emit('presence', Array.from(onlineUsers.keys()));

io.on('connection', (socket) => {
  const userId = (socket as any).userId;
  onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
  broadcastPresence();

  // Personal room so we can push list-level updates to a user across chats
  socket.join(`user:${userId}`);

  socket.on('join_chat', (matchId) => { socket.join(matchId); });
  socket.on('leave_chat', (matchId) => { socket.leave(matchId); });

  socket.on('send_message', async ({ matchId, content }) => {
    try {
      if (!content?.trim()) return;
      const message = await prisma.message.create({
        data: { matchId, senderId: userId, content: content.trim() },
      });
      // To everyone viewing the thread
      io.to(matchId).emit('new_message', message);

      // Notify the other participant's personal room so their list updates live
      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (match) {
        const otherId = match.userAId === userId ? match.userBId : match.userAId;
        io.to(`user:${otherId}`).emit('conversation_update', { matchId, message });
      }
    } catch (error) { console.error('Error saving message:', error); }
  });

  // Typing indicator — relay to the other people in the thread only
  socket.on('typing', ({ matchId, isTyping }) => {
    socket.to(matchId).emit('typing', { matchId, userId, isTyping });
  });

  // Read receipts — mark the sender's messages read and tell the room
  socket.on('mark_read', async ({ matchId }) => {
    try {
      await prisma.message.updateMany({
        where: { matchId, senderId: { not: userId }, readAt: null },
        data: { readAt: new Date() },
      });
      socket.to(matchId).emit('messages_read', { matchId, by: userId });
    } catch (error) { console.error('Error marking read:', error); }
  });

  socket.on('disconnect', () => {
    const count = (onlineUsers.get(userId) || 1) - 1;
    if (count <= 0) onlineUsers.delete(userId);
    else onlineUsers.set(userId, count);
    broadcastPresence();
  });
});

export { app, server, io };