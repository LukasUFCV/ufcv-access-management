import { WorkflowStatus, WorkflowTaskStatus } from '@prisma/client';
import { z } from 'zod';

export const workflowTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  order: z.number().int().min(1),
  status: z.nativeEnum(WorkflowTaskStatus).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const workflowCaseSchema = z.object({
  personId: z.string().min(1),
  status: z.nativeEnum(WorkflowStatus).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
  tasks: z.array(workflowTaskSchema).optional(),
});

export const workflowUpdateSchema = z.object({
  status: z.nativeEnum(WorkflowStatus).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
  completionRate: z.number().min(0).max(100).optional(),
});

