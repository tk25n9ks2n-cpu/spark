import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { ChatPage } from './ChatPage';
import { Edit3, Search, ArrowLeft, MessageSquarePlus, Trash2, X, Check } from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
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
    if (s < 604800)
        return `${Math.floor(s / 86400)}d`;
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
};
export const MessagesPage = ({ onBack, user, initialChat, onChatConsumed }) => {
    const myId = user?.id;
    const [search, setSearch] = useState('');
    const [activeChat, setActiveChat] = useState(null);
    const [convos, setConvos] = useState([]);
    const [online, setOnline] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [manage, setManage] = useState(false);
    const [people, setPeople] = useState([]);
    const [viewProfile, setViewProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const activeChatRef = useRef(null);
    activeChatRef.current = activeChat;
    const load = () => api.getConversations()
        .then(({ conversations }) => setConvos(conversations || []))
        .catch(() => { });
    // Clean up the old auto-seeded demo chats, then load real conversations
    useEffect(() => {
        (async () => {
            try {
                await api.cleanupDemoChats();
            }
            catch { /* ignore */ }
            await load();
            setLoading(false);
        })();
    }, []);
    // If we were opened with a specific conversation (from a match / search), open it
    useEffect(() => {
        if (initialChat) {
            setConvos(prev => (prev.some(c => c.id === initialChat.id) ? prev : [initialChat, ...prev]));
            setActiveChat(initialChat);
            onChatConsumed?.();
        }
    }, []);
    // Live presence + incoming-message updates for the whole list
    useEffect(() => {
        const socket = getSocket();
        const onPresence = (ids) => setOnline(new Set(ids));
        const onUpdate = ({ matchId, message }) => {
            setConvos(prev => {
                // If we don't have this conversation yet (a new match messaged us), reload
                if (!prev.some(c => c.id === matchId)) {
                    load();
                    return prev;
                }
                const next = prev.map(c => c.id === matchId
                    ? {
                        ...c,
                        lastMessage: { content: message.content, senderId: message.senderId, sentAt: message.sentAt },
                        updatedAt: message.sentAt,
                        unread: activeChatRef.current?.id === matchId ? 0 : c.unread + 1,
                    }
                    : c);
                next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                return next;
            });
        };
        socket.on('presence', onPresence);
        socket.on('conversation_update', onUpdate);
        return () => {
            socket.off('presence', onPresence);
            socket.off('conversation_update', onUpdate);
        };
    }, []);
    // Live people search (debounced) while typing
    useEffect(() => {
        const q = search.trim();
        if (!q) {
            setPeople([]);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const { users } = await api.search(q);
                setPeople((users || []).filter((u) => u.id !== myId));
            }
            catch { /* ignore */ }
        }, 220);
        return () => clearTimeout(t);
    }, [search, myId]);
    const openChat = (c) => {
        setConvos(prev => prev.map(x => (x.id === c.id ? { ...x, unread: 0 } : x)));
        setActiveChat(c);
    };
    const closeChat = () => { setActiveChat(null); load(); };
    const openProfile = async (userId) => {
        setProfileLoading(true);
        try {
            const data = await api.getPublicProfile(userId);
            setViewProfile(data);
        }
        catch { /* ignore */ }
        setProfileLoading(false);
    };
    const messageUser = async (userId) => {
        try {
            const { conversation } = await api.startChat(userId);
            setViewProfile(null);
            setSearch('');
            setConvos(prev => (prev.some(c => c.id === conversation.id) ? prev : [conversation, ...prev]));
            setActiveChat(conversation);
        }
        catch { /* ignore */ }
    };
    const removeConvo = async (id) => {
        setConvos(prev => prev.filter(c => c.id !== id));
        try {
            await api.deleteConversation(id);
        }
        catch { /* ignore */ }
    };
    const filtered = convos.filter(c => c.user.name.toLowerCase().includes(search.toLowerCase()));
    const activeNow = convos.filter(c => online.has(c.user.id));
    const totalUnread = convos.reduce((n, c) => n + c.unread, 0);
    // People found in search who aren't already in the conversation list
    const newPeople = people.filter(p => !convos.some(c => c.user.id === p.id));
    if (activeChat) {
        return (_jsx(ChatPage, { matchId: activeChat.id, matchName: activeChat.user.name, matchPhoto: api.fileUrl(activeChat.user.photo), myId: myId, isOnline: online.has(activeChat.user.id), onBack: closeChat }));
    }
    return (_jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [_jsxs("div", { className: "top-bar", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12 }, children: [onBack && (_jsx("button", { className: "icon-btn", onClick: onBack, "aria-label": "Go back", style: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(ArrowLeft, { size: 20, strokeWidth: 2 }) })), _jsxs("h2", { style: { margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }, children: ["Messages", totalUnread > 0 && _jsxs("span", { style: { fontSize: 13, color: 'var(--rose)', fontWeight: 700, marginLeft: 8 }, children: [totalUnread, " new"] })] })] }), _jsx("button", { className: "icon-btn", onClick: () => setManage(m => !m), style: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: manage ? 'var(--rose)' : undefined }, "aria-label": "Manage", children: manage ? _jsx(Check, { size: 19, strokeWidth: 2.5 }) : _jsx(Edit3, { size: 18, strokeWidth: 2 }) })] }), _jsx("div", { style: { padding: '12px 16px 0', flexShrink: 0 }, children: _jsxs("div", { style: { position: 'relative' }, children: [_jsx("div", { style: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: 'var(--text-3)', pointerEvents: 'none' }, children: _jsx(Search, { size: 18 }) }), _jsx("input", { className: "inp", placeholder: "Search people to message\u2026", value: search, onChange: e => setSearch(e.target.value), style: { paddingLeft: 42, paddingRight: search ? 38 : 14 } }), search && (_jsx("button", { onClick: () => setSearch(''), style: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex' }, "aria-label": "Clear", children: _jsx(X, { size: 16 }) }))] }) }), _jsxs("div", { style: { flex: 1, overflowY: 'auto', paddingTop: 8 }, children: [search.trim() && newPeople.length > 0 && (_jsxs("div", { style: { padding: '4px 0 8px' }, children: [_jsx("div", { style: { fontSize: 12, fontWeight: 800, color: 'var(--text-3)', letterSpacing: 0.4, padding: '4px 16px 6px' }, children: "PEOPLE" }), newPeople.map(p => (_jsxs("div", { onClick: () => openProfile(p.id), style: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', cursor: 'pointer' }, children: [_jsx("img", { src: api.fileUrl(p.photo), alt: p.name, style: { width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' } }), _jsx("div", { style: { flex: 1, fontSize: 15, fontWeight: 700 }, children: p.name }), _jsx("button", { onClick: e => { e.stopPropagation(); messageUser(p.id); }, className: "btn-rose", style: { padding: '7px 14px', fontSize: 13 }, children: "Message" })] }, p.id))), _jsx("div", { className: "divider", style: { margin: '8px 16px' } })] })), loading ? (_jsx("p", { style: { textAlign: 'center', color: 'var(--text-3)', marginTop: 40, fontSize: 14 }, children: "Loading conversations\u2026" })) : convos.length === 0 && !search.trim() ? (_jsxs("div", { style: { textAlign: 'center', color: 'var(--text-3)', marginTop: 60, padding: '0 32px' }, children: [_jsx(MessageSquarePlus, { size: 44, strokeWidth: 1.5, style: { opacity: 0.4, marginBottom: 12 } }), _jsx("p", { style: { fontSize: 15, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 4px' }, children: "No messages yet" }), _jsx("p", { style: { fontSize: 13, margin: 0 }, children: "Search for someone above to start a chat, or wait for a match to text you." })] })) : (_jsxs(_Fragment, { children: [!search.trim() && activeNow.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { padding: '8px 16px 4px' }, children: [_jsx("p", { style: { margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', letterSpacing: 1, textTransform: 'uppercase' }, children: "Active now" }), _jsx("div", { style: { display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12 }, children: activeNow.map(c => (_jsxs("div", { onClick: () => openChat(c), style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', flexShrink: 0 }, children: [_jsxs("div", { style: { position: 'relative' }, children: [_jsx("img", { src: api.fileUrl(c.user.photo), alt: c.user.name, style: { width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg)' } }), _jsx("div", { style: { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--bg)' } })] }), _jsx("span", { style: { fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }, children: c.user.name })] }, c.id))) })] }), _jsx("div", { className: "divider", style: { margin: '0 16px 8px' } })] })), filtered.map((convo, i) => {
                                const isMine = convo.lastMessage?.senderId === myId;
                                return (_jsxs("div", { onClick: () => !manage && openChat(convo), style: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: manage ? 'default' : 'pointer', transition: 'background 0.15s', animation: `fadeUp 0.35s ${i * 0.04}s ease both` }, onMouseEnter: e => { if (!manage)
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }, onMouseLeave: e => (e.currentTarget.style.background = 'transparent'), children: [_jsxs("div", { style: { position: 'relative', flexShrink: 0 }, children: [_jsx("img", { src: api.fileUrl(convo.user.photo), alt: convo.user.name, style: { width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', border: convo.unread > 0 ? '2.5px solid var(--rose)' : '2px solid rgba(255,255,255,0.08)' } }), online.has(convo.user.id) && (_jsx("div", { style: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--bg)' } }))] }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }, children: [_jsx("span", { style: { fontWeight: convo.unread > 0 ? 800 : 600, fontSize: 15, color: 'var(--text-1)' }, children: convo.user.name }), _jsx("span", { style: { fontSize: 11, color: convo.unread > 0 ? 'var(--rose)' : 'var(--text-3)', flexShrink: 0, marginLeft: 8, fontWeight: convo.unread > 0 ? 700 : 400 }, children: relTime(convo.updatedAt) })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("span", { style: { fontSize: 13, color: convo.unread > 0 ? 'var(--text-2)' : 'var(--text-3)', fontWeight: convo.unread > 0 ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }, children: convo.lastMessage ? `${isMine ? 'You: ' : ''}${convo.lastMessage.content}` : 'Say hi 👋' }), convo.unread > 0 && (_jsx("div", { style: { minWidth: 20, height: 20, borderRadius: 10, background: 'linear-gradient(135deg, #E8445A, #F97F68)', color: 'white', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0, marginLeft: 8 }, children: convo.unread }))] })] }), manage && (_jsx("button", { onClick: e => { e.stopPropagation(); removeConvo(convo.id); }, style: { background: 'rgba(232,68,90,0.12)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--rose)', flexShrink: 0 }, "aria-label": "Delete conversation", children: _jsx(Trash2, { size: 17 }) }))] }, convo.id));
                            }), search.trim() && filtered.length === 0 && newPeople.length === 0 && (_jsxs("p", { style: { textAlign: 'center', color: 'var(--text-3)', marginTop: 40, fontSize: 14 }, children: ["No people or chats match \"", search, "\""] }))] }))] }), (viewProfile || profileLoading) && (_jsx("div", { onClick: () => setViewProfile(null), style: { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }, children: _jsx("div", { onClick: e => e.stopPropagation(), className: "animate-scale-in", style: { width: '100%', maxWidth: 360, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 24, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', maxHeight: '85vh', overflowY: 'auto' }, children: profileLoading || !viewProfile ? (_jsx("p", { style: { textAlign: 'center', color: 'var(--text-3)', padding: 30 }, children: "Loading\u2026" })) : (_jsxs(_Fragment, { children: [_jsx("div", { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }, children: _jsx("button", { onClick: () => setViewProfile(null), className: "icon-btn", style: { width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }, "aria-label": "Close", children: _jsx(X, { size: 16 }) }) }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { className: "story-ring", style: { margin: '0 auto 12px', width: 'fit-content' }, children: _jsx("div", { className: "story-inner", children: _jsx("img", { src: viewProfile.user.avatarUrl ? api.fileUrl(viewProfile.user.avatarUrl) : '/p2.png', alt: viewProfile.user.name, style: { width: 84, height: 84, objectFit: 'cover', display: 'block' } }) }) }), _jsx("div", { style: { fontWeight: 800, fontSize: 20, letterSpacing: -0.3 }, children: viewProfile.user.name }), _jsxs("div", { style: { fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }, children: [viewProfile.postCount, " post", viewProfile.postCount === 1 ? '' : 's'] }), viewProfile.user.bio && _jsx("div", { style: { fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, margin: '12px 0 0', whiteSpace: 'pre-wrap' }, children: viewProfile.user.bio })] }), viewProfile.interests?.length > 0 && (_jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 14 }, children: viewProfile.interests.map((t) => (_jsx("span", { style: { padding: '5px 11px', borderRadius: 999, background: 'rgba(232,68,90,0.12)', border: '1px solid rgba(232,68,90,0.25)', color: 'var(--rose)', fontSize: 12.5, fontWeight: 600 }, children: t }, t))) })), viewProfile.posts?.length > 0 && (_jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, marginTop: 16, borderRadius: 12, overflow: 'hidden' }, children: viewProfile.posts.map((p) => (_jsx("div", { style: { aspectRatio: '1/1', overflow: 'hidden' }, children: _jsx("img", { src: api.fileUrl(p.imageUrl), alt: "", style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }) }, p.id))) })), _jsxs("button", { onClick: () => messageUser(viewProfile.user.id), className: "btn-rose", style: { width: '100%', padding: '13px 0', fontSize: 15, marginTop: 20 }, children: ["\uD83D\uDCAC Message ", viewProfile.user.name] })] })) }) }))] }));
};
//# sourceMappingURL=MessagesPage.js.map