import { Router, Response } from 'express';
import { prisma } from '../../config/database';
import { requireAuth, AuthRequest } from '../user/auth.middleware';

const router = Router();

const avatarFor = (u: { id: string; avatarUrl?: string | null; photos?: { url: string }[] }) =>
  u.avatarUrl || u.photos?.[0]?.url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`;

/** GET /api/chat/conversations — the user's matches with last message + unread count. */
router.get('/conversations', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const matches = await prisma.match.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: { id: true, name: true, avatarUrl: true, photos: { where: { order: 0 }, select: { url: true } } } },
        userB: { select: { id: true, name: true, avatarUrl: true, photos: { where: { order: 0 }, select: { url: true } } } },
        messages: { orderBy: { sentAt: 'desc' }, take: 1 },
      },
    });

    const convos = await Promise.all(matches.map(async (m) => {
      const other = m.userA.id === userId ? m.userB : m.userA;
      const last = m.messages[0];
      const unread = await prisma.message.count({
        where: { matchId: m.id, senderId: other.id, readAt: null },
      });
      return {
        id: m.id,
        user: { id: other.id, name: other.name, photo: avatarFor(other) },
        lastMessage: last ? { content: last.content, senderId: last.senderId, sentAt: last.sentAt } : null,
        unread,
        updatedAt: last?.sentAt || m.createdAt,
      };
    }));

    convos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({ conversations: convos });
  } catch (error: any) {
    console.error('conversations error', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/** GET /api/chat/matches/:matchId/messages — full history; marks incoming as read. */
router.get('/matches/:matchId/messages', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { matchId } = req.params;
    const match = await prisma.match.findFirst({
      where: { id: matchId, OR: [{ userAId: userId }, { userBId: userId }] },
    });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const messages = await prisma.message.findMany({
      where: { matchId },
      orderBy: { sentAt: 'asc' },
    });

    // Mark the other party's messages as read
    await prisma.message.updateMany({
      where: { matchId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    res.json({ messages });
  } catch (error: any) {
    console.error('messages error', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/** POST /api/chat/matches/:matchId/messages — REST fallback for sending (also used offline). */
router.post('/matches/:matchId/messages', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { matchId } = req.params;
    const { content } = req.body || {};
    if (!content?.trim()) return res.status(400).json({ error: 'Empty message' });

    const match = await prisma.match.findFirst({
      where: { id: matchId, OR: [{ userAId: userId }, { userBId: userId }] },
    });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const message = await prisma.message.create({
      data: { matchId, senderId: userId, content: content.trim() },
    });
    res.status(201).json({ message });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/** POST /api/chat/matches/:matchId/read — mark the conversation read. */
router.post('/matches/:matchId/read', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { matchId } = req.params;
    await prisma.message.updateMany({
      where: { matchId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

/**
 * POST /api/chat/start — find-or-create a conversation with another user so you can
 * message them directly (e.g. from search). Returns a conversation object.
 */
router.post('/start', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const otherId = req.body?.userId;
    if (!otherId || otherId === userId) return res.status(400).json({ error: 'Invalid user' });

    let match = await prisma.match.findFirst({
      where: { OR: [{ userAId: userId, userBId: otherId }, { userAId: otherId, userBId: userId }] },
    });
    if (!match) match = await prisma.match.create({ data: { userAId: userId, userBId: otherId } });

    const other = await prisma.user.findUnique({
      where: { id: otherId },
      select: { id: true, name: true, avatarUrl: true, photos: { where: { order: 0 }, select: { url: true } } },
    });
    if (!other) return res.status(404).json({ error: 'User not found' });

    const last = await prisma.message.findFirst({ where: { matchId: match.id }, orderBy: { sentAt: 'desc' } });
    res.json({
      conversation: {
        id: match.id,
        user: { id: other.id, name: other.name, photo: avatarFor(other) },
        lastMessage: last ? { content: last.content, senderId: last.senderId, sentAt: last.sentAt } : null,
        unread: 0,
        updatedAt: last?.sentAt || match.createdAt,
      },
    });
  } catch (error: any) {
    console.error('start chat error', error);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

/**
 * DELETE /api/chat/conversations/:matchId — remove a conversation (match + messages).
 */
router.delete('/conversations/:matchId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { matchId } = req.params;
    const match = await prisma.match.findFirst({
      where: { id: matchId, OR: [{ userAId: userId }, { userBId: userId }] },
    });
    if (!match) return res.status(404).json({ error: 'Not found' });
    await prisma.message.deleteMany({ where: { matchId } });
    await prisma.match.delete({ where: { id: matchId } });
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

/**
 * POST /api/chat/demo-cleanup — remove the auto-seeded demo conversations
 * (a demo partner sent an opener but you never replied). Keeps real chats.
 */
router.post('/demo-cleanup', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const matches = await prisma.match.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: { id: true, email: true } },
        userB: { select: { id: true, email: true } },
        messages: { select: { senderId: true } },
      },
    });
    let removed = 0;
    for (const m of matches) {
      const other = m.userAId === userId ? m.userB : m.userA;
      const isDemo = other.email?.endsWith('@spark.local');
      const userSent = m.messages.some(x => x.senderId === userId);
      if (isDemo && !userSent && m.messages.length > 0) {
        await prisma.message.deleteMany({ where: { matchId: m.id } });
        await prisma.match.delete({ where: { id: m.id } });
        removed++;
      }
    }
    res.json({ removed });
  } catch (error: any) {
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

/**
 * POST /api/chat/seed-demo — if the user has no matches, create a few demo partners,
 * matches, and opening messages so the chat is populated with real DB records.
 */
router.post('/seed-demo', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const existing = await prisma.match.count({ where: { OR: [{ userAId: userId }, { userBId: userId }] } });
    if (existing > 0) return res.json({ seeded: false });

    const demos = [
      { name: 'Sophie', gender: 'female', opener: 'That hike sounds amazing! 🏔️' },
      { name: 'Mia', gender: 'female', opener: 'Love that photo you posted ✨' },
      { name: 'Elena', gender: 'female', opener: 'Coffee on Saturday? ☕' },
      { name: 'Luna', gender: 'female', opener: 'This new palette is gorgeous! 🎨' },
    ];

    for (const [i, d] of demos.entries()) {
      const partner = await prisma.user.create({
        data: {
          email: `demo_${userId.slice(0, 6)}_${i}_${Date.now()}@spark.local`,
          name: d.name,
          dob: new Date('1997-01-01'),
          gender: d.gender,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.name}${i}`,
        },
      });
      const match = await prisma.match.create({
        data: { userAId: userId, userBId: partner.id },
      });
      await prisma.message.create({
        data: {
          matchId: match.id, senderId: partner.id, content: d.opener,
          sentAt: new Date(Date.now() - (i + 1) * 3600_000),
        },
      });
    }

    res.json({ seeded: true });
  } catch (error: any) {
    console.error('seed-demo error', error);
    res.status(500).json({ error: 'Failed to seed demo' });
  }
});

export default router;
