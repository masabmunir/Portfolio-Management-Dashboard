import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as chatController from './chat.controller';

const router = Router();

router.use(requireAuth);
router.post('/', chatController.sendMessage);

export default router;