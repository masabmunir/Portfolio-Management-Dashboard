import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middleware/validate';
import { credentialsSchema, refreshTokenSchema } from './auth.dto';

const router = Router();

router.post('/register', validate(credentialsSchema), authController.register);
router.post('/login', validate(credentialsSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', validate(refreshTokenSchema), authController.logout);

export default router;