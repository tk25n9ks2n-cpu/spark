import { useState, useEffect, useRef } from 'react';
import { AuthPage } from './pages/AuthPage';
import { FeedPage } from './pages/FeedPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { CreatePage } from './pages/CreatePage';
import { MessagesPage } from './pages/MessagesPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { Home, Compass, MessageCircle, User, Plus } from 'lucide-react';
import { disconnectSocket, getSocket } from './services/socket';
import { api } from './services/api';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<'feed' | 'discover' | 'create' | 'messages' | 'profile' | 'notifications'>('feed');
  const [pendingChat, setPendingChat] = useState<any | null>(null);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState<string>('');
  const pageRef = useRef(currentPage);
  pageRef.current = currentPage;

  const openChat = (conversation: any) => {
    setPendingChat(conversation);
    setCurrentPage('messages');
  };

  // Recompute total unread from the DB (source of truth)
  const refreshUnread = () => {
    if (!localStorage.getItem('token')) return;
    api.getConversations()
      .then(({ conversations }) => setUnread((conversations || []).reduce((n: number, c: any) => n + (c.unread || 0), 0)))
      .catch(() => {});
  };

  // App-wide real-time: auto-retrieve incoming messages from the DB and update the badge
  useEffect(() => {
    if (!token || !user) return;
    refreshUnread();
    const socket = getSocket();
    const onIncoming = async ({ matchId }: any) => {
      refreshUnread();
      // If you're not already in Messages, surface a toast for the new message
      if (pageRef.current !== 'messages') {
        try {
          const { conversations } = await api.getConversations();
          const c = (conversations || []).find((x: any) => x.id === matchId);
          setToast(c ? `💬 New message from ${c.user.name}` : '💬 New message');
          setTimeout(() => setToast(''), 3000);
        } catch { /* ignore */ }
      }
    };
    socket.on('conversation_update', onIncoming);
    return () => { socket.off('conversation_update', onIncoming); };
  }, [token, user]);

  // Recompute unread whenever the page changes (e.g. after reading in Messages)
  useEffect(() => { if (token && user) refreshUnread(); }, [currentPage]);

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    disconnectSocket();
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderPage = () => {
    switch(currentPage) {
      case 'feed':
        return <FeedPage
          onOpenMessages={() => setCurrentPage('messages')}
          onOpenNotifications={() => setCurrentPage('notifications')}
          onOpenChat={openChat}
        />;
      case 'discover': return <DiscoverPage user={user} onOpenChat={openChat} />;
      case 'create': return <CreatePage onClose={() => setCurrentPage('feed')} />;
      case 'messages': return <MessagesPage user={user} onBack={() => setCurrentPage('feed')} initialChat={pendingChat} onChatConsumed={() => setPendingChat(null)} />;
      case 'profile': return <ProfilePage user={user} onLogout={handleLogout} />;
      case 'notifications': return <NotificationsPage onBack={() => setCurrentPage('feed')} onOpenChat={openChat} />;
      default: return <FeedPage />;
    }
  };

  return (
    <div className="app-shell">
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderPage()}
      </div>

      {/* Incoming-message toast (auto, app-wide) */}
      {toast && (
        <div
          onClick={() => { setToast(''); setCurrentPage('messages'); }}
          className="animate-scale-in"
          style={{
            position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 400,
            background: 'var(--bg-card, #1a1a24)', border: '1px solid var(--border-light, rgba(255,255,255,0.1))',
            color: 'var(--text-1, #fff)', padding: '11px 18px', borderRadius: 999, cursor: 'pointer',
            fontSize: 13.5, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,0.45)', whiteSpace: 'nowrap',
          }}
        >
          {toast}
        </div>
      )}

      {currentPage !== 'notifications' && (
        <div className="bottom-nav">
          <button className={`nav-btn ${currentPage === 'feed' ? 'active' : ''}`} onClick={() => setCurrentPage('feed')}>
            <Home className="nav-icon" size={24} color={currentPage === 'feed' ? '#E8445A' : '#ffffff66'} strokeWidth={currentPage === 'feed' ? 2.5 : 2} />
          </button>
          <button className={`nav-btn ${currentPage === 'discover' ? 'active' : ''}`} onClick={() => setCurrentPage('discover')}>
            <Compass className="nav-icon" size={24} color={currentPage === 'discover' ? '#E8445A' : '#ffffff66'} strokeWidth={currentPage === 'discover' ? 2.5 : 2} />
          </button>
          
          <button className="nav-create" onClick={() => setCurrentPage('create')}>
            <Plus size={24} strokeWidth={3} />
          </button>

          <button className={`nav-btn ${currentPage === 'messages' ? 'active' : ''}`} onClick={() => setCurrentPage('messages')}>
            <div style={{ position: 'relative' }}>
              <MessageCircle className="nav-icon" size={24} color={currentPage === 'messages' ? '#E8445A' : '#ffffff66'} strokeWidth={currentPage === 'messages' ? 2.5 : 2} />
              {unread > 0 && <div className="badge" style={{ top: -4, right: -6 }}>{unread > 9 ? '9+' : unread}</div>}
            </div>
          </button>
          <button className={`nav-btn ${currentPage === 'profile' ? 'active' : ''}`} onClick={() => setCurrentPage('profile')}>
            <User className="nav-icon" size={24} color={currentPage === 'profile' ? '#E8445A' : '#ffffff66'} strokeWidth={currentPage === 'profile' ? 2.5 : 2} />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
