import { PersonStatus } from '@prisma/client';
import { z } from 'zod';

export const peopleQuerySchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().optional(),
  status: z.nativeEnum(PersonStatus).optional(),
  actorTypeId: z.string().optional(),
  regionId: z.string().optional(),
  domainId: z.string().optional(),
  activityId: z.string().optional(),
  sortBy: z.enum(['lastName', 'startDate', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const personUpsertSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  sessionIdentifier: z.string().min(2),
  emailProfessional: z.string().email(),
  phoneProfessional: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  actorTypeId: z.string().min(1),
  positionId: z.string().optional().nullable(),
  domainId: z.string().optional().nullable(),
  activityId: z.string().optional().nullable(),
  regionId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  orgNodeId: z.string().optional().nullable(),
  hierarchyLevel: z.string().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  status: z.nativeEnum(PersonStatus),
  isExternal: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export const personUpdateSchema = personUpsertSchema.partial();

