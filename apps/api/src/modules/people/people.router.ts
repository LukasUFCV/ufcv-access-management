import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../core/http/async-handler.js';
import { validateRequest } from '../../core/http/validate.js';
import { requireAuth, requirePermissions } from '../../core/security/permissions.js';
import { peopleQuerySchema, personUpdateSchema, personUpsertSchema } from './people.schemas.js';
import { peopleService } from './people.service.js';

const router = Router();

router.get('/', requirePermissions('people:read'), validateRequest({ query: peopleQuerySchema }), asyncHandler(async (request, response) => {
  response.json(await peopleService.listPeople(request.query));
}));

router.post('/', requirePermissions('people:write'), validateRequest({ body: personUpsertSchema }), asyncHandler(async (request, response) => {
  const result = await peopleService.createPerson(
    request.auth?.userId,
    {
      ...request.body,
      startDate: request.body.startDate ? new Date(request.body.startDate) : null,
      endDate: request.body.endDate ? new Date(request.body.endDate) : null,
    },
    {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    },
  );
  response.status(201).json(result);
}));

router.get('/:id', requirePermissions('people:read'), validateRequest({ params: z.object({ id: z.string().min(1) }) }), asyncHandler(async (request, response) => {
  response.json(await peopleService.getPersonById(request.params.id as string));
}));

router.patch('/:id', requirePermissions('people:write'), validateRequest({ params: z.object({ id: z.string().min(1) }), body: personUpdateSchema }), asyncHandler(async (request, response) => {
  const personId = request.params.id as string;
  response.json(
    await peopleService.updatePerson(
      request.auth?.userId,
      personId,
      {
        ...request.body,
        startDate: request.body.startDate ? new Date(request.body.startDate) : undefined,
        endDate: request.body.endDate ? new Date(request.body.endDate) : undefined,
      },
      {
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      },
    ),
  );
}));

router.delete('/:id', requirePermissions('people:write'), validateRequest({ params: z.object({ id: z.string().min(1) }) }), asyncHandler(async (request, response) => {
  await peopleService.archivePerson(request.auth?.userId, request.params.id as string);
  response.status(204).send();
}));

router.get('/:id/accesses', requirePermissions('people:read'), validateRequest({ params: z.object({ id: z.string().min(1) }) }), asyncHandler(async (request, response) => {
  response.json(await peopleService.getPersonAccesses(request.params.id as string));
}));

router.get('/:id/documents', requirePermissions('people:read'), validateRequest({ params: z.object({ id: z.string().min(1) }) }), asyncHandler(async (request, response) => {
  response.json(await peopleService.getPersonDocuments(request.params.id as string));
}));

router.get('/:id/audit', requirePermissions('audit:read'), validateRequest({ params: z.object({ id: z.string().min(1) }) }), asyncHandler(async (request, response) => {
  response.json(await peopleService.getPersonAudit(request.params.id as string));
}));

router.get('/me/profile', requireAuth, asyncHandler(async (request, response) => {
  response.json(await peopleService.getMyProfile(request.auth!.userId));
}));

router.get('/me/accesses', requireAuth, asyncHandler(async (request, response) => {
  if (!request.auth?.personId) {
    response.json({ material: [], software: [], information: [] });
    return;
  }

  response.json(await peopleService.getPersonAccesses(request.auth.personId));
}));

export { router as peopleRouter };
