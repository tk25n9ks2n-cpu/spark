"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likePost = exports.createPost = exports.getFeed = exports.getPosts = void 0;
const database_1 = require("../../config/database");
const stories_controller_1 = require("../user/stories.controller");
const authorOf = (u) => ({
    id: u.id,
    name: u.name,
    photo: u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
});
/** GET /api/posts/user/:userId — one user's posts (used by the profile grid). */
const getPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const posts = await database_1.prisma.post.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ posts });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPosts = getPosts;
/** GET /api/posts/feed — every post with its author, newest first. */
const getFeed = async (_req, res) => {
    try {
        const posts = await database_1.prisma.post.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        });
        res.json({
            posts: posts.map(p => ({
                id: p.id,
                imageUrl: p.imageUrl,
                caption: p.caption,
                likes: p.likes,
                createdAt: p.createdAt,
                author: authorOf(p.user),
            })),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getFeed = getFeed;
/**
 * POST /api/posts — authenticated create.
 * Body: { image: dataURL | url, caption }. Base64 images are stored to /uploads.
 */
const createPost = async (req, res) => {
    try {
        const { image, caption } = req.body || {};
        if (!image)
            return res.status(400).json({ error: 'Image required' });
        let imageUrl = image;
        if (typeof image === 'string' && image.startsWith('data:')) {
            const saved = (0, stories_controller_1.saveDataUrl)(image);
            if ('error' in saved)
                return res.status(saved.status).json({ error: saved.error });
            imageUrl = saved.url;
        }
        const post = await database_1.prisma.post.create({
            data: { userId: req.userId, imageUrl, caption: caption || null, likes: 0 },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        });
        res.status(201).json({
            post: {
                id: post.id, imageUrl: post.imageUrl, caption: post.caption,
                likes: post.likes, createdAt: post.createdAt, author: authorOf(post.user),
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createPost = createPost;
/** POST /api/posts/:id/like — body { liked } adjusts the like count. */
const likePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { liked } = req.body || {};
        const post = await database_1.prisma.post.update({
            where: { id },
            data: { likes: { increment: liked ? 1 : -1 } },
        });
        res.json({ likes: Math.max(0, post.likes) });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.likePost = likePost;
