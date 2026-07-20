import { Router } from 'express';
import { requireAuth } from './auth.middleware';
import { getMe, updateSettings, updateProfile, uploadAvatar, getPublicProfile, addPhoto } from './user.controller';
import { createStory, getStories, getFeedStories, deleteStory } from './stories.controller';

const router = Router();

router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, updateProfile);
router.post('/avatar', requireAuth, uploadAvatar);
router.post('/photo', requireAuth, addPhoto);
router.patch('/settings', requireAuth, updateSettings);

router.get('/stories/feed', requireAuth, getFeedStories);
router.get('/stories', requireAuth, getStories);
router.post('/stories', requireAuth, createStory);
router.delete('/stories/:id', requireAuth, deleteStory);

router.get('/:id/public', requireAuth, getPublicProfile);

export default router;
