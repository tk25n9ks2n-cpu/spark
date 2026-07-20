"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../config/database");
const auth_middleware_1 = require("../user/auth.middleware");
const router = (0, express_1.Router)();
const photoOf = (u) => u?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u?.id}`;
/**
 * GET /api/notifications — a merged, time-sorted activity feed built from the DB:
 * new matches, people who liked you, and messages you received.
 */
router.get('/', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        // 1) Matches you're part of
        const matches = await database_1.prisma.match.findMany({
            where: { OR: [{ userAId: userId }, { userBId: userId }] },
            include: {
                userA: { select: { id: true, name: true, avatarUrl: true } },
                userB: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        // 2) People who liked you (right/super swipes on you)
        const likes = await database_1.prisma.swipe.findMany({
            where: { swipedId: userId, direction: { in: ['right', 'up'] } },
            include: { swiper: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        // 3) Messages you received (from your matches)
        const matchIds = matches.map(m => m.id);
        const messages = matchIds.length
            ? await database_1.prisma.message.findMany({
                where: { matchId: { in: matchIds }, senderId: { not: userId } },
                include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
                orderBy: { sentAt: 'desc' },
                take: 20,
            })
            : [];
        const items = [];
        matches.forEach(m => {
            const other = m.userAId === userId ? m.userB : m.userA;
            items.push({
                id: `match_${m.id}`, type: 'match', matchId: m.id,
                user: { id: other.id, name: other.name, photo: photoOf(other) },
                text: "It's a match! Say hi 👋", time: m.createdAt,
            });
        });
        likes.forEach(l => {
            items.push({
                id: `like_${l.id}`, type: 'like',
                user: { id: l.swiper.id, name: l.swiper.name, photo: photoOf(l.swiper) },
                text: 'liked you ❤️', time: l.createdAt,
            });
        });
        messages.forEach(msg => {
            items.push({
                id: `msg_${msg.id}`, type: 'message', matchId: msg.matchId,
                user: { id: msg.sender.id, name: msg.sender.name, photo: photoOf(msg.sender) },
                text: msg.content.length > 40 ? msg.content.slice(0, 40) + '…' : msg.content,
                time: msg.sentAt, unread: !msg.readAt,
            });
        });
        items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        res.json({ notifications: items.slice(0, 40) });
    }
    catch (error) {
        console.error('notifications error', error);
        res.status(500).json({ error: 'Failed to load notifications' });
    }
});
exports.default = router;
