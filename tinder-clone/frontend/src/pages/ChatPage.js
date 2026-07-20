import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Check, CheckCheck } from 'lucide-react';
import { getSocket } from '../services/socket';
import { api } from '../services/api';
const fmtTime = (iso) => {
    if (!iso)
        return '';
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};
export const ChatPage = ({ matchId, matchName, matchPhoto, myId, isOnline, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [theyTyping, setTheyTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeout = useRef(null);
    // Load history + wire socket events for this thread
    useEffect(() => {
        const socket = getSocket();
        socket.emit('join_chat', matchId);
        api.getMessages(matchId)
            .then(({ messages }) => setMessages(messages || []))
            .catch(() => { });
        api.markRead(matchId);
        const onNew = (msg) => {
            setMessages(prev => {
                // Reconcile our own optimistic message with the server echo
                if (msg.senderId === myId) {
                    const idx = prev.findIndex(m => m.pending && m.content === msg.content);
                    if (idx !== -1) {
                        const copy = [...prev];
                        copy[idx] = msg;
                        return copy;
                    }
                }
                if (prev.some(m => m.id === msg.id))
                    return prev;
                return [...prev, msg];
            });
            // Their message arrived while we're looking — mark read immediately
            if (msg.senderId !== myId) {
                socket.emit('mark_read', { matchId });
                setTheyTyping(false);
            }
        };
        const onTyping = ({ matchId: mid, userId, isTyping }) => {
            if (mid === matchId && userId !== myId)
                setTheyTyping(isTyping);
        };
        const onRead = ({ matchId: mid, by }) => {
            if (mid === matchId && by !== myId) {
                setMessages(prev => prev.map(m => (m.senderId === myId && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m)));
            }
        };
        socket.on('new_message', onNew);
        socket.on('typing', onTyping);
        socket.on('messages_read', onRead);
        return () => {
            socket.emit('leave_chat', matchId);
            socket.off('new_message', onNew);
            socket.off('typing', onTyping);
            socket.off('messages_read', onRead);
        };
    }, [matchId, myId]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, theyTyping]);
    const emitTyping = (isTyping) => {
        getSocket().emit('typing', { matchId, isTyping });
    };
    const handleInput = (val) => {
        setInput(val);
        emitTyping(true);
        if (typingTimeout.current)
            clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => emitTyping(false), 1500);
    };
    const sendMessage = (e) => {
        e.preventDefault();
        const content = input.trim();
        if (!content)
            return;
        // Optimistic bubble; server echo will replace it with the saved record
        setMessages(prev => [...prev, { id: `tmp_${Date.now()}`, senderId: myId, content, sentAt: new Date().toISOString(), pending: true }]);
        getSocket().emit('send_message', { matchId, content });
        emitTyping(false);
        setInput('');
    };
    // Index of the last message I sent — for showing a single read receipt
    const lastMineIdx = (() => {
        for (let i = messages.length - 1; i >= 0; i--)
            if (messages[i].senderId === myId)
                return i;
        return -1;
    })();
    return (_jsxs("div", { className: "app-shell", style: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }, children: [_jsxs("div", { className: "top-bar", style: { display: 'flex', alignItems: 'center', gap: 12 }, children: [_jsx("button", { className: "icon-btn", onClick: onBack, "aria-label": "Go back", style: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(ArrowLeft, { size: 20, strokeWidth: 2 }) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [_jsxs("div", { style: { position: 'relative' }, children: [_jsx("img", { src: matchPhoto, alt: matchName, style: { width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' } }), isOnline && _jsx("div", { style: { position: 'absolute', bottom: -1, right: -1, width: 11, height: 11, borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--bg)' } })] }), _jsxs("div", { children: [_jsx("h2", { style: { margin: 0, fontSize: 16, fontWeight: 800, lineHeight: 1.1 }, children: matchName }), _jsx("span", { style: { fontSize: 12, color: theyTyping ? 'var(--rose)' : 'var(--text-3)', fontWeight: theyTyping ? 600 : 400 }, children: theyTyping ? 'typing…' : isOnline ? 'Active now' : 'Offline' })] })] })] }), _jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 3 }, children: [messages.length === 0 && (_jsxs("div", { style: { textAlign: 'center', color: 'var(--text-3)', marginTop: 60 }, children: [_jsx("img", { src: matchPhoto, alt: matchName, style: { width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 } }), _jsxs("p", { style: { margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }, children: ["You matched with ", matchName] }), _jsx("p", { style: { margin: '4px 0 0', fontSize: 13 }, children: "Say hi and start the conversation \uD83D\uDC4B" })] })), messages.map((msg, i) => {
                        const mine = msg.senderId === myId;
                        const prev = messages[i - 1];
                        const grouped = prev && prev.senderId === msg.senderId;
                        return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', marginTop: grouped ? 0 : 8 }, children: [_jsx("div", { className: mine ? 'bubble-me' : 'bubble-them', style: { opacity: msg.pending ? 0.7 : 1 }, children: msg.content }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, padding: '0 4px' }, children: [_jsx("span", { style: { fontSize: 10.5, color: 'var(--text-3)' }, children: fmtTime(msg.sentAt) }), mine && i === lastMineIdx && !msg.pending && (msg.readAt
                                            ? _jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: 2, fontSize: 10.5, color: 'var(--rose)', fontWeight: 600 }, children: [_jsx(CheckCheck, { size: 13 }), " Seen"] })
                                            : _jsx(Check, { size: 13, style: { color: 'var(--text-3)' } }))] })] }, msg.id));
                    }), theyTyping && (_jsx("div", { className: "bubble-them", style: { display: 'inline-flex', gap: 4, padding: '12px 16px', alignSelf: 'flex-start', marginTop: 8 }, children: [0, 1, 2].map(i => (_jsx("span", { style: { width: 7, height: 7, borderRadius: '50%', background: 'var(--text-3)', animation: `typingBounce 1s ${i * 0.15}s infinite` } }, i))) })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("form", { onSubmit: sendMessage, style: { padding: 16, background: 'var(--bg-card)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }, children: [_jsx("input", { className: "inp", value: input, onChange: e => handleInput(e.target.value), placeholder: "Type a message...", style: { borderRadius: 50, flex: 1 } }), _jsx("button", { type: "submit", className: "btn-rose", style: { width: 44, height: 44, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }, disabled: !input.trim(), children: _jsx(Send, { size: 18, strokeWidth: 2.5, style: { marginLeft: 2 } }) })] })] }));
};
//# sourceMappingURL=ChatPage.js.map