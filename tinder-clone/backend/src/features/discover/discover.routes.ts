import { Router } from 'express';
import { requireAuth } from '../user/auth.middleware';
import { getDiscover, swipe, rewind } from './discover.controller';

const router = Router();

router.get('/', requireAuth, getDiscover);
router.post('/swipe', requireAuth, swipe);
router.post('/rewind', requireAuth, rewind);

export default router;
