import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Camera, MoreVertical, Lock, Shield, UserCog, Activity, Ban, Bell, LogOut, Share2, Pin, Pencil, X, Crown, Sparkles, Settings, ChevronRight, ArrowLeft, Globe, Moon, KeyRound, Smartphone, Heart, MessageCircle, Eye, HelpCircle, FileText, Trash2, Star } from 'lucide-react';
import { api } from '../services/api';
const HIGHLIGHTS = [
    { label: 'Travel', emoji: '✈️' },
    { label: 'Coffee', emoji: '☕' },
    { label: 'Art', emoji: '🎨' },
    { label: 'Add', emoji: '+', isAdd: true },
];
// Suggested interests users can toggle onto their profile
const INTEREST_CATALOG = [
    '✈️ Travel', '☕ Coffee', '🎵 Music', '🎨 Art', '🏋️ Gym', '📚 Books',
    '🍳 Cooking', '🎮 Gaming', '📸 Photography', '🐶 Dogs', '🐱 Cats', '🌱 Plants',
    '🏔️ Hiking', '🎬 Movies', '🍷 Wine', '☕ Brunch', '🏄 Surfing', '🧘 Yoga',
    '⚽ Football', '🎧 Podcasts', '✍️ Writing', '💃 Dancing', '🍕 Foodie', '🌍 Languages',
];
// ---- Helpers -----------------------------------------------------------
/** Builds a 14-week (98 day) activity grid, most recent day last, from post timestamps. */
function buildHeatmap(posts) {
    const DAYS = 98; // 14 weeks — reads well without overwhelming the profile
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const counts = new Map();
    posts.forEach(p => {
        if (!p.createdAt)
            return;
        const d = new Date(p.createdAt);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);
        counts.set(key, (counts.get(key) || 0) + 1);
    });
    const cells = [];
    for (let i = DAYS - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        cells.push({ key, count: counts.get(key) || 0, date: d });
    }
    // Group into weeks (columns), Sunday-start
    const weeks = [];
    let currentWeek = [];
    cells.forEach((cell, idx) => {
        currentWeek.push(cell);
        if (cell.date.getDay() === 6 || idx === cells.length - 1) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });
    const max = Math.max(1, ...cells.map(c => c.count));
    return { weeks, max };
}
function heatColor(count, max) {
    if (count === 0)
        return 'rgba(255,255,255,0.06)';
    const t = Math.min(1, count / max);
    // Interpolate toward the app's rose accent as intensity rises
    const alpha = 0.25 + t * 0.75;
    return `rgba(232, 68, 90, ${alpha.toFixed(2)})`;
}
// ---- Settings UI primitives ---------------------------------------------
/** iOS-style toggle switch. */
const Toggle = ({ on, onClick }) => (_jsx("button", { onClick: onClick, style: {
        width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: on ? 'linear-gradient(135deg, #E8445A, #F97F68)' : 'rgba(255,255,255,0.15)',
        position: 'relative', transition: 'background 0.2s', padding: 0,
    }, role: "switch", "aria-checked": on, children: _jsx("span", { style: {
            position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%',
            background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        } }) }));
/** A single settings row: icon + label (+ optional subtitle) with a right-side control. */
const Row = ({ icon, label, sub, right, onClick, danger }) => (_jsxs("button", { onClick: onClick, disabled: !onClick, style: {
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
        padding: '13px 14px', background: 'none', border: 'none',
        cursor: onClick ? 'pointer' : 'default', fontFamily: 'Inter, sans-serif',
        color: danger ? 'var(--rose)' : 'var(--text-1)',
    }, children: [icon && _jsx("span", { style: { color: danger ? 'var(--rose)' : 'var(--text-2)', display: 'flex', flexShrink: 0 }, children: icon }), _jsxs("span", { style: { flex: 1, minWidth: 0 }, children: [_jsx("span", { style: { display: 'block', fontSize: 14.5, fontWeight: 600 }, children: label }), sub && _jsx("span", { style: { display: 'block', fontSize: 12, color: 'var(--text-3)', marginTop: 2 }, children: sub })] }), right] }));
/** Slide-in full-height settings panel with a header + back button. */
const PanelShell = ({ title, onBack, children }) => (_jsxs("div", { style: {
        position: 'absolute', inset: 0, zIndex: 150, background: 'var(--bg)',
        display: 'flex', flexDirection: 'column', animation: 'slideRight 0.22s ease',
    }, children: [_jsxs("div", { className: "top-bar", style: { flexShrink: 0 }, children: [_jsx("button", { className: "icon-btn", onClick: onBack, style: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }, "aria-label": "Back", children: _jsx(ArrowLeft, { size: 20, strokeWidth: 2 }) }), _jsx("span", { style: { fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }, children: title }), _jsx("span", { style: { width: 36 } })] }), _jsx("div", { style: { flex: 1, overflowY: 'auto', padding: '8px 12px 40px' }, children: children })] }));
