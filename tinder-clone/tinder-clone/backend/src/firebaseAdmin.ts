import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

function getFirebaseCredential() {
  // Prefer a local service account JSON file at backend/serviceAccountKey.json
  try {
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    if (existsSync(serviceAccountPath)) {
      try {
        const raw = readFileSync(serviceAccountPath, 'utf8');
        const parsed = JSON.parse(raw);
        return cert(parsed);
      } catch (e) {
        console.warn('Failed to parse serviceAccountKey.json, falling back to env vars or ADC:', e);
      }
    }
  } catch (e) {
    // ignore filesystem errors and continue to env-based credential resolution
  }

  // Support full JSON in env var (useful for containerized deployments)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
  }

  // Support individual env vars (projectId, clientEmail, privateKey)
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return cert({ projectId, clientEmail, privateKey });
  }

  // Fall back to Application Default Credentials
  return applicationDefault();
}

const app = getApps().length ? getApp() : initializeApp({
  credential: getFirebaseCredential(),
});

export const firebaseAuth = getAuth(app);
export const firebaseDb = getFirestore(app);
export const firebaseStorage = getStorage(app);
