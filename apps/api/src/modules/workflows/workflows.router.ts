import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../core/http/async-handler.js';
import { validateRequest } from '../../core/http/validate.js';
import { requirePermissions } from '../../core/security/permissions.js';
import { workflowCaseSchema, workflowUpdateSchema } from './workflows.schemas.js';
import { workflowsService } from './workflows.service.js';

const router = Router();

router.get('/onboarding', requirePermissions('workflow:read'), asyncHandler(async (_request, response) => {
  response.json(await workflowsService.listOnboardingCases());
}));

router.post('/onboarding', requirePermissions('workflow:write'), validateRequest({ body: workflowCaseSchema }), asyncHandler(async (request, response) => {
  response.status(201).json(
    await workflowsService.createOnboardingCase(request.auth?.userId, {
      ...request.body,
      dueDate: request.body.dueDate ? new Date(request.body.dueDate) : null,
      tasks: request.body.tasks?.map((task: (typeof request.body.tasks)[number]) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
      })),
    }),
  );
}));

router.patch('/onboarding/:id', requirePermissions('workflow:write'), validateRequest({ params: z.object({ id: z.string().min(1) }), body: workflowUpdateSchema }), asyncHandler(async (request, response) => {
  const caseId = request.params.id as string;
  response.json(
    await workflowsService.updateOnboardingCase(request.auth?.userId, caseId, {
      ...request.body,
      dueDate: request.body.dueDate ? new Date(request.body.dueDate) : null,
    }),
  );
}));

router.get('/offboarding', requirePermissions('workflow:read'), asyncHandler(async (_request, response) => {
  response.json(await workflowsService.listOffboardingCases());
}));

router.post('/offboarding', requirePermissions('workflow:write'), validateRequest({ body: workflowCaseSchema }), asyncHandler(async (request, response) => {
  response.status(201).json(
    await workflowsService.createOffboardingCase(request.auth?.userId, {
      ...request.body,
      dueDate: request.body.dueDate ? new Date(request.body.dueDate) : null,
      tasks: request.body.tasks?.map((task: (typeof request.body.tasks)[number]) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
      })),
    }),
  );
}));

router.patch('/offboarding/:id', requirePermissions('workflow:write'), validateRequest({ params: z.object({ id: z.string().min(1) }), body: workflowUpdateSchema }), asyncHandler(async (request, response) => {
  const caseId = request.params.id as string;
  response.json(
    await workflowsService.updateOffboardingCase(request.auth?.userId, caseId, {
      ...request.body,
      dueDate: request.body.dueDate ? new Date(request.body.dueDate) : null,
    }),
  );
}));

export { router as workflowsRouter };
