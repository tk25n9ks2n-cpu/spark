const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export const api = {
  signup: async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },
  getUserPosts: async (userId: string) => {
    const res = await fetch(`${API_URL}/api/posts/user/${userId}`);
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  /** All posts (feed), newest first, with author info. */
  getFeed: async () => {
    const res = await fetch(`${API_URL}/api/posts/feed`);
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  /** Create a post. `image` is a data URL (uploaded) or an existing url. */
  createPost: async (image: string, caption: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ image, caption })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  /** Live search across people and posts. Returns { users, posts }. */
  search: async (q: string) => {
    const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  likePost: async (id: string, liked: boolean) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/posts/${id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ liked })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  /** Returns { user, settings } for the currently authenticated user. */
  getMe: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  /** Updates the user's real name/bio. Returns { user }. */
  updateProfile: async (data: { name?: string; bio?: string }) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/user/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  updateUser: async (id: string, data: Record<string, any>) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/user/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  /** Uploads a base64 avatar image; returns { avatarUrl }. */
  uploadAvatar: async (image: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/user/avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ image })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  /** Clears the avatar back to default; returns { avatarUrl: null }. */
  removeAvatar: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/user/avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ remove: true })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  /** Merges the given partial settings into the stored blob. Returns { settings }. */
  updateSettings: async (settings: Record<string, any>) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/user/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ settings })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  /** Resolves a backend-served upload path to an absolute url; leaves other paths (frontend public assets, http urls) untouched. */
  fileUrl: (url: string) => (url?.startsWith('/uploads') ? `${API_URL}${url}` : url),

  getStories: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/user/stories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  /** Uploads a base64 data URL; returns { story: { id, url } }. */
  uploadStory: async (image: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/user/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ image })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  deleteStory: async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/user/stories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  // ---- Discover --------------------------------------------------------
  getDiscover: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/discover`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  swipe: async (swipedId: string, direction: 'left' | 'right' | 'up') => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/discover/swipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ swipedId, direction })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  rewind: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/discover/rewind`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  // ---- Chat ------------------------------------------------------------
  getConversations: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  getMessages: async (matchId: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/chat/matches/${matchId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  markRead: async (matchId: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/chat/matches/${matchId}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});
  },

  seedDemoChats: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/chat/seed-demo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  /** Remove the auto-seeded demo conversations you never replied to. */
  cleanupDemoChats: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/chat/demo-cleanup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  /** Find-or-create a conversation with a user; returns { conversation }. */
  startChat: async (userId: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/chat/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  deleteConversation: async (matchId: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/chat/conversations/${matchId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  /** Merged activity feed: matches, likes received, messages received. */
  getNotifications: async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  },

  /** Another user's public profile (name, avatar, bio, interests, recent posts). */
  getPublicProfile: async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/user/${id}/public`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  }
};