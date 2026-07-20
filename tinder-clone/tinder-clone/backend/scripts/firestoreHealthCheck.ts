import { firebaseDb } from '../src/firebaseAdmin';

async function run() {
  try {
    const docRef = firebaseDb.collection('healthchecks').doc('backend_check');
    const payload = { status: 'ok', checkedAt: new Date().toISOString() };
    await docRef.set(payload, { merge: true });
    console.log('Wrote healthcheck:', payload);

    const snap = await docRef.get();
    if (!snap.exists) {
      console.error('Healthcheck document was not found after write.');
      process.exit(2);
    }

    console.log('Read back healthcheck:', snap.data());
    console.log('Firestore healthcheck successful.');
    process.exit(0);
  } catch (err) {
    console.error('Firestore healthcheck failed:', err);
    process.exit(1);
  }
}

run();
