import { useState, useRef, useEffect } from 'react';
import {
  Bell, Send, MoreHorizontal, Heart, MessageCircle, Bookmark,
  X, Plus, MapPin, BadgeCheck, Link2, Users, Sparkles, ArrowUp,
  Search, ArrowLeft, TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';

const relTime = (iso?: string) => {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

/* ─── Demo data ──────────────────────────────────────────────────── */
const STORIES = [
  { id: 's0', name: 'Your story', photo: '/p2.png', seen: true,  isMe: true },
  { id: 's1', name: 'Sophie',    photo: '/p1.png',  seen: false },
  { id: 's2', name: 'Mia',       photo: '/p3.png',  seen: false },
  { id: 's3', name: 'Elena',     photo: '/p4.png',  seen: false },
  { id: 's4', name: 'Luna',      photo: '/p1.png',  seen: true  },
  { id: 's5', name: 'Aria',      photo: '/p3.png',  seen: false },
];

const SUGGESTED = [
  { id: 'u1', user: 'aria.writes', photo: '/p3.png', reason: 'Followed by mia.design' },
  { id: 'u2', user: 'zoe_fitness', photo: '/p4.png', reason: 'New to Spark' },
  { id: 'u3', user: 'leo.travels', photo: '/p1.png', reason: 'Popular near you' },
  { id: 'u4', user: 'kai.designs', photo: '/p3.png', reason: 'Followed by elenabooks' },
];

const POSTS = [
  {
    id: 'p1', user: 'sophie_adventures', userPhoto: '/p1.png', verified: true, following: false,
    location: 'Swiss Alps, 🇨🇭', feed: 'nearby',
    image: '/post1.png', imageAspect: '4/5',
    likes: 1842, caption: 'Nothing beats this view after a 6-hour hike 🏔️✨ Adventure is always worth it.',
    likedBy: [{ name: 'mia.design', photo: '/p3.png' }, { name: 'elenabooks', photo: '/p4.png' }],
    comments: [
      { user: 'mia.design', text: 'This is unreal 😍', likes: 12 },
      { user: 'elenabooks', text: 'Adding this to my bucket list!!', likes: 4 },
    ],
    time: '2h', isLiked: false, isSaved: false, tags: ['Travel', 'Adventure'],
  },
  {
    id: 'p2', user: 'mia.design', userPhoto: '/p3.png', verified: false, following: true,
    location: 'Home Studio ☕', feed: 'following',
    image: '/post2.png', imageAspect: '1/1',
    likes: 934, caption: 'Sunday mornings are sacred. Coffee, good music, and zero plans ☕🎵',
    likedBy: [{ name: 'sophie_adventures', photo: '/p1.png' }],
    comments: [
      { user: 'sophie_adventures', text: 'The vibe is immaculate ✨', likes: 8 },
    ],
    time: '5h', isLiked: true, isSaved: false, tags: ['Lifestyle', 'Coffee'],
  },
  {
    id: 'p3', user: 'elenabooks', userPhoto: '/p4.png', verified: true, following: false,
    location: 'Tokyo, 🇯🇵', feed: 'trending',
    image: '/post3.png', imageAspect: '4/5',
    likes: 2201, caption: 'Lost in Tokyo and absolutely loving it 🌸 The energy here is unlike anything.',
    likedBy: [{ name: 'mia.design', photo: '/p3.png' }, { name: 'luna_creates', photo: '/p1.png' }],
    comments: [
      { user: 'mia.design', text: 'Jealous beyond words 😭', likes: 15 },
      { user: 'sophie_adventures', text: 'When are we going together???', likes: 6 },
    ],
    time: '1d', isLiked: false, isSaved: true, tags: ['Travel', 'Japan'],
  },
  {
    id: 'p4', user: 'luna_creates', userPhoto: '/p1.png', verified: false, following: true,
    location: 'Art District 🎨', feed: 'following',
    image: '/post4.png', imageAspect: '1/1',
    likes: 671, caption: 'New piece finished 🎨 Spent 3 weeks on this one. Sometimes the slow burn is the best.',
    likedBy: [{ name: 'elenabooks', photo: '/p4.png' }],
    comments: [], time: '2d', isLiked: false, isSaved: false, tags: ['Art', 'Creative'],
  },
  {
    id: 'p5', user: 'leo.travels', userPhoto: '/p3.png', verified: true, following: false,
    location: 'Santorini, 🇬🇷', feed: 'trending',
    image: '/post5.png', imageAspect: '4/5',
    likes: 3120, caption: 'Blue hour in Santorini hits different 🤍 Already planning the next trip.',
    likedBy: [{ name: 'sophie_adventures', photo: '/p1.png' }, { name: 'aria.writes', photo: '/p3.png' }],
    comments: [{ user: 'zoe_fitness', text: 'Dream destination 🙌', likes: 9 }],
    time: '3d', isLiked: false, isSaved: false, tags: ['Travel', 'Greece'],
  },
];

type Comment = { user: string; text: string; likes: number };
type Post = {
  id: string; user: string; userPhoto: string; verified: boolean; following: boolean;
  location: string; feed: string; image: string; imageAspect: string;
  likes: number; caption: string; likedBy: { name: string; photo: string }[];
  comments: Comment[]; time: string; isLiked: boolean; isSaved: boolean; tags: string[];
  real?: boolean;
};
type Story = typeof STORIES[number];

const TABS = [
  { key: 'foryou',    label: 'For You' },
  { key: 'following', label: 'Following' },
  { key: 'nearby',    label: 'Nearby' },
  { key: 'trending',  label: 'Trending' },
] as const;
type TabKey = typeof TABS[number]['key'];

/* ─── Component ──────────────────────────────────────────────────── */
export const FeedPage = ({ onOpenMessages, onOpenNotifications, onOpenChat }: { onOpenMessages?: () => void, onOpenNotifications?: () => void, onOpenChat?: (conversation: any) => void }) => {
  const [posts, setPosts] = useState<Post[]>(POSTS);
  const [tab, setTab] = useState<TabKey>('foryou');
  const [activeStory, setActiveStory] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [suggested, setSuggested] = useState(SUGGESTED);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [shareFor, setShareFor] = useState<Post | null>(null);
  const [toast, setToast] = useState('');
  const [showNewPill, setShowNewPill] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  // Load real posts from the database and place them at the top of the feed
  useEffect(() => {
    api.getFeed()
      .then(({ posts: dbPosts }) => {
        if (!dbPosts?.length) return;
        const mapped: Post[] = dbPosts.map((p: any) => {
          const lines = (p.caption || '').split('\n');
          const locLine = lines.find((l: string) => l.trim().startsWith('📍'));
          const caption = lines.filter((l: string) => !l.trim().startsWith('📍')).join('\n').trim();
          return {
            id: p.id,
            user: p.author.name,
            userPhoto: api.fileUrl(p.author.photo),
            verified: false,
            following: true, // your own/matched posts count as followed
            location: locLine ? locLine.replace('📍', '').trim() : '',
            feed: 'foryou',
            image: api.fileUrl(p.imageUrl),
            imageAspect: '1/1',
            likes: p.likes,
            caption: caption || 'New post',
            likedBy: [],
            comments: [],
            time: relTime(p.createdAt),
            isLiked: false,
            isSaved: false,
            tags: [],
            real: true,
          };
        });
        setPosts(prev => [...mapped, ...prev.filter(p => !p.real)]);
      })
      .catch(() => {});
  }, []);

  // Simulate "new posts" arriving so the pill feels alive
  useEffect(() => {
    const t = setTimeout(() => setShowNewPill(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const toggleLike = (postId: string) => {
    const target = posts.find(p => p.id === postId);
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p
    ));
    if (target?.real) api.likePost(postId, !target.isLiked).catch(() => {});
  };
  const toggleSave = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: !p.isSaved } : p));
    const p = posts.find(x => x.id === postId);
    flash(p?.isSaved ? 'Removed from saved' : 'Saved to collection ✓');
  };
  const toggleFollow = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, following: !p.following } : p));
  };
  const addComment = (postId: string) => {
    const text = commentInput[postId]?.trim();
    if (!text) return;
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, { user: 'you', text, likes: 0 }] } : p
    ));
    setCommentInput(prev => ({ ...prev, [postId]: '' }));
  };
  const toggleCommentLike = (key: string) => {
    setLikedComments(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const followSuggested = (id: string) => {
    setSuggested(prev => prev.filter(s => s.id !== id));
    flash('Followed ✓');
  };
  const jumpToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setShowNewPill(false);
  };

  const visible = posts.filter(p => tab === 'foryou' ? true : p.feed === tab || (tab === 'following' && p.following));
  const shown = tab === 'trending' ? [...visible].sort((a, b) => b.likes - a.likes) : visible;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 24, fontWeight: 900, letterSpacing: -1,
            background: 'linear-gradient(135deg, #E8445A, #F97F68)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>spark</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--text-3)', textTransform: 'uppercase', marginTop: 2 }}>social</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="icon-btn" onClick={() => setSearchOpen(true)} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Search">
            <Search size={19} strokeWidth={2} />
          </button>
          <button className="icon-btn" onClick={onOpenNotifications} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Notifications">
            <Bell size={19} strokeWidth={2} />
          </button>
          <button className="icon-btn" onClick={onOpenMessages} style={{ width: 36, height: 36, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Messages">
            <Send size={18} strokeWidth={2} />
            <div className="badge">3</div>
          </button>
        </div>
      </div>

      {/* Feed tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', overflowX: 'auto', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '7px 15px', borderRadius: 50, border: 'none', cursor: 'pointer', flexShrink: 0,
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13,
              background: tab === t.key ? 'linear-gradient(135deg, #E8445A, #F97F68)' : 'rgba(255,255,255,0.05)',
              color: tab === t.key ? 'white' : 'var(--text-3)',
              boxShadow: tab === t.key ? 'var(--shadow-rose)' : 'none', transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Scrollable feed */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {/* New posts pill */}
        {showNewPill && (
          <button
            onClick={jumpToTop}
            className="animate-scale-in"
            style={{
              position: 'sticky', top: 10, zIndex: 20, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 6, margin: '10px auto 0',
              padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #E8445A, #F97F68)', color: 'white',
              fontSize: 13, fontWeight: 700, boxShadow: '0 6px 20px rgba(232,68,90,0.45)', fontFamily: 'Inter, sans-serif',
            }}
          >
            <ArrowUp size={15} strokeWidth={2.5} /> New posts
          </button>
        )}

        {/* Stories (only on For You) */}
        {tab === 'foryou' && (
          <>
            <div style={{ overflowX: 'auto', padding: '14px 0 12px' }}>
              <div style={{ display: 'flex', gap: 14, padding: '0 16px', width: 'max-content' }}>
                {STORIES.map((s, i) => (
                  <div key={s.id} onClick={() => setActiveStory(s.id)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', flexShrink: 0, animation: `fadeUp 0.4s ${i * 0.05}s ease both` }}>
                    <div className={s.seen ? 'story-ring-seen' : 'story-ring'} style={{ position: 'relative' }}>
                      <div className="story-inner">
                        <img src={s.photo} alt={s.name} style={{ width: 62, height: 62, objectFit: 'cover', display: 'block' }} />
                      </div>
                      {s.isMe && (
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #E8445A, #F97F68)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)', color: 'white' }}>
                          <Plus size={13} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: s.seen ? 'var(--text-3)' : 'var(--text-2)', fontWeight: s.seen ? 400 : 600, maxWidth: 64, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.isMe ? 'Your story' : s.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="divider" />
          </>
        )}

        {/* Posts + injected suggestions */}
        {shown.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 60, padding: '0 32px' }}>
            <Sparkles size={40} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 4px' }}>Nothing here yet</p>
            <p style={{ fontSize: 13, margin: 0 }}>Follow more people to fill up this feed.</p>
          </div>
        ) : (
          shown.map((post, idx) => (
            <div key={post.id}>
              <PostCard
                post={post}
                idx={idx}
                onLike={() => toggleLike(post.id)}
                onSave={() => toggleSave(post.id)}
                onFollow={() => toggleFollow(post.id)}
                onShare={() => setShareFor(post)}
                commentInput={commentInput[post.id] || ''}
                onCommentChange={v => setCommentInput(p => ({ ...p, [post.id]: v }))}
                onCommentSubmit={() => addComment(post.id)}
                expanded={expandedPost === post.id}
                onToggleExpand={() => setExpandedPost(p => p === post.id ? null : post.id)}
                likedComments={likedComments}
                onCommentLike={toggleCommentLike}
              />
              {/* Inject suggested-for-you carousel after the 2nd post on For You */}
              {tab === 'foryou' && idx === 1 && suggested.length > 0 && (
                <SuggestedCarousel people={suggested} onFollow={followSuggested} onDismiss={id => setSuggested(prev => prev.filter(s => s.id !== id))} />
              )}
            </div>
          ))
        )}

        {/* End of feed */}
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>You're all caught up ✨</p>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <SearchOverlay
          posts={posts}
          onClose={() => setSearchOpen(false)}
          onFollow={() => flash('Followed ✓')}
          onOpenChat={onOpenChat}
        />
      )}

      {/* Story viewer overlay */}
      {activeStory && (
        <StoryViewer story={STORIES.find(s => s.id === activeStory)!} onClose={() => setActiveStory(null)} />
      )}

      {/* Share sheet */}
      {shareFor && (
        <ShareSheet post={shareFor} onClose={() => setShareFor(null)} onAction={msg => { setShareFor(null); flash(msg); }} />
      )}

      {/* Toast */}
      {toast && (
        <div className="animate-scale-in" style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 300,
          background: 'var(--text-1)', color: 'var(--bg)', padding: '10px 18px', borderRadius: 999,
          fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.35)', whiteSpace: 'nowrap',
        }}>{toast}</div>
      )}
    </div>
  );
};

