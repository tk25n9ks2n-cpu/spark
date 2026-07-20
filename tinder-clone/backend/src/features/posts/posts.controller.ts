import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../user/auth.middleware';
import { saveDataUrl } from '../user/stories.controller';

const authorOf = (u: { id: string; name: string; avatarUrl?: string | null }) => ({
  id: u.id,
  name: u.name,
  photo: u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
});

/** GET /api/posts/user/:userId — one user's posts (used by the profile grid). */
export const getPosts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ posts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/** GET /api/posts/feed — every post with its author, newest first. */
export const getFeed = async (_req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/posts — authenticated create.
 * Body: { image: dataURL | url, caption }. Base64 images are stored to /uploads.
 */
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { image, caption } = req.body || {};
    if (!image) return res.status(400).json({ error: 'Image required' });

    let imageUrl = image;
    if (typeof image === 'string' && image.startsWith('data:')) {
      const saved = saveDataUrl(image);
      if ('error' in saved) return res.status(saved.status).json({ error: saved.error });
      imageUrl = saved.url;
    }

    const post = await prisma.post.create({
      data: { userId: req.userId!, imageUrl, caption: caption || null, likes: 0 },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    res.status(201).json({
      post: {
        id: post.id, imageUrl: post.imageUrl, caption: post.caption,
        likes: post.likes, createdAt: post.createdAt, author: authorOf(post.user),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/** POST /api/posts/:id/like — body { liked } adjusts the like count. */
export const likePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { liked } = req.body || {};
    const post = await prisma.post.update({
      where: { id },
      data: { likes: { increment: liked ? 1 : -1 } },
    });
    res.json({ likes: Math.max(0, post.likes) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
