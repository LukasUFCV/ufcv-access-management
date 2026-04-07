import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../core/http/async-handler.js';
import { validateRequest } from '../../core/http/validate.js';
import { requireAuth, requirePermissions } from '../../core/security/permissions.js';
import { notificationsService } from './notifications.service.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  requirePermissions('notifications:read'),
  asyncHandler(async (request, response) => {
    const items = await notificationsService.listForUser(request.auth!.userId);
    response.json(items);
  }),
);

router.patch(
  '/:id/read',
  requireAuth,
  validateRequest({
    params: z.object({
      id: z.string().min(1),
    }),
  }),
  asyncHandler(async (request, response) => {
    await notificationsService.markAsRead(request.params.id as string, request.auth!.userId);
    response.status(204).send();
  }),
);

export { router as notificationsRouter };
