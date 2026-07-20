"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_routes_1 = __importDefault(require("./features/auth/auth.routes"));
const posts_routes_1 = __importDefault(require("./features/posts/posts.routes"));
const user_routes_1 = __importDefault(require("./features/user/user.routes"));
const chat_routes_1 = __importDefault(require("./features/chat/chat.routes"));
const search_routes_1 = __importDefault(require("./features/search/search.routes"));
const discover_routes_1 = __importDefault(require("./features/discover/discover.routes"));
const notifications_routes_1 = __importDefault(require("./features/notifications/notifications.routes"));
const database_1 = require("./config/database");
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
// Allow any origin on the local network (LAN access from phones etc.) + localhost
const isAllowedOrigin = (origin) => {
    if (!origin)
        return true; // same-origin / server-to-server
    const allowed = [
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
        /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
        /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/,
    ];
    return allowed.some(re => re.test(origin));
};
const io = new socket_io_1.Server(server, {
    cors: { origin: isAllowedOrigin, methods: ["GET", "POST"], credentials: true }
});
exports.io = io;
app.use((0, cors_1.default)({
    origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/posts', posts_routes_1.default);
app.use('/api/user', user_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/search', search_routes_1.default);
app.use('/api/discover', discover_routes_1.default);
app.use('/api/notifications', notifications_routes_1.default);
app.get('/', (req, res) => res.send('Tinder Clone API is running!'));
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token)
        return next(new Error('Authentication error'));
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET || 'super_secret_access_key');
        socket.userId = decoded.userId;
        next();
    }
    catch (err) {
        next(new Error('Authentication error'));
    }
});
// Track which users are currently connected (for presence dots)
const onlineUsers = new Map(); // userId -> socket count
const broadcastPresence = () => io.emit('presence', Array.from(onlineUsers.keys()));
io.on('connection', (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
    broadcastPresence();
    // Personal room so we can push list-level updates to a user across chats
    socket.join(`user:${userId}`);
    socket.on('join_chat', (matchId) => { socket.join(matchId); });
    socket.on('leave_chat', (matchId) => { socket.leave(matchId); });
    socket.on('send_message', async ({ matchId, content }) => {
        try {
            if (!content?.trim())
                return;
            const message = await database_1.prisma.message.create({
                data: { matchId, senderId: userId, content: content.trim() },
            });
            // To everyone viewing the thread
            io.to(matchId).emit('new_message', message);
            // Notify the other participant's personal room so their list updates live
            const match = await database_1.prisma.match.findUnique({ where: { id: matchId } });
            if (match) {
                const otherId = match.userAId === userId ? match.userBId : match.userAId;
                io.to(`user:${otherId}`).emit('conversation_update', { matchId, message });
            }
        }
        catch (error) {
            console.error('Error saving message:', error);
        }
    });
    // Typing indicator — relay to the other people in the thread only
    socket.on('typing', ({ matchId, isTyping }) => {
        socket.to(matchId).emit('typing', { matchId, userId, isTyping });
    });
    // Read receipts — mark the sender's messages read and tell the room
    socket.on('mark_read', async ({ matchId }) => {
        try {
            await database_1.prisma.message.updateMany({
                where: { matchId, senderId: { not: userId }, readAt: null },
                data: { readAt: new Date() },
            });
            socket.to(matchId).emit('messages_read', { matchId, by: userId });
        }
        catch (error) {
            console.error('Error marking read:', error);
        }
    });
    socket.on('disconnect', () => {
        const count = (onlineUsers.get(userId) || 1) - 1;
        if (count <= 0)
            onlineUsers.delete(userId);
        else
            onlineUsers.set(userId, count);
        broadcastPresence();
    });
});
