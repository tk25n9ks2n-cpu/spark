import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Camera, MoreVertical, Lock, Shield, UserCog, Activity, Ban, Bell, LogOut, Share2, Pin, Pencil, X, Crown, Sparkles, Settings, ChevronRight, ArrowLeft, Globe, Moon, KeyRound, Smartphone, Heart, MessageCircle, Eye, HelpCircle, FileText, Trash2, Star } from 'lucide-react';
import { api } from '../services/api';

const HIGHLIGHTS = [
  { label: 'Travel', emoji: '✈️' },
  { label: 'Coffee', emoji: '☕' },
  { label: 'Art',    emoji: '🎨' },
  { label: 'Add',    emoji: '+',  isAdd: true },
];

// Suggested interests users can toggle onto their profile
const INTEREST_CATALOG = [
  '✈️ Travel', '☕ Coffee', '🎵 Music', '🎨 Art', '🏋️ Gym', '📚 Books',
  '🍳 Cooking', '🎮 Gaming', '📸 Photography', '🐶 Dogs', '🐱 Cats', '🌱 Plants',
  '🏔️ Hiking', '🎬 Movies', '🍷 Wine', '☕ Brunch', '🏄 Surfing', '🧘 Yoga',
  '⚽ Football', '🎧 Podcasts', '✍️ Writing', '💃 Dancing', '🍕 Foodie', '🌍 Languages',
];

interface ProfilePageProps {
  user: any;
  onLogout: () => void;
}

// ---- Helpers -----------------------------------------------------------

/** Builds a 14-week (98 day) activity grid, most recent day last, from post timestamps. */
function buildHeatmap(posts: any[]) {
  const DAYS = 98; // 14 weeks — reads well without overwhelming the profile
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const counts = new Map<string, number>();
  posts.forEach(p => {
    if (!p.createdAt) return;
    const d = new Date(p.createdAt);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const cells: { key: string; count: number; date: Date }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ key, count: counts.get(key) || 0, date: d });
  }

  // Group into weeks (columns), Sunday-start
  const weeks: typeof cells[] = [];
  let currentWeek: typeof cells = [];
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

function heatColor(count: number, max: number) {
  if (count === 0) return 'rgba(255,255,255,0.06)';
  const t = Math.min(1, count / max);
  // Interpolate toward the app's rose accent as intensity rises
  const alpha = 0.25 + t * 0.75;
  return `rgba(232, 68, 90, ${alpha.toFixed(2)})`;
}

// ---- Settings UI primitives ---------------------------------------------

/** iOS-style toggle switch. */
const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
      background: on ? 'linear-gradient(135deg, #E8445A, #F97F68)' : 'rgba(255,255,255,0.15)',
      position: 'relative', transition: 'background 0.2s', padding: 0,
    }}
    role="switch"
    aria-checked={on}
  >
    <span style={{
      position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%',
      background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    }} />
  </button>
);

/** A single settings row: icon + label (+ optional subtitle) with a right-side control. */
const Row = ({ icon, label, sub, right, onClick, danger }: {
  icon?: React.ReactNode; label: string; sub?: string; right?: React.ReactNode; onClick?: () => void; danger?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
      padding: '13px 14px', background: 'none', border: 'none',
      cursor: onClick ? 'pointer' : 'default', fontFamily: 'Inter, sans-serif',
      color: danger ? 'var(--rose)' : 'var(--text-1)',
    }}
  >
    {icon && <span style={{ color: danger ? 'var(--rose)' : 'var(--text-2)', display: 'flex', flexShrink: 0 }}>{icon}</span>}
    <span style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600 }}>{label}</span>
      {sub && <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{sub}</span>}
    </span>
    {right}
  </button>
);

/** Slide-in full-height settings panel with a header + back button. */
const PanelShell = ({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) => (
  <div style={{
    position: 'absolute', inset: 0, zIndex: 150, background: 'var(--bg)',
    display: 'flex', flexDirection: 'column', animation: 'slideRight 0.22s ease',
  }}>
    <div className="top-bar" style={{ flexShrink: 0 }}>
      <button className="icon-btn" onClick={onBack} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Back">
        <ArrowLeft size={20} strokeWidth={2} />
      </button>
      <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>{title}</span>
      <span style={{ width: 36 }} />
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 40px' }}>{children}</div>
  </div>
);

/** A grouped card that wraps a set of rows with dividers. */
const Group = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 18 }}>
    {title && <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: 0.4, margin: '4px 6px 8px' }}>{title.toUpperCase()}</div>}
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 16, overflow: 'hidden' }}>
      {children}
    </div>
  </div>
);

// ---- Avatar customizer --------------------------------------------------

const PRESETS = ['/p1.png', '/p2.png', '/p3.png', '/p4.png'];
const BOX = 260; // preview size

