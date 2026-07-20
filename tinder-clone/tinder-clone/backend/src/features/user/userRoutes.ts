import { Router } from 'express';
import { firebaseDb } from '../../firebaseAdmin';

const userRouter = Router();

userRouter.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userDoc = await firebaseDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(userDoc.data());
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

userRouter.post('/profile', async (req, res) => {
  try {
    const firebaseUser = (req as any).firebaseUser;
    if (!firebaseUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, bio, age, location } = req.body;

    await firebaseDb.collection('users').doc(firebaseUser.uid).set(
      {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: name || firebaseUser.name,
        bio: bio || '',
        age: age || null,
        location: location || '',
        updatedAt: new Date(),
      },
      { merge: true },
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
});

export default userRouter;
