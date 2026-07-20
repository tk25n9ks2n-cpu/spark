export declare const api: {
    signup: (name: string, email: string, password: string) => Promise<any>;
    login: (email: string, password: string) => Promise<any>;
    getUserPosts: (userId: string) => Promise<any>;
    /** All posts (feed), newest first, with author info. */
    getFeed: () => Promise<any>;
    /** Create a post. `image` is a data URL (uploaded) or an existing url. */
    createPost: (image: string, caption: string) => Promise<any>;
    /** Live search across people and posts. Returns { users, posts }. */
    search: (q: string) => Promise<any>;
    likePost: (id: string, liked: boolean) => Promise<any>;
    /** Returns { user, settings } for the currently authenticated user. */
    getMe: () => Promise<any>;
    /** Updates the user's real name/bio. Returns { user }. */
    updateProfile: (data: {
        name?: string;
        bio?: string;
    }) => Promise<any>;
    /** Uploads a base64 avatar image; returns { avatarUrl }. */
    uploadAvatar: (image: string) => Promise<any>;
    /** Clears the avatar back to default; returns { avatarUrl: null }. */
    removeAvatar: () => Promise<any>;
    /** Merges the given partial settings into the stored blob. Returns { settings }. */
    updateSettings: (settings: Record<string, any>) => Promise<any>;
    /** Resolves a backend-served upload path to an absolute url; leaves other paths (frontend public assets, http urls) untouched. */
    fileUrl: (url: string) => string;
    getStories: () => Promise<any>;
    /** Uploads a base64 data URL; returns { story: { id, url } }. */
    uploadStory: (image: string) => Promise<any>;
    deleteStory: (id: string) => Promise<any>;
    getDiscover: () => Promise<any>;
    swipe: (swipedId: string, direction: "left" | "right" | "up") => Promise<any>;
    rewind: () => Promise<any>;
    getConversations: () => Promise<any>;
    getMessages: (matchId: string) => Promise<any>;
    markRead: (matchId: string) => Promise<void>;
    seedDemoChats: () => Promise<any>;
    /** Remove the auto-seeded demo conversations you never replied to. */
    cleanupDemoChats: () => Promise<any>;
    /** Find-or-create a conversation with a user; returns { conversation }. */
    startChat: (userId: string) => Promise<any>;
    deleteConversation: (matchId: string) => Promise<any>;
    /** Merged activity feed: matches, likes received, messages received. */
    getNotifications: () => Promise<any>;
    /** Another user's public profile (name, avatar, bio, interests, recent posts). */
    getPublicProfile: (id: string) => Promise<any>;
};
//# sourceMappingURL=api.d.ts.map