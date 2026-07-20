"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.uploadAvatar = exports.getPublicProfile = exports.addPhoto = exports.updateProfile = exports.getMe = void 0;
const database_1 = require("../../config/database");
const stories_controller_1 = require("./stories.controller");
const parseSettings = (raw) => {
    if (!raw)
        return {};
    try {
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
};
/** Returns the authenticated user's public fields + parsed settings. */
const getMe = async (req, res) => {
    try {
        const user = await database_1.prisma.user.findUnique({ where: { id: req.userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.json({
            user: { id: user.id, name: user.name, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl },
            settings: parseSettings(user.settings),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getMe = getMe;
/**
 * Updates the user's real profile columns (name, bio).
 * Body: { name?, bio? }
 */
const updateProfile = async (req, res) => {
    try {
        const { name, bio } = req.body || {};
        const data = {};
        if (typeof name === 'string' && name.trim())
            data.name = name.trim().slice(0, 60);
        if (typeof bio === 'string')
            data.bio = bio.slice(0, 300);
        const user = await database_1.prisma.user.update({ where: { id: req.userId }, data });
        res.json({ user: { id: user.id, name: user.name, email: user.email, bio: user.bio } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateProfile = updateProfile;
/** POST /api/user/photo — body { image }. Adds a photo to the user's discover profile. */
const addPhoto = async (req, res) => {
    try {
        const saved = (0, stories_controller_1.saveDataUrl)(req.body?.image);
        if ('error' in saved)
            return res.status(saved.status).json({ error: saved.error });
        const count = await database_1.prisma.photo.count({ where: { userId: req.userId } });
        const photo = await database_1.prisma.photo.create({
            data: { userId: req.userId, url: saved.url, order: count },
        });
        res.status(201).json({ photo: { id: photo.id, url: photo.url } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addPhoto = addPhoto;
/** GET /api/user/:id/public — another user's public profile (for search / viewing). */
const getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await database_1.prisma.user.findUnique({
            where: { id },
            include: { posts: { orderBy: { createdAt: 'desc' }, take: 9, select: { id: true, imageUrl: true } } },
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const s = parseSettings(user.settings);
        const postCount = await database_1.prisma.post.count({ where: { userId: id } });
        res.json({
            user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl, bio: user.bio },
            interests: Array.isArray(s.interests) ? s.interests : [],
            posts: user.posts,
            postCount,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPublicProfile = getPublicProfile;
/**
 * POST /api/user/avatar — body { image: dataURL } to set, or { remove: true } to clear.
 */
const uploadAvatar = async (req, res) => {
    try {
        if (req.body?.remove) {
            const user = await database_1.prisma.user.update({ where: { id: req.userId }, data: { avatarUrl: null } });
            return res.json({ avatarUrl: user.avatarUrl });
        }
        const saved = (0, stories_controller_1.saveDataUrl)(req.body?.image);
        if ('error' in saved)
            return res.status(saved.status).json({ error: saved.error });
        const user = await database_1.prisma.user.update({
            where: { id: req.userId },
            data: { avatarUrl: saved.url },
        });
        res.json({ avatarUrl: user.avatarUrl });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.uploadAvatar = uploadAvatar;
/**
 * Merges the incoming partial settings into the stored blob and saves.
 * Body: { settings: { ...partial } }
 */
const updateSettings = async (req, res) => {
    try {
        const incoming = req.body?.settings ?? req.body ?? {};
        const user = await database_1.prisma.user.findUnique({ where: { id: req.userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const merged = { ...parseSettings(user.settings), ...incoming };
        await database_1.prisma.user.update({
            where: { id: req.userId },
            data: { settings: JSON.stringify(merged) },
        });
        res.json({ settings: merged });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateSettings = updateSettings;
