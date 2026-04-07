import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../core/http/async-handler.js';
import { validateRequest } from '../../core/http/validate.js';
import { requireAuth, requirePermissions } from '../../core/security/permissions.js';
import { documentAssignSchema, documentCreateSchema, documentSignSchema } from './documents.schemas.js';
import { documentsService } from './documents.service.js';

const router = Router();

router.get('/', requirePermissions('documents:read'), asyncHandler(async (_request, response) => {
  response.json(await documentsService.listDocuments());
}));

router.post('/', requirePermissions('documents:write'), validateRequest({ body: documentCreateSchema }), asyncHandler(async (request, response) => {
  response.status(201).json(
    await documentsService.createDocument(
      request.auth?.userId,
      {
        ...request.body,
        expiresAt: request.body.expiresAt ? new Date(request.body.expiresAt) : null,
      },
      {
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      },
    ),
  );
}));

router.get('/:id', requirePermissions('documents:read'), validateRequest({ params: z.object({ id: z.string().min(1) }) }), asyncHandler(async (request, response) => {
  response.json(await documentsService.getDocument(request.params.id as string));
}));

router.post('/:id/assign', requirePermissions('documents:write'), validateRequest({ params: z.object({ id: z.string().min(1) }), body: documentAssignSchema }), asyncHandler(async (request, response) => {
  const documentId = request.params.id as string;
  response.status(201).json(
    await documentsService.assignDocument(
      request.auth?.userId,
      documentId,
      {
        ...request.body,
        dueDate: request.body.dueDate ? new Date(request.body.dueDate) : null,
      },
      {
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      },
    ),
  );
}));

router.post('/:id/sign', requireAuth, requirePermissions('documents:sign'), validateRequest({ params: z.object({ id: z.string().min(1) }), body: documentSignSchema }), asyncHandler(async (request, response) => {
  const documentId = request.params.id as string;
  response.status(201).json(
    await documentsService.signDocument(request.auth!.userId, documentId, request.body, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    }),
  );
}));

router.get('/me/documents', requireAuth, asyncHandler(async (request, response) => {
  response.json(await documentsService.getMyDocuments(request.auth!.userId));
}));

router.get('/me/signatures', requireAuth, asyncHandler(async (request, response) => {
  response.json(await documentsService.getMySignatures(request.auth!.userId));
}));

export { router as documentsRouter };
