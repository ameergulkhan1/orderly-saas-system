import { Router } from 'express';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { completeOnboardingSchema } from './onboarding.validation';

const router = Router();

const service = new OnboardingService(prisma);
const controller = new OnboardingController(service);

// ── Diagnostic: remove after it works ──────────────────
console.log('🔎 [onboarding] controller.complete =', typeof controller.complete);
console.log('🔎 [onboarding] controller.status   =', typeof controller.status);
// ───────────────────────────────────────────────────────

// All onboarding routes require an authenticated seller
router.use(authenticate);

router.get('/status', controller.status);

router.post(
  '/complete',
  validate(completeOnboardingSchema),
  controller.complete
);

// ── Diagnostic: verify layer count ─────────────────────
console.log('🔎 [onboarding] router layers =', (router as any).stack.length);
// ───────────────────────────────────────────────────────

export default router;