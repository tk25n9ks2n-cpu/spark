import { useState } from 'react';

const GRID_IMAGES = [
  '/post1.png', '/post2.png', '/post3.png',
  '/post4.png', '/post5.png', '/p1.png',
  '/p3.png',    '/p4.png',    '/post1.png',
  '/post2.png', '/post3.png', '/post4.png',
];

const SUGGESTED = [
  { id: 'u1', name: 'Sophie', username: 'sophie_adventures', photo: '/p1.png', mutual: '12 mutual matches' },
  { id: 'u2', name: 'Mia',    username: 'mia.design',        photo: '/p3.png', mutual: '8 mutual matches' },
  { id: 'u3', name: 'Elena',  username: 'elenabooks',        photo: '/p4.png', mutual: '5 mutual matches' },
];

const TAGS = ['✨ All', '✈️ Travel', '☕ Coffee', '🎨 Art', '🎵 Music', '🌿 Nature', '🍕 Food', '🏋️ Fitness'];

export const ExplorePage = () => {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('✨ All');
  const [followed, setFollowed] = useState<Record<string, boolean>>({});

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Explore</h2>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-3)', pointerEvents: 'none' }}>🔍</span>
          <input
            id="explore-search"
            className="inp"
            placeholder="Search people, posts, tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 42 }}
          />
        </div>

        {/* Tag pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14 }}>
          {TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 50, border: 'none',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12,
                background: activeTag === tag
                  ? 'linear-gradient(135deg, #E8445A, #F97F68)'
                  : 'rgba(255,255,255,0.06)',
                color: activeTag === tag ? 'white' : 'var(--text-2)',
                boxShadow: activeTag === tag ? '0 2px 12px rgba(232,68,90,0.35)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Suggested people */}
        <div style={{ padding: '0 16px 16px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', letterSpacing: 1, textTransform: 'uppercase' }}>
            Suggested for you
          </p>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {SUGGESTED.map((u, i) => (
              <div key={u.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '16px 14px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                minWidth: 140, flexShrink: 0, cursor: 'pointer',
                animation: `fadeUp 0.4s ${i * 0.07}s ease both`,
              }}>
                <div className="story-ring">
                  <div className="story-inner">
                    <img src={u.photo} alt={u.name} style={{ width: 56, height: 56, objectFit: 'cover', display: 'block' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>@{u.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--rose)', marginTop: 3 }}>❤️ {u.mutual}</div>
                </div>
                <button
                  id={`follow-btn-${u.id}`}
                  className={followed[u.id] ? 'btn-ghost' : 'btn-rose'}
                  onClick={() => setFollowed(p => ({ ...p, [u.id]: !p[u.id] }))}
                  style={{ padding: '6px 18px', fontSize: 12, width: '100%' }}
                >
                  {followed[u.id] ? 'Following ✓' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Photo grid */}
        <div className="explore-grid" style={{ gap: 2 }}>
          {GRID_IMAGES.map((img, i) => (
            <div
              key={i}
              style={{
                aspectRatio: i === 1 || i === 7 ? '1/1.6' : '1/1',
                gridRow: i === 1 ? 'span 2' : undefined,
                overflow: 'hidden', cursor: 'pointer', position: 'relative',
                animation: `fadeIn 0.4s ${i * 0.03}s ease both`,
              }}
              onClick={() => {}}
            >
              <img
                src={img}
                alt={`Post ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
              {/* Hover overlay */}
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
                transition: 'background 0.2s', opacity: 0,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; e.currentTarget.style.opacity = '0'; }}
              >
                <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>❤️ {Math.floor(Math.random() * 900 + 100)}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
};
