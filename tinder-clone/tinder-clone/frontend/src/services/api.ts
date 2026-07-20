import { getIdToken } from 'firebase/auth';
import { auth } from '../firebase';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchBackendProfile() {
  if (!auth.currentUser) {
    throw new Error('No authenticated Firebase user.');
  }

  const token = await getIdToken(auth.currentUser, true);
  const response = await fetch(`${apiUrl}/api/auth/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'Failed to fetch backend profile');
  }

  return response.json();
}
