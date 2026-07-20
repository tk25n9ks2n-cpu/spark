import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Bell, Send, MoreHorizontal, Heart, MessageCircle, Bookmark, X, Plus, MapPin, BadgeCheck, Link2, Users, Sparkles, ArrowUp, Search, ArrowLeft, TrendingUp, } from 'lucide-react';
import { api } from '../services/api';
const relTime = (iso) => {
    if (!iso)
        return '';
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60)
        return 'now';
    if (s < 3600)
        return `${Math.floor(s / 60)}m`;
    if (s < 86400)
        return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
};
/* ─── Demo data ──────────────────────────────────────────────────── */
const STORIES = [
    { id: 's0', name: 'Your story', photo: '/p2.png', seen: true, isMe: true },
    { id: 's1', name: 'Sophie', photo: '/p1.png', seen: false },
    { id: 's2', name: 'Mia', photo: '/p3.png', seen: false },
    { id: 's3', name: 'Elena', photo: '/p4.png', seen: false },
    { id: 's4', name: 'Luna', photo: '/p1.png', seen: true },
    { id: 's5', name: 'Aria', photo: '/p3.png', seen: false },
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
const TABS = [
    { key: 'foryou', label: 'For You' },
    { key: 'following', label: 'Following' },
    { key: 'nearby', label: 'Nearby' },
    { key: 'trending', label: 'Trending' },
];
/* ─── Component ──────────────────────────────────────────────────── */
export const FeedPage = ({ onOpenMessages, onOpenNotifications, onOpenChat }) => {
    const [posts, setPosts] = useState(POSTS);
    const [tab, setTab] = useState('foryou');
    const [activeStory, setActiveStory] = useState(null);
    const [commentInput, setCommentInput] = useState({});
    const [expandedPost, setExpandedPost] = useState(null);
    const [suggested, setSuggested] = useState(SUGGESTED);
    const [likedComments, setLikedComments] = useState(new Set());
    const [shareFor, setShareFor] = useState(null);
    const [toast, setToast] = useState('');
    const [showNewPill, setShowNewPill] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const scrollRef = useRef(null);
    const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200); };
    // Load real posts from the database and place them at the top of the feed
    useEffect(() => {
        api.getFeed()
            .then(({ posts: dbPosts }) => {
            if (!dbPosts?.length)
                return;
            const mapped = dbPosts.map((p) => {
                const lines = (p.caption || '').split('\n');
                const locLine = lines.find((l) => l.trim().startsWith('📍'));
                const caption = lines.filter((l) => !l.trim().startsWith('📍')).join('\n').trim();
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
            .catch(() => { });
    }, []);
    // Simulate "new posts" arriving so the pill feels alive
    useEffect(() => {
        const t = setTimeout(() => setShowNewPill(true), 6000);
        return () => clearTimeout(t);
    }, []);
    const toggleLike = (postId) => {
        const target = posts.find(p => p.id === postId);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p));
        if (target?.real)
            api.likePost(postId, !target.isLiked).catch(() => { });
    };
    const toggleSave = (postId) => {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: !p.isSaved } : p));
        const p = posts.find(x => x.id === postId);
        flash(p?.isSaved ? 'Removed from saved' : 'Saved to collection ✓');
    };
    const toggleFollow = (postId) => {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, following: !p.following } : p));
    };
    const addComment = (postId) => {
        const text = commentInput[postId]?.trim();
        if (!text)
            return;
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, { user: 'you', text, likes: 0 }] } : p));
        setCommentInput(prev => ({ ...prev, [postId]: '' }));
    };
    const toggleCommentLike = (key) => {
        setLikedComments(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };
    const followSuggested = (id) => {
        setSuggested(prev => prev.filter(s => s.id !== id));
        flash('Followed ✓');
    };
    const jumpToTop = () => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        setShowNewPill(false);
    };
    const visible = posts.filter(p => tab === 'foryou' ? true : p.feed === tab || (tab === 'following' && p.following));
    const shown = tab === 'trending' ? [...visible].sort((a, b) => b.likes - a.likes) : visible;
    return (_jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [_jsxs("div", { className: "top-bar", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: {
                                    fontSize: 24, fontWeight: 900, letterSpacing: -1,
                                    background: 'linear-gradient(135deg, #E8445A, #F97F68)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                                }, children: "spark" }), _jsx("span", { style: { fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--text-3)', textTransform: 'uppercase', marginTop: 2 }, children: "social" })] }), _jsxs("div", { style: { display: 'flex', gap: 10, alignItems: 'center' }, children: [_jsx("button", { className: "icon-btn", onClick: () => setSearchOpen(true), style: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }, "aria-label": "Search", children: _jsx(Search, { size: 19, strokeWidth: 2 }) }), _jsx("button", { className: "icon-btn", onClick: onOpenNotifications, style: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }, "aria-label": "Notifications", children: _jsx(Bell, { size: 19, strokeWidth: 2 }) }), _jsxs("button", { className: "icon-btn", onClick: onOpenMessages, style: { width: 36, height: 36, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }, "aria-label": "Messages", children: [_jsx(Send, { size: 18, strokeWidth: 2 }), _jsx("div", { className: "badge", children: "3" })] })] })] }), _jsx("div", { style: { display: 'flex', gap: 6, padding: '10px 16px', overflowX: 'auto', borderBottom: '1px solid var(--border)', flexShrink: 0 }, children: TABS.map(t => (_jsx("button", { onClick: () => setTab(t.key), style: {
                        padding: '7px 15px', borderRadius: 50, border: 'none', cursor: 'pointer', flexShrink: 0,
                        fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13,
                        background: tab === t.key ? 'linear-gradient(135deg, #E8445A, #F97F68)' : 'rgba(255,255,255,0.05)',
                        color: tab === t.key ? 'white' : 'var(--text-3)',
                        boxShadow: tab === t.key ? 'var(--shadow-rose)' : 'none', transition: 'all 0.2s',
                    }, children: t.label }, t.key))) }), _jsxs("div", { ref: scrollRef, style: { flex: 1, overflowY: 'auto', position: 'relative' }, children: [showNewPill && (_jsxs("button", { onClick: jumpToTop, className: "animate-scale-in", style: {
                            position: 'sticky', top: 10, zIndex: 20, left: '50%', transform: 'translateX(-50%)',
                            display: 'flex', alignItems: 'center', gap: 6, margin: '10px auto 0',
                            padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #E8445A, #F97F68)', color: 'white',
                            fontSize: 13, fontWeight: 700, boxShadow: '0 6px 20px rgba(232,68,90,0.45)', fontFamily: 'Inter, sans-serif',
                        }, children: [_jsx(ArrowUp, { size: 15, strokeWidth: 2.5 }), " New posts"] })), tab === 'foryou' && (_jsxs(_Fragment, { children: [_jsx("div", { style: { overflowX: 'auto', padding: '14px 0 12px' }, children: _jsx("div", { style: { display: 'flex', gap: 14, padding: '0 16px', width: 'max-content' }, children: STORIES.map((s, i) => (_jsxs("div", { onClick: () => setActiveStory(s.id), style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', flexShrink: 0, animation: `fadeUp 0.4s ${i * 0.05}s ease both` }, children: [_jsxs("div", { className: s.seen ? 'story-ring-seen' : 'story-ring', style: { position: 'relative' }, children: [_jsx("div", { className: "story-inner", children: _jsx("img", { src: s.photo, alt: s.name, style: { width: 62, height: 62, objectFit: 'cover', display: 'block' } }) }), s.isMe && (_jsx("div", { style: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #E8445A, #F97F68)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)', color: 'white' }, children: _jsx(Plus, { size: 13, strokeWidth: 3 }) }))] }), _jsx("span", { style: { fontSize: 11, color: s.seen ? 'var(--text-3)' : 'var(--text-2)', fontWeight: s.seen ? 400 : 600, maxWidth: 64, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: s.isMe ? 'Your story' : s.name })] }, s.id))) }) }), _jsx("div", { className: "divider" })] })), shown.length === 0 ? (_jsxs("div", { style: { textAlign: 'center', color: 'var(--text-3)', marginTop: 60, padding: '0 32px' }, children: [_jsx(Sparkles, { size: 40, strokeWidth: 1.5, style: { opacity: 0.4, marginBottom: 12 } }), _jsx("p", { style: { fontSize: 15, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 4px' }, children: "Nothing here yet" }), _jsx("p", { style: { fontSize: 13, margin: 0 }, children: "Follow more people to fill up this feed." })] })) : (shown.map((post, idx) => (_jsxs("div", { children: [_jsx(PostCard, { post: post, idx: idx, onLike: () => toggleLike(post.id), onSave: () => toggleSave(post.id), onFollow: () => toggleFollow(post.id), onShare: () => setShareFor(post), commentInput: commentInput[post.id] || '', onCommentChange: v => setCommentInput(p => ({ ...p, [post.id]: v })), onCommentSubmit: () => addComment(post.id), expanded: expandedPost === post.id, onToggleExpand: () => setExpandedPost(p => p === post.id ? null : post.id), likedComments: likedComments, onCommentLike: toggleCommentLike }), tab === 'foryou' && idx === 1 && suggested.length > 0 && (_jsx(SuggestedCarousel, { people: suggested, onFollow: followSuggested, onDismiss: id => setSuggested(prev => prev.filter(s => s.id !== id)) }))] }, post.id)))), _jsx("div", { style: { padding: '32px 0', textAlign: 'center' }, children: _jsx("p", { style: { color: 'var(--text-3)', fontSize: 13 }, children: "You're all caught up \u2728" }) })] }), searchOpen && (_jsx(SearchOverlay, { posts: posts, onClose: () => setSearchOpen(false), onFollow: () => flash('Followed ✓'), onOpenChat: onOpenChat })), activeStory && (_jsx(StoryViewer, { story: STORIES.find(s => s.id === activeStory), onClose: () => setActiveStory(null) })), shareFor && (_jsx(ShareSheet, { post: shareFor, onClose: () => setShareFor(null), onAction: msg => { setShareFor(null); flash(msg); } })), toast && (_jsx("div", { className: "animate-scale-in", style: {
                    position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 300,
                    background: 'var(--text-1)', color: 'var(--bg)', padding: '10px 18px', borderRadius: 999,
                    fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.35)', whiteSpace: 'nowrap',
                }, children: toast }))] }));
};
/* ─── Search overlay (real-time) ─────────────────────────────────── */
const TRENDING = ['#Travel', '#Coffee', '#Art', '#Japan', '#Fitness', '#Design'];
const SearchOverlay = ({ posts, onClose, onFollow, onOpenChat }) => {
    const [q, setQ] = useState('');
    const [dbUsers, setDbUsers] = useState([]);
    const [dbPosts, setDbPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewProfile, setViewProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const openProfile = async (id) => {
        setProfileLoading(true);
        try {
            setViewProfile(await api.getPublicProfile(id));
        }
        catch { /* ignore */ }
        setProfileLoading(false);
    };
    const messageUser = async (id) => {
        try {
            const { conversation } = await api.startChat(id);
            onOpenChat?.(conversation);
        }
        catch { /* ignore */ }
    };
    // Debounced DB search as the user types
    useEffect(() => {
        const query = q.trim();
        if (!query) {
            setDbUsers([]);
            setDbPosts([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const t = setTimeout(async () => {
            try {
                const { users, posts: p } = await api.search(query);
                setDbUsers(users || []);
                setDbPosts(p || []);
            }
            catch { /* ignore */ }
            setLoading(false);
        }, 220);
        return () => clearTimeout(t);
    }, [q]);
    const ql = q.trim().toLowerCase();
    // Merge live DB users (real, messageable) with local demo people, de-duped by name
    const localPeople = [
        ...SUGGESTED.map(s => ({ id: undefined, name: s.user, photo: s.photo })),
        ...STORIES.filter(s => !s.isMe).map(s => ({ id: undefined, name: s.name, photo: s.photo })),
    ].filter(p => ql && p.name.toLowerCase().includes(ql));
    const seen = new Set();
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
    return (_jsxs("div", { style: { position: 'absolute', inset: 0, zIndex: 160, background: 'var(--bg)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.15s ease' }, children: [_jsxs("div", { className: "top-bar", style: { gap: 10 }, children: [_jsx("button", { className: "icon-btn", onClick: onClose, style: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }, "aria-label": "Close search", children: _jsx(ArrowLeft, { size: 20, strokeWidth: 2 }) }), _jsxs("div", { style: { position: 'relative', flex: 1 }, children: [_jsx("div", { style: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: 'var(--text-3)', pointerEvents: 'none' }, children: _jsx(Search, { size: 17 }) }), _jsx("input", { autoFocus: true, className: "inp", placeholder: "Search people, posts, tags\u2026", value: q, onChange: e => setQ(e.target.value), style: { paddingLeft: 40, paddingRight: q ? 38 : 14, borderRadius: 50 } }), q && (_jsx("button", { onClick: () => setQ(''), style: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex' }, "aria-label": "Clear", children: _jsx(X, { size: 16 }) }))] })] }), _jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '8px 0 40px' }, children: [!ql && (_jsxs("div", { style: { padding: '8px 16px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 10px' }, children: [_jsx(TrendingUp, { size: 15, strokeWidth: 2.5, style: { color: 'var(--rose)' } }), _jsx("span", { style: { fontSize: 13, fontWeight: 800 }, children: "Trending" })] }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }, children: TRENDING.map(t => (_jsx("button", { onClick: () => setQ(t.replace('#', '')), style: { padding: '8px 14px', borderRadius: 999, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }, children: t }, t))) }), _jsx("div", { style: { fontSize: 13, fontWeight: 800, marginBottom: 12 }, children: "Suggested people" }), SUGGESTED.map(s => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }, children: [_jsx("img", { src: s.photo, alt: s.user, style: { width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' } }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontSize: 14, fontWeight: 700 }, children: s.user }), _jsx("div", { style: { fontSize: 12, color: 'var(--text-3)' }, children: s.reason })] }), _jsx("button", { className: "btn-rose", onClick: onFollow, style: { padding: '6px 14px', fontSize: 13 }, children: "Follow" })] }, s.id)))] })), ql && (_jsxs(_Fragment, { children: [loading && _jsx("p", { style: { textAlign: 'center', color: 'var(--text-3)', fontSize: 13, margin: '16px 0' }, children: "Searching\u2026" }), people.length > 0 && (_jsxs("div", { style: { padding: '4px 16px 8px' }, children: [_jsx("div", { style: { fontSize: 12, fontWeight: 800, color: 'var(--text-3)', letterSpacing: 0.4, margin: '4px 0 8px' }, children: "PEOPLE" }), people.map((p, i) => (_jsxs("div", { onClick: () => p.id && openProfile(p.id), style: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', cursor: p.id ? 'pointer' : 'default' }, children: [_jsx("img", { src: p.photo, alt: p.name, style: { width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' } }), _jsx("div", { style: { flex: 1, fontSize: 14, fontWeight: 700 }, children: p.name }), p.id ? (_jsx("button", { className: "btn-rose", onClick: e => { e.stopPropagation(); messageUser(p.id); }, style: { padding: '6px 14px', fontSize: 13 }, children: "Message" })) : (_jsx("button", { className: "btn-rose", onClick: e => { e.stopPropagation(); onFollow(); }, style: { padding: '6px 14px', fontSize: 13 }, children: "Follow" }))] }, i)))] })), postThumbs.length > 0 && (_jsxs("div", { style: { padding: '8px 16px' }, children: [_jsx("div", { style: { fontSize: 12, fontWeight: 800, color: 'var(--text-3)', letterSpacing: 0.4, margin: '4px 0 8px' }, children: "POSTS" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }, children: postThumbs.map(p => (_jsx("div", { onClick: onClose, style: { aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer', borderRadius: 4 }, children: _jsx("img", { src: p.img, alt: "", style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }) }, p.id))) })] })), !loading && people.length === 0 && postThumbs.length === 0 && (_jsxs("div", { style: { textAlign: 'center', color: 'var(--text-3)', marginTop: 50, padding: '0 32px' }, children: [_jsx(Search, { size: 40, strokeWidth: 1.5, style: { opacity: 0.4, marginBottom: 12 } }), _jsxs("p", { style: { fontSize: 15, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 4px' }, children: ["No results for \"", q, "\""] }), _jsx("p", { style: { fontSize: 13, margin: 0 }, children: "Try a different name, caption, or tag." })] }))] }))] }), (viewProfile || profileLoading) && (_jsx("div", { onClick: () => setViewProfile(null), style: { position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }, children: _jsx("div", { onClick: e => e.stopPropagation(), className: "animate-scale-in", style: { width: '100%', maxWidth: 360, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 24, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', maxHeight: '85vh', overflowY: 'auto' }, children: profileLoading || !viewProfile ? (_jsx("p", { style: { textAlign: 'center', color: 'var(--text-3)', padding: 30 }, children: "Loading\u2026" })) : (_jsxs(_Fragment, { children: [_jsx("div", { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }, children: _jsx("button", { onClick: () => setViewProfile(null), className: "icon-btn", style: { width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }, "aria-label": "Close", children: _jsx(X, { size: 16 }) }) }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { className: "story-ring", style: { margin: '0 auto 12px', width: 'fit-content' }, children: _jsx("div", { className: "story-inner", children: _jsx("img", { src: viewProfile.user.avatarUrl ? api.fileUrl(viewProfile.user.avatarUrl) : '/p2.png', alt: viewProfile.user.name, style: { width: 84, height: 84, objectFit: 'cover', display: 'block' } }) }) }), _jsx("div", { style: { fontWeight: 800, fontSize: 20, letterSpacing: -0.3 }, children: viewProfile.user.name }), _jsxs("div", { style: { fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }, children: [viewProfile.postCount, " post", viewProfile.postCount === 1 ? '' : 's'] }), viewProfile.user.bio && _jsx("div", { style: { fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, margin: '12px 0 0', whiteSpace: 'pre-wrap' }, children: viewProfile.user.bio })] }), viewProfile.interests?.length > 0 && (_jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 14 }, children: viewProfile.interests.map((t) => (_jsx("span", { style: { padding: '5px 11px', borderRadius: 999, background: 'rgba(232,68,90,0.12)', border: '1px solid rgba(232,68,90,0.25)', color: 'var(--rose)', fontSize: 12.5, fontWeight: 600 }, children: t }, t))) })), viewProfile.posts?.length > 0 && (_jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, marginTop: 16, borderRadius: 12, overflow: 'hidden' }, children: viewProfile.posts.map((p) => (_jsx("div", { style: { aspectRatio: '1/1', overflow: 'hidden' }, children: _jsx("img", { src: api.fileUrl(p.imageUrl), alt: "", style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }) }, p.id))) })), _jsxs("button", { onClick: () => messageUser(viewProfile.user.id), className: "btn-rose", style: { width: '100%', padding: '13px 0', fontSize: 15, marginTop: 20 }, children: ["\uD83D\uDCAC Message ", viewProfile.user.name] })] })) }) }))] }));
};
/* ─── Suggested carousel ─────────────────────────────────────────── */
const SuggestedCarousel = ({ people, onFollow, onDismiss }) => (_jsxs("div", { style: { padding: '14px 0 16px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 8 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px 12px' }, children: [_jsx(Users, { size: 15, strokeWidth: 2.5, style: { color: 'var(--rose)' } }), _jsx("span", { style: { fontSize: 13, fontWeight: 800, letterSpacing: -0.2 }, children: "Suggested for you" })] }), _jsx("div", { style: { display: 'flex', gap: 12, overflowX: 'auto', padding: '0 16px' }, children: people.map(p => (_jsxs("div", { style: { flexShrink: 0, width: 150, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 14, position: 'relative', textAlign: 'center' }, children: [_jsx("button", { onClick: () => onDismiss(p.id), style: { position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex' }, "aria-label": "Dismiss", children: _jsx(X, { size: 14 }) }), _jsx("div", { className: "story-ring", style: { margin: '4px auto 8px', width: 'fit-content' }, children: _jsx("div", { className: "story-inner", children: _jsx("img", { src: p.photo, alt: p.user, style: { width: 56, height: 56, objectFit: 'cover', display: 'block' } }) }) }), _jsx("div", { style: { fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, children: p.user }), _jsx("div", { style: { fontSize: 11, color: 'var(--text-3)', margin: '2px 0 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, children: p.reason }), _jsx("button", { className: "btn-rose", onClick: () => onFollow(p.id), style: { width: '100%', padding: '7px 0', fontSize: 13 }, children: "Follow" })] }, p.id))) })] }));
const PostCard = ({ post, idx, onLike, onSave, onFollow, onShare, commentInput, onCommentChange, onCommentSubmit, expanded, onToggleExpand, likedComments, onCommentLike }) => {
    const [likeAnim, setLikeAnim] = useState(false);
    const handleDoubleTap = () => {
        if (!post.isLiked)
            onLike();
        setLikeAnim(true);
        setTimeout(() => setLikeAnim(false), 600);
    };
    return (_jsxs("div", { className: "post-card", style: { marginBottom: 8, animation: `fadeUp 0.4s ${idx * 0.06}s ease both` }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 10px' }, children: [_jsx("div", { className: "story-ring", style: { cursor: 'pointer' }, children: _jsx("div", { className: "story-inner", children: _jsx("img", { src: post.userPhoto, alt: post.user, style: { width: 38, height: 38, objectFit: 'cover', display: 'block' } }) }) }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("span", { style: { fontWeight: 700, fontSize: 14, color: 'var(--text-1)', letterSpacing: -0.2 }, children: post.user }), post.verified && _jsx(BadgeCheck, { size: 14, fill: "#E8445A", color: "white", strokeWidth: 2 }), !post.following && (_jsxs(_Fragment, { children: [_jsx("span", { style: { color: 'var(--text-3)', fontSize: 13 }, children: "\u00B7" }), _jsx("button", { onClick: onFollow, style: { background: 'none', border: 'none', color: 'var(--rose)', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif' }, children: "Follow" })] }))] }), post.location && (_jsxs("div", { style: { fontSize: 12, color: 'var(--text-3)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }, children: [_jsx(MapPin, { size: 11, strokeWidth: 2.2, style: { flexShrink: 0 } }), " ", post.location] }))] }), _jsx("button", { className: "post-action-btn", style: { display: 'flex', alignItems: 'center', justifyContent: 'center' }, "aria-label": "More options", children: _jsx(MoreHorizontal, { size: 19, strokeWidth: 2 }) })] }), _jsxs("div", { style: { position: 'relative' }, onDoubleClick: handleDoubleTap, children: [_jsx("img", { src: post.image, alt: "Post", className: "post-img", style: { aspectRatio: post.imageAspect, maxHeight: 520 }, draggable: false }), likeAnim && (_jsx("div", { style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }, children: _jsx(Heart, { size: 92, fill: "#ffffff", color: "#ffffff", strokeWidth: 0, style: { animation: 'popHeart 0.6s ease', filter: 'drop-shadow(0 4px 20px rgba(232,68,90,0.6))' } }) }))] }), _jsxs("div", { style: { padding: '10px 14px 0' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, children: [_jsxs("div", { style: { display: 'flex', gap: 14, alignItems: 'center' }, children: [_jsx("button", { className: `post-action-btn ${post.isLiked ? 'liked' : ''}`, onClick: onLike, "aria-label": "Like post", style: { display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(Heart, { size: 22, strokeWidth: 2, fill: post.isLiked ? '#E8445A' : 'none', color: post.isLiked ? '#E8445A' : 'currentColor' }) }), _jsx("button", { className: "post-action-btn", onClick: onToggleExpand, "aria-label": "Comment", style: { display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(MessageCircle, { size: 21, strokeWidth: 2 }) }), _jsx("button", { className: "post-action-btn", onClick: onShare, "aria-label": "Share", style: { display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(Send, { size: 20, strokeWidth: 2 }) })] }), _jsx("button", { className: "post-action-btn", onClick: onSave, "aria-label": "Save post", style: { color: post.isSaved ? 'var(--rose)' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(Bookmark, { size: 21, strokeWidth: 2, fill: post.isSaved ? 'var(--rose, #E8445A)' : 'none' }) })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }, children: [post.likedBy.length > 0 && (_jsx("div", { style: { display: 'flex' }, children: post.likedBy.slice(0, 3).map((l, i) => (_jsx("img", { src: l.photo, alt: l.name, style: { width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg-card)', marginLeft: i ? -8 : 0 } }, i))) })), _jsx("div", { style: { fontSize: 13, color: 'var(--text-1)' }, children: post.likedBy.length > 0 ? (_jsxs(_Fragment, { children: ["Liked by ", _jsx("b", { children: post.likedBy[0].name }), " and ", _jsxs("b", { children: [(post.likes - 1).toLocaleString(), " others"] })] })) : (_jsxs("b", { children: [post.likes.toLocaleString(), " likes"] })) })] }), _jsxs("div", { style: { fontSize: 14, color: 'var(--text-2)', marginBottom: 6, lineHeight: 1.5 }, children: [_jsx("span", { style: { fontWeight: 700, color: 'var(--text-1)', marginRight: 6 }, children: post.user }), post.caption] }), _jsx("div", { style: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }, children: post.tags.map(t => (_jsxs("span", { style: { fontSize: 12, color: 'var(--rose)', fontWeight: 600 }, children: ["#", t] }, t))) }), post.comments.length > 0 && !expanded && (_jsxs("button", { onClick: onToggleExpand, style: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-3)', fontSize: 13, marginBottom: 4 }, children: ["View all ", post.comments.length, " comment", post.comments.length !== 1 ? 's' : ''] })), expanded && (_jsx("div", { style: { marginBottom: 8 }, children: post.comments.map((c, i) => {
                            const key = `${post.id}-${i}`;
                            const liked = likedComments.has(key);
                            return (_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }, children: [_jsxs("div", { style: { flex: 1, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }, children: [_jsx("span", { style: { fontWeight: 700, color: 'var(--text-1)', marginRight: 6 }, children: c.user }), c.text] }), _jsxs("button", { onClick: () => onCommentLike(key), style: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: 0, flexShrink: 0 }, "aria-label": "Like comment", children: [_jsx(Heart, { size: 13, strokeWidth: 2, fill: liked ? '#E8445A' : 'none', color: liked ? '#E8445A' : 'var(--text-3)' }), _jsx("span", { style: { fontSize: 10, color: 'var(--text-3)' }, children: c.likes + (liked ? 1 : 0) || '' })] })] }, i));
                        }) })), _jsxs("div", { style: { fontSize: 11, color: 'var(--text-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }, children: [post.time, " ago"] }), _jsx("div", { className: "divider", style: { margin: '0 -14px 10px' } }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10 }, children: [_jsx("img", { src: "/p2.png", alt: "You", style: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 } }), _jsx("input", { className: "inp", placeholder: "Add a comment\u2026", value: commentInput, onChange: e => onCommentChange(e.target.value), onKeyDown: e => e.key === 'Enter' && onCommentSubmit(), style: { borderRadius: 50, padding: '8px 14px', fontSize: 13 } }), commentInput.trim() && (_jsx("button", { className: "btn-rose", onClick: onCommentSubmit, style: { padding: '8px 14px', fontSize: 13, flexShrink: 0 }, children: "Post" }))] })] })] }));
};
/* ─── Share sheet ────────────────────────────────────────────────── */
const ShareSheet = ({ post, onClose, onAction }) => {
    const people = STORIES.filter(s => !s.isMe);
    return (_jsx("div", { onClick: onClose, style: { position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }, children: _jsxs("div", { onClick: e => e.stopPropagation(), style: { width: '100%', background: 'var(--bg-card)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '18px 16px 24px', animation: 'slideUp 0.25s ease', borderTop: '1px solid var(--border-light)' }, children: [_jsx("div", { style: { width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 16px' } }), _jsx("div", { style: { fontSize: 15, fontWeight: 800, marginBottom: 14 }, children: "Share this post" }), _jsx("div", { style: { display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }, children: people.map(p => (_jsxs("div", { onClick: () => onAction(`Sent to ${p.name} ✓`), style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }, children: [_jsx("img", { src: p.photo, alt: p.name, style: { width: 54, height: 54, borderRadius: '50%', objectFit: 'cover' } }), _jsx("span", { style: { fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }, children: p.name })] }, p.id))) }), _jsx("div", { className: "divider", style: { margin: '4px 0 12px' } }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 4 }, children: [
                        { icon: _jsx(Link2, { size: 18 }), label: 'Copy link', msg: 'Link copied ✓' },
                        { icon: _jsx(Plus, { size: 18 }), label: 'Share to your story', msg: 'Added to your story ✓' },
                        { icon: _jsx(Send, { size: 18 }), label: 'Share externally', msg: 'Opening share…' },
                    ].map(o => (_jsxs("button", { onClick: () => onAction(o.msg), className: "menu-item-btn", style: { justifyContent: 'flex-start' }, children: [o.icon, " ", o.label] }, o.label))) })] }) }));
};
/* ─── Story Viewer ───────────────────────────────────────────────── */
const StoryViewer = ({ story, onClose }) => (_jsxs("div", { style: { position: 'absolute', inset: 0, background: 'black', zIndex: 100, display: 'flex', flexDirection: 'column', animation: 'scaleIn 0.25s ease' }, onClick: onClose, children: [_jsx("div", { style: { height: 3, background: 'rgba(255,255,255,0.2)', margin: '12px 12px 0', borderRadius: 2, overflow: 'hidden' }, children: _jsx("div", { style: { height: '100%', width: '60%', background: 'white', borderRadius: 2, animation: 'shimmer 3s linear' } }) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }, children: [_jsx("img", { src: story.photo, alt: story.name, style: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' } }), _jsx("span", { style: { fontWeight: 700, fontSize: 14, color: 'white' }, children: story.name }), _jsx("span", { style: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginLeft: 4 }, children: "2h ago" }), _jsx("button", { onClick: onClose, style: { marginLeft: 'auto', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }, "aria-label": "Close story", children: _jsx(X, { size: 22, strokeWidth: 2 }) })] }), _jsx("div", { style: { flex: 1, overflow: 'hidden' }, children: _jsx("img", { src: story.photo, alt: "", style: { width: '100%', height: '100%', objectFit: 'cover' } }) }), _jsxs("div", { style: { padding: '14px', display: 'flex', gap: 10, alignItems: 'center' }, onClick: e => e.stopPropagation(), children: [_jsx("input", { className: "inp", placeholder: `Reply to ${story.name}…`, style: { borderRadius: 50, border: '1px solid rgba(255,255,255,0.3)' } }), _jsx("button", { style: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }, "aria-label": "Like story", children: _jsx(Heart, { size: 22, strokeWidth: 2 }) })] })] }));
//# sourceMappingURL=FeedPage.js.map