import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { SwipeCard } from './components/SwipeCard';
import { AuthForm } from './components/AuthForm';
import { ProfileUpload } from './components/ProfileUpload';
import { Chat } from './components/Chat';
import { fetchBackendProfile } from './services/api';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [backendProfile, setBackendProfile] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'swipe' | 'chat'>('profile');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setBackendProfile(null);
      setError(null);
    });

    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleFetchProfile = async () => {
    setLoadingProfile(true);
    setError(null);

    try {
      const profile = await fetchBackendProfile();
      setBackendProfile(profile);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingProfile(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-xl">
          <h1 className="mb-6 text-center text-4xl font-bold text-red-500">Tinder Clone</h1>
          <AuthForm />
        </div>
      </div>
    );
  }

  const mockProfile = {
    id: '1',
    name: 'Alex',
    age: 26,
    bio: 'Love hiking and coffee!',
    photos: [{ url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800' }],
  };

  const handleSwipe = (direction: string) => {
    console.log(`Swiped ${direction} on ${mockProfile.name}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-gray-50 p-6">
      <header className="mb-6 flex w-full max-w-4xl items-center justify-between rounded-3xl bg-white/90 px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-red-500">Tinder Clone</h1>
          <p className="text-sm text-gray-600">Signed in as {user.email ?? user.uid}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-full border border-red-500 px-4 py-2 text-red-500 transition hover:bg-red-50"
        >
          Sign out
        </button>
      </header>

      <main className="w-full max-w-4xl">
        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 rounded-3xl bg-white/90 p-2 shadow-sm">
          {['profile', 'swipe', 'chat'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`flex-1 rounded-2xl py-2 px-4 font-semibold transition ${
                activeTab === tab
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <section className="space-y-6">
            <div className="rounded-3xl bg-white/90 p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">Your Firebase Profile</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-700"><strong>UID:</strong> {user.uid}</p>
                <p className="text-sm text-gray-700"><strong>Email:</strong> {user.email ?? 'No email available'}</p>
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              {backendProfile && (
                <div className="mt-4 rounded-2xl bg-gray-100 p-4 text-sm">
                  <p className="font-semibold text-gray-900 mb-2">Backend Profile:</p>
                  <pre className="overflow-auto text-gray-800">{JSON.stringify(backendProfile, null, 2)}</pre>
                </div>
              )}
              <button
                onClick={handleFetchProfile}
                className="mt-4 rounded-lg bg-red-500 px-6 py-2 text-white transition hover:bg-red-600 disabled:bg-gray-400"
                disabled={loadingProfile}
              >
                {loadingProfile ? 'Loading...' : 'Fetch Backend Profile'}
              </button>
            </div>

            <ProfileUpload />
          </section>
        )}

        {/* Swipe Tab */}
        {activeTab === 'swipe' && (
          <section className="rounded-3xl bg-white/90 p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">Discover People</h2>
            <div className="relative w-full max-w-sm h-[600px] mx-auto">
              <SwipeCard profile={mockProfile} onSwipe={handleSwipe} />
            </div>
          </section>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <section className="rounded-3xl bg-white/90 p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">Chat with Matches</h2>
            <div className="h-[500px]">
              <Chat matchId="demo-match-123" otherUserId="other-user-456" />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
