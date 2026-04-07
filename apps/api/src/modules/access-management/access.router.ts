import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../core/http/async-handler.js';
import { validateRequest } from '../../core/http/validate.js';
import { requirePermissions } from '../../core/security/permissions.js';
import {
  informationAssignmentSchema,
  informationResourceSchema,
  materialAssignmentSchema,
  materialAssetSchema,
  softwareAssignmentSchema,
  softwareAssignmentUpdateSchema,
  softwareResourceSchema,
} from './access.schemas.js';
import { accessManagementService } from './access.service.js';

const router = Router();

router.get('/assets/material', requirePermissions('assets:read'), asyncHandler(async (_request, response) => {
  response.json(await accessManagementService.listMaterialAssets());
}));

router.post('/assets/material', requirePermissions('assets:write'), validateRequest({ body: materialAssetSchema }), asyncHandler(async (request, response) => {
  response.status(201).json(await accessManagementService.createMaterialAsset(request.body));
}));

router.post('/assets/material/:id/assign', requirePermissions('assets:write'), validateRequest({ params: z.object({ id: z.string().min(1) }), body: materialAssignmentSchema }), asyncHandler(async (request, response) => {
  const assetId = request.params.id as string;
  response.status(201).json(
    await accessManagementService.assignMaterialAsset(
      request.auth?.userId,
      assetId,
      {
        personId: request.body.personId,
        dueBackAt: request.body.dueBackAt ? new Date(request.body.dueBackAt) : null,
        notes: request.body.notes,
      },
      {
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      },
    ),
  );
}));

router.post('/assets/material/:id/return', requirePermissions('assets:write'), validateRequest({ params: z.object({ id: z.string().min(1) }) }), asyncHandler(async (request, response) => {
  const assetId = request.params.id as string;
  await accessManagementService.returnMaterialAsset(request.auth?.userId, assetId, {
    ipAddress: request.ip,
    userAgent: request.get('user-agent'),
  });
  response.status(204).send();
}));

router.get('/resources/software', requirePermissions('software:read'), asyncHandler(async (_request, response) => {
  response.json(await accessManagementService.listSoftwareResources());
}));

router.post('/resources/software', requirePermissions('software:write'), validateRequest({ body: softwareResourceSchema }), asyncHandler(async (request, response) => {
  response.status(201).json(await accessManagementService.createSoftwareResource(request.body));
}));

router.post('/software-assignments', requirePermissions('software:write'), validateRequest({ body: softwareAssignmentSchema }), asyncHandler(async (request, response) => {
  response.status(201).json(
    await accessManagementService.createSoftwareAssignment(
      request.auth?.userId,
      {
        ...request.body,
        startDate: new Date(request.body.startDate),
        endDate: request.body.endDate ? new Date(request.body.endDate) : null,
      },
      {
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      },
    ),
  );
}));

router.patch('/software-assignments/:id', requirePermissions('software:write'), validateRequest({ params: z.object({ id: z.string().min(1) }), body: softwareAssignmentUpdateSchema }), asyncHandler(async (request, response) => {
  const assignmentId = request.params.id as string;
  response.json(
    await accessManagementService.updateSoftwareAssignment(
      request.auth?.userId,
      assignmentId,
      {
        ...request.body,
        endDate: request.body.endDate ? new Date(request.body.endDate) : null,
      },
      {
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      },
    ),
  );
}));

router.get('/resources/information', requirePermissions('information:read'), asyncHandler(async (_request, response) => {
  response.json(await accessManagementService.listInformationResources());
}));

router.post('/resources/information', requirePermissions('information:write'), validateRequest({ body: informationResourceSchema }), asyncHandler(async (request, response) => {
  response.status(201).json(await accessManagementService.createInformationResource(request.body));
}));

router.post('/information-assignments', requirePermissions('information:write'), validateRequest({ body: informationAssignmentSchema }), asyncHandler(async (request, response) => {
  response.status(201).json(
    await accessManagementService.createInformationAssignment(
      request.auth?.userId,
      {
        ...request.body,
        startDate: new Date(request.body.startDate),
        endDate: request.body.endDate ? new Date(request.body.endDate) : null,
      },
      {
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      },
    ),
  );
}));

router.patch('/information-assignments/:id', requirePermissions('information:write'), validateRequest({ params: z.object({ id: z.string().min(1) }), body: z.object({ endDate: z.string().datetime().optional().nullable(), status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED', 'RETURNED']).optional() }) }), asyncHandler(async (request, response) => {
  const assignmentId = request.params.id as string;
  response.json(
    await accessManagementService.updateInformationAssignment(
      request.auth?.userId,
      assignmentId,
      {
        ...request.body,
        endDate: request.body.endDate ? new Date(request.body.endDate) : null,
      },
      {
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      },
    ),
  );
}));

export { router as accessManagementRouter };
