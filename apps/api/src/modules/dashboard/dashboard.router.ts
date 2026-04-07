import { Router } from 'express';

import { asyncHandler } from '../../core/http/async-handler.js';
import { requirePermissions } from '../../core/security/permissions.js';
import { dashboardService } from './dashboard.service.js';

const router = Router();

router.get(
  '/summary',
  requirePermissions('dashboard:read'),
  asyncHandler(async (_request, response) => {
    const summary = await dashboardService.getSummary();
    response.json(summary);
  }),
);

export { router as dashboardRouter };

