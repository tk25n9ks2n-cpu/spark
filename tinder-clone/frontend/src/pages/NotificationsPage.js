import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Sparkles, MessageCircle, BellOff } from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
const relTime = (iso) => {
    if (!iso)
        return '';
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60)
        return 'now';
    if (s < 3600)
        return `${Math.floor(s / 60)}m ago`;
    if (s < 86400)
        return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800)
        return `${Math.floor(s / 86400)}d ago`;
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
};
export const NotificationsPage = ({ onBack, onOpenChat }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = () => api.getNotifications()
        .then(({ notifications }) => setItems(notifications || []))
        .catch(() => { })
        .finally(() => setLoading(false));
    useEffect(() => { load(); }, []);
    // Refresh automatically when new activity arrives over the socket
    useEffect(() => {
        const socket = getSocket();
        const refresh = () => load();
        socket.on('conversation_update', refresh);
        return () => { socket.off('conversation_update', refresh); };
    }, []);
    const openItem = (n) => {
        if ((n.type === 'message' || n.type === 'match') && n.matchId && onOpenChat) {
            onOpenChat({
                id: n.matchId,
                user: { id: n.user.id, name: n.user.name, photo: n.user.photo },
                lastMessage: null, unread: 0, updatedAt: n.time,
            });
        }
    };
    return (_jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }, children: [_jsxs("div", { className: "top-bar", style: { display: 'flex', alignItems: 'center', gap: 16 }, children: [_jsx("button", { className: "icon-btn", onClick: onBack, "aria-label": "Go back", style: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(ArrowLeft, { size: 20, strokeWidth: 2 }) }), _jsx("h2", { style: { margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }, children: "Notifications" })] }), _jsx("div", { style: { flex: 1, overflowY: 'auto', padding: '8px 0' }, children: loading ? (_jsx("p", { style: { textAlign: 'center', color: 'var(--text-3)', marginTop: 40, fontSize: 14 }, children: "Loading\u2026" })) : items.length === 0 ? (_jsxs("div", { style: { textAlign: 'center', color: 'var(--text-3)', marginTop: 70, padding: '0 32px' }, children: [_jsx(BellOff, { size: 44, strokeWidth: 1.5, style: { opacity: 0.4, marginBottom: 12 } }), _jsx("p", { style: { fontSize: 15, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 4px' }, children: "No notifications yet" }), _jsx("p", { style: { fontSize: 13, margin: 0 }, children: "Likes, matches, and messages will show up here." })] })) : (items.map(n => {
                    const clickable = (n.type === 'message' || n.type === 'match') && !!n.matchId;
                    return (_jsxs("div", { onClick: () => openItem(n), style: {
                            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                            borderBottom: '1px solid var(--border-light)', cursor: clickable ? 'pointer' : 'default',
                            background: n.unread ? 'rgba(232,68,90,0.05)' : 'transparent',
                        }, children: [_jsx("div", { className: n.type === 'match' ? 'story-ring' : 'story-ring-seen', style: { flexShrink: 0 }, children: _jsx("div", { className: "story-inner", children: _jsx("img", { src: api.fileUrl(n.user.photo), alt: n.user.name, style: { width: 42, height: 42, objectFit: 'cover', display: 'block' } }) }) }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsxs("div", { style: { fontSize: 14, color: 'var(--text-1)', lineHeight: 1.4 }, children: [_jsx("span", { style: { fontWeight: 700, marginRight: 4 }, children: n.user.name }), _jsx("span", { style: { color: 'var(--text-2)' }, children: n.text })] }), _jsx("div", { style: { fontSize: 12, color: 'var(--text-4)', marginTop: 4 }, children: relTime(n.time) })] }), _jsxs("div", { style: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated, rgba(255,255,255,0.05))' }, children: [n.type === 'like' && _jsx(Heart, { size: 16, fill: "var(--rose)", color: "var(--rose)" }), n.type === 'match' && _jsx(Sparkles, { size: 16, color: "var(--rose)" }), n.type === 'message' && _jsx(MessageCircle, { size: 16, color: "var(--rose)" })] })] }, n.id));
                })) })] }));
};
//# sourceMappingURL=NotificationsPage.js.map