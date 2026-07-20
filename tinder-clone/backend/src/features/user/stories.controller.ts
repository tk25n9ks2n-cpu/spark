import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { AuthRequest } from './auth.middleware';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXT: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg',
  'image/webp': 'webp', 'image/gif': 'gif',
};

/** Decodes a base64 data URL, writes it to the uploads dir, and returns its public url. */
export const saveDataUrl = (image: string): { url: string } | { error: string; status: number } => {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(image || '');
  if (!match) return { error: 'Invalid image data', status: 400 };
  const ext = EXT[match[1]];
  if (!ext) return { error: 'Unsupported image type', status: 400 };
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 8 * 1024 * 1024) return { error: 'Image too large (max 8MB)', status: 413 };
  const filename = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
  return { url: `/uploads/${filename}` };
};

/** POST /api/user/stories — body { image: dataURL }. Decodes and stores the file. */
export const createStory = async (req: AuthRequest, res: Response) => {
  try {
    const { image, isPrivate } = req.body || {};
    const saved = saveDataUrl(image);
    if ('error' in saved) return res.status(saved.status).json({ error: saved.error });

    const story = await prisma.story.create({
      data: { userId: req.userId!, url: saved.url, isPrivate: isPrivate === false ? false : true },
    });
    res.status(201).json({ story: { id: story.id, url: story.url } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/** GET /api/user/stories — the authenticated user's private stories. */
export const getStories = async (req: AuthRequest, res: Response) => {
  try {
    const stories = await prisma.story.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, url: true },
    });
    res.json({ stories });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/** GET /api/user/stories/feed — recent PUBLIC stories from everyone (for the feed row). */
export const getFeedStories = async (_req: AuthRequest, res: Response) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
    const stories = await prisma.story.findMany({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/** DELETE /api/user/stories/:id — removes the record and the file. */
export const deleteStory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story || story.userId !== req.userId) return res.status(404).json({ error: 'Not found' });

    await prisma.story.delete({ where: { id } });
    const filePath = path.join(UPLOAD_DIR, path.basename(story.url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
