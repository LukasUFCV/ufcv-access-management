import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../core/http/async-handler.js';
import { validateRequest } from '../../core/http/validate.js';
import { requirePermissions } from '../../core/security/permissions.js';
import { auditService } from './audit.service.js';

const router = Router();

router.get(
  '/',
  requirePermissions('audit:read'),
  validateRequest({
    query: z.object({
      page: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
      action: z.string().optional(),
      entityType: z.string().optional(),
    }),
  }),
  asyncHandler(async (request, response) => {
    const result = await auditService.listLogs(request.query);
    response.json(result);
  }),
);

export { router as auditRouter };

