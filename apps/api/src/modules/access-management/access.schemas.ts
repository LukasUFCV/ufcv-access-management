import { AccessStatus, MaterialState } from '@prisma/client';
import { z } from 'zod';

export const materialAssetSchema = z.object({
  assetTag: z.string().min(2),
  name: z.string().min(2),
  assetType: z.string().min(2),
  serialNumber: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  state: z.nativeEnum(MaterialState).optional(),
});

export const materialAssignmentSchema = z.object({
  personId: z.string().min(1),
  dueBackAt: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const softwareResourceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  licenseType: z.string().min(2),
  provisioningKey: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const softwareAssignmentSchema = z.object({
  personId: z.string().min(1),
  resourceId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  justification: z.string().optional().nullable(),
  status: z.nativeEnum(AccessStatus).optional(),
});

export const softwareAssignmentUpdateSchema = z.object({
  endDate: z.string().datetime().optional().nullable(),
  justification: z.string().optional().nullable(),
  status: z.nativeEnum(AccessStatus).optional(),
});

export const informationResourceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  resourceType: z.string().min(2),
  owner: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const informationAssignmentSchema = z.object({
  personId: z.string().min(1),
  resourceId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  status: z.nativeEnum(AccessStatus).optional(),
});

