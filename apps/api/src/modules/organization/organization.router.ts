import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../core/http/async-handler.js';
import { validateRequest } from '../../core/http/validate.js';
import { requirePermissions } from '../../core/security/permissions.js';
import {
  orgTreeQuerySchema,
  referenceCreateSchema,
  referenceUpdateSchema,
} from './organization.schemas.js';
import { organizationService } from './organization.service.js';

const router = Router();

router.get('/org/tree', requirePermissions('organization:read'), validateRequest({ query: orgTreeQuerySchema }), asyncHandler(async (request, response) => {
  response.json(await organizationService.getOrgTree(request.query));
}));

router.get('/domains', requirePermissions('organization:read'), asyncHandler(async (_request, response) => {
  response.json(await organizationService.listDomains());
}));

router.post('/domains', requirePermissions('organization:write'), validateRequest({ body: referenceCreateSchema }), asyncHandler(async (request, response) => {
  response.status(201).json(await organizationService.createDomain(request.body));
}));

router.patch('/domains/:id', requirePermissions('organization:write'), validateRequest({ params: z.object({ id: z.string().min(1) }), body: referenceUpdateSchema }), asyncHandler(async (request, response) => {
  response.json(await organizationService.updateDomain(request.params.id as string, request.body));
}));

router.get('/activities', requirePermissions('organization:read'), asyncHandler(async (_request, response) => {
  response.json(await organizationService.listActivities());
}));

router.post('/activities', requirePermissions('organization:write'), validateRequest({ body: referenceCreateSchema.extend({ domainId: z.string().min(1) }) }), asyncHandler(async (request, response) => {
  response.status(201).json(await organizationService.createActivity(request.body));
}));

router.patch('/activities/:id', requirePermissions('organization:write'), validateRequest({ params: z.object({ id: z.string().min(1) }), body: referenceUpdateSchema }), asyncHandler(async (request, response) => {
  response.json(await organizationService.updateActivity(request.params.id as string, request.body));
}));

router.get('/job-types', requirePermissions('organization:read'), asyncHandler(async (_request, response) => {
  response.json(await organizationService.listJobTypes());
}));

router.post('/job-types', requirePermissions('organization:write'), validateRequest({ body: referenceCreateSchema }), asyncHandler(async (request, response) => {
  response.status(201).json(await organizationService.createJobType(request.body));
}));

router.patch('/job-types/:id', requirePermissions('organization:write'), validateRequest({ params: z.object({ id: z.string().min(1) }), body: referenceUpdateSchema }), asyncHandler(async (request, response) => {
  response.json(await organizationService.updateJobType(request.params.id as string, request.body));
}));

router.get('/positions', requirePermissions('organization:read'), asyncHandler(async (_request, response) => {
  response.json(await organizationService.listPositions());
}));

router.post('/positions', requirePermissions('organization:write'), validateRequest({ body: referenceCreateSchema }), asyncHandler(async (request, response) => {
  response.status(201).json(await organizationService.createPosition(request.body));
}));

router.patch('/positions/:id', requirePermissions('organization:write'), validateRequest({ params: z.object({ id: z.string().min(1) }), body: referenceUpdateSchema }), asyncHandler(async (request, response) => {
  response.json(await organizationService.updatePosition(request.params.id as string, request.body));
}));

router.get('/regions', requirePermissions('organization:read'), asyncHandler(async (_request, response) => {
  response.json(await organizationService.listRegions());
}));

router.get('/actor-types', requirePermissions('organization:read'), asyncHandler(async (_request, response) => {
  response.json(await organizationService.listActorTypes());
}));

router.get('/roles', requirePermissions('admin:read'), asyncHandler(async (_request, response) => {
  response.json(await organizationService.listRoles());
}));

router.get('/permissions', requirePermissions('admin:read'), asyncHandler(async (_request, response) => {
  response.json(await organizationService.listPermissions());
}));

export { router as organizationRouter };
