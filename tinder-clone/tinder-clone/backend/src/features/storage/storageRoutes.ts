import { Router } from 'express';
import { firebaseStorage } from '../../firebaseAdmin';

const storageRouter = Router();

storageRouter.post('/upload-url', async (req, res) => {
  try {
    const firebaseUser = (req as any).firebaseUser;
    if (!firebaseUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType are required' });
    }

    const bucket = firebaseStorage.bucket();
    const file = bucket.file(`profile-pictures/${firebaseUser.uid}/${filename}`);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    });

    return res.json({ url, path: file.name });
  } catch (error) {
    console.error('Failed to generate upload URL:', error);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

storageRouter.post('/download-url', async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ error: 'path is required' });
    }

    const bucket = firebaseStorage.bucket();
    const file = bucket.file(path);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000,
    });

    return res.json({ url });
  } catch (error) {
    console.error('Failed to generate download URL:', error);
    return res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

export default storageRouter;