/* ─── Search overlay (real-time) ─────────────────────────────────── */
const TRENDING = ['#Travel', '#Coffee', '#Art', '#Japan', '#Fitness', '#Design'];

const SearchOverlay = ({ posts, onClose, onFollow, onOpenChat }: { posts: Post[]; onClose: () => void; onFollow: () => void; onOpenChat?: (conversation: any) => void }) => {
  const [q, setQ] = useState('');
  const [dbUsers, setDbUsers] = useState<{ id: string; name: string; photo: string }[]>([]);
  const [dbPosts, setDbPosts] = useState<{ id: string; imageUrl: string; caption: string; likes: number; author: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewProfile, setViewProfile] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const openProfile = async (id: string) => {
    setProfileLoading(true);
    try { setViewProfile(await api.getPublicProfile(id)); } catch { /* ignore */ }
    setProfileLoading(false);
  };
  const messageUser = async (id: string) => {
    try {
      const { conversation } = await api.startChat(id);
      onOpenChat?.(conversation);
    } catch { /* ignore */ }
  };

  // Debounced DB search as the user types
  useEffect(() => {
    const query = q.trim();
    if (!query) { setDbUsers([]); setDbPosts([]); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { users, posts: p } = await api.search(query);
        setDbUsers(users || []);
        setDbPosts(p || []);
      } catch { /* ignore */ }
      setLoading(false);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const ql = q.trim().toLowerCase();

  // Merge live DB users (real, messageable) with local demo people, de-duped by name
  const localPeople = [
    ...SUGGESTED.map(s => ({ id: undefined as string | undefined, name: s.user, photo: s.photo })),
    ...STORIES.filter(s => !s.isMe).map(s => ({ id: undefined as string | undefined, name: s.name, photo: s.photo })),
  ].filter(p => ql && p.name.toLowerCase().includes(ql));
  const seen = new Set<string>();
  const people = [...dbUsers.map(u => ({ id: u.id, name: u.name, photo: api.fileUrl(u.photo) })), ...localPeople]
    .filter(p => (seen.has(p.name.toLowerCase()) ? false : (seen.add(p.name.toLowerCase()), true)));

  // Local post matches (caption / author / tag) + DB post matches
  const localPosts = ql
    ? posts.filter(p => p.caption.toLowerCase().includes(ql) || p.user.toLowerCase().includes(ql) || p.tags.some(t => t.toLowerCase().includes(ql)))
    : [];
  const postThumbs = [
    ...dbPosts.map(p => ({ id: p.id, img: api.fileUrl(p.imageUrl) })),
    ...localPosts.map(p => ({ id: p.id, img: p.image })),
  ].filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 160, background: 'var(--bg)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.15s ease' }}>
      {/* Search bar */}
      <div className="top-bar" style={{ gap: 10 }}>
        <button className="icon-btn" onClick={onClose} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-label="Close search">
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: 'var(--text-3)', pointerEvents: 'none' }}>
            <Search size={17} />
          </div>
          <input
            autoFocus
            className="inp"
            placeholder="Search people, posts, tags…"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{ paddingLeft: 40, paddingRight: q ? 38 : 14, borderRadius: 50 }}
          />
          {q && (
            <button onClick={() => setQ('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex' }} aria-label="Clear">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0 40px' }}>
        {/* Empty state — trending + suggested */}
        {!ql && (
          <div style={{ padding: '8px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 10px' }}>
              <TrendingUp size={15} strokeWidth={2.5} style={{ color: 'var(--rose)' }} />
              <span style={{ fontSize: 13, fontWeight: 800 }}>Trending</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {TRENDING.map(t => (
                <button key={t} onClick={() => setQ(t.replace('#', ''))} style={{ padding: '8px 14px', borderRadius: 999, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Suggested people</div>
            {SUGGESTED.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                <img src={s.photo} alt={s.user} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{s.user}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.reason}</div>
                </div>
                <button className="btn-rose" onClick={onFollow} style={{ padding: '6px 14px', fontSize: 13 }}>Follow</button>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {ql && (
          <>
            {loading && <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, margin: '16px 0' }}>Searching…</p>}

            {people.length > 0 && (
              <div style={{ padding: '4px 16px 8px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-3)', letterSpacing: 0.4, margin: '4px 0 8px' }}>PEOPLE</div>
                {people.map((p, i) => (
                  <div key={i} onClick={() => p.id && openProfile(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', cursor: p.id ? 'pointer' : 'default' }}>
                    <img src={p.photo} alt={p.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                    {p.id ? (
                      <button className="btn-rose" onClick={e => { e.stopPropagation(); messageUser(p.id!); }} style={{ padding: '6px 14px', fontSize: 13 }}>Message</button>
                    ) : (
                      <button className="btn-rose" onClick={e => { e.stopPropagation(); onFollow(); }} style={{ padding: '6px 14px', fontSize: 13 }}>Follow</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {postThumbs.length > 0 && (
              <div style={{ padding: '8px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-3)', letterSpacing: 0.4, margin: '4px 0 8px' }}>POSTS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                  {postThumbs.map(p => (
                    <div key={p.id} onClick={onClose} style={{ aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer', borderRadius: 4 }}>
                      <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && people.length === 0 && postThumbs.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 50, padding: '0 32px' }}>
                <Search size={40} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 12 }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 4px' }}>No results for "{q}"</p>
                <p style={{ fontSize: 13, margin: 0 }}>Try a different name, caption, or tag.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* User profile modal */}
      {(viewProfile || profileLoading) && (
        <div onClick={() => setViewProfile(null)} style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-in" style={{ width: '100%', maxWidth: 360, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 24, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', maxHeight: '85vh', overflowY: 'auto' }}>
            {profileLoading || !viewProfile ? (
              <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: 30 }}>Loading…</p>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                  <button onClick={() => setViewProfile(null)} className="icon-btn" style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close"><X size={16} /></button>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="story-ring" style={{ margin: '0 auto 12px', width: 'fit-content' }}>
                    <div className="story-inner"><img src={viewProfile.user.avatarUrl ? api.fileUrl(viewProfile.user.avatarUrl) : '/p2.png'} alt={viewProfile.user.name} style={{ width: 84, height: 84, objectFit: 'cover', display: 'block' }} /></div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.3 }}>{viewProfile.user.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{viewProfile.postCount} post{viewProfile.postCount === 1 ? '' : 's'}</div>
                  {viewProfile.user.bio && <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, margin: '12px 0 0', whiteSpace: 'pre-wrap' }}>{viewProfile.user.bio}</div>}
                </div>
                {viewProfile.interests?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 14 }}>
                    {viewProfile.interests.map((t: string) => (
                      <span key={t} style={{ padding: '5px 11px', borderRadius: 999, background: 'rgba(232,68,90,0.12)', border: '1px solid rgba(232,68,90,0.25)', color: 'var(--rose)', fontSize: 12.5, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                )}
                {viewProfile.posts?.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, marginTop: 16, borderRadius: 12, overflow: 'hidden' }}>
                    {viewProfile.posts.map((p: any) => (
                      <div key={p.id} style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                        <img src={api.fileUrl(p.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => messageUser(viewProfile.user.id)} className="btn-rose" style={{ width: '100%', padding: '13px 0', fontSize: 15, marginTop: 20 }}>
                  💬 Message {viewProfile.user.name}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Suggested carousel ─────────────────────────────────────────── */
const SuggestedCarousel = ({ people, onFollow, onDismiss }: { people: typeof SUGGESTED; onFollow: (id: string) => void; onDismiss: (id: string) => void }) => (
  <div style={{ padding: '14px 0 16px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px 12px' }}>
      <Users size={15} strokeWidth={2.5} style={{ color: 'var(--rose)' }} />
      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.2 }}>Suggested for you</span>
    </div>
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 16px' }}>
      {people.map(p => (
        <div key={p.id} style={{ flexShrink: 0, width: 150, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 14, position: 'relative', textAlign: 'center' }}>
          <button onClick={() => onDismiss(p.id)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex' }} aria-label="Dismiss"><X size={14} /></button>
          <div className="story-ring" style={{ margin: '4px auto 8px', width: 'fit-content' }}>
            <div className="story-inner"><img src={p.photo} alt={p.user} style={{ width: 56, height: 56, objectFit: 'cover', display: 'block' }} /></div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.user}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.reason}</div>
          <button className="btn-rose" onClick={() => onFollow(p.id)} style={{ width: '100%', padding: '7px 0', fontSize: 13 }}>Follow</button>
        </div>
      ))}
    </div>
  </div>
);

/* ─── Post Card ──────────────────────────────────────────────────── */
interface PostCardProps {
  post: Post; idx: number;
  onLike: () => void; onSave: () => void; onFollow: () => void; onShare: () => void;
  commentInput: string; onCommentChange: (v: string) => void; onCommentSubmit: () => void;
  expanded: boolean; onToggleExpand: () => void;
  likedComments: Set<string>; onCommentLike: (key: string) => void;
}

const PostCard = ({ post, idx, onLike, onSave, onFollow, onShare, commentInput, onCommentChange, onCommentSubmit, expanded, onToggleExpand, likedComments, onCommentLike }: PostCardProps) => {
  const [likeAnim, setLikeAnim] = useState(false);
  const handleDoubleTap = () => {
    if (!post.isLiked) onLike();
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 600);
  };

  return (
    <div className="post-card" style={{ marginBottom: 8, animation: `fadeUp 0.4s ${idx * 0.06}s ease both` }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 10px' }}>
        <div className="story-ring" style={{ cursor: 'pointer' }}>
          <div className="story-inner">
            <img src={post.userPhoto} alt={post.user} style={{ width: 38, height: 38, objectFit: 'cover', display: 'block' }} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', letterSpacing: -0.2 }}>{post.user}</span>
            {post.verified && <BadgeCheck size={14} fill="#E8445A" color="white" strokeWidth={2} />}
            {!post.following && (
              <>
                <span style={{ color: 'var(--text-3)', fontSize: 13 }}>·</span>
                <button onClick={onFollow} style={{ background: 'none', border: 'none', color: 'var(--rose)', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif' }}>Follow</button>
              </>
            )}
          </div>
          {post.location && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={11} strokeWidth={2.2} style={{ flexShrink: 0 }} /> {post.location}
            </div>
          )}
        </div>
        <button className="post-action-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="More options">
          <MoreHorizontal size={19} strokeWidth={2} />
        </button>
      </div>

      {/* Image with double-tap to like */}
      <div style={{ position: 'relative' }} onDoubleClick={handleDoubleTap}>
        <img src={post.image} alt="Post" className="post-img" style={{ aspectRatio: post.imageAspect, maxHeight: 520 }} draggable={false} />
        {likeAnim && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <Heart size={92} fill="#ffffff" color="#ffffff" strokeWidth={0} style={{ animation: 'popHeart 0.6s ease', filter: 'drop-shadow(0 4px 20px rgba(232,68,90,0.6))' }} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '10px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <button className={`post-action-btn ${post.isLiked ? 'liked' : ''}`} onClick={onLike} aria-label="Like post" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={22} strokeWidth={2} fill={post.isLiked ? '#E8445A' : 'none'} color={post.isLiked ? '#E8445A' : 'currentColor'} />
            </button>
            <button className="post-action-btn" onClick={onToggleExpand} aria-label="Comment" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={21} strokeWidth={2} />
            </button>
            <button className="post-action-btn" onClick={onShare} aria-label="Share" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={20} strokeWidth={2} />
            </button>
          </div>
          <button className="post-action-btn" onClick={onSave} aria-label="Save post" style={{ color: post.isSaved ? 'var(--rose)' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bookmark size={21} strokeWidth={2} fill={post.isSaved ? 'var(--rose, #E8445A)' : 'none'} />
          </button>
        </div>

        {/* Liked by row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          {post.likedBy.length > 0 && (
            <div style={{ display: 'flex' }}>
              {post.likedBy.slice(0, 3).map((l, i) => (
                <img key={i} src={l.photo} alt={l.name} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg-card)', marginLeft: i ? -8 : 0 }} />
              ))}
            </div>
          )}
          <div style={{ fontSize: 13, color: 'var(--text-1)' }}>
            {post.likedBy.length > 0 ? (
              <>Liked by <b>{post.likedBy[0].name}</b> and <b>{(post.likes - 1).toLocaleString()} others</b></>
            ) : (
              <b>{post.likes.toLocaleString()} likes</b>
            )}
          </div>
        </div>

        {/* Caption */}
        <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 6, lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-1)', marginRight: 6 }}>{post.user}</span>
          {post.caption}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {post.tags.map(t => (
            <span key={t} style={{ fontSize: 12, color: 'var(--rose)', fontWeight: 600 }}>#{t}</span>
          ))}
        </div>

        {/* Comments preview */}
        {post.comments.length > 0 && !expanded && (
          <button onClick={onToggleExpand} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-3)', fontSize: 13, marginBottom: 4 }}>
            View all {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
          </button>
        )}

        {expanded && (
          <div style={{ marginBottom: 8 }}>
            {post.comments.map((c, i) => {
              const key = `${post.id}-${i}`;
              const liked = likedComments.has(key);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-1)', marginRight: 6 }}>{c.user}</span>
                    {c.text}
                  </div>
                  <button onClick={() => onCommentLike(key)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: 0, flexShrink: 0 }} aria-label="Like comment">
                    <Heart size={13} strokeWidth={2} fill={liked ? '#E8445A' : 'none'} color={liked ? '#E8445A' : 'var(--text-3)'} />
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{c.likes + (liked ? 1 : 0) || ''}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Timestamp */}
        <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{post.time} ago</div>

        {/* Add comment */}
        <div className="divider" style={{ margin: '0 -14px 10px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10 }}>
          <img src="/p2.png" alt="You" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <input className="inp" placeholder="Add a comment…" value={commentInput} onChange={e => onCommentChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onCommentSubmit()} style={{ borderRadius: 50, padding: '8px 14px', fontSize: 13 }} />
          {commentInput.trim() && (
            <button className="btn-rose" onClick={onCommentSubmit} style={{ padding: '8px 14px', fontSize: 13, flexShrink: 0 }}>Post</button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Share sheet ────────────────────────────────────────────────── */
const ShareSheet = ({ post, onClose, onAction }: { post: Post; onClose: () => void; onAction: (msg: string) => void }) => {
  const people = STORIES.filter(s => !s.isMe);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--bg-card)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '18px 16px 24px', animation: 'slideUp 0.25s ease', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Share this post</div>

        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
          {people.map(p => (
            <div key={p.id} onClick={() => onAction(`Sent to ${p.name} ✓`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
              <img src={p.photo} alt={p.name} style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>{p.name}</span>
            </div>
          ))}
        </div>

        <div className="divider" style={{ margin: '4px 0 12px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { icon: <Link2 size={18} />, label: 'Copy link', msg: 'Link copied ✓' },
            { icon: <Plus size={18} />, label: 'Share to your story', msg: 'Added to your story ✓' },
            { icon: <Send size={18} />, label: 'Share externally', msg: 'Opening share…' },
          ].map(o => (
            <button key={o.label} onClick={() => onAction(o.msg)} className="menu-item-btn" style={{ justifyContent: 'flex-start' }}>
              {o.icon} {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Story Viewer ───────────────────────────────────────────────── */
const StoryViewer = ({ story, onClose }: { story: Story; onClose: () => void }) => (
  <div style={{ position: 'absolute', inset: 0, background: 'black', zIndex: 100, display: 'flex', flexDirection: 'column', animation: 'scaleIn 0.25s ease' }} onClick={onClose}>
    <div style={{ height: 3, background: 'rgba(255,255,255,0.2)', margin: '12px 12px 0', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: '60%', background: 'white', borderRadius: 2, animation: 'shimmer 3s linear' }} />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
      <img src={story.photo} alt={story.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
      <span style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{story.name}</span>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginLeft: 4 }}>2h ago</span>
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }} aria-label="Close story">
        <X size={22} strokeWidth={2} />
      </button>
    </div>
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <img src={story.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    <div style={{ padding: '14px', display: 'flex', gap: 10, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
      <input className="inp" placeholder={`Reply to ${story.name}…`} style={{ borderRadius: 50, border: '1px solid rgba(255,255,255,0.3)' }} />
      <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }} aria-label="Like story">
        <Heart size={22} strokeWidth={2} />
      </button>
    </div>
  </div>
);
