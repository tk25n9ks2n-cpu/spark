import { Router } from 'express';
import { verifyFirebaseIdToken } from './authMiddleware';

const authRouter = Router();

authRouter.get('/profile', verifyFirebaseIdToken, (req, res) => {
  const firebaseUser = (req as any).firebaseUser;

  if (!firebaseUser) {
    return res.status(404).json({ error: 'Firebase user not found' });
  }

  return res.json({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.name || firebaseUser.displayName || null,
  });
});

export default authRouter;
