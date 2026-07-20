"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../config/database");
const router = (0, express_1.Router)();
const photoFor = (u) => u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`;
/** GET /api/search?q= — live search across people (by name) and posts (by caption). */
router.get('/', async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        if (!q)
            return res.json({ users: [], posts: [] });
        const [users, posts] = await Promise.all([
            database_1.prisma.user.findMany({
                where: { name: { contains: q } },
                take: 10,
                select: { id: true, name: true, avatarUrl: true },
            }),
            database_1.prisma.post.findMany({
                where: { caption: { contains: q } },
                take: 12,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, name: true, avatarUrl: true } } },
            }),
        ]);
        res.json({
            users: users.map(u => ({ id: u.id, name: u.name, photo: photoFor(u) })),
            posts: posts.map(p => ({
                id: p.id,
                imageUrl: p.imageUrl,
                caption: p.caption,
                likes: p.likes,
                author: { id: p.user.id, name: p.user.name, photo: photoFor(p.user) },
            })),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
