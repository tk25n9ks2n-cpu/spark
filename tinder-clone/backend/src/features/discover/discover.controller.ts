import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../user/auth.middleware';

const ageFrom = (dob: Date) => Math.max(18, Math.floor((Date.now() - new Date(dob).getTime()) / 3.15576e10));
const parse = (raw: string | null) => { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } };
const photoOf = (u: any) => u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`;

const toProfile = (u: any) => {
  const s = parse(u.settings);
  const uploaded = Array.isArray(u.photos) ? u.photos.map((p: any) => p.url) : [];
  const photos = uploaded.length ? [...uploaded, photoOf(u)] : [photoOf(u)];
  return {
    id: u.id,
    name: u.name,
    age: ageFrom(u.dob),
    bio: u.bio || s.bio || 'Hey there! I’m new on Spark ✨',
    job: s.job || '✨ On Spark',
    distance: `${s.distance ?? (1 + (u.id.charCodeAt(0) % 15))} km away`,
    interests: Array.isArray(s.interests) ? s.interests.map((i: string) => i.replace(/^\p{Emoji}+\s*/u, '').trim() || i) : ['Music', 'Travel', 'Coffee'],
    photos,
  };
};

// Demo people to discover, so the stack is never empty. `preLike` means they've
// already liked you — so liking them back creates a real mutual match.
const DEMO_POOL = [
  { name: 'Sophie', photo: '/p1.png', job: '📸 Photographer', bio: 'Adventure seeker & coffee enthusiast ✨', interests: ['Travel', 'Coffee', 'Photography', 'Yoga'], preLike: true },
  { name: 'Mia', photo: '/p3.png', job: '🎨 UX Designer', bio: 'Creative soul, vintage records & rooftop sunsets 🌅', interests: ['Design', 'Music', 'Art', 'Hiking'], preLike: true },
  { name: 'Elena', photo: '/p4.png', job: '📚 Teacher', bio: 'Book lover, plant parent & amateur chef ☕', interests: ['Reading', 'Cooking', 'Plants', 'Cinema'], preLike: false },
  { name: 'Luna', photo: '/p1.png', job: '🎨 Artist', bio: 'Painting the world one canvas at a time 🎨', interests: ['Art', 'Coffee', 'Travel'], preLike: true },
  { name: 'Aria', photo: '/p3.png', job: '✍️ Writer', bio: 'Words, wanderlust & good wine 🍷', interests: ['Writing', 'Wine', 'Books'], preLike: false },
  { name: 'Zoe', photo: '/p4.png', job: '🏋️ Trainer', bio: 'Sunrise runs & smoothie bowls 🥑', interests: ['Fitness', 'Health', 'Travel'], preLike: true },
];

const seedCandidates = async (userId: string) => {
  for (const d of DEMO_POOL) {
    const partner = await prisma.user.create({
      data: {
        email: `disc_${userId.slice(0, 6)}_${d.name}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@spark.local`,
        name: d.name,
        dob: new Date(`${1996 + Math.floor(Math.random() * 6)}-01-01`),
        gender: 'female',
        bio: d.bio,
        avatarUrl: d.photo,
        settings: JSON.stringify({ job: d.job, interests: d.interests, distance: 1 + Math.floor(Math.random() * 15) }),
      },
    });
    // Some of them have already swiped right on you
    if (d.preLike) {
      await prisma.swipe.create({ data: { swiperId: partner.id, swipedId: userId, direction: 'right' } });
    }
  }
};

/** GET /api/discover — people you haven't swiped yet. Seeds demo people if low. */
export const getDiscover = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const swiped = await prisma.swipe.findMany({ where: { swiperId: userId }, select: { swipedId: true } });
    const excludeIds = [userId, ...swiped.map(s => s.swipedId)];

    let candidates = await prisma.user.findMany({
      where: { id: { notIn: excludeIds } },
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: { photos: { orderBy: { order: 'desc' }, select: { url: true } } },
    });

    if (candidates.length < 3) {
      await seedCandidates(userId);
      candidates = await prisma.user.findMany({
        where: { id: { notIn: excludeIds } },
        take: 15,
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json({ profiles: candidates.map(toProfile) });
  } catch (error: any) {
    console.error('discover error', error);
    res.status(500).json({ error: error.message });
  }
};

/** POST /api/discover/swipe — body { swipedId, direction }. Creates a match if mutual. */
export const swipe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { swipedId, direction } = req.body || {};
    if (!swipedId || !direction) return res.status(400).json({ error: 'swipedId and direction required' });

    await prisma.swipe.upsert({
      where: { swiperId_swipedId: { swiperId: userId, swipedId } },
      create: { swiperId: userId, swipedId, direction },
      update: { direction },
    });

    const liked = direction === 'right' || direction === 'up';
    if (liked) {
      const reciprocal = await prisma.swipe.findFirst({
        where: { swiperId: swipedId, swipedId: userId, direction: { in: ['right', 'up'] } },
      });
      if (reciprocal) {
        const existing = await prisma.match.findFirst({
          where: { OR: [{ userAId: userId, userBId: swipedId }, { userAId: swipedId, userBId: userId }] },
        });
        const match = existing || await prisma.match.create({ data: { userAId: userId, userBId: swipedId } });
        const partner = await prisma.user.findUnique({ where: { id: swipedId } });
        return res.json({
          match: true,
          matchId: match.id,
          partner: { id: partner!.id, name: partner!.name, photo: photoOf(partner) },
        });
      }
    }
    res.json({ match: false });
  } catch (error: any) {
    console.error('swipe error', error);
    res.status(500).json({ error: error.message });
  }
};

/** POST /api/discover/rewind — undo your last swipe, returning that profile. */
export const rewind = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const last = await prisma.swipe.findFirst({ where: { swiperId: userId }, orderBy: { createdAt: 'desc' } });
    if (!last) return res.json({ profile: null });
    await prisma.swipe.delete({ where: { id: last.id } });
    const u = await prisma.user.findUnique({ where: { id: last.swipedId }, include: { photos: { orderBy: { order: 'desc' }, select: { url: true } } } });
    res.json({ profile: u ? toProfile(u) : null });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
