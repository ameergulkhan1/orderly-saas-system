import { Router } from 'express';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/authorize.middleware';

const router = Router();

const invitationService = new InvitationService(prisma);
const invitationController = new InvitationController(invitationService);

// ============================================
// PUBLIC ROUTES (No authentication)
// ============================================

// GET /api/v1/invitations/validate/:token - Public
router.get('/validate/:token', invitationController.validate);

// POST /api/v1/invitations/accept - Public
router.post('/accept', invitationController.accept);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// POST /api/v1/invitations - Owner or Admin can invite
router.post('/', authenticate, requireRole('OWNER', 'ADMIN'), invitationController.create);

// GET /api/v1/invitations - List all invitations
router.get('/', authenticate, requireRole('OWNER', 'ADMIN'), invitationController.list);

// DELETE /api/v1/invitations/:id - Cancel invitation
router.delete('/:id', authenticate, requireRole('OWNER', 'ADMIN'), invitationController.cancel);

// POST /api/v1/invitations/:id/resend - Resend invitation
router.post('/:id/resend', authenticate, requireRole('OWNER', 'ADMIN'), invitationController.resend);

export default router;