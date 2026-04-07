import { z } from 'zod';

export const referenceCreateSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  domainId: z.string().optional().nullable(),
  activityId: z.string().optional().nullable(),
  jobTypeId: z.string().optional().nullable(),
  regionId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  label: z.string().optional(),
});

export const referenceUpdateSchema = referenceCreateSchema.partial();

export const orgTreeQuerySchema = z.object({
  regionId: z.string().optional(),
  domainId: z.string().optional(),
  activityId: z.string().optional(),
});