/** A grouped card that wraps a set of rows with dividers. */
const Group = ({ title, children }) => (_jsxs("div", { style: { marginBottom: 18 }, children: [title && _jsx("div", { style: { fontSize: 11.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: 0.4, margin: '4px 6px 8px' }, children: title.toUpperCase() }), _jsx("div", { style: { background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 16, overflow: 'hidden' }, children: children })] }));
// ---- Avatar customizer --------------------------------------------------
const PRESETS = ['/p1.png', '/p2.png', '/p3.png', '/p4.png'];
const BOX = 260; // preview size
/** Pick a photo (upload or preset), zoom & reposition it in a circular crop, then save. */
const AvatarEditor = ({ currentUrl, onSave, onRemove, onClose }) => {
    const [src, setSrc] = useState(null);
    const [dims, setDims] = useState({ w: 0, h: 0 });
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const drag = useRef(null);
    const imgRef = useRef(null);
    const fileRef = useRef(null);
    // Load natural dimensions whenever a source is chosen
    useEffect(() => {
        if (!src)
            return;
        const im = new Image();
        im.onload = () => { setDims({ w: im.naturalWidth, h: im.naturalHeight }); setZoom(1); setPan({ x: 0, y: 0 }); };
        im.src = src;
    }, [src]);
    const cover = dims.w && dims.h ? Math.max(BOX / dims.w, BOX / dims.h) : 1;
    const dispW = dims.w * cover * zoom;
    const dispH = dims.h * cover * zoom;
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
    const left = clamp((BOX - dispW) / 2 + pan.x, BOX - dispW, 0);
    const top = clamp((BOX - dispH) / 2 + pan.y, BOX - dispH, 0);
    const onPointerDown = (e) => {
        e.target.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    };
    const onPointerMove = (e) => {
        if (!drag.current)
            return;
        setPan({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) });
    };
    const onPointerUp = () => { drag.current = null; };
    const pickFile = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => setSrc(reader.result);
        reader.readAsDataURL(file);
        e.target.value = '';
    };
    const save = () => {
        const img = imgRef.current;
        if (!img)
            return;
        const O = 512, k = O / BOX;
        const canvas = document.createElement('canvas');
        canvas.width = O;
        canvas.height = O;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, O, O);
        ctx.beginPath();
        ctx.arc(O / 2, O / 2, O / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, left * k, top * k, dispW * k, dispH * k);
        try {
            onSave(canvas.toDataURL('image/jpeg', 0.9));
        }
        catch {
            onSave(src);
        } // fallback if canvas is tainted
    };
    return (_jsx("div", { onClick: onClose, style: { position: 'fixed', inset: 0, zIndex: 210, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }, children: _jsxs("div", { onClick: e => e.stopPropagation(), className: "animate-scale-in", style: { width: '100%', maxWidth: 340, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 24, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }, children: [_jsx("span", { style: { fontWeight: 800, fontSize: 18 }, children: src ? 'Adjust photo' : 'Profile photo' }), _jsx("button", { onClick: onClose, className: "icon-btn", style: { width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }, "aria-label": "Close", children: _jsx(X, { size: 18 }) })] }), _jsx("input", { ref: fileRef, type: "file", accept: "image/*", style: { display: 'none' }, onChange: pickFile }), src ? (_jsxs(_Fragment, { children: [_jsx("div", { onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onPointerLeave: onPointerUp, style: { width: BOX, height: BOX, margin: '0 auto', borderRadius: '50%', overflow: 'hidden', position: 'relative', cursor: 'grab', touchAction: 'none', background: '#000', boxShadow: '0 0 0 3px var(--rose)' }, children: _jsx("img", { ref: imgRef, src: src, alt: "", draggable: false, style: { position: 'absolute', left, top, width: dispW, height: dispH, maxWidth: 'none', userSelect: 'none', pointerEvents: 'none' } }) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 4px' }, children: [_jsx("span", { style: { fontSize: 16 }, children: "\uD83D\uDD0D" }), _jsx("input", { type: "range", min: 1, max: 3, step: 0.01, value: zoom, onChange: e => setZoom(+e.target.value), style: { flex: 1, accentColor: '#E8445A' } })] }), _jsx("div", { style: { textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }, children: "Drag to reposition \u00B7 slide to zoom" }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { onClick: () => setSrc(null), style: { flex: 1, padding: '12px 0', borderRadius: 12, border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }, children: "Back" }), _jsx("button", { onClick: save, className: "btn-rose", style: { flex: 1, padding: '12px 0', fontSize: 14 }, children: "Save photo" })] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { style: { display: 'flex', justifyContent: 'center', marginBottom: 18 }, children: _jsx("div", { className: "story-ring", children: _jsx("div", { className: "story-inner", children: _jsx("img", { src: currentUrl || '/p2.png', alt: "Current", style: { width: 90, height: 90, objectFit: 'cover', display: 'block' } }) }) }) }), _jsx("button", { onClick: () => fileRef.current?.click(), className: "btn-rose", style: { width: '100%', padding: '13px 0', fontSize: 15, marginBottom: 14 }, children: "\uD83D\uDCF7 Upload a photo" }), _jsx("div", { style: { fontSize: 12, color: 'var(--text-3)', fontWeight: 700, letterSpacing: 0.3, marginBottom: 10 }, children: "OR PICK ONE" }), _jsx("div", { style: { display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 18 }, children: PRESETS.map(p => (_jsx("div", { onClick: () => setSrc(p), style: { cursor: 'pointer', borderRadius: '50%', overflow: 'hidden', width: 56, height: 56, border: '2px solid var(--border)' }, children: _jsx("img", { src: p, alt: "", style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }) }, p))) }), currentUrl && (_jsxs("button", { onClick: onRemove, style: { width: '100%', padding: '11px 0', borderRadius: 12, border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--rose)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Inter, sans-serif' }, children: [_jsx(Trash2, { size: 16 }), " Remove current photo"] }))] }))] }) }));
};
// ---- Component ----------------------------------------------------------
export const ProfilePage = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('posts');
    const [posts, setPosts] = useState([]);
    const [currentlyText, setCurrentlyText] = useState(() => user?.currentStatus || '');
    const [editingStatus, setEditingStatus] = useState(false);
    const [statusDraft, setStatusDraft] = useState('');
    // Editable profile identity (persisted to the real User record)
    const [profileName, setProfileName] = useState(user?.name || '');
    const [profileBio, setProfileBio] = useState(user?.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
    const [showAvatarEditor, setShowAvatarEditor] = useState(false);
    const saveAvatar = async (dataUrl) => {
        const prev = avatarUrl;
        setAvatarUrl(dataUrl); // optimistic
        setShowAvatarEditor(false);
        try {
            const { avatarUrl: saved } = await api.uploadAvatar(dataUrl);
            setAvatarUrl(saved);
        }
        catch {
            setAvatarUrl(prev);
        }
    };
    const removeAvatar = async () => {
        const prev = avatarUrl;
        setAvatarUrl('');
        setShowAvatarEditor(false);
        try {
            await api.removeAvatar();
        }
        catch {
            setAvatarUrl(prev);
        }
    };
    const [editingProfile, setEditingProfile] = useState(false);
    const [nameDraft, setNameDraft] = useState('');
    const [bioDraft, setBioDraft] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const openEditProfile = () => {
        setNameDraft(profileName);
        setBioDraft(profileBio);
        setEditingProfile(true);
    };
    const saveProfile = async () => {
        const name = nameDraft.trim();
        if (!name)
            return;
        setSavingProfile(true);
        try {
            const { user: updated } = await api.updateProfile({ name, bio: bioDraft });
            setProfileName(updated.name);
            setProfileBio(updated.bio || '');
            setEditingProfile(false);
        }
        catch {
            // keep the editor open on failure
        }
        finally {
            setSavingProfile(false);
        }
    };
    const [pinnedPostId, setPinnedPostId] = useState(user?.pinnedPostId || null);
    const [pickingPin, setPickingPin] = useState(false);
    // Private stories — a premium feature; only visible to you, gated behind the lock badge
    const [privateStories, setPrivateStories] = useState([]);
    const [viewerStory, setViewerStory] = useState(null);
    const [isPremium, setIsPremium] = useState(!!user?.isPremium);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [activePanel, setActivePanel] = useState(null);
    const openPanel = (p) => setActivePanel(p);
    const [privacy, setPrivacy] = useState({
        privateAccount: false, activityStatus: true, readReceipts: true,
        messageRequests: true, hideFromSearch: false, showDistance: true,
    });
    const [security, setSecurity] = useState({ twoFactor: false, loginAlerts: true, biometric: true });
    const [notifs, setNotifs] = useState({
        likes: true, matches: true, messages: true, superLikes: true, promos: false, email: false,
    });
    const [prefs, setPrefs] = useState({ dataSaver: false, showOnlineStatus: true, units: 'mi' });
    const [blocked, setBlocked] = useState([
        { id: 'b1', name: 'Jordan Blake', handle: '@jordan.b' },
        { id: 'b2', name: 'Sam Rivera', handle: '@samr' },
    ]);
    const flip = (setter, key) => () => setter(prev => ({ ...prev, [key]: !prev[key] }));
    const unblock = (id) => setBlocked(prev => prev.filter(b => b.id !== id));
    // Recent-activity feed synthesised from posts so it reflects real data where available
    const activityFeed = useMemo(() => {
        const fromPosts = posts.slice(0, 4).map((p, i) => ({
            id: `p${i}`, icon: '📸', text: `You shared a new post`, when: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recently',
        }));
        return [
            { id: 'a1', icon: '❤️', text: 'You liked 3 profiles', when: 'Today' },
            { id: 'a2', icon: '✨', text: 'You got a new match', when: 'Yesterday' },
            ...fromPosts,
            { id: 'a3', icon: '🔐', text: 'New login from iPhone · New York', when: '2 days ago' },
        ];
    }, [posts]);
    const storyInputRef = useRef(null);
    const handleStoryTileClick = () => {
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }
        storyInputRef.current?.click();
    };
    const handleUnlockPremium = () => {
        setIsPremium(true);
        setShowPremiumModal(false);
        api.updateUser?.(user?.id, { isPremium: true }).catch?.(() => { });
        // Open the picker right away so the unlock flows straight into adding a story
        setTimeout(() => storyInputRef.current?.click(), 150);
    };
    const handleAddStory = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = reader.result;
            // Optimistic add so the ring appears instantly, then reconcile with the saved record
            const tempId = `tmp_${Date.now()}`;
            setPrivateStories(prev => [...prev, { id: tempId, url: dataUrl }]);
            try {
                const { story } = await api.uploadStory(dataUrl);
                setPrivateStories(prev => prev.map(s => (s.id === tempId ? story : s)));
            }
            catch {
                // Upload failed — roll back the optimistic entry
                setPrivateStories(prev => prev.filter(s => s.id !== tempId));
            }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };
    const handleRemoveStory = (id) => {
        setPrivateStories(prev => prev.filter(s => s.id !== id));
        setViewerStory(null);
        if (!id.startsWith('tmp_'))
            api.deleteStory(id).catch(() => { });
    };
    // ---- Interests / Passions ---------------------------------------------
    const [interests, setInterests] = useState(user?.interests || ['✈️ Travel', '☕ Coffee', '🎵 Music']);
    const [addingInterest, setAddingInterest] = useState(false);
    const [customInterest, setCustomInterest] = useState('');
    const removeInterest = (label) => {
        setInterests(prev => {
            const next = prev.filter(i => i !== label);
            api.updateUser?.(user?.id, { interests: next }).catch?.(() => { });
            return next;
        });
    };
    const addInterest = (label) => {
        const clean = label.trim();
        if (!clean)
            return;
        setInterests(prev => {
            if (prev.includes(clean))
                return prev;
            const next = [...prev, clean];
            api.updateUser?.(user?.id, { interests: next }).catch?.(() => { });
            return next;
        });
    };
    useEffect(() => {
        if (user?.id) {
            api.getUserPosts(user.id)
                .then(data => setPosts(data.posts || []))
                .catch(console.error);
        }
    }, [user]);
    // ---- Real-time settings persistence -----------------------------------
    const hydrated = useRef(false);
    // Load saved settings once, hydrating every group from the backend.
    useEffect(() => {
        api.getMe?.()
            .then(({ user: me, settings }) => {
            if (me) {
                if (me.name)
                    setProfileName(me.name);
                if (typeof me.bio === 'string')
                    setProfileBio(me.bio);
                if (me.avatarUrl)
                    setAvatarUrl(me.avatarUrl);
            }
            if (settings && typeof settings === 'object') {
                if (settings.privacy)
                    setPrivacy(p => ({ ...p, ...settings.privacy }));
                if (settings.security)
                    setSecurity(s => ({ ...s, ...settings.security }));
                if (settings.notifs)
                    setNotifs(n => ({ ...n, ...settings.notifs }));
                if (settings.prefs)
                    setPrefs(pr => ({ ...pr, ...settings.prefs }));
                if (Array.isArray(settings.blocked))
                    setBlocked(settings.blocked);
                if (Array.isArray(settings.interests))
                    setInterests(settings.interests);
                if (typeof settings.isPremium === 'boolean')
                    setIsPremium(settings.isPremium);
                if (typeof settings.currentStatus === 'string')
                    setCurrentlyText(settings.currentStatus);
                if ('pinnedPostId' in settings)
                    setPinnedPostId(settings.pinnedPostId);
            }
        })
            .catch(() => { })
            .finally(() => { hydrated.current = true; });
        // Load persisted private stories
        api.getStories?.()
            .then(({ stories }) => { if (Array.isArray(stories))
            setPrivateStories(stories); })
            .catch(() => { });
    }, []);
    // Persist any change to the backend (debounced) — skips the initial hydrate.
    useEffect(() => {
        if (!hydrated.current)
            return;
        const t = setTimeout(() => {
            api.updateSettings?.({
                privacy, security, notifs, prefs, blocked, interests,
                isPremium, currentStatus: currentlyText, pinnedPostId,
            }).catch(() => { });
        }, 400);
        return () => clearTimeout(t);
    }, [privacy, security, notifs, prefs, blocked, interests, isPremium, currentlyText, pinnedPostId]);
    const handleShareProfile = () => {
        const shareUrl = `${window.location.origin}/profile/${user?.id}`;
        if (navigator.share) {
            navigator.share({
                title: `${user?.name}'s Profile`,
                text: `Check out ${user?.name}'s profile on Spark!`,
                url: shareUrl,
            }).catch(console.error);
        }
        else {
            navigator.clipboard.writeText(shareUrl);
            alert('Profile link copied to clipboard!');
        }
    };
    const handleSaveStatus = () => {
        const trimmed = statusDraft.trim();
        setCurrentlyText(trimmed);
        setEditingStatus(false);
        // Best-effort persist; ignore failure so UI never blocks on it
        api.updateUser?.(user?.id, { currentStatus: trimmed }).catch?.(() => { });
    };
    const handleTogglePin = (postId) => {
        const next = pinnedPostId === postId ? null : postId;
        setPinnedPostId(next);
        setPickingPin(false);
        api.updateUser?.(user?.id, { pinnedPostId: next }).catch?.(() => { });
    };
    const pinnedPost = useMemo(() => posts.find(p => (p.id || '') === pinnedPostId) || null, [posts, pinnedPostId]);
    const gridPosts = useMemo(() => posts.filter(p => (p.id || '') !== pinnedPostId), [posts, pinnedPostId]);
    const { weeks, max } = useMemo(() => buildHeatmap(posts), [posts]);
    return (_jsxs("div", { style: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }, children: [_jsxs("div", { className: "top-bar", style: { position: 'relative' }, children: [_jsx("span", { style: { fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }, children: profileName?.toLowerCase().replace(/\s+/g, '_') || 'your_profile' }), _jsxs("div", { style: { display: 'flex', gap: 10 }, children: [_jsx("button", { className: "icon-btn", onClick: handleShareProfile, style: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }, "aria-label": "Share profile", children: _jsx(Share2, { size: 20, strokeWidth: 2 }) }), _jsx("button", { className: "icon-btn", style: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }, "aria-label": "Create post", children: _jsx(Plus, { size: 20, strokeWidth: 2 }) }), _jsx("button", { className: "icon-btn", onClick: () => openPanel('menu'), style: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }, "aria-label": "Menu", children: _jsx(MoreVertical, { size: 20, strokeWidth: 2 }) })] })] }), _jsxs("div", { style: { padding: '20px 16px 0' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }, children: [_jsxs("div", { style: { position: 'relative' }, children: [_jsx("div", { className: "story-ring", style: { cursor: 'pointer' }, onClick: () => setShowAvatarEditor(true), children: _jsx("div", { className: "story-inner", children: _jsx("img", { src: avatarUrl ? api.fileUrl(avatarUrl) : '/p2.png', alt: "Profile", style: { width: 80, height: 80, objectFit: 'cover', display: 'block' } }) }) }), _jsx("div", { onClick: () => setShowAvatarEditor(true), style: {
                                            position: 'absolute', bottom: 0, right: 0,
                                            width: 26, height: 26, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #E8445A, #F97F68)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: '2px solid var(--bg)', color: 'white',
                                            cursor: 'pointer', boxShadow: 'var(--shadow-rose)',
                                        }, children: _jsx(Camera, { size: 14, strokeWidth: 2.5 }) })] }), _jsxs("div", { style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 14, overflowX: 'auto', paddingBottom: 2 }, children: [_jsx("input", { ref: storyInputRef, type: "file", accept: "image/*", style: { display: 'none' }, onChange: handleAddStory }), privateStories.map(story => (_jsxs("div", { onClick: () => setViewerStory(story), style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }, children: [_jsxs("div", { style: { position: 'relative' }, children: [_jsx("div", { className: "story-ring", children: _jsx("div", { className: "story-inner", children: _jsx("img", { src: api.fileUrl(story.url), alt: "Private story", style: { width: 60, height: 60, objectFit: 'cover', display: 'block' } }) }) }), _jsx("div", { style: {
                                                            position: 'absolute', bottom: -2, right: -2,
                                                            width: 20, height: 20, borderRadius: '50%',
                                                            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            border: '2px solid var(--bg)', color: 'white',
                                                        }, children: _jsx(Lock, { size: 10, strokeWidth: 2.5 }) })] }), _jsx("span", { style: { fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }, children: "Private" })] }, story.id))), _jsxs("div", { onClick: handleStoryTileClick, style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }, children: [_jsxs("div", { style: {
                                                    position: 'relative', width: 64, height: 64, borderRadius: '50%',
                                                    padding: 2.5, background: 'linear-gradient(135deg, #F7C948, #F0932B)',
                                                    boxShadow: '0 4px 14px rgba(240, 147, 43, 0.4)',
                                                }, children: [_jsx("div", { style: {
                                                            width: '100%', height: '100%', borderRadius: '50%',
                                                            background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }, children: isPremium
                                                            ? _jsx(Plus, { size: 22, strokeWidth: 2.5, style: { color: '#F0932B' } })
                                                            : _jsx(Lock, { size: 20, strokeWidth: 2.5, style: { color: '#F0932B' } }) }), _jsx("div", { style: {
                                                            position: 'absolute', bottom: -2, right: -2,
                                                            width: 22, height: 22, borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #F7C948, #F0932B)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            border: '2px solid var(--bg)', color: 'white',
                                                        }, children: _jsx(Crown, { size: 11, strokeWidth: 2.5, fill: "white" }) })] }), _jsxs("span", { style: {
                                                    fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3,
                                                    background: 'linear-gradient(135deg, #F7C948, #F0932B)', WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                                                }, children: [_jsx(Crown, { size: 10, strokeWidth: 2.5, style: { color: '#F0932B' } }), " Private Story"] })] })] })] }), _jsxs("div", { style: { marginBottom: 14 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 15, marginBottom: 2 }, children: profileName || 'Your name' }), profileBio ? (_jsx("div", { style: { fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }, children: profileBio })) : (_jsx("button", { onClick: openEditProfile, style: { fontSize: 13, color: 'var(--text-3)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }, children: "+ Add a bio" }))] }), _jsx("div", { style: { marginBottom: 14 }, children: editingStatus ? (_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center' }, children: [_jsx("input", { autoFocus: true, value: statusDraft, onChange: e => setStatusDraft(e.target.value.slice(0, 60)), onKeyDown: e => {
                                        if (e.key === 'Enter')
                                            handleSaveStatus();
                                        if (e.key === 'Escape')
                                            setEditingStatus(false);
                                    }, placeholder: "\uD83C\uDFA7 listening to... / \uD83D\uDCCD currently in...", style: {
                                        flex: 1, padding: '8px 12px', borderRadius: 999,
                                        border: '1px solid var(--border-light)', background: 'var(--bg-card)',
                                        color: 'var(--text-1)', fontSize: 13, fontFamily: 'Inter, sans-serif',
                                        outline: 'none',
                                    } }), _jsx("button", { onClick: handleSaveStatus, className: "btn-rose", style: { padding: '8px 14px', fontSize: 13, flexShrink: 0 }, children: "Save" }), _jsx("button", { onClick: () => setEditingStatus(false), className: "icon-btn", style: { width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }, "aria-label": "Cancel", children: _jsx(X, { size: 16 }) })] })) : currentlyText ? (_jsxs("button", { onClick: () => { setStatusDraft(currentlyText); setEditingStatus(true); }, style: {
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '6px 12px', borderRadius: 999,
                                background: 'rgba(232, 68, 90, 0.1)', border: '1px solid rgba(232, 68, 90, 0.25)',
                                color: 'var(--rose)', fontSize: 12.5, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                            }, children: [currentlyText, _jsx(Pencil, { size: 11, strokeWidth: 2.5, style: { opacity: 0.6 } })] })) : (_jsx("button", { onClick: () => { setStatusDraft(''); setEditingStatus(true); }, style: {
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '6px 12px', borderRadius: 999,
                                background: 'transparent', border: '1px dashed var(--border-light)',
                                color: 'var(--text-3)', fontSize: 12.5, fontWeight: 500,
                                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                            }, children: "+ Set status" })) }), _jsxs("div", { style: { display: 'flex', gap: 8, marginBottom: 18 }, children: [_jsx("button", { onClick: openEditProfile, className: "btn-rose", style: { flex: 1, padding: '10px 0', fontSize: 14 }, children: "\u270F\uFE0F Edit Profile" }), _jsx("button", { onClick: handleShareProfile, className: "icon-btn", style: { width: 40, height: 40, flexShrink: 0 }, "aria-label": "Share", children: "\u2295" })] }), _jsxs("div", { style: { marginBottom: 18 }, children: [_jsx("div", { style: { fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 10, letterSpacing: 0.2 }, children: "INTERESTS" }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8 }, children: [interests.map(label => (_jsxs("button", { onClick: () => removeInterest(label), style: {
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
                                            background: 'rgba(232, 68, 90, 0.12)', border: '1px solid rgba(232, 68, 90, 0.3)',
                                            color: 'var(--rose)', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                                        }, title: "Tap to remove", children: [label, _jsx(X, { size: 12, strokeWidth: 2.5, style: { opacity: 0.55 } })] }, label))), _jsxs("button", { onClick: () => setAddingInterest(a => !a), style: {
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                            padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
                                            background: 'transparent', border: '1px dashed var(--border-light)',
                                            color: 'var(--text-3)', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                                        }, children: [_jsx(Plus, { size: 13, strokeWidth: 2.5 }), " Add interest"] })] }), addingInterest && (_jsxs("div", { className: "animate-scale-in", style: {
                                    marginTop: 12, padding: 14, borderRadius: 16,
                                    background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                                }, children: [_jsxs("div", { style: { display: 'flex', gap: 8, marginBottom: 12 }, children: [_jsx("input", { value: customInterest, onChange: e => setCustomInterest(e.target.value.slice(0, 24)), onKeyDown: e => { if (e.key === 'Enter' && customInterest.trim()) {
                                                    addInterest(customInterest);
                                                    setCustomInterest('');
                                                } }, placeholder: "Add your own\u2026", style: { flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border-light)', background: 'var(--bg)', color: 'var(--text-1)', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none' } }), _jsx("button", { onClick: () => { if (customInterest.trim()) {
                                                    addInterest(customInterest);
                                                    setCustomInterest('');
                                                } }, className: "btn-rose", style: { padding: '9px 16px', fontSize: 13, flexShrink: 0 }, children: "Add" })] }), _jsx("div", { style: { fontSize: 11, color: 'var(--text-3)', fontWeight: 700, letterSpacing: 0.3, marginBottom: 8 }, children: "SUGGESTED" }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8 }, children: INTEREST_CATALOG.filter(c => !interests.includes(c)).map(label => (_jsxs("button", { onClick: () => addInterest(label), style: {
                                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                                padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
                                                background: 'var(--bg)', border: '1px solid var(--border)',
                                                color: 'var(--text-2)', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                                                transition: 'all 0.15s',
                                            }, children: [_jsx(Plus, { size: 12, strokeWidth: 2.5, style: { color: 'var(--rose)' } }), " ", label] }, label))) })] }))] }), _jsx("div", { style: { display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 18 }, children: HIGHLIGHTS.map(h => (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }, children: [_jsx("div", { style: {
                                        width: 60, height: 60, borderRadius: '50%',
                                        background: h.isAdd ? 'rgba(255,255,255,0.05)' : 'var(--bg-card)',
                                        border: h.isAdd ? '1.5px dashed rgba(255,255,255,0.2)' : '1.5px solid var(--border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: h.isAdd ? 22 : 28,
                                        color: h.isAdd ? 'var(--text-3)' : undefined,
                                    }, children: h.emoji }), _jsx("span", { style: { fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }, children: h.label })] }, h.label))) }), posts.length > 0 && (_jsxs("div", { style: { marginBottom: 18 }, children: [_jsx("div", { style: { fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8, letterSpacing: 0.2 }, children: "POSTING ACTIVITY" }), _jsx("div", { style: { display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 4 }, children: weeks.map((week, wi) => (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }, children: week.map(cell => (_jsx("div", { title: `${cell.count} post${cell.count === 1 ? '' : 's'} on ${cell.date.toLocaleDateString()}`, style: {
                                            width: 9, height: 9, borderRadius: 2.5,
                                            background: heatColor(cell.count, max),
                                        } }, cell.key))) }, wi))) })] }))] }), _jsx("div", { style: { display: 'flex', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', flexShrink: 0 }, children: [
                    { key: 'posts', icon: '⊞', label: 'Posts' },
                    { key: 'tagged', icon: '🏷️', label: 'Tagged' },
                ].map(t => (_jsx("button", { onClick: () => setActiveTab(t.key), style: {
                        flex: 1, padding: '12px 0', background: 'none', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 600,
                        color: activeTab === t.key ? 'var(--text-1)' : 'var(--text-3)',
                        borderBottom: activeTab === t.key ? '2px solid var(--rose)' : '2px solid transparent',
                        transition: 'all 0.2s',
                    }, children: _jsx("span", { style: { fontSize: 18 }, children: t.icon }) }, t.key))) }), activeTab === 'posts' && pinnedPost && (_jsx("div", { style: { padding: '16px 16px 4px', display: 'flex', justifyContent: 'center' }, children: _jsxs("div", { style: {
                        position: 'relative', width: '78%', maxWidth: 280,
                        background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                        borderRadius: 10, padding: 10, boxShadow: 'var(--shadow-md)',
                        transform: 'rotate(-2deg)', transition: 'transform 0.2s',
                    }, onMouseEnter: e => (e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)'), onMouseLeave: e => (e.currentTarget.style.transform = 'rotate(-2deg) scale(1)'), children: [_jsx("div", { style: {
                                position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                                width: 26, height: 26, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #E8445A, #F97F68)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: 'var(--shadow-rose)', color: 'white',
                            }, children: _jsx(Pin, { size: 13, strokeWidth: 2.5 }) }), _jsx("img", { src: pinnedPost.imageUrl, alt: pinnedPost.caption || 'Pinned memory', style: { width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 6, display: 'block' } }), pinnedPost.caption && (_jsx("div", { style: { fontSize: 12, color: 'var(--text-2)', marginTop: 8, textAlign: 'center', fontStyle: 'italic' }, children: pinnedPost.caption })), _jsx("button", { onClick: () => handleTogglePin(pinnedPost.id), style: {
                                position: 'absolute', top: 6, right: 6, width: 22, height: 22,
                                borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none',
                                color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }, "aria-label": "Unpin", children: _jsx(X, { size: 12 }) })] }) })), _jsx("div", { className: "profile-grid", style: { gap: 2, flex: 1 }, children: gridPosts.map((post, i) => (_jsxs("div", { style: { aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer', position: 'relative', animation: `fadeIn 0.3s ${i * 0.04}s ease both` }, children: [_jsx("img", { src: post.imageUrl, alt: post.caption || `Post ${i + 1}`, style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }, onMouseEnter: e => (e.currentTarget.style.transform = 'scale(1.05)'), onMouseLeave: e => (e.currentTarget.style.transform = 'scale(1)') }), _jsxs("div", { style: {
                                position: 'absolute', inset: 0, opacity: 0, background: 'rgba(0,0,0,0.45)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
                                transition: 'opacity 0.2s',
                            }, onMouseEnter: e => {
                                e.currentTarget.style.opacity = '1';
                            }, onMouseLeave: e => (e.currentTarget.style.opacity = '0'), children: [_jsxs("span", { style: { color: 'white', fontSize: 13, fontWeight: 700 }, children: ["\u2764\uFE0F ", post.likes || 0] }), _jsxs("span", { style: { color: 'white', fontSize: 13, fontWeight: 700 }, children: ["\uD83D\uDCAC ", post.commentsCount ?? (post.comments?.length || 0)] }), _jsx("button", { onClick: ev => {
                                        ev.stopPropagation();
                                        handleTogglePin(post.id);
                                    }, style: {
                                        background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                                        width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: 'white',
                                    }, "aria-label": pinnedPostId === post.id ? 'Unpin from top' : 'Pin as memory', title: pinnedPostId === post.id ? 'Unpin' : 'Pin as memory', children: _jsx(Pin, { size: 13, strokeWidth: 2.5, fill: pinnedPostId === post.id ? 'white' : 'none' }) })] })] }, post.id || i))) }), showAvatarEditor && (_jsx(AvatarEditor, { currentUrl: avatarUrl ? api.fileUrl(avatarUrl) : '', onSave: saveAvatar, onRemove: removeAvatar, onClose: () => setShowAvatarEditor(false) })), editingProfile && (_jsx("div", { onClick: () => !savingProfile && setEditingProfile(false), style: {
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                }, children: _jsxs("div", { onClick: e => e.stopPropagation(), className: "animate-scale-in", style: {
                        width: '100%', maxWidth: 360, background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)', borderRadius: 22, padding: 22,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }, children: [_jsx("span", { style: { fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }, children: "Edit profile" }), _jsx("button", { onClick: () => !savingProfile && setEditingProfile(false), className: "icon-btn", style: { width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }, "aria-label": "Close", children: _jsx(X, { size: 18 }) })] }), _jsx("label", { style: { display: 'block', fontSize: 12, color: 'var(--text-3)', fontWeight: 700, letterSpacing: 0.3, marginBottom: 6 }, children: "NAME" }), _jsx("input", { autoFocus: true, value: nameDraft, onChange: e => setNameDraft(e.target.value.slice(0, 60)), placeholder: "Your name", style: { width: '100%', padding: '11px 13px', borderRadius: 12, border: '1px solid var(--border-light)', background: 'var(--bg)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', marginBottom: 16 } }), _jsx("label", { style: { display: 'block', fontSize: 12, color: 'var(--text-3)', fontWeight: 700, letterSpacing: 0.3, marginBottom: 6 }, children: "BIO" }), _jsx("textarea", { value: bioDraft, onChange: e => setBioDraft(e.target.value.slice(0, 300)), placeholder: "Tell people about yourself\u2026", rows: 4, style: { width: '100%', padding: '11px 13px', borderRadius: 12, border: '1px solid var(--border-light)', background: 'var(--bg)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical', lineHeight: 1.5 } }), _jsxs("div", { style: { textAlign: 'right', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }, children: [bioDraft.length, "/300"] }), _jsxs("div", { style: { display: 'flex', gap: 8, marginTop: 18 }, children: [_jsx("button", { onClick: () => setEditingProfile(false), disabled: savingProfile, style: { flex: 1, padding: '11px 0', borderRadius: 12, border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }, children: "Cancel" }), _jsx("button", { onClick: saveProfile, disabled: savingProfile || !nameDraft.trim(), className: "btn-rose", style: { flex: 1, padding: '11px 0', fontSize: 14, opacity: savingProfile || !nameDraft.trim() ? 0.6 : 1 }, children: savingProfile ? 'Saving…' : 'Save' })] })] }) })), showPremiumModal && (_jsx("div", { onClick: () => setShowPremiumModal(false), style: {
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                }, children: _jsxs("div", { onClick: e => e.stopPropagation(), className: "animate-scale-in", style: {
                        position: 'relative', width: '100%', maxWidth: 340,
                        background: 'var(--bg-card)', border: '1px solid rgba(247, 201, 72, 0.3)',
                        borderRadius: 24, padding: '28px 24px', textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden',
                    }, children: [_jsx("div", { style: {
                                position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
                                width: 200, height: 200, borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(247,201,72,0.25), transparent 70%)',
                                pointerEvents: 'none',
                            } }), _jsx("button", { onClick: () => setShowPremiumModal(false), className: "icon-btn", style: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }, "aria-label": "Close", children: _jsx(X, { size: 18 }) }), _jsx("div", { style: {
                                width: 68, height: 68, borderRadius: '50%', margin: '4px auto 16px',
                                background: 'linear-gradient(135deg, #F7C948, #F0932B)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 24px rgba(240, 147, 43, 0.45)', position: 'relative', zIndex: 1,
                            }, children: _jsx(Crown, { size: 32, strokeWidth: 2, fill: "white", color: "white" }) }), _jsx("div", { style: { fontWeight: 900, fontSize: 20, letterSpacing: -0.5, marginBottom: 6, position: 'relative', zIndex: 1 }, children: "Private Stories" }), _jsxs("div", { style: {
                                display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 14,
                                padding: '3px 10px', borderRadius: 999,
                                background: 'linear-gradient(135deg, #F7C948, #F0932B)',
                                color: 'white', fontSize: 11, fontWeight: 800, letterSpacing: 0.5, position: 'relative', zIndex: 1,
                            }, children: [_jsx(Sparkles, { size: 11, strokeWidth: 2.5 }), " PREMIUM"] }), _jsxs("div", { style: { fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 20, position: 'relative', zIndex: 1 }, children: ["Share moments only ", _jsx("b", { children: "you" }), " can see. Unlock Private Stories and go ad-free with ", _jsx("b", { children: "Spark Premium" }), "."] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, position: 'relative', zIndex: 1 }, children: ['Unlimited private stories', 'Hidden from everyone but you', 'Priority likes & unlimited swipes'].map(feat => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', textAlign: 'left' }, children: [_jsx("span", { style: {
                                            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                                            background: 'rgba(247, 201, 72, 0.15)', color: '#F0932B',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900,
                                        }, children: "\u2713" }), feat] }, feat))) }), _jsxs("button", { onClick: handleUnlockPremium, style: {
                                width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #F7C948, #F0932B)', color: 'white',
                                fontSize: 15, fontWeight: 800, fontFamily: 'Inter, sans-serif',
                                boxShadow: '0 8px 20px rgba(240, 147, 43, 0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                position: 'relative', zIndex: 1,
                            }, children: [_jsx(Crown, { size: 17, strokeWidth: 2.5, fill: "white" }), " Unlock Premium"] }), _jsx("div", { style: { fontSize: 11, color: 'var(--text-3)', marginTop: 10, position: 'relative', zIndex: 1 }, children: "$9.99/mo \u00B7 Cancel anytime" })] }) })), viewerStory && (_jsx("div", { onClick: () => setViewerStory(null), style: {
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                }, children: _jsxs("div", { onClick: e => e.stopPropagation(), style: { position: 'relative', width: '100%', maxWidth: 380, animation: 'fadeIn 0.2s ease' }, children: [_jsxs("div", { style: {
                                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10,
                                padding: '5px 12px', borderRadius: 999,
                                background: 'rgba(232, 68, 90, 0.15)', border: '1px solid rgba(232, 68, 90, 0.3)',
                                color: 'var(--rose)', fontSize: 12, fontWeight: 600,
                            }, children: [_jsx(Lock, { size: 12, strokeWidth: 2.5 }), " Only you can see this"] }), _jsx("img", { src: api.fileUrl(viewerStory.url), alt: "Private story", style: { width: '100%', borderRadius: 16, display: 'block', maxHeight: '70vh', objectFit: 'contain' } }), _jsxs("div", { style: { display: 'flex', gap: 8, marginTop: 12 }, children: [_jsxs("button", { onClick: () => handleRemoveStory(viewerStory.id), style: {
                                        flex: 1, padding: '10px 0', borderRadius: 12, border: '1px solid var(--border-light)',
                                        background: 'var(--bg-card)', color: 'var(--rose)', fontSize: 14, fontWeight: 600,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        fontFamily: 'Inter, sans-serif',
                                    }, children: [_jsx(X, { size: 16 }), " Delete story"] }), _jsx("button", { onClick: () => setViewerStory(null), className: "btn-rose", style: { flex: 1, padding: '10px 0', fontSize: 14 }, children: "Close" })] })] }) })), activePanel === 'menu' && (_jsxs(PanelShell, { title: profileName?.toLowerCase().replace(/\s+/g, '_') || 'Menu', onBack: () => setActivePanel(null), children: [!isPremium && (_jsxs("button", { onClick: () => { setActivePanel(null); setShowPremiumModal(true); }, style: {
                            display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                            padding: 16, marginBottom: 18, borderRadius: 16, cursor: 'pointer',
                            background: 'linear-gradient(135deg, rgba(247,201,72,0.15), rgba(240,147,43,0.1))',
                            border: '1px solid rgba(247, 201, 72, 0.35)', fontFamily: 'Inter, sans-serif',
                        }, children: [_jsx("div", { style: { width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #F7C948, #F0932B)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(240,147,43,0.4)' }, children: _jsx(Crown, { size: 22, fill: "white", color: "white" }) }), _jsxs("span", { style: { flex: 1 }, children: [_jsx("span", { style: { display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--text-1)' }, children: "Upgrade to Premium" }), _jsx("span", { style: { display: 'block', fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }, children: "Private stories, unlimited swipes & more" })] }), _jsx(ChevronRight, { size: 20, color: "#F0932B" })] })), _jsxs(Group, { children: [_jsx(Row, { icon: _jsx(Lock, { size: 18 }), label: "Privacy", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => setActivePanel('privacy') }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Shield, { size: 18 }), label: "Security", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => setActivePanel('security') }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(UserCog, { size: 18 }), label: "Account Center", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => setActivePanel('account') })] }), _jsxs(Group, { children: [_jsx(Row, { icon: _jsx(Activity, { size: 18 }), label: "Activity", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => setActivePanel('activity') }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Ban, { size: 18 }), label: "Blocked", sub: `${blocked.length} account${blocked.length === 1 ? '' : 's'}`, right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => setActivePanel('blocked') }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Bell, { size: 18 }), label: "Notifications", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => setActivePanel('notifications') }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Settings, { size: 18 }), label: "Settings", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => setActivePanel('settings') })] }), _jsxs(Group, { children: [_jsx(Row, { icon: _jsx(Share2, { size: 18 }), label: "Share profile", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => { setActivePanel(null); handleShareProfile(); } }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(HelpCircle, { size: 18 }), label: "Help center", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => { } })] }), _jsx(Group, { children: _jsx(Row, { icon: _jsx(LogOut, { size: 18 }), label: "Log out", danger: true, onClick: onLogout }) }), _jsx("div", { style: { textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 8 }, children: "Spark \u00B7 v1.0.0" })] })), activePanel === 'privacy' && (_jsxs(PanelShell, { title: "Privacy", onBack: () => setActivePanel('menu'), children: [_jsxs(Group, { title: "Account privacy", children: [_jsx(Row, { icon: _jsx(Lock, { size: 18 }), label: "Private account", sub: "Only approved followers see your posts", right: _jsx(Toggle, { on: privacy.privateAccount, onClick: flip(setPrivacy, 'privateAccount') }) }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Eye, { size: 18 }), label: "Hide from search", sub: "Don't appear in name search", right: _jsx(Toggle, { on: privacy.hideFromSearch, onClick: flip(setPrivacy, 'hideFromSearch') }) })] }), _jsxs(Group, { title: "Interactions", children: [_jsx(Row, { icon: _jsx(Activity, { size: 18 }), label: "Show activity status", sub: "Let matches see when you're active", right: _jsx(Toggle, { on: privacy.activityStatus, onClick: flip(setPrivacy, 'activityStatus') }) }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(MessageCircle, { size: 18 }), label: "Read receipts", sub: "Show when you've read messages", right: _jsx(Toggle, { on: privacy.readReceipts, onClick: flip(setPrivacy, 'readReceipts') }) }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Bell, { size: 18 }), label: "Allow message requests", right: _jsx(Toggle, { on: privacy.messageRequests, onClick: flip(setPrivacy, 'messageRequests') }) }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Globe, { size: 18 }), label: "Show distance", sub: "Display distance on your profile", right: _jsx(Toggle, { on: privacy.showDistance, onClick: flip(setPrivacy, 'showDistance') }) })] })] })), activePanel === 'security' && (_jsxs(PanelShell, { title: "Security", onBack: () => setActivePanel('menu'), children: [_jsxs(Group, { title: "Login", children: [_jsx(Row, { icon: _jsx(Shield, { size: 18 }), label: "Two-factor authentication", sub: security.twoFactor ? 'On · via SMS' : 'Off', right: _jsx(Toggle, { on: security.twoFactor, onClick: flip(setSecurity, 'twoFactor') }) }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Smartphone, { size: 18 }), label: "Biometric unlock", sub: "Face ID / fingerprint", right: _jsx(Toggle, { on: security.biometric, onClick: flip(setSecurity, 'biometric') }) }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Bell, { size: 18 }), label: "Login alerts", sub: "Notify me of new logins", right: _jsx(Toggle, { on: security.loginAlerts, onClick: flip(setSecurity, 'loginAlerts') }) })] }), _jsx(Group, { title: "Password", children: _jsx(Row, { icon: _jsx(KeyRound, { size: 18 }), label: "Change password", sub: "Last changed 3 months ago", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => { } }) }), _jsxs(Group, { title: "Where you're logged in", children: [_jsx(Row, { icon: _jsx(Smartphone, { size: 18 }), label: "iPhone 15 \u00B7 New York", sub: "This device \u00B7 active now", right: _jsx("span", { style: { fontSize: 12, color: '#3ECf8E', fontWeight: 700 }, children: "\u25CF" }) }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Globe, { size: 18 }), label: "Chrome \u00B7 MacBook", sub: "Last active 2h ago", right: _jsx("span", { style: { fontSize: 12, color: 'var(--rose)', fontWeight: 600 }, children: "Log out" }), onClick: () => { } })] })] })), activePanel === 'account' && (_jsxs(PanelShell, { title: "Account Center", onBack: () => setActivePanel('menu'), children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0 20px' }, children: [_jsx("div", { className: "story-ring", children: _jsx("div", { className: "story-inner", children: _jsx("img", { src: avatarUrl ? api.fileUrl(avatarUrl) : '/p2.png', alt: "You", style: { width: 76, height: 76, objectFit: 'cover', display: 'block' } }) }) }), _jsx("div", { style: { fontWeight: 800, fontSize: 17, marginTop: 10 }, children: profileName || 'Your name' }), _jsx("div", { style: { fontSize: 13, color: 'var(--text-3)' }, children: user?.email || 'you@spark.app' }), isPremium && (_jsxs("div", { style: { marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, background: 'linear-gradient(135deg, #F7C948, #F0932B)', color: 'white', fontSize: 11, fontWeight: 800 }, children: [_jsx(Crown, { size: 12, fill: "white" }), " PREMIUM"] }))] }), _jsxs(Group, { title: "Profile", children: [_jsx(Row, { icon: _jsx(UserCog, { size: 18 }), label: "Personal details", sub: "Name, birthday, gender", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => { } }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Pencil, { size: 18 }), label: "Edit profile", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => { } })] }), _jsx(Group, { title: "Subscription", children: _jsx(Row, { icon: _jsx(Crown, { size: 18 }), label: isPremium ? 'Spark Premium' : 'Upgrade to Premium', sub: isPremium ? 'Active · renews monthly' : 'Unlock private stories & more', right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => { setActivePanel(null); setShowPremiumModal(true); } }) }), _jsxs(Group, { title: "Connected", children: [_jsx(Row, { icon: _jsx(Globe, { size: 18 }), label: "Instagram", sub: "Not connected", right: _jsx("span", { style: { fontSize: 13, color: 'var(--rose)', fontWeight: 600 }, children: "Connect" }), onClick: () => { } }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Globe, { size: 18 }), label: "Spotify", sub: "Not connected", right: _jsx("span", { style: { fontSize: 13, color: 'var(--rose)', fontWeight: 600 }, children: "Connect" }), onClick: () => { } })] }), _jsx(Group, { children: _jsx(Row, { icon: _jsx(Trash2, { size: 18 }), label: "Deactivate account", danger: true, onClick: () => { }, right: _jsx(ChevronRight, { size: 18, color: "var(--rose)" }) }) })] })), activePanel === 'activity' && (_jsxs(PanelShell, { title: "Activity", onBack: () => setActivePanel('menu'), children: [_jsx("div", { style: { display: 'flex', gap: 10, marginBottom: 18 }, children: [
                            { label: 'Likes given', value: '128', icon: _jsx(Heart, { size: 16, fill: "var(--rose)", color: "var(--rose)" }) },
                            { label: 'Matches', value: '24', icon: _jsx(Sparkles, { size: 16, color: "var(--rose)" }) },
                            { label: 'Posts', value: posts.length.toString(), icon: _jsx(Star, { size: 16, color: "var(--rose)" }) },
                        ].map(s => (_jsxs("div", { style: { flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }, children: [_jsx("div", { style: { display: 'flex', justifyContent: 'center', marginBottom: 4 }, children: s.icon }), _jsx("div", { style: { fontWeight: 900, fontSize: 18 }, children: s.value }), _jsx("div", { style: { fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }, children: s.label })] }, s.label))) }), _jsx(Group, { title: "Recent activity", children: activityFeed.map((a, i) => (_jsxs("div", { children: [i > 0 && _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx("span", { style: { fontSize: 18 }, children: a.icon }), label: a.text, sub: a.when })] }, a.id))) })] })), activePanel === 'blocked' && (_jsx(PanelShell, { title: "Blocked", onBack: () => setActivePanel('menu'), children: blocked.length === 0 ? (_jsxs("div", { style: { textAlign: 'center', padding: '60px 24px', color: 'var(--text-3)' }, children: [_jsx(Ban, { size: 40, strokeWidth: 1.5, style: { opacity: 0.4, marginBottom: 12 } }), _jsx("div", { style: { fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }, children: "No blocked accounts" }), _jsx("div", { style: { fontSize: 13 }, children: "People you block will appear here." })] })) : (_jsx(Group, { title: `${blocked.length} blocked`, children: blocked.map((b, i) => (_jsxs("div", { children: [i > 0 && _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx("div", { style: { width: 34, height: 34, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--text-2)' }, children: b.name[0] }), label: b.name, sub: b.handle, right: _jsx("button", { onClick: () => unblock(b.id), className: "icon-btn", style: { padding: '6px 14px', fontSize: 13, fontWeight: 600 }, children: "Unblock" }) })] }, b.id))) })) })), activePanel === 'notifications' && (_jsxs(PanelShell, { title: "Notifications", onBack: () => setActivePanel('menu'), children: [_jsxs(Group, { title: "Push notifications", children: [_jsx(Row, { icon: _jsx(Heart, { size: 18 }), label: "Likes", right: _jsx(Toggle, { on: notifs.likes, onClick: flip(setNotifs, 'likes') }) }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Sparkles, { size: 18 }), label: "New matches", right: _jsx(Toggle, { on: notifs.matches, onClick: flip(setNotifs, 'matches') }) }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(MessageCircle, { size: 18 }), label: "Messages", right: _jsx(Toggle, { on: notifs.messages, onClick: flip(setNotifs, 'messages') }) }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Star, { size: 18 }), label: "Super Likes", right: _jsx(Toggle, { on: notifs.superLikes, onClick: flip(setNotifs, 'superLikes') }) })] }), _jsxs(Group, { title: "From Spark", children: [_jsx(Row, { icon: _jsx(Bell, { size: 18 }), label: "Promotions & tips", right: _jsx(Toggle, { on: notifs.promos, onClick: flip(setNotifs, 'promos') }) }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(FileText, { size: 18 }), label: "Email notifications", right: _jsx(Toggle, { on: notifs.email, onClick: flip(setNotifs, 'email') }) })] })] })), activePanel === 'settings' && (_jsxs(PanelShell, { title: "Settings", onBack: () => setActivePanel('menu'), children: [_jsxs(Group, { title: "Preferences", children: [_jsx(Row, { icon: _jsx(Eye, { size: 18 }), label: "Show online status", right: _jsx(Toggle, { on: prefs.showOnlineStatus, onClick: flip(setPrefs, 'showOnlineStatus') }) }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Moon, { size: 18 }), label: "Data saver", sub: "Load lower-res images", right: _jsx(Toggle, { on: prefs.dataSaver, onClick: flip(setPrefs, 'dataSaver') }) }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Globe, { size: 18 }), label: "Distance units", right: _jsx("div", { style: { display: 'flex', gap: 4, background: 'var(--bg)', borderRadius: 999, padding: 3 }, children: ['mi', 'km'].map(u => (_jsx("button", { onClick: () => setPrefs(p => ({ ...p, units: u })), style: {
                                            padding: '4px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                                            background: prefs.units === u ? 'var(--rose)' : 'transparent', color: prefs.units === u ? 'white' : 'var(--text-3)',
                                        }, children: u }, u))) }) })] }), _jsxs(Group, { title: "Shortcuts", children: [_jsx(Row, { icon: _jsx(Lock, { size: 18 }), label: "Privacy", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => setActivePanel('privacy') }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Shield, { size: 18 }), label: "Security", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => setActivePanel('security') }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(Bell, { size: 18 }), label: "Notifications", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => setActivePanel('notifications') })] }), _jsxs(Group, { title: "Support", children: [_jsx(Row, { icon: _jsx(HelpCircle, { size: 18 }), label: "Help center", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => { } }), _jsx("div", { className: "divider" }), _jsx(Row, { icon: _jsx(FileText, { size: 18 }), label: "Terms & Privacy Policy", right: _jsx(ChevronRight, { size: 18, color: "var(--text-3)" }), onClick: () => { } })] }), _jsx(Group, { children: _jsx(Row, { icon: _jsx(LogOut, { size: 18 }), label: "Log out", danger: true, onClick: onLogout }) }), _jsx("div", { style: { textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 8 }, children: "Spark \u00B7 v1.0.0" })] }))] }));
};
//# sourceMappingURL=ProfilePage.js.map