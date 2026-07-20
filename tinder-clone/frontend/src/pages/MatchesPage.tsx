import { useState } from 'react';

const DEMO_MATCHES = [
  { id: '1', name: 'Sophie', age: 24, photo: '/p1.png', lastMsg: 'Hey! How are you? 😊', time: '2m', unread: 2, online: true },
  { id: '2', name: 'Mia', age: 26, photo: '/p3.png', lastMsg: 'That sounds amazing! 🎉', time: '15m', unread: 0, online: true },
  { id: '3', name: 'Elena', age: 25, photo: '/p4.png', lastMsg: 'Let\'s grab coffee ☕', time: '1h', unread: 1, online: false },
  { id: '4', name: 'Luna', age: 23, photo: '/p1.png', lastMsg: 'You matched!', time: '3h', unread: 0, online: false },
  { id: '5', name: 'Aria', age: 27, photo: '/p3.png', lastMsg: 'You matched!', time: '1d', unread: 0, online: false },
];

const NEW_MATCHES = [
  { id: 'n1', name: 'Sophie', photo: '/p1.png' },
  { id: 'n2', name: 'Mia', photo: '/p3.png' },
  { id: 'n3', name: 'Elena', photo: '/p4.png' },
];

interface MatchesPageProps {
  onOpenChat: (matchId: string, matchName: string, matchPhoto: string) => void;
}

export const MatchesPage = ({ onOpenChat }: MatchesPageProps) => {
  const [search, setSearch] = useState('');

  const filtered = DEMO_MATCHES.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 26, fontWeight: 900, color: 'white', letterSpacing: -0.5 }}>
          💬 Messages
        </h2>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 16, color: 'rgba(255,255,255,0.3)',
          }}>🔍</span>
          <input
            className="input-dark"
            placeholder="Search matches..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 42, paddingTop: 12, paddingBottom: 12 }}
          />
        </div>

        {/* New Matches row */}
        <div style={{ marginBottom: 4 }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase' }}>
            New Matches
          </p>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
            {NEW_MATCHES.map((m, i) => (
              <div key={m.id} onClick={() => onOpenChat(m.id, m.name, m.photo)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF4458, #FF6B35)',
                    padding: 2,
                    animation: i === 0 ? 'glow-pulse 2s infinite' : 'none',
                  }}>
                    <img src={m.photo} alt={m.name} style={{
                      width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
                      border: '2px solid var(--bg-dark)',
                    }} />
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 2, right: 2,
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#4ade80', border: '2px solid var(--bg-dark)',
                  }} />
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <p style={{ margin: '4px 20px 8px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase' }}>
          Conversations
        </p>
        {filtered.map((match, i) => (
          <div
            key={match.id}
            onClick={() => onOpenChat(match.id, match.name, match.photo)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 20px', cursor: 'pointer',
              transition: 'background 0.15s',
              animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src={match.photo} alt={match.name} style={{
                width: 58, height: 58, borderRadius: '50%', objectFit: 'cover',
                border: match.unread > 0 ? '2px solid #FF4458' : '2px solid transparent',
              }} />
              {match.online && (
                <div style={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: 13, height: 13, borderRadius: '50%',
                  background: '#4ade80', border: '2px solid var(--bg-dark)',
                }} />
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontWeight: match.unread > 0 ? 700 : 600, fontSize: 15, color: 'white' }}>
                  {match.name}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 0, marginLeft: 8 }}>
                  {match.time}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: 13, color: match.unread > 0 ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)',
                  fontWeight: match.unread > 0 ? 500 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {match.lastMsg}
                </span>
                {match.unread > 0 && (
                  <div style={{
                    minWidth: 20, height: 20, borderRadius: 10,
                    background: 'linear-gradient(135deg, #FF4458, #FF6B35)',
                    color: 'white', fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 5px', flexShrink: 0, marginLeft: 8,
                  }}>
                    {match.unread}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
