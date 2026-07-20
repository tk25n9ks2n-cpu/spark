import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';

const router = Router();

const photoFor = (u: { id: string; avatarUrl?: string | null }) =>
  u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`;

/** GET /api/search?q= — live search across people (by name) and posts (by caption). */
router.get('/', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ users: [], posts: [] });

    const [users, posts] = await Promise.all([
      prisma.user.findMany({
        where: { name: { contains: q } },
        take: 10,
        select: { id: true, name: true, avatarUrl: true },
      }),
      prisma.post.findMany({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
