import { NextFunction, Request, Response } from 'express';
import { firebaseAuth } from '../../firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  firebaseUser?: Record<string, any>;
}

export async function verifyFirebaseIdToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;
  const token = typeof authorization === 'string' && authorization.startsWith('Bearer ')
    ? authorization.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    (req as AuthenticatedRequest).firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return res.status(401).json({ error: 'Invalid Firebase ID token' });
  }
}
