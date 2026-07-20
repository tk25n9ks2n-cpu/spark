"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStory = exports.getFeedStories = exports.getStories = exports.createStory = exports.saveDataUrl = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../../config/database");
const UPLOAD_DIR = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(UPLOAD_DIR))
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
const EXT = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg',
    'image/webp': 'webp', 'image/gif': 'gif',
};
/** Decodes a base64 data URL, writes it to the uploads dir, and returns its public url. */
const saveDataUrl = (image) => {
    const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(image || '');
    if (!match)
        return { error: 'Invalid image data', status: 400 };
    const ext = EXT[match[1]];
    if (!ext)
        return { error: 'Unsupported image type', status: 400 };
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 8 * 1024 * 1024)
        return { error: 'Image too large (max 8MB)', status: 413 };
    const filename = `${crypto_1.default.randomUUID()}.${ext}`;
    fs_1.default.writeFileSync(path_1.default.join(UPLOAD_DIR, filename), buffer);
    return { url: `/uploads/${filename}` };
};
exports.saveDataUrl = saveDataUrl;
/** POST /api/user/stories — body { image: dataURL }. Decodes and stores the file. */
const createStory = async (req, res) => {
    try {
        const { image, isPrivate } = req.body || {};
        const saved = (0, exports.saveDataUrl)(image);
        if ('error' in saved)
            return res.status(saved.status).json({ error: saved.error });
        const story = await database_1.prisma.story.create({
            data: { userId: req.userId, url: saved.url, isPrivate: isPrivate === false ? false : true },
        });
        res.status(201).json({ story: { id: story.id, url: story.url } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createStory = createStory;
/** GET /api/user/stories — the authenticated user's private stories. */
const getStories = async (req, res) => {
    try {
        const stories = await database_1.prisma.story.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'asc' },
            select: { id: true, url: true },
        });
        res.json({ stories });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getStories = getStories;
/** GET /api/user/stories/feed — recent PUBLIC stories from everyone (for the feed row). */
const getFeedStories = async (_req, res) => {
    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
        const stories = await database_1.prisma.story.findMany({
            where: { isPrivate: false, createdAt: { gte: since } },
            orderBy: { createdAt: 'desc' },
            take: 40,
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        });
        res.json({
            stories: stories.map(s => ({
                id: s.id,
                url: s.url,
                createdAt: s.createdAt,
                author: {
                    id: s.user.id,
                    name: s.user.name,
                    photo: s.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.user.id}`,
                },
            })),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getFeedStories = getFeedStories;
/** DELETE /api/user/stories/:id — removes the record and the file. */
const deleteStory = async (req, res) => {
    try {
        const { id } = req.params;
        const story = await database_1.prisma.story.findUnique({ where: { id } });
        if (!story || story.userId !== req.userId)
            return res.status(404).json({ error: 'Not found' });
        await database_1.prisma.story.delete({ where: { id } });
        const filePath = path_1.default.join(UPLOAD_DIR, path_1.default.basename(story.url));
        if (fs_1.default.existsSync(filePath))
            fs_1.default.unlinkSync(filePath);
        res.json({ ok: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteStory = deleteStory;
