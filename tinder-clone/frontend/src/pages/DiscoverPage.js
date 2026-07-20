import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
export const DiscoverPage = ({ user, onOpenChat }) => {
    const [profiles, setProfiles] = useState([]);
    const [showMatch, setShowMatch] = useState(null);
    const [photoIndex, setPhotoIndex] = useState({});
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ minAge: 18, maxAge: 45, maxDist: 20 });
    const [likedCount, setLikedCount] = useState(0);
    const history = useRef([]);
    const myPhoto = user?.avatarUrl ? api.fileUrl(user.avatarUrl) : '/p2.png';
    const loadProfiles = (initial = false) => {
        if (initial)
            setLoading(true);
        api.getDiscover()
            .then(({ profiles: p }) => {
            setProfiles(prev => {
                const existing = new Set(prev.map(x => x.id));
                const fresh = (p || []).filter((x) => !existing.has(x.id));
                return [...prev, ...fresh];
            });
        })
            .catch(() => { })
            .finally(() => setLoading(false));
    };
    useEffect(() => { loadProfiles(true); }, []);
    const handleSwipe = async (direction, profileId) => {
        const profile = profiles.find(p => p.id === profileId);
        if (profile)
            history.current.push(profile);
        if (direction !== 'left')
            setLikedCount(c => c + 1);
        setProfiles(prev => prev.filter(p => p.id !== profileId));
        try {
            const res = await api.swipe(profileId, direction);
            if (res.match)
                setShowMatch({ ...res.partner, matchId: res.matchId });
        }
        catch { /* ignore */ }
    };
    const handleRewind = async () => {
        try {
            const { profile } = await api.rewind();
            if (profile) {
                setProfiles(prev => [profile, ...prev.filter(p => p.id !== profile.id)]);
                history.current = history.current.filter(p => p.id !== profile.id);
            }
        }
        catch { /* ignore */ }
    };
    // Auto-fetch more when the stack runs low
    useEffect(() => {
        if (!loading && profiles.length < 3)
            loadProfiles();
    }, [profiles.length, loading]);
    const visible = profiles.filter(p => {
        const dist = parseInt(p.distance) || 0;
        return p.age >= filters.minAge && p.age <= filters.maxAge && dist <= filters.maxDist;
    });
    const topProfile = visible[0];
    const nextProfile = visible[1];
    return (_jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }, children: [_jsxs("div", { style: {
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px 8px', flexShrink: 0,
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [_jsx("div", { style: {
                                    width: 36, height: 36, borderRadius: 12,
                                    background: 'linear-gradient(135deg, #FF4458, #FF6B35)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 18,
                                }, children: "\uD83D\uDD25" }), _jsx("span", { style: { fontWeight: 900, fontSize: 22, letterSpacing: -0.5, color: 'white' }, children: "Spark" })] }), _jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'center' }, children: [_jsx("button", { className: "btn-glass", onClick: () => setShowFilters(true), style: { padding: '8px 14px', fontSize: 13 }, children: "\uD83C\uDFAF Filters" }), _jsxs("div", { style: {
                                    position: 'relative', width: 36, height: 36, borderRadius: 12,
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                                    cursor: 'pointer',
                                }, title: "Likes sent", children: ["\u26A1", likedCount > 0 && (_jsx("div", { style: { position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9, background: 'linear-gradient(135deg, #FF4458, #FF6B35)', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: likedCount }))] })] })] }), _jsx("div", { style: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px' }, children: loading ? (_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 40, marginBottom: 12, animation: 'float 2s ease-in-out infinite' }, children: "\uD83D\uDD25" }), _jsx("p", { style: { color: 'rgba(255,255,255,0.5)', fontSize: 14 }, children: "Finding people near you\u2026" })] })) : visible.length === 0 ? (_jsxs("div", { style: { textAlign: 'center', animation: 'fadeIn 0.5s ease' }, children: [_jsx("div", { style: { fontSize: 64, marginBottom: 16 }, children: "\uD83D\uDE34" }), _jsx("h3", { style: { color: 'white', fontSize: 22, fontWeight: 800, marginBottom: 8 }, children: "You've seen everyone!" }), _jsx("p", { style: { color: 'rgba(255,255,255,0.4)', fontSize: 14 }, children: profiles.length > 0 ? 'Try widening your filters' : 'Check back later for new people nearby' }), _jsx("button", { className: "btn-flame", style: { padding: '14px 32px', marginTop: 24, fontSize: 15 }, onClick: () => { profiles.length > 0 ? setFilters({ minAge: 18, maxAge: 45, maxDist: 20 }) : loadProfiles(true); }, children: profiles.length > 0 ? '🎯 Reset filters' : '🔄 Refresh' })] })) : (_jsxs(_Fragment, { children: [nextProfile && (_jsxs("div", { style: {
                                position: 'absolute', inset: 8,
                                transform: 'scale(0.93) translateY(10px)',
                                borderRadius: 24, overflow: 'hidden',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                            }, children: [_jsx("img", { src: api.fileUrl(nextProfile.photos[0]), alt: "", style: { width: '100%', height: '100%', objectFit: 'cover' } }), _jsx("div", { style: {
                                        position: 'absolute', inset: 0,
                                        background: 'rgba(15,15,19,0.5)',
                                    } })] })), topProfile && (_jsx(SwipeCardAnimated, { profile: topProfile, photoIdx: photoIndex[topProfile.id] || 0, onPhotoChange: (idx) => setPhotoIndex(p => ({ ...p, [topProfile.id]: idx })), onSwipe: (dir) => handleSwipe(dir, topProfile.id) }, topProfile.id))] })) }), !loading && visible.length > 0 && (_jsxs("div", { style: {
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 16, padding: '12px 0 16px', flexShrink: 0,
                }, children: [_jsx("button", { className: "action-btn", style: {
                            width: 50, height: 50, background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)', color: '#FFB800', fontSize: 20,
                        }, title: "Rewind last swipe", onClick: handleRewind, children: "\u21BA" }), _jsx("button", { className: "action-btn action-btn-nope", title: "Nope", onClick: () => topProfile && handleSwipe('left', topProfile.id), children: "\u2715" }), _jsx("button", { className: "action-btn action-btn-like", title: "Like", style: { width: 70, height: 70, fontSize: 30 }, onClick: () => topProfile && handleSwipe('right', topProfile.id), children: "\u2665" }), _jsx("button", { className: "action-btn action-btn-super", title: "Super Like", onClick: () => topProfile && handleSwipe('up', topProfile.id), children: "\u2605" }), _jsx("button", { className: "action-btn action-btn-boost", title: "Boost", onClick: () => { }, children: "\u26A1" })] })), _jsx(AnimatePresence, { children: showFilters && (_jsx(FiltersPanel, { filters: filters, onChange: setFilters, onClose: () => setShowFilters(false) })) }), _jsx(AnimatePresence, { children: showMatch && (_jsx(MatchModal, { partner: showMatch, myPhoto: myPhoto, onClose: () => setShowMatch(null), onMessage: () => {
                        const m = showMatch;
                        setShowMatch(null);
                        onOpenChat?.({
                            id: m.matchId,
                            user: { id: m.id, name: m.name, photo: m.photo },
                            lastMessage: null,
                            unread: 0,
                            updatedAt: new Date().toISOString(),
                        });
                    } })) })] }));
};
/* ─── Filters Panel ────────────────────────────── */
const FiltersPanel = ({ filters, onChange, onClose }) => (_jsx(motion.div, { className: "match-overlay", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose, style: { alignItems: 'flex-end' }, children: _jsxs(motion.div, { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: { type: 'spring', stiffness: 300, damping: 32 }, onClick: e => e.stopPropagation(), style: { width: '100%', background: 'rgba(26,26,36,0.98)', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '20px 22px 30px', border: '1px solid rgba(255,255,255,0.1)' }, children: [_jsx("div", { style: { width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 18px' } }), _jsx("h3", { style: { color: 'white', fontSize: 19, fontWeight: 800, margin: '0 0 20px' }, children: "Discovery filters" }), _jsxs("div", { style: { marginBottom: 22 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 10 }, children: [_jsx("span", { children: "Age range" }), _jsxs("span", { style: { color: '#FF6B35' }, children: [filters.minAge, "\u2013", filters.maxAge] })] }), _jsx("input", { type: "range", min: 18, max: 60, value: filters.minAge, onChange: e => onChange({ ...filters, minAge: Math.min(+e.target.value, filters.maxAge) }), style: { width: '100%', accentColor: '#FF4458' } }), _jsx("input", { type: "range", min: 18, max: 60, value: filters.maxAge, onChange: e => onChange({ ...filters, maxAge: Math.max(+e.target.value, filters.minAge) }), style: { width: '100%', accentColor: '#FF4458' } })] }), _jsxs("div", { style: { marginBottom: 26 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 10 }, children: [_jsx("span", { children: "Maximum distance" }), _jsxs("span", { style: { color: '#FF6B35' }, children: [filters.maxDist, " km"] })] }), _jsx("input", { type: "range", min: 1, max: 50, value: filters.maxDist, onChange: e => onChange({ ...filters, maxDist: +e.target.value }), style: { width: '100%', accentColor: '#FF4458' } })] }), _jsx("button", { className: "btn-flame", style: { width: '100%', padding: '14px 0', fontSize: 15 }, onClick: onClose, children: "Show results" })] }) }));
const SwipeCardAnimated = ({ profile, photoIdx, onPhotoChange, onSwipe }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-250, 250], [-18, 18]);
    const likeOpacity = useTransform(x, [20, 120], [0, 1]);
    const nopeOpacity = useTransform(x, [-120, -20], [1, 0]);
    const superOpacity = useTransform(y, [-120, -20], [1, 0]);
    const handleDragEnd = (_, info) => {
        const threshold = 100;
        if (info.offset.x > threshold)
            onSwipe('right');
        else if (info.offset.x < -threshold)
            onSwipe('left');
        else if (info.offset.y < -threshold)
            onSwipe('up');
    };
    const tapLeft = (e) => {
        e.stopPropagation();
        if (photoIdx > 0)
            onPhotoChange(photoIdx - 1);
    };
    const tapRight = (e) => {
        e.stopPropagation();
        if (photoIdx < profile.photos.length - 1)
            onPhotoChange(photoIdx + 1);
    };
    return (_jsx(motion.div, { className: "swipe-card", style: { x, y, rotate, position: 'absolute', inset: 8 }, drag: true, dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 }, dragElastic: 0.9, onDragEnd: handleDragEnd, initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { opacity: 0 }, transition: { type: 'spring', stiffness: 300, damping: 25 }, children: _jsxs("div", { style: { position: 'relative', width: '100%', height: '100%' }, children: [_jsx("img", { src: api.fileUrl(profile.photos[photoIdx]), alt: profile.name, style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }, draggable: false }), _jsxs("div", { style: { position: 'absolute', inset: 0, display: 'flex', zIndex: 5 }, children: [_jsx("div", { style: { flex: 1 }, onClick: tapLeft }), _jsx("div", { style: { flex: 1 }, onClick: tapRight })] }), profile.photos.length > 1 && (_jsx("div", { style: {
                        position: 'absolute', top: 12, left: 0, right: 0,
                        display: 'flex', justifyContent: 'center', gap: 4, zIndex: 6,
                    }, children: profile.photos.map((_, i) => (_jsx("div", { style: {
                            height: 3, borderRadius: 2,
                            width: i === photoIdx ? 20 : 8,
                            background: i === photoIdx ? 'white' : 'rgba(255,255,255,0.4)',
                            transition: 'all 0.2s',
                        } }, i))) })), _jsx(motion.div, { style: { opacity: likeOpacity, position: 'absolute', top: 40, left: 24, zIndex: 7 }, children: _jsx("div", { style: {
                            border: '3px solid #4ade80', color: '#4ade80', borderRadius: 8,
                            padding: '6px 16px', fontSize: 24, fontWeight: 900, letterSpacing: 3,
                            transform: 'rotate(-20deg)',
                        }, children: "LIKE" }) }), _jsx(motion.div, { style: { opacity: nopeOpacity, position: 'absolute', top: 40, right: 24, zIndex: 7 }, children: _jsx("div", { style: {
                            border: '3px solid #f87171', color: '#f87171', borderRadius: 8,
                            padding: '6px 16px', fontSize: 24, fontWeight: 900, letterSpacing: 3,
                            transform: 'rotate(20deg)',
                        }, children: "NOPE" }) }), _jsx(motion.div, { style: { opacity: superOpacity, position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', zIndex: 7 }, children: _jsx("div", { style: {
                            border: '3px solid #06B6D4', color: '#06B6D4', borderRadius: 8,
                            padding: '6px 20px', fontSize: 22, fontWeight: 900, letterSpacing: 3,
                        }, children: "SUPER \u2605" }) }), _jsxs("div", { className: "profile-gradient", style: {
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        padding: '80px 20px 20px', zIndex: 6,
                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }, children: [_jsxs("div", { children: [_jsxs("h2", { style: { margin: 0, fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: -0.5 }, children: [profile.name, ", ", profile.age] }), _jsxs("p", { style: { margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }, children: ["\uD83D\uDCCD ", profile.distance, " \u00B7 ", profile.job] })] }), _jsx("button", { style: {
                                        width: 42, height: 42, borderRadius: 21, border: 'none',
                                        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                                        color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                    }, children: "\u2139\uFE0F" })] }), _jsx("p", { style: { margin: '0 0 12px', fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }, children: profile.bio }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6 }, children: profile.interests.map(tag => (_jsx("span", { style: {
                                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'white', fontSize: 12, fontWeight: 600,
                                    padding: '4px 10px', borderRadius: 20,
                                }, children: tag }, tag))) })] })] }) }));
};
/* ─── Match Modal ──────────────────────────────── */
const MatchModal = ({ partner, myPhoto, onClose, onMessage }) => (_jsx(motion.div, { className: "match-overlay", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose, children: _jsxs(motion.div, { initial: { scale: 0, rotate: -10 }, animate: { scale: 1, rotate: 0 }, exit: { scale: 0, opacity: 0 }, transition: { type: 'spring', stiffness: 260, damping: 18 }, onClick: e => e.stopPropagation(), style: {
            background: 'rgba(26,26,36,0.95)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 32, padding: '40px 28px', textAlign: 'center', maxWidth: 340, width: '90%',
            backdropFilter: 'blur(20px)',
        }, children: [_jsx("div", { style: { fontSize: 36, marginBottom: 8 }, children: "\u2728\uD83C\uDF89\u2728" }), _jsx("h2", { style: {
                    fontSize: 34, fontWeight: 900, margin: '0 0 4px',
                    background: 'linear-gradient(135deg, #FF4458, #FF6B35)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }, children: "It's a Match!" }), _jsxs("p", { style: { color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 28px' }, children: ["You and ", partner.name, " liked each other"] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'center', gap: -16, marginBottom: 28, position: 'relative' }, children: [_jsx("img", { src: myPhoto, alt: "You", style: {
                            width: 90, height: 90, borderRadius: '50%', objectFit: 'cover',
                            border: '3px solid #FF4458', boxShadow: '0 4px 20px rgba(255,68,88,0.4)',
                            position: 'relative', zIndex: 1,
                        } }), _jsx("div", { style: {
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FF4458, #FF6B35)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, alignSelf: 'center',
                            boxShadow: '0 4px 16px rgba(255,68,88,0.5)',
                            position: 'relative', zIndex: 2, margin: '0 -4px',
                        }, children: "\u2665" }), _jsx("img", { src: api.fileUrl(partner.photo), alt: partner.name, style: {
                            width: 90, height: 90, borderRadius: '50%', objectFit: 'cover',
                            border: '3px solid #FF4458', boxShadow: '0 4px 20px rgba(255,68,88,0.4)',
                            position: 'relative', zIndex: 1,
                        } })] }), _jsx("button", { className: "btn-flame", onClick: onMessage, style: { width: '100%', padding: '15px 0', fontSize: 16, marginBottom: 12 }, children: "\uD83D\uDCAC Send a Message" }), _jsx("button", { className: "btn-glass", style: { width: '100%', padding: '14px 0', fontSize: 15 }, onClick: onClose, children: "Keep Swiping" })] }) }));
//# sourceMappingURL=DiscoverPage.js.map