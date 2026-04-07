import { AccessStatus, MaterialState, Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../core/errors/app-error.js';
import { auditService } from '../audit/audit.service.js';

export class AccessManagementService {
  async listMaterialAssets() {
    return prisma.materialAsset.findMany({
      include: {
        assignments: {
          include: { person: true },
          orderBy: { assignedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createMaterialAsset(input: {
    assetTag: string;
    name: string;
    assetType: string;
    serialNumber?: string | null;
    description?: string | null;
    state?: MaterialState;
  }) {
    return prisma.materialAsset.create({
      data: {
        ...input,
        state: input.state ?? MaterialState.AVAILABLE,
      },
    });
  }

  async assignMaterialAsset(
    actorId: string | undefined,
    assetId: string,
    input: { personId: string; dueBackAt?: Date | null; notes?: string | null },
    context: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const asset = await prisma.materialAsset.findUnique({ where: { id: assetId } });
    if (!asset) throw new AppError(404, 'Matériel introuvable.');

    const assignment = await prisma.materialAssignment.create({
      data: {
        assetId,
        personId: input.personId,
        dueBackAt: input.dueBackAt,
        notes: input.notes,
        status: AccessStatus.ACTIVE,
      },
    });

    await prisma.materialAsset.update({
      where: { id: assetId },
      data: { state: MaterialState.ASSIGNED },
    });

    await prisma.accessHistory.create({
      data: {
        categoryCode: 'material',
        eventType: 'ASSIGNED',
        materialAssignmentId: assignment.id,
        metadata: { assetTag: asset.assetTag },
      },
    });

    await auditService.createLog({
      actorId,
      action: 'assets.assign',
      entityType: 'MaterialAssignment',
      entityId: assignment.id,
      metadata: { assetId, personId: input.personId },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return assignment;
  }

  async returnMaterialAsset(
    actorId: string | undefined,
    assetId: string,
    context: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const assignment = await prisma.materialAssignment.findFirst({
      where: { assetId, status: AccessStatus.ACTIVE },
      orderBy: { assignedAt: 'desc' },
    });

    if (!assignment) {
      throw new AppError(404, 'Aucune attribution active trouvée pour ce matériel.');
    }

    const updated = await prisma.materialAssignment.update({
      where: { id: assignment.id },
      data: { status: AccessStatus.RETURNED, returnedAt: new Date() },
    });

    await prisma.materialAsset.update({
      where: { id: assetId },
      data: { state: MaterialState.AVAILABLE },
    });

    await prisma.accessHistory.create({
      data: {
        categoryCode: 'material',
        eventType: 'RETURNED',
        materialAssignmentId: updated.id,
      },
    });

    await auditService.createLog({
      actorId,
      action: 'assets.return',
      entityType: 'MaterialAssignment',
      entityId: updated.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  async listSoftwareResources() {
    return prisma.softwareResource.findMany({
      include: { assignments: true },
      orderBy: { name: 'asc' },
    });
  }

  async createSoftwareResource(input: {
    name: string;
    slug: string;
    licenseType: string;
    provisioningKey?: string | null;
    description?: string | null;
  }) {
    return prisma.softwareResource.create({ data: input });
  }

  async createSoftwareAssignment(
    actorId: string | undefined,
    input: {
      personId: string;
      resourceId: string;
      startDate: Date;
      endDate?: Date | null;
      justification?: string | null;
      status?: AccessStatus;
    },
    context: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const assignment = await prisma.softwareAssignment.create({
      data: {
        ...input,
        status: input.status ?? AccessStatus.ACTIVE,
      },
    });

    await prisma.accessHistory.create({
      data: {
        categoryCode: 'software',
        eventType: 'ASSIGNED',
        softwareAssignmentId: assignment.id,
      },
    });

    await auditService.createLog({
      actorId,
      action: 'software.assign',
      entityType: 'SoftwareAssignment',
      entityId: assignment.id,
      metadata: { resourceId: input.resourceId, personId: input.personId },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return assignment;
  }

  async updateSoftwareAssignment(
    actorId: string | undefined,
    assignmentId: string,
    input: { endDate?: Date | null; justification?: string | null; status?: AccessStatus },
    context: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const assignment = await prisma.softwareAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new AppError(404, 'Attribution logicielle introuvable.');

    const updated = await prisma.softwareAssignment.update({
      where: { id: assignmentId },
      data: input,
    });

    await prisma.accessHistory.create({
      data: {
        categoryCode: 'software',
        eventType: input.status === AccessStatus.REVOKED ? 'REVOKED' : 'UPDATED',
        softwareAssignmentId: updated.id,
      },
    });

    await auditService.createLog({
      actorId,
      action: 'software.update',
      entityType: 'SoftwareAssignment',
      entityId: updated.id,
      metadata: input as unknown as Prisma.JsonObject,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return updated;
  }

  async listInformationResources() {
    return prisma.informationResource.findMany({
      include: { assignments: true },
      orderBy: { name: 'asc' },
    });
  }

  async createInformationResource(input: {
    name: string;
    slug: string;
    resourceType: string;
    owner?: string | null;
    description?: string | null;
  }) {
    return prisma.informationResource.create({ data: input });
  }

  async createInformationAssignment(
    actorId: string | undefined,
    input: { personId: string; resourceId: string; startDate: Date; endDate?: Date | null; status?: AccessStatus },
    context: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const assignment = await prisma.informationAssignment.create({
      data: {
        ...input,
        status: input.status ?? AccessStatus.ACTIVE,
      },
    });

    await prisma.accessHistory.create({
      data: {
        categoryCode: 'information',
        eventType: 'ASSIGNED',
        informationAssignmentId: assignment.id,
      },
    });

    await auditService.createLog({
      actorId,
      action: 'information.assign',
      entityType: 'InformationAssignment',
      entityId: assignment.id,
      metadata: { resourceId: input.resourceId, personId: input.personId },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return assignment;
  }

  async updateInformationAssignment(
    actorId: string | undefined,
    assignmentId: string,
    input: { endDate?: Date | null; status?: AccessStatus },
    context: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const assignment = await prisma.informationAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new AppError(404, 'Attribution d’information introuvable.');

    const updated = await prisma.informationAssignment.update({
      where: { id: assignmentId },
      data: input,
    });

    await prisma.accessHistory.create({
      data: {
        categoryCode: 'information',
        eventType: input.status === AccessStatus.REVOKED ? 'REVOKED' : 'UPDATED',
        informationAssignmentId: updated.id,
      },
    });

    await auditService.createLog({
      actorId,
      action: 'information.update',
      entityType: 'InformationAssignment',
      entityId: updated.id,
      metadata: input as unknown as Prisma.JsonObject,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return updated;
  }
}

export const accessManagementService = new AccessManagementService();
