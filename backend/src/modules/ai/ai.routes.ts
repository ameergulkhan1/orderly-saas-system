import { Router } from 'express';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/authorize.middleware';

const router = Router();

const aiService = new AIService(prisma);
const aiController = new AIController(aiService);

router.use(authenticate);

router.post('/chat', requireRole('OWNER', 'ADMIN'), aiController.chat);

export default router;