/** Pick a photo (upload or preset), zoom & reposition it in a circular crop, then save. */
const AvatarEditor = ({ currentUrl, onSave, onRemove, onClose }: {
  currentUrl: string; onSave: (dataUrl: string) => void; onRemove: () => void; onClose: () => void;
}) => {
  const [src, setSrc] = useState<string | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Load natural dimensions whenever a source is chosen
  useEffect(() => {
    if (!src) return;
    const im = new Image();
    im.onload = () => { setDims({ w: im.naturalWidth, h: im.naturalHeight }); setZoom(1); setPan({ x: 0, y: 0 }); };
    im.src = src;
  }, [src]);

  const cover = dims.w && dims.h ? Math.max(BOX / dims.w, BOX / dims.h) : 1;
  const dispW = dims.w * cover * zoom;
  const dispH = dims.h * cover * zoom;
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  const left = clamp((BOX - dispW) / 2 + pan.x, BOX - dispW, 0);
  const top = clamp((BOX - dispH) / 2 + pan.y, BOX - dispH, 0);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPan({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) });
  };
  const onPointerUp = () => { drag.current = null; };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const save = () => {
    const img = imgRef.current;
    if (!img) return;
    const O = 512, k = O / BOX;
    const canvas = document.createElement('canvas');
    canvas.width = O; canvas.height = O;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, O, O);
    ctx.beginPath();
    ctx.arc(O / 2, O / 2, O / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, left * k, top * k, dispW * k, dispH * k);
    try { onSave(canvas.toDataURL('image/jpeg', 0.9)); }
    catch { onSave(src!); } // fallback if canvas is tainted
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 210, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="animate-scale-in" style={{ width: '100%', maxWidth: 340, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 24, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>{src ? 'Adjust photo' : 'Profile photo'}</span>
          <button onClick={onClose} className="icon-btn" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close"><X size={18} /></button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile} />

        {src ? (
          <>
            {/* Circular crop preview */}
            <div
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
              style={{ width: BOX, height: BOX, margin: '0 auto', borderRadius: '50%', overflow: 'hidden', position: 'relative', cursor: 'grab', touchAction: 'none', background: '#000', boxShadow: '0 0 0 3px var(--rose)' }}
            >
              <img ref={imgRef} src={src} alt="" draggable={false} style={{ position: 'absolute', left, top, width: dispW, height: dispH, maxWidth: 'none', userSelect: 'none', pointerEvents: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 4px' }}>
              <span style={{ fontSize: 16 }}>🔍</span>
              <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(+e.target.value)} style={{ flex: 1, accentColor: '#E8445A' }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>Drag to reposition · slide to zoom</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSrc(null)} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Back</button>
              <button onClick={save} className="btn-rose" style={{ flex: 1, padding: '12px 0', fontSize: 14 }}>Save photo</button>
            </div>
          </>
        ) : (
          <>
            {/* Current + source picker */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <div className="story-ring"><div className="story-inner"><img src={currentUrl || '/p2.png'} alt="Current" style={{ width: 90, height: 90, objectFit: 'cover', display: 'block' }} /></div></div>
            </div>
            <button onClick={() => fileRef.current?.click()} className="btn-rose" style={{ width: '100%', padding: '13px 0', fontSize: 15, marginBottom: 14 }}>
              📷 Upload a photo
            </button>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700, letterSpacing: 0.3, marginBottom: 10 }}>OR PICK ONE</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 18 }}>
              {PRESETS.map(p => (
                <div key={p} onClick={() => setSrc(p)} style={{ cursor: 'pointer', borderRadius: '50%', overflow: 'hidden', width: 56, height: 56, border: '2px solid var(--border)' }}>
                  <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
            {currentUrl && (
              <button onClick={onRemove} style={{ width: '100%', padding: '11px 0', borderRadius: 12, border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--rose)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Inter, sans-serif' }}>
                <Trash2 size={16} /> Remove current photo
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ---- Component ----------------------------------------------------------

export const ProfilePage = ({ user, onLogout }: ProfilePageProps) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'tagged'>('posts');
  const [posts, setPosts] = useState<any[]>([]);

  const [currentlyText, setCurrentlyText] = useState<string>(() => user?.currentStatus || '');
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState('');

  // Editable profile identity (persisted to the real User record)
  const [profileName, setProfileName] = useState<string>(user?.name || '');
  const [profileBio, setProfileBio] = useState<string>(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || '');
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);

  const saveAvatar = async (dataUrl: string) => {
    const prev = avatarUrl;
    setAvatarUrl(dataUrl);          // optimistic
    setShowAvatarEditor(false);
    try {
      const { avatarUrl: saved } = await api.uploadAvatar(dataUrl);
      setAvatarUrl(saved);
    } catch { setAvatarUrl(prev); }
  };

  const removeAvatar = async () => {
    const prev = avatarUrl;
    setAvatarUrl('');
    setShowAvatarEditor(false);
    try { await api.removeAvatar(); } catch { setAvatarUrl(prev); }
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
    if (!name) return;
    setSavingProfile(true);
    try {
      const { user: updated } = await api.updateProfile({ name, bio: bioDraft });
      setProfileName(updated.name);
      setProfileBio(updated.bio || '');
      setEditingProfile(false);
    } catch {
      // keep the editor open on failure
    } finally {
      setSavingProfile(false);
    }
  };

  const [pinnedPostId, setPinnedPostId] = useState<string | null>(user?.pinnedPostId || null);
  const [pickingPin, setPickingPin] = useState(false);

  // Private stories — a premium feature; only visible to you, gated behind the lock badge
  const [privateStories, setPrivateStories] = useState<{ id: string; url: string }[]>([]);
  const [viewerStory, setViewerStory] = useState<{ id: string; url: string } | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(!!user?.isPremium);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // ---- Menu panels (Privacy / Security / Account / Activity / Blocked / Notifications / Settings) ----
  type Panel = 'menu' | 'privacy' | 'security' | 'account' | 'activity' | 'blocked' | 'notifications' | 'settings';
  const [activePanel, setActivePanel] = useState<Panel | null>(null);

  const openPanel = (p: Panel) => setActivePanel(p);

  const [privacy, setPrivacy] = useState({
    privateAccount: false, activityStatus: true, readReceipts: true,
    messageRequests: true, hideFromSearch: false, showDistance: true,
  });
  const [security, setSecurity] = useState({ twoFactor: false, loginAlerts: true, biometric: true });
  const [notifs, setNotifs] = useState({
    likes: true, matches: true, messages: true, superLikes: true, promos: false, email: false,
  });
  const [prefs, setPrefs] = useState({ dataSaver: false, showOnlineStatus: true, units: 'mi' as 'mi' | 'km' });
  const [blocked, setBlocked] = useState<{ id: string; name: string; handle: string }[]>([
    { id: 'b1', name: 'Jordan Blake', handle: '@jordan.b' },
    { id: 'b2', name: 'Sam Rivera', handle: '@samr' },
  ]);

  const flip = <T extends Record<string, any>>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof T) =>
    () => setter(prev => ({ ...prev, [key]: !prev[key] }));

  const unblock = (id: string) => setBlocked(prev => prev.filter(b => b.id !== id));

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
  const storyInputRef = useRef<HTMLInputElement | null>(null);

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
    api.updateUser?.(user?.id, { isPremium: true }).catch?.(() => {});
    // Open the picker right away so the unlock flows straight into adding a story
    setTimeout(() => storyInputRef.current?.click(), 150);
  };

  const handleAddStory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      // Optimistic add so the ring appears instantly, then reconcile with the saved record
      const tempId = `tmp_${Date.now()}`;
      setPrivateStories(prev => [...prev, { id: tempId, url: dataUrl }]);
      try {
        const { story } = await api.uploadStory(dataUrl);
        setPrivateStories(prev => prev.map(s => (s.id === tempId ? story : s)));
      } catch {
        // Upload failed — roll back the optimistic entry
        setPrivateStories(prev => prev.filter(s => s.id !== tempId));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveStory = (id: string) => {
    setPrivateStories(prev => prev.filter(s => s.id !== id));
    setViewerStory(null);
    if (!id.startsWith('tmp_')) api.deleteStory(id).catch(() => {});
  };

  // ---- Interests / Passions ---------------------------------------------
  const [interests, setInterests] = useState<string[]>(
    user?.interests || ['✈️ Travel', '☕ Coffee', '🎵 Music']
  );
  const [addingInterest, setAddingInterest] = useState(false);
  const [customInterest, setCustomInterest] = useState('');

  const removeInterest = (label: string) => {
    setInterests(prev => {
      const next = prev.filter(i => i !== label);
      api.updateUser?.(user?.id, { interests: next }).catch?.(() => {});
      return next;
    });
  };

  const addInterest = (label: string) => {
    const clean = label.trim();
    if (!clean) return;
    setInterests(prev => {
      if (prev.includes(clean)) return prev;
      const next = [...prev, clean];
      api.updateUser?.(user?.id, { interests: next }).catch?.(() => {});
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
      .then(({ user: me, settings }: any) => {
        if (me) {
          if (me.name) setProfileName(me.name);
          if (typeof me.bio === 'string') setProfileBio(me.bio);
          if (me.avatarUrl) setAvatarUrl(me.avatarUrl);
        }
        if (settings && typeof settings === 'object') {
          if (settings.privacy) setPrivacy(p => ({ ...p, ...settings.privacy }));
          if (settings.security) setSecurity(s => ({ ...s, ...settings.security }));
          if (settings.notifs) setNotifs(n => ({ ...n, ...settings.notifs }));
          if (settings.prefs) setPrefs(pr => ({ ...pr, ...settings.prefs }));
          if (Array.isArray(settings.blocked)) setBlocked(settings.blocked);
          if (Array.isArray(settings.interests)) setInterests(settings.interests);
          if (typeof settings.isPremium === 'boolean') setIsPremium(settings.isPremium);
          if (typeof settings.currentStatus === 'string') setCurrentlyText(settings.currentStatus);
          if ('pinnedPostId' in settings) setPinnedPostId(settings.pinnedPostId);
        }
      })
      .catch(() => {})
      .finally(() => { hydrated.current = true; });

    // Load persisted private stories
    api.getStories?.()
      .then(({ stories }: any) => { if (Array.isArray(stories)) setPrivateStories(stories); })
      .catch(() => {});
  }, []);

  // Persist any change to the backend (debounced) — skips the initial hydrate.
  useEffect(() => {
    if (!hydrated.current) return;
    const t = setTimeout(() => {
      api.updateSettings?.({
        privacy, security, notifs, prefs, blocked, interests,
        isPremium, currentStatus: currentlyText, pinnedPostId,
      }).catch(() => {});
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
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Profile link copied to clipboard!');
    }
  };

  const handleSaveStatus = () => {
    const trimmed = statusDraft.trim();
    setCurrentlyText(trimmed);
    setEditingStatus(false);
    // Best-effort persist; ignore failure so UI never blocks on it
    api.updateUser?.(user?.id, { currentStatus: trimmed }).catch?.(() => {});
  };

  const handleTogglePin = (postId: string) => {
    const next = pinnedPostId === postId ? null : postId;
    setPinnedPostId(next);
    setPickingPin(false);
    api.updateUser?.(user?.id, { pinnedPostId: next }).catch?.(() => {});
  };

  const pinnedPost = useMemo(
    () => posts.find(p => (p.id || '') === pinnedPostId) || null,
    [posts, pinnedPostId]
  );

  const gridPosts = useMemo(
    () => posts.filter(p => (p.id || '') !== pinnedPostId),
    [posts, pinnedPostId]
  );

  const { weeks, max } = useMemo(() => buildHeatmap(posts), [posts]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top bar */}
      <div className="top-bar" style={{ position: 'relative' }}>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>
          {profileName?.toLowerCase().replace(/\s+/g, '_') || 'your_profile'}
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="icon-btn"
            onClick={handleShareProfile}
            style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Share profile"
          >
            <Share2 size={20} strokeWidth={2} />
          </button>
          <button className="icon-btn" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Create post">
            <Plus size={20} strokeWidth={2} />
          </button>
          <button className="icon-btn" onClick={() => openPanel('menu')} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Menu">
            <MoreVertical size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Profile info */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div className="story-ring" style={{ cursor: 'pointer' }} onClick={() => setShowAvatarEditor(true)}>
              <div className="story-inner">
                <img src={avatarUrl ? api.fileUrl(avatarUrl) : '/p2.png'} alt="Profile" style={{ width: 80, height: 80, objectFit: 'cover', display: 'block' }} />
              </div>
            </div>
            <div
              onClick={() => setShowAvatarEditor(true)}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: '50%',
                background: 'linear-gradient(135deg, #E8445A, #F97F68)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg)', color: 'white',
                cursor: 'pointer', boxShadow: 'var(--shadow-rose)',
              }}
            >
              <Camera size={14} strokeWidth={2.5} />
            </div>
          </div>

          {/* Private Story — premium feature, aligned to the right */}
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 14, overflowX: 'auto', paddingBottom: 2 }}>
            <input
              ref={storyInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAddStory}
            />

            {/* Added private stories (shown before the add tile so the add tile stays far right) */}
            {privateStories.map(story => (
              <div
                key={story.id}
                onClick={() => setViewerStory(story)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }}
              >
                <div style={{ position: 'relative' }}>
                  <div className="story-ring">
                    <div className="story-inner">
                      <img src={api.fileUrl(story.url)} alt="Private story" style={{ width: 60, height: 60, objectFit: 'cover', display: 'block' }} />
                    </div>
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--bg)', color: 'white',
                  }}>
                    <Lock size={10} strokeWidth={2.5} />
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Private</span>
              </div>
            ))}

            {/* Add private story — premium */}
            <div
              onClick={handleStoryTileClick}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }}
            >
              <div style={{
                position: 'relative', width: 64, height: 64, borderRadius: '50%',
                padding: 2.5, background: 'linear-gradient(135deg, #F7C948, #F0932B)',
                boxShadow: '0 4px 14px rgba(240, 147, 43, 0.4)',
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isPremium
                    ? <Plus size={22} strokeWidth={2.5} style={{ color: '#F0932B' }} />
                    : <Lock size={20} strokeWidth={2.5} style={{ color: '#F0932B' }} />}
                </div>
                {/* Premium crown badge */}
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F7C948, #F0932B)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--bg)', color: 'white',
                }}>
                  <Crown size={11} strokeWidth={2.5} fill="white" />
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3,
                background: 'linear-gradient(135deg, #F7C948, #F0932B)', WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                <Crown size={10} strokeWidth={2.5} style={{ color: '#F0932B' }} /> Private Story
              </span>
            </div>
          </div>
        </div>

        {/* Name + bio */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>{profileName || 'Your name'}</div>
          {profileBio ? (
            <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {profileBio}
            </div>
          ) : (
            <button
              onClick={openEditProfile}
              style={{ fontSize: 13, color: 'var(--text-3)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}
            >
              + Add a bio
            </button>
          )}
        </div>

        {/* Currently widget */}
        <div style={{ marginBottom: 14 }}>
          {editingStatus ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                autoFocus
                value={statusDraft}
                onChange={e => setStatusDraft(e.target.value.slice(0, 60))}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveStatus();
                  if (e.key === 'Escape') setEditingStatus(false);
                }}
                placeholder="🎧 listening to... / 📍 currently in..."
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 999,
                  border: '1px solid var(--border-light)', background: 'var(--bg-card)',
                  color: 'var(--text-1)', fontSize: 13, fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSaveStatus}
                className="btn-rose"
                style={{ padding: '8px 14px', fontSize: 13, flexShrink: 0 }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingStatus(false)}
                className="icon-btn"
                style={{ width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          ) : currentlyText ? (
            <button
              onClick={() => { setStatusDraft(currentlyText); setEditingStatus(true); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                background: 'rgba(232, 68, 90, 0.1)', border: '1px solid rgba(232, 68, 90, 0.25)',
                color: 'var(--rose)', fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              {currentlyText}
              <Pencil size={11} strokeWidth={2.5} style={{ opacity: 0.6 }} />
            </button>
          ) : (
            <button
              onClick={() => { setStatusDraft(''); setEditingStatus(true); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                background: 'transparent', border: '1px dashed var(--border-light)',
                color: 'var(--text-3)', fontSize: 12.5, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              + Set status
            </button>
          )}
        </div>

        {/* Action buttons - Only Edit Profile now */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button onClick={openEditProfile} className="btn-rose" style={{ flex: 1, padding: '10px 0', fontSize: 14 }}>
            ✏️ Edit Profile
          </button>
          <button onClick={handleShareProfile} className="icon-btn" style={{ width: 40, height: 40, flexShrink: 0 }} aria-label="Share">⊕</button>
        </div>

        {/* 💛 Interests / Passions */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 10, letterSpacing: 0.2 }}>
            INTERESTS
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {interests.map(label => (
              <button
                key={label}
                onClick={() => removeInterest(label)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
                  background: 'rgba(232, 68, 90, 0.12)', border: '1px solid rgba(232, 68, 90, 0.3)',
                  color: 'var(--rose)', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                }}
                title="Tap to remove"
              >
                {label}
                <X size={12} strokeWidth={2.5} style={{ opacity: 0.55 }} />
              </button>
            ))}

            <button
              onClick={() => setAddingInterest(a => !a)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
                background: 'transparent', border: '1px dashed var(--border-light)',
                color: 'var(--text-3)', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
              }}
            >
              <Plus size={13} strokeWidth={2.5} /> Add interest
            </button>
          </div>

          {/* Picker */}
          {addingInterest && (
            <div className="animate-scale-in" style={{
              marginTop: 12, padding: 14, borderRadius: 16,
              background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            }}>
              {/* Custom add */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  value={customInterest}
                  onChange={e => setCustomInterest(e.target.value.slice(0, 24))}
                  onKeyDown={e => { if (e.key === 'Enter' && customInterest.trim()) { addInterest(customInterest); setCustomInterest(''); } }}
                  placeholder="Add your own…"
                  style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border-light)', background: 'var(--bg)', color: 'var(--text-1)', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none' }}
                />
                <button
                  onClick={() => { if (customInterest.trim()) { addInterest(customInterest); setCustomInterest(''); } }}
                  className="btn-rose"
                  style={{ padding: '9px 16px', fontSize: 13, flexShrink: 0 }}
                >
                  Add
                </button>
              </div>

              {/* Suggestions */}
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, letterSpacing: 0.3, marginBottom: 8 }}>SUGGESTED</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {INTEREST_CATALOG.filter(c => !interests.includes(c)).map(label => (
                  <button
                    key={label}
                    onClick={() => addInterest(label)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      color: 'var(--text-2)', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Plus size={12} strokeWidth={2.5} style={{ color: 'var(--rose)' }} /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Story highlights */}
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 18 }}>
          {HIGHLIGHTS.map(h => (
            <div key={h.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: (h as any).isAdd ? 'rgba(255,255,255,0.05)' : 'var(--bg-card)',
                border: (h as any).isAdd ? '1.5px dashed rgba(255,255,255,0.2)' : '1.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: (h as any).isAdd ? 22 : 28,
                color: (h as any).isAdd ? 'var(--text-3)' : undefined,
              }}>{h.emoji}</div>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{h.label}</span>
            </div>
          ))}
        </div>

        {/* Activity heatmap */}
        {posts.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8, letterSpacing: 0.2 }}>
              POSTING ACTIVITY
            </div>
            <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 4 }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
                  {week.map(cell => (
                    <div
                      key={cell.key}
                      title={`${cell.count} post${cell.count === 1 ? '' : 's'} on ${cell.date.toLocaleDateString()}`}
                      style={{
                        width: 9, height: 9, borderRadius: 2.5,
                        background: heatColor(cell.count, max),
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {([
          { key: 'posts',  icon: '⊞', label: 'Posts'  },
          { key: 'tagged', icon: '🏷️', label: 'Tagged' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1, padding: '12px 0', background: 'none', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 600,
              color: activeTab === t.key ? 'var(--text-1)' : 'var(--text-3)',
              borderBottom: activeTab === t.key ? '2px solid var(--rose)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
          </button>
        ))}
      </div>

      {/* Pinned memory card */}
      {activeTab === 'posts' && pinnedPost && (
        <div style={{ padding: '16px 16px 4px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            position: 'relative', width: '78%', maxWidth: 280,
            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            borderRadius: 10, padding: 10, boxShadow: 'var(--shadow-md)',
            transform: 'rotate(-2deg)', transition: 'transform 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'rotate(-2deg) scale(1)')}
          >
            <div style={{
              position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
              width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg, #E8445A, #F97F68)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-rose)', color: 'white',
            }}>
              <Pin size={13} strokeWidth={2.5} />
            </div>
            <img
              src={pinnedPost.imageUrl}
              alt={pinnedPost.caption || 'Pinned memory'}
              style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 6, display: 'block' }}
            />
            {pinnedPost.caption && (
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8, textAlign: 'center', fontStyle: 'italic' }}>
                {pinnedPost.caption}
              </div>
            )}
            <button
              onClick={() => handleTogglePin(pinnedPost.id)}
              style={{
                position: 'absolute', top: 6, right: 6, width: 22, height: 22,
                borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none',
                color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Unpin"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Post grid */}
      <div className="profile-grid" style={{ gap: 2, flex: 1 }}>
        {gridPosts.map((post, i) => (
          <div
            key={post.id || i}
            style={{ aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer', position: 'relative', animation: `fadeIn 0.3s ${i * 0.04}s ease both` }}
          >
            <img
              src={post.imageUrl}
              alt={post.caption || `Post ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
            {/* Overlay */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0, background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
              transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
            >
              <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>❤️ {post.likes || 0}</span>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>💬 {post.commentsCount ?? (post.comments?.length || 0)}</span>
              <button
                onClick={ev => {
                  ev.stopPropagation();
                  handleTogglePin(post.id);
                }}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                  width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'white',
                }}
                aria-label={pinnedPostId === post.id ? 'Unpin from top' : 'Pin as memory'}
                title={pinnedPostId === post.id ? 'Unpin' : 'Pin as memory'}
              >
                <Pin size={13} strokeWidth={2.5} fill={pinnedPostId === post.id ? 'white' : 'none'} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Avatar customizer */}
      {showAvatarEditor && (
        <AvatarEditor
          currentUrl={avatarUrl ? api.fileUrl(avatarUrl) : ''}
          onSave={saveAvatar}
          onRemove={removeAvatar}
          onClose={() => setShowAvatarEditor(false)}
        />
      )}

      {/* Edit Profile modal */}
      {editingProfile && (
        <div
          onClick={() => !savingProfile && setEditingProfile(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="animate-scale-in"
            style={{
              width: '100%', maxWidth: 360, background: 'var(--bg-card)',
              border: '1px solid var(--border-light)', borderRadius: 22, padding: 22,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>Edit profile</span>
              <button onClick={() => !savingProfile && setEditingProfile(false)} className="icon-btn" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close"><X size={18} /></button>
            </div>

            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-3)', fontWeight: 700, letterSpacing: 0.3, marginBottom: 6 }}>NAME</label>
            <input
              autoFocus
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value.slice(0, 60))}
              placeholder="Your name"
              style={{ width: '100%', padding: '11px 13px', borderRadius: 12, border: '1px solid var(--border-light)', background: 'var(--bg)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', marginBottom: 16 }}
            />

            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-3)', fontWeight: 700, letterSpacing: 0.3, marginBottom: 6 }}>BIO</label>
            <textarea
              value={bioDraft}
              onChange={e => setBioDraft(e.target.value.slice(0, 300))}
              placeholder="Tell people about yourself…"
              rows={4}
              style={{ width: '100%', padding: '11px 13px', borderRadius: 12, border: '1px solid var(--border-light)', background: 'var(--bg)', color: 'var(--text-1)', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{bioDraft.length}/300</div>

            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button
                onClick={() => setEditingProfile(false)}
                disabled={savingProfile}
                style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={savingProfile || !nameDraft.trim()}
                className="btn-rose"
                style={{ flex: 1, padding: '11px 0', fontSize: 14, opacity: savingProfile || !nameDraft.trim() ? 0.6 : 1 }}
              >
                {savingProfile ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium upsell modal */}
      {showPremiumModal && (
        <div
          onClick={() => setShowPremiumModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="animate-scale-in"
            style={{
              position: 'relative', width: '100%', maxWidth: 340,
              background: 'var(--bg-card)', border: '1px solid rgba(247, 201, 72, 0.3)',
              borderRadius: 24, padding: '28px 24px', textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden',
            }}
          >
            {/* Glow */}
            <div style={{
              position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
              width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(247,201,72,0.25), transparent 70%)',
              pointerEvents: 'none',
            }} />

            <button
              onClick={() => setShowPremiumModal(false)}
              className="icon-btn"
              style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div style={{
              width: 68, height: 68, borderRadius: '50%', margin: '4px auto 16px',
              background: 'linear-gradient(135deg, #F7C948, #F0932B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(240, 147, 43, 0.45)', position: 'relative', zIndex: 1,
            }}>
              <Crown size={32} strokeWidth={2} fill="white" color="white" />
            </div>

            <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: -0.5, marginBottom: 6, position: 'relative', zIndex: 1 }}>
              Private Stories
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 14,
              padding: '3px 10px', borderRadius: 999,
              background: 'linear-gradient(135deg, #F7C948, #F0932B)',
              color: 'white', fontSize: 11, fontWeight: 800, letterSpacing: 0.5, position: 'relative', zIndex: 1,
            }}>
              <Sparkles size={11} strokeWidth={2.5} /> PREMIUM
            </div>

            <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 20, position: 'relative', zIndex: 1 }}>
              Share moments only <b>you</b> can see. Unlock Private Stories and go ad-free with <b>Spark Premium</b>.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, position: 'relative', zIndex: 1 }}>
              {['Unlimited private stories', 'Hidden from everyone but you', 'Priority likes & unlimited swipes'].map(feat => (
                <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', textAlign: 'left' }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(247, 201, 72, 0.15)', color: '#F0932B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900,
                  }}>✓</span>
                  {feat}
                </div>
              ))}
            </div>

            <button
              onClick={handleUnlockPremium}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #F7C948, #F0932B)', color: 'white',
                fontSize: 15, fontWeight: 800, fontFamily: 'Inter, sans-serif',
                boxShadow: '0 8px 20px rgba(240, 147, 43, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                position: 'relative', zIndex: 1,
              }}
            >
              <Crown size={17} strokeWidth={2.5} fill="white" /> Unlock Premium
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10, position: 'relative', zIndex: 1 }}>
              $9.99/mo · Cancel anytime
            </div>
          </div>
        </div>
      )}

      {/* Private story viewer */}
      {viewerStory && (
        <div
          onClick={() => setViewerStory(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', width: '100%', maxWidth: 380, animation: 'fadeIn 0.2s ease' }}
          >
            {/* Private label */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10,
              padding: '5px 12px', borderRadius: 999,
              background: 'rgba(232, 68, 90, 0.15)', border: '1px solid rgba(232, 68, 90, 0.3)',
              color: 'var(--rose)', fontSize: 12, fontWeight: 600,
            }}>
              <Lock size={12} strokeWidth={2.5} /> Only you can see this
            </div>
            <img
              src={api.fileUrl(viewerStory.url)}
              alt="Private story"
              style={{ width: '100%', borderRadius: 16, display: 'block', maxHeight: '70vh', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => handleRemoveStory(viewerStory.id)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, border: '1px solid var(--border-light)',
                  background: 'var(--bg-card)', color: 'var(--rose)', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <X size={16} /> Delete story
              </button>
              <button
                onClick={() => setViewerStory(null)}
                className="btn-rose"
                style={{ flex: 1, padding: '10px 0', fontSize: 14 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MENU PANELS ============ */}

      {activePanel === 'menu' && (
        <PanelShell title={profileName?.toLowerCase().replace(/\s+/g, '_') || 'Menu'} onBack={() => setActivePanel(null)}>
          {/* Premium banner */}
          {!isPremium && (
            <button
              onClick={() => { setActivePanel(null); setShowPremiumModal(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                padding: 16, marginBottom: 18, borderRadius: 16, cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(247,201,72,0.15), rgba(240,147,43,0.1))',
                border: '1px solid rgba(247, 201, 72, 0.35)', fontFamily: 'Inter, sans-serif',
              }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #F7C948, #F0932B)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(240,147,43,0.4)' }}>
                <Crown size={22} fill="white" color="white" />
              </div>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--text-1)' }}>Upgrade to Premium</span>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>Private stories, unlimited swipes & more</span>
              </span>
              <ChevronRight size={20} color="#F0932B" />
            </button>
          )}

          <Group>
            <Row icon={<Lock size={18} />} label="Privacy" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => setActivePanel('privacy')} />
            <div className="divider" />
            <Row icon={<Shield size={18} />} label="Security" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => setActivePanel('security')} />
            <div className="divider" />
            <Row icon={<UserCog size={18} />} label="Account Center" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => setActivePanel('account')} />
          </Group>

          <Group>
            <Row icon={<Activity size={18} />} label="Activity" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => setActivePanel('activity')} />
            <div className="divider" />
            <Row icon={<Ban size={18} />} label="Blocked" sub={`${blocked.length} account${blocked.length === 1 ? '' : 's'}`} right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => setActivePanel('blocked')} />
            <div className="divider" />
            <Row icon={<Bell size={18} />} label="Notifications" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => setActivePanel('notifications')} />
            <div className="divider" />
            <Row icon={<Settings size={18} />} label="Settings" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => setActivePanel('settings')} />
          </Group>

          <Group>
            <Row icon={<Share2 size={18} />} label="Share profile" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => { setActivePanel(null); handleShareProfile(); }} />
            <div className="divider" />
            <Row icon={<HelpCircle size={18} />} label="Help center" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => {}} />
          </Group>

          <Group>
            <Row icon={<LogOut size={18} />} label="Log out" danger onClick={onLogout} />
          </Group>

          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>Spark · v1.0.0</div>
        </PanelShell>
      )}

      {activePanel === 'privacy' && (
        <PanelShell title="Privacy" onBack={() => setActivePanel('menu')}>
          <Group title="Account privacy">
            <Row icon={<Lock size={18} />} label="Private account" sub="Only approved followers see your posts" right={<Toggle on={privacy.privateAccount} onClick={flip(setPrivacy, 'privateAccount')} />} />
            <div className="divider" />
            <Row icon={<Eye size={18} />} label="Hide from search" sub="Don't appear in name search" right={<Toggle on={privacy.hideFromSearch} onClick={flip(setPrivacy, 'hideFromSearch')} />} />
          </Group>
          <Group title="Interactions">
            <Row icon={<Activity size={18} />} label="Show activity status" sub="Let matches see when you're active" right={<Toggle on={privacy.activityStatus} onClick={flip(setPrivacy, 'activityStatus')} />} />
            <div className="divider" />
            <Row icon={<MessageCircle size={18} />} label="Read receipts" sub="Show when you've read messages" right={<Toggle on={privacy.readReceipts} onClick={flip(setPrivacy, 'readReceipts')} />} />
            <div className="divider" />
            <Row icon={<Bell size={18} />} label="Allow message requests" right={<Toggle on={privacy.messageRequests} onClick={flip(setPrivacy, 'messageRequests')} />} />
            <div className="divider" />
            <Row icon={<Globe size={18} />} label="Show distance" sub="Display distance on your profile" right={<Toggle on={privacy.showDistance} onClick={flip(setPrivacy, 'showDistance')} />} />
          </Group>
        </PanelShell>
      )}

      {activePanel === 'security' && (
        <PanelShell title="Security" onBack={() => setActivePanel('menu')}>
          <Group title="Login">
            <Row icon={<Shield size={18} />} label="Two-factor authentication" sub={security.twoFactor ? 'On · via SMS' : 'Off'} right={<Toggle on={security.twoFactor} onClick={flip(setSecurity, 'twoFactor')} />} />
            <div className="divider" />
            <Row icon={<Smartphone size={18} />} label="Biometric unlock" sub="Face ID / fingerprint" right={<Toggle on={security.biometric} onClick={flip(setSecurity, 'biometric')} />} />
            <div className="divider" />
            <Row icon={<Bell size={18} />} label="Login alerts" sub="Notify me of new logins" right={<Toggle on={security.loginAlerts} onClick={flip(setSecurity, 'loginAlerts')} />} />
          </Group>
          <Group title="Password">
            <Row icon={<KeyRound size={18} />} label="Change password" sub="Last changed 3 months ago" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => {}} />
          </Group>
          <Group title="Where you're logged in">
            <Row icon={<Smartphone size={18} />} label="iPhone 15 · New York" sub="This device · active now" right={<span style={{ fontSize: 12, color: '#3ECf8E', fontWeight: 700 }}>●</span>} />
            <div className="divider" />
            <Row icon={<Globe size={18} />} label="Chrome · MacBook" sub="Last active 2h ago" right={<span style={{ fontSize: 12, color: 'var(--rose)', fontWeight: 600 }}>Log out</span>} onClick={() => {}} />
          </Group>
        </PanelShell>
      )}

      {activePanel === 'account' && (
        <PanelShell title="Account Center" onBack={() => setActivePanel('menu')}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0 20px' }}>
            <div className="story-ring"><div className="story-inner"><img src={avatarUrl ? api.fileUrl(avatarUrl) : '/p2.png'} alt="You" style={{ width: 76, height: 76, objectFit: 'cover', display: 'block' }} /></div></div>
            <div style={{ fontWeight: 800, fontSize: 17, marginTop: 10 }}>{profileName || 'Your name'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{user?.email || 'you@spark.app'}</div>
            {isPremium && (
              <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, background: 'linear-gradient(135deg, #F7C948, #F0932B)', color: 'white', fontSize: 11, fontWeight: 800 }}>
                <Crown size={12} fill="white" /> PREMIUM
              </div>
            )}
          </div>
          <Group title="Profile">
            <Row icon={<UserCog size={18} />} label="Personal details" sub="Name, birthday, gender" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => {}} />
            <div className="divider" />
            <Row icon={<Pencil size={18} />} label="Edit profile" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => {}} />
          </Group>
          <Group title="Subscription">
            <Row icon={<Crown size={18} />} label={isPremium ? 'Spark Premium' : 'Upgrade to Premium'} sub={isPremium ? 'Active · renews monthly' : 'Unlock private stories & more'} right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => { setActivePanel(null); setShowPremiumModal(true); }} />
          </Group>
          <Group title="Connected">
            <Row icon={<Globe size={18} />} label="Instagram" sub="Not connected" right={<span style={{ fontSize: 13, color: 'var(--rose)', fontWeight: 600 }}>Connect</span>} onClick={() => {}} />
            <div className="divider" />
            <Row icon={<Globe size={18} />} label="Spotify" sub="Not connected" right={<span style={{ fontSize: 13, color: 'var(--rose)', fontWeight: 600 }}>Connect</span>} onClick={() => {}} />
          </Group>
          <Group>
            <Row icon={<Trash2 size={18} />} label="Deactivate account" danger onClick={() => {}} right={<ChevronRight size={18} color="var(--rose)" />} />
          </Group>
        </PanelShell>
      )}

      {activePanel === 'activity' && (
        <PanelShell title="Activity" onBack={() => setActivePanel('menu')}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            {[
              { label: 'Likes given', value: '128', icon: <Heart size={16} fill="var(--rose)" color="var(--rose)" /> },
              { label: 'Matches', value: '24', icon: <Sparkles size={16} color="var(--rose)" /> },
              { label: 'Posts', value: posts.length.toString(), icon: <Star size={16} color="var(--rose)" /> },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <Group title="Recent activity">
            {activityFeed.map((a, i) => (
              <div key={a.id}>
                {i > 0 && <div className="divider" />}
                <Row icon={<span style={{ fontSize: 18 }}>{a.icon}</span>} label={a.text} sub={a.when} />
              </div>
            ))}
          </Group>
        </PanelShell>
      )}

      {activePanel === 'blocked' && (
        <PanelShell title="Blocked" onBack={() => setActivePanel('menu')}>
          {blocked.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-3)' }}>
              <Ban size={40} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>No blocked accounts</div>
              <div style={{ fontSize: 13 }}>People you block will appear here.</div>
            </div>
          ) : (
            <Group title={`${blocked.length} blocked`}>
              {blocked.map((b, i) => (
                <div key={b.id}>
                  {i > 0 && <div className="divider" />}
                  <Row
                    icon={<div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--text-2)' }}>{b.name[0]}</div>}
                    label={b.name}
                    sub={b.handle}
                    right={<button onClick={() => unblock(b.id)} className="icon-btn" style={{ padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>Unblock</button>}
                  />
                </div>
              ))}
            </Group>
          )}
        </PanelShell>
      )}

      {activePanel === 'notifications' && (
        <PanelShell title="Notifications" onBack={() => setActivePanel('menu')}>
          <Group title="Push notifications">
            <Row icon={<Heart size={18} />} label="Likes" right={<Toggle on={notifs.likes} onClick={flip(setNotifs, 'likes')} />} />
            <div className="divider" />
            <Row icon={<Sparkles size={18} />} label="New matches" right={<Toggle on={notifs.matches} onClick={flip(setNotifs, 'matches')} />} />
            <div className="divider" />
            <Row icon={<MessageCircle size={18} />} label="Messages" right={<Toggle on={notifs.messages} onClick={flip(setNotifs, 'messages')} />} />
            <div className="divider" />
            <Row icon={<Star size={18} />} label="Super Likes" right={<Toggle on={notifs.superLikes} onClick={flip(setNotifs, 'superLikes')} />} />
          </Group>
          <Group title="From Spark">
            <Row icon={<Bell size={18} />} label="Promotions & tips" right={<Toggle on={notifs.promos} onClick={flip(setNotifs, 'promos')} />} />
            <div className="divider" />
            <Row icon={<FileText size={18} />} label="Email notifications" right={<Toggle on={notifs.email} onClick={flip(setNotifs, 'email')} />} />
          </Group>
        </PanelShell>
      )}

      {activePanel === 'settings' && (
        <PanelShell title="Settings" onBack={() => setActivePanel('menu')}>
          <Group title="Preferences">
            <Row icon={<Eye size={18} />} label="Show online status" right={<Toggle on={prefs.showOnlineStatus} onClick={flip(setPrefs, 'showOnlineStatus')} />} />
            <div className="divider" />
            <Row icon={<Moon size={18} />} label="Data saver" sub="Load lower-res images" right={<Toggle on={prefs.dataSaver} onClick={flip(setPrefs, 'dataSaver')} />} />
            <div className="divider" />
            <Row icon={<Globe size={18} />} label="Distance units" right={
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', borderRadius: 999, padding: 3 }}>
                {(['mi', 'km'] as const).map(u => (
                  <button key={u} onClick={() => setPrefs(p => ({ ...p, units: u }))} style={{
                    padding: '4px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: prefs.units === u ? 'var(--rose)' : 'transparent', color: prefs.units === u ? 'white' : 'var(--text-3)',
                  }}>{u}</button>
                ))}
              </div>
            } />
          </Group>
          <Group title="Shortcuts">
            <Row icon={<Lock size={18} />} label="Privacy" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => setActivePanel('privacy')} />
            <div className="divider" />
            <Row icon={<Shield size={18} />} label="Security" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => setActivePanel('security')} />
            <div className="divider" />
            <Row icon={<Bell size={18} />} label="Notifications" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => setActivePanel('notifications')} />
          </Group>
          <Group title="Support">
            <Row icon={<HelpCircle size={18} />} label="Help center" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => {}} />
            <div className="divider" />
            <Row icon={<FileText size={18} />} label="Terms & Privacy Policy" right={<ChevronRight size={18} color="var(--text-3)" />} onClick={() => {}} />
          </Group>
          <Group>
            <Row icon={<LogOut size={18} />} label="Log out" danger onClick={onLogout} />
          </Group>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>Spark · v1.0.0</div>
        </PanelShell>
      )}
    </div>
  );
};
