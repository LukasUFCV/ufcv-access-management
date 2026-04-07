import { DocumentAssignmentStatus, DocumentValueType } from '@prisma/client';
import { z } from 'zod';

export const documentCreateSchema = z.object({
  code: z.string().min(2),
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1),
  valueType: z.nativeEnum(DocumentValueType).default(DocumentValueType.ORGANISATIONNELLE),
  consequenceText: z.string().optional().nullable(),
  versionLabel: z.string().min(1),
  contentMarkdown: z.string().min(10),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const documentAssignSchema = z.object({
  personIds: z.array(z.string().min(1)).min(1),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.nativeEnum(DocumentAssignmentStatus).optional(),
  notes: z.string().optional().nullable(),
});

export const documentSignSchema = z.object({
  assignmentId: z.string().optional(),
  acknowledgementText: z
    .string()
    .default("Je reconnais avoir lu et accepte ce document dans le cadre de mes engagements internes UFCV."),
});

