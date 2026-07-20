import { Router } from 'express';
import { getPosts, getFeed, createPost, likePost } from './posts.controller';
import { requireAuth } from '../user/auth.middleware';

const router = Router();

router.get('/feed', getFeed);
router.get('/user/:userId', getPosts);
router.post('/', requireAuth, createPost);
router.post('/:id/like', requireAuth, likePost);

export default router;
