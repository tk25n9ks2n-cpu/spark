import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Sparkles, MessageCircle, BellOff } from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

interface NotificationsPageProps {
  onBack: () => void;
  onOpenChat?: (conversation: any) => void;
}

interface Notif {
  id: string;
  type: 'match' | 'like' | 'message';
  matchId?: string;
  user: { id: string; name: string; photo: string };
  text: string;
  time: string;
  unread?: boolean;
}

const relTime = (iso?: string) => {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const NotificationsPage = ({ onBack, onOpenChat }: NotificationsPageProps) => {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.getNotifications()
      .then(({ notifications }) => setItems(notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // Refresh automatically when new activity arrives over the socket
  useEffect(() => {
    const socket = getSocket();
    const refresh = () => load();
    socket.on('conversation_update', refresh);
    return () => { socket.off('conversation_update', refresh); };
  }, []);

  const openItem = (n: Notif) => {
    if ((n.type === 'message' || n.type === 'match') && n.matchId && onOpenChat) {
      onOpenChat({
        id: n.matchId,
        user: { id: n.user.id, name: n.user.name, photo: n.user.photo },
        lastMessage: null, unread: 0, updatedAt: n.time,
      });
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Header */}
      <div className="top-bar" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="icon-btn" onClick={onBack} aria-label="Go back" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}>Notifications</h2>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 40, fontSize: 14 }}>Loading…</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 70, padding: '0 32px' }}>
            <BellOff size={44} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 4px' }}>No notifications yet</p>
            <p style={{ fontSize: 13, margin: 0 }}>Likes, matches, and messages will show up here.</p>
          </div>
        ) : (
          items.map(n => {
            const clickable = (n.type === 'message' || n.type === 'match') && !!n.matchId;
            return (
              <div
                key={n.id}
                onClick={() => openItem(n)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                  borderBottom: '1px solid var(--border-light)', cursor: clickable ? 'pointer' : 'default',
                  background: n.unread ? 'rgba(232,68,90,0.05)' : 'transparent',
                }}
              >
                <div className={n.type === 'match' ? 'story-ring' : 'story-ring-seen'} style={{ flexShrink: 0 }}>
                  <div className="story-inner">
                    <img src={api.fileUrl(n.user.photo)} alt={n.user.name} style={{ width: 42, height: 42, objectFit: 'cover', display: 'block' }} />
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 700, marginRight: 4 }}>{n.user.name}</span>
                    <span style={{ color: 'var(--text-2)' }}>{n.text}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>{relTime(n.time)}</div>
                </div>

                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated, rgba(255,255,255,0.05))' }}>
                  {n.type === 'like' && <Heart size={16} fill="var(--rose)" color="var(--rose)" />}
                  {n.type === 'match' && <Sparkles size={16} color="var(--rose)" />}
                  {n.type === 'message' && <MessageCircle size={16} color="var(--rose)" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
