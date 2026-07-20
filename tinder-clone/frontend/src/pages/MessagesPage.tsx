import { useState, useEffect, useRef } from 'react';
import { ChatPage } from './ChatPage';
import { Edit3, Search, ArrowLeft, MessageSquarePlus, Trash2, X, Check } from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

interface Convo {
  id: string;
  user: { id: string; name: string; photo: string };
  lastMessage: { content: string; senderId: string; sentAt: string } | null;
  unread: number;
  updatedAt: string;
}

const relTime = (iso?: string) => {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const MessagesPage = ({ onBack, user, initialChat, onChatConsumed }: { onBack?: () => void; user: any; initialChat?: Convo | null; onChatConsumed?: () => void }) => {
  const myId = user?.id;
  const [search, setSearch] = useState('');
  const [activeChat, setActiveChat] = useState<Convo | null>(null);
  const [convos, setConvos] = useState<Convo[]>([]);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [manage, setManage] = useState(false);
  const [people, setPeople] = useState<{ id: string; name: string; photo: string }[]>([]);
  const [viewProfile, setViewProfile] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const activeChatRef = useRef<Convo | null>(null);
  activeChatRef.current = activeChat;

  const load = () =>
    api.getConversations()
      .then(({ conversations }) => setConvos(conversations || []))
      .catch(() => {});

  // Clean up the old auto-seeded demo chats, then load real conversations
  useEffect(() => {
    (async () => {
      try { await api.cleanupDemoChats(); } catch { /* ignore */ }
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
    const onPresence = (ids: string[]) => setOnline(new Set(ids));
    const onUpdate = ({ matchId, message }: any) => {
      setConvos(prev => {
        // If we don't have this conversation yet (a new match messaged us), reload
        if (!prev.some(c => c.id === matchId)) { load(); return prev; }
        const next = prev.map(c =>
          c.id === matchId
            ? {
                ...c,
                lastMessage: { content: message.content, senderId: message.senderId, sentAt: message.sentAt },
                updatedAt: message.sentAt,
                unread: activeChatRef.current?.id === matchId ? 0 : c.unread + 1,
              }
            : c
        );
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
    if (!q) { setPeople([]); return; }
    const t = setTimeout(async () => {
      try {
        const { users } = await api.search(q);
        setPeople((users || []).filter((u: any) => u.id !== myId));
      } catch { /* ignore */ }
    }, 220);
    return () => clearTimeout(t);
  }, [search, myId]);

  const openChat = (c: Convo) => {
    setConvos(prev => prev.map(x => (x.id === c.id ? { ...x, unread: 0 } : x)));
    setActiveChat(c);
  };

  const closeChat = () => { setActiveChat(null); load(); };

  const openProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const data = await api.getPublicProfile(userId);
      setViewProfile(data);
    } catch { /* ignore */ }
    setProfileLoading(false);
  };

  const messageUser = async (userId: string) => {
    try {
      const { conversation } = await api.startChat(userId);
      setViewProfile(null);
      setSearch('');
      setConvos(prev => (prev.some(c => c.id === conversation.id) ? prev : [conversation, ...prev]));
      setActiveChat(conversation);
    } catch { /* ignore */ }
  };

  const removeConvo = async (id: string) => {
    setConvos(prev => prev.filter(c => c.id !== id));
    try { await api.deleteConversation(id); } catch { /* ignore */ }
  };

  const filtered = convos.filter(c => c.user.name.toLowerCase().includes(search.toLowerCase()));
  const activeNow = convos.filter(c => online.has(c.user.id));
  const totalUnread = convos.reduce((n, c) => n + c.unread, 0);
  // People found in search who aren't already in the conversation list
  const newPeople = people.filter(p => !convos.some(c => c.user.id === p.id));

  if (activeChat) {
    return (
      <ChatPage
        matchId={activeChat.id}
        matchName={activeChat.user.name}
        matchPhoto={api.fileUrl(activeChat.user.photo)}
        myId={myId}
        isOnline={online.has(activeChat.user.id)}
        onBack={closeChat}
      />
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button className="icon-btn" onClick={onBack} aria-label="Go back" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
          )}
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}>
            Messages{totalUnread > 0 && <span style={{ fontSize: 13, color: 'var(--rose)', fontWeight: 700, marginLeft: 8 }}>{totalUnread} new</span>}
          </h2>
        </div>
        <button className="icon-btn" onClick={() => setManage(m => !m)} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: manage ? 'var(--rose)' : undefined }} aria-label="Manage">
          {manage ? <Check size={19} strokeWidth={2.5} /> : <Edit3 size={18} strokeWidth={2} />}
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: 'var(--text-3)', pointerEvents: 'none' }}>
            <Search size={18} />
          </div>
          <input className="inp" placeholder="Search people to message…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 42, paddingRight: search ? 38 : 14 }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex' }} aria-label="Clear"><X size={16} /></button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
        {/* People search results */}
        {search.trim() && newPeople.length > 0 && (
          <div style={{ padding: '4px 0 8px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-3)', letterSpacing: 0.4, padding: '4px 16px 6px' }}>PEOPLE</div>
            {newPeople.map(p => (
              <div key={p.id} onClick={() => openProfile(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', cursor: 'pointer' }}>
                <img src={api.fileUrl(p.photo)} alt={p.name} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }} />
                <div style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{p.name}</div>
                <button onClick={e => { e.stopPropagation(); messageUser(p.id); }} className="btn-rose" style={{ padding: '7px 14px', fontSize: 13 }}>Message</button>
              </div>
            ))}
            <div className="divider" style={{ margin: '8px 16px' }} />
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 40, fontSize: 14 }}>Loading conversations…</p>
        ) : convos.length === 0 && !search.trim() ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 60, padding: '0 32px' }}>
            <MessageSquarePlus size={44} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 4px' }}>No messages yet</p>
            <p style={{ fontSize: 13, margin: 0 }}>Search for someone above to start a chat, or wait for a match to text you.</p>
          </div>
        ) : (
          <>
            {/* Active now */}
            {!search.trim() && activeNow.length > 0 && (
              <>
                <div style={{ padding: '8px 16px 4px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', letterSpacing: 1, textTransform: 'uppercase' }}>Active now</p>
                  <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12 }}>
                    {activeNow.map(c => (
                      <div key={c.id} onClick={() => openChat(c)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', flexShrink: 0 }}>
                        <div style={{ position: 'relative' }}>
                          <img src={api.fileUrl(c.user.photo)} alt={c.user.name} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg)' }} />
                          <div style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--bg)' }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>{c.user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="divider" style={{ margin: '0 16px 8px' }} />
              </>
            )}

            {/* Conversation rows */}
            {filtered.map((convo, i) => {
              const isMine = convo.lastMessage?.senderId === myId;
              return (
                <div
                  key={convo.id}
                  onClick={() => !manage && openChat(convo)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: manage ? 'default' : 'pointer', transition: 'background 0.15s', animation: `fadeUp 0.35s ${i * 0.04}s ease both` }}
                  onMouseEnter={e => { if (!manage) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={api.fileUrl(convo.user.photo)} alt={convo.user.name} style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', border: convo.unread > 0 ? '2.5px solid var(--rose)' : '2px solid rgba(255,255,255,0.08)' }} />
                    {online.has(convo.user.id) && (
                      <div style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--bg)' }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontWeight: convo.unread > 0 ? 800 : 600, fontSize: 15, color: 'var(--text-1)' }}>{convo.user.name}</span>
                      <span style={{ fontSize: 11, color: convo.unread > 0 ? 'var(--rose)' : 'var(--text-3)', flexShrink: 0, marginLeft: 8, fontWeight: convo.unread > 0 ? 700 : 400 }}>{relTime(convo.updatedAt)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: convo.unread > 0 ? 'var(--text-2)' : 'var(--text-3)', fontWeight: convo.unread > 0 ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {convo.lastMessage ? `${isMine ? 'You: ' : ''}${convo.lastMessage.content}` : 'Say hi 👋'}
                      </span>
                      {convo.unread > 0 && (
                        <div style={{ minWidth: 20, height: 20, borderRadius: 10, background: 'linear-gradient(135deg, #E8445A, #F97F68)', color: 'white', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0, marginLeft: 8 }}>{convo.unread}</div>
                      )}
                    </div>
                  </div>

                  {manage && (
                    <button onClick={e => { e.stopPropagation(); removeConvo(convo.id); }} style={{ background: 'rgba(232,68,90,0.12)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--rose)', flexShrink: 0 }} aria-label="Delete conversation">
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              );
            })}

            {search.trim() && filtered.length === 0 && newPeople.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 40, fontSize: 14 }}>No people or chats match "{search}"</p>
            )}
          </>
        )}
      </div>

      {/* User profile modal */}
      {(viewProfile || profileLoading) && (
        <div onClick={() => setViewProfile(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
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
