import { ConnectorStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../core/http/async-handler.js';
import { validateRequest } from '../../core/http/validate.js';
import { requirePermissions } from '../../core/security/permissions.js';
import { integrationsService } from './integrations.service.js';

const router = Router();

router.get('/connectors', requirePermissions('admin:read'), asyncHandler(async (_request, response) => {
  response.json(await integrationsService.listConnectors());
}));

router.get('/connectors/readiness', requirePermissions('admin:read'), asyncHandler(async (_request, response) => {
  response.json(await integrationsService.getArchitectureReadiness());
}));

router.patch('/connectors/:id', requirePermissions('admin:write'), validateRequest({ params: z.object({ id: z.string().min(1) }), body: z.object({ status: z.nativeEnum(ConnectorStatus).optional(), baseUrl: z.string().url().optional().nullable(), config: z.record(z.unknown()).optional().nullable() }) }), asyncHandler(async (request, response) => {
  response.json(await integrationsService.updateConnector(request.params.id as string, request.body));
}));

export { router as integrationsRouter };
