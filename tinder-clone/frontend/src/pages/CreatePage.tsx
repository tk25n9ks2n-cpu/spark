import { useState, useRef } from 'react';
import { api } from '../services/api';

interface CreatePageProps {
  onClose: () => void;
}

const FILTERS = [
  { name: 'None',     style: '' },
  { name: 'Warm',     style: 'sepia(0.4) saturate(1.3)' },
  { name: 'Cool',     style: 'hue-rotate(180deg) saturate(0.8)' },
  { name: 'Fade',     style: 'brightness(1.1) contrast(0.85) saturate(0.7)' },
  { name: 'Vivid',    style: 'saturate(1.8) contrast(1.1)' },
  { name: 'Mono',     style: 'grayscale(1)' },
  { name: 'Golden',   style: 'sepia(0.6) brightness(1.1) saturate(1.3)' },
];

export const CreatePage = ({ onClose }: CreatePageProps) => {
  const [step, setStep] = useState<'pick' | 'edit' | 'share'>('pick');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [filter, setFilter] = useState('None');
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setImageUrl(ev.target?.result as string); setStep('edit'); };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setImageUrl(ev.target?.result as string); setStep('edit'); };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!imageUrl) return;
    setPosting(true);
    try {
      const fullCaption = location.trim() ? `${caption}\n📍 ${location.trim()}` : caption;
      await api.createPost(imageUrl, fullCaption);
      setPosted(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      alert('Failed to share post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const activeFilter = FILTERS.find(f => f.name === filter)?.style || '';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div className="top-bar">
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 16, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
          Cancel
        </button>
        <span style={{ fontWeight: 800, fontSize: 16 }}>New Post</span>
        {step === 'edit' && (
          <button onClick={() => setStep('share')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--rose)' }}>
            Next →
          </button>
        )}
        {step === 'share' && (
          <button
            id="share-post-btn"
            className="btn-rose"
            onClick={handlePost}
            disabled={posting || posted}
            style={{ padding: '8px 16px', fontSize: 14 }}
          >
            {posted ? '✓ Posted!' : posting ? 'Sharing…' : 'Share'}
          </button>
        )}
        {step === 'pick' && <div style={{ width: 60 }} />}
      </div>

      {/* Step: pick image */}
      {step === 'pick' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%', aspectRatio: '1/1', maxHeight: 300,
              background: 'var(--bg-card)', border: '2px dashed rgba(232,68,90,0.35)',
              borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              gap: 12, transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(232,68,90,0.7)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(232,68,90,0.05)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(232,68,90,0.35)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)'; }}
          >
            <span style={{ fontSize: 52, animation: 'float 3s ease-in-out infinite' }}>🖼️</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Drop your photo here</span>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>or click to browse</span>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFilePick} />
          </div>

          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <button
              className="btn-rose"
              onClick={() => fileRef.current?.click()}
              style={{ flex: 1, padding: '14px 0', fontSize: 15 }}
            >
              📷 Upload Photo
            </button>
          </div>

          {/* Use demo image */}
          <button
            onClick={() => { setImageUrl('/post1.png'); setStep('edit'); }}
            style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, textDecoration: 'underline' }}
          >
            Use a demo photo instead →
          </button>
        </div>
      )}

      {/* Step: edit + filter */}
      {step === 'edit' && imageUrl && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={imageUrl}
              alt="Preview"
              style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block', filter: activeFilter, transition: 'filter 0.3s' }}
            />
          </div>

          {/* Filters */}
          <div style={{ overflowX: 'auto', padding: '14px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 12, padding: '0 16px', width: 'max-content' }}>
              {FILTERS.map(f => (
                <div
                  key={f.name}
                  onClick={() => setFilter(f.name)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                >
                  <div style={{
                    width: 58, height: 58, borderRadius: 12, overflow: 'hidden',
                    border: filter === f.name ? '2.5px solid var(--rose)' : '2.5px solid transparent',
                    transition: 'border 0.2s',
                    boxShadow: filter === f.name ? 'var(--shadow-rose)' : 'none',
                  }}>
                    <img src={imageUrl} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: f.style }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: filter === f.name ? 'var(--rose)' : 'var(--text-3)' }}>{f.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step: share details */}
      {step === 'share' && imageUrl && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          {/* Preview */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}>
            <img src={imageUrl} alt="Preview" style={{
              width: 80, height: 80, objectFit: 'cover', borderRadius: 12, flexShrink: 0, filter: activeFilter,
            }} />
            <textarea
              id="post-caption"
              className="inp"
              placeholder="Write a caption…"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={4}
              style={{ resize: 'none', borderRadius: 'var(--radius-md)', lineHeight: 1.6 }}
            />
          </div>

          {/* Fields */}
          {[
            { icon: '📍', label: 'Location', value: location, onChange: setLocation, placeholder: 'Add location…' },
          ].map(field => (
            <div key={field.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 18 }}>{field.icon}</span>
                <input
                  className="inp"
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  style={{ border: 'none', background: 'none', padding: 0, fontSize: 14 }}
                />
              </div>
            </div>
          ))}

          {/* Options */}
          {[
            { icon: '👥', label: 'Tag people', value: '' },
            { icon: '🔗', label: 'Advanced settings', value: '' },
          ].map(opt => (
            <div key={opt.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px', marginBottom: 8,
              background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 18 }}>{opt.icon}</span>
                <span style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>{opt.label}</span>
              </div>
              <span style={{ color: 'var(--text-3)', fontSize: 18 }}>›</span>
            </div>
          ))}

          {posted && (
            <div style={{ textAlign: 'center', padding: 20, animation: 'scaleIn 0.3s ease' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'white' }}>Post shared!</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
