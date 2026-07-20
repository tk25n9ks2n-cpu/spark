import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from './auth.middleware';
import { saveDataUrl } from './stories.controller';

const parseSettings = (raw: string | null) => {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
};

/** Returns the authenticated user's public fields + parsed settings. */
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      user: { id: user.id, name: user.name, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl },
      settings: parseSettings(user.settings),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Updates the user's real profile columns (name, bio).
 * Body: { name?, bio? }
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, bio } = req.body || {};
    const data: { name?: string; bio?: string } = {};
    if (typeof name === 'string' && name.trim()) data.name = name.trim().slice(0, 60);
    if (typeof bio === 'string') data.bio = bio.slice(0, 300);

    const user = await prisma.user.update({ where: { id: req.userId }, data });
    res.json({ user: { id: user.id, name: user.name, email: user.email, bio: user.bio } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/** POST /api/user/photo — body { image }. Adds a photo to the user's discover profile. */
export const addPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const saved = saveDataUrl(req.body?.image);
    if ('error' in saved) return res.status(saved.status).json({ error: saved.error });
    const count = await prisma.photo.count({ where: { userId: req.userId } });
    const photo = await prisma.photo.create({
      data: { userId: req.userId!, url: saved.url, order: count },
    });
    res.status(201).json({ photo: { id: photo.id, url: photo.url } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/** GET /api/user/:id/public — another user's public profile (for search / viewing). */
export const getPublicProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { posts: { orderBy: { createdAt: 'desc' }, take: 9, select: { id: true, imageUrl: true } } },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const s = parseSettings(user.settings);
    const postCount = await prisma.post.count({ where: { userId: id } });
    res.json({
      user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl, bio: user.bio },
      interests: Array.isArray(s.interests) ? s.interests : [],
      posts: user.posts,
      postCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/user/avatar — body { image: dataURL } to set, or { remove: true } to clear.
 */
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (req.body?.remove) {
      const user = await prisma.user.update({ where: { id: req.userId }, data: { avatarUrl: null } });
      return res.json({ avatarUrl: user.avatarUrl });
    }
    const saved = saveDataUrl(req.body?.image);
    if ('error' in saved) return res.status(saved.status).json({ error: saved.error });
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatarUrl: saved.url },
    });
    res.json({ avatarUrl: user.avatarUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Merges the incoming partial settings into the stored blob and saves.
 * Body: { settings: { ...partial } }
 */
export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const incoming = req.body?.settings ?? req.body ?? {};
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const merged = { ...parseSettings(user.settings), ...incoming };
    await prisma.user.update({
      where: { id: req.userId },
      data: { settings: JSON.stringify(merged) },
    });
    res.json({ settings: merged });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
