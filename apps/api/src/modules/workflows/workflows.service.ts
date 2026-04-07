import type { WorkflowCaseItem } from '../../contracts/types.js';
import { WorkflowStatus, WorkflowTaskStatus, Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../core/errors/app-error.js';
import { auditService } from '../audit/audit.service.js';

const defaultOnboardingTasks = [
  'Créer le dossier utilisateur',
  'Attribuer les accès initiaux',
  'Mettre à disposition les documents',
  'Vérifier la prise de poste',
];

const defaultOffboardingTasks = [
  'Planifier la date de sortie',
  'Révoquer les accès logiciels',
  'Retirer les accès à l’information',
  'Récupérer le matériel',
  'Clôturer le dossier',
];

const mapCase = (
  item: Prisma.OnboardingCaseGetPayload<{ include: { person: true } }> | Prisma.OffboardingCaseGetPayload<{ include: { person: true } }>,
  type: WorkflowCaseItem['type'],
): WorkflowCaseItem => ({
  id: item.id,
  type,
  personName: `${item.person.firstName} ${item.person.lastName}`,
  status: item.status as WorkflowCaseItem['status'],
  progress: item.completionRate,
  dueDate: item.dueDate?.toISOString() ?? null,
});

export class WorkflowsService {
  async listOnboardingCases(): Promise<WorkflowCaseItem[]> {
    const items = await prisma.onboardingCase.findMany({
      include: { person: true },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => mapCase(item, 'ONBOARDING'));
  }

  async listOffboardingCases(): Promise<WorkflowCaseItem[]> {
    const items = await prisma.offboardingCase.findMany({
      include: { person: true },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => mapCase(item, 'OFFBOARDING'));
  }

  async createOnboardingCase(
    actorId: string | undefined,
    input: {
      personId: string;
      status?: WorkflowStatus;
      dueDate?: Date | null;
      notes?: string | null;
      tasks?: Array<{
        title: string;
        description?: string | null;
        order: number;
        status?: WorkflowTaskStatus;
        dueDate?: Date | null;
      }>;
    },
  ) {
    const created = await prisma.onboardingCase.create({
      data: {
        personId: input.personId,
        status: input.status ?? WorkflowStatus.EN_COURS,
        dueDate: input.dueDate,
        notes: input.notes,
        tasks: {
          create:
            input.tasks?.map((task) => ({
              ...task,
              status: task.status ?? WorkflowTaskStatus.TODO,
            })) ??
            defaultOnboardingTasks.map((title, index) => ({
              title,
              order: index + 1,
              status: WorkflowTaskStatus.TODO,
            })),
        },
      },
      include: { person: true },
    });

    await auditService.createLog({
      actorId,
      action: 'workflow.onboarding.create',
      entityType: 'OnboardingCase',
      entityId: created.id,
    });

    return created;
  }

  async createOffboardingCase(
    actorId: string | undefined,
    input: {
      personId: string;
      status?: WorkflowStatus;
      dueDate?: Date | null;
      notes?: string | null;
      tasks?: Array<{
        title: string;
        description?: string | null;
        order: number;
        status?: WorkflowTaskStatus;
        dueDate?: Date | null;
      }>;
    },
  ) {
    const created = await prisma.offboardingCase.create({
      data: {
        personId: input.personId,
        status: input.status ?? WorkflowStatus.EN_COURS,
        dueDate: input.dueDate,
        notes: input.notes,
        tasks: {
          create:
            input.tasks?.map((task) => ({
              ...task,
              status: task.status ?? WorkflowTaskStatus.TODO,
            })) ??
            defaultOffboardingTasks.map((title, index) => ({
              title,
              order: index + 1,
              status: WorkflowTaskStatus.TODO,
            })),
        },
      },
      include: { person: true },
    });

    await auditService.createLog({
      actorId,
      action: 'workflow.offboarding.create',
      entityType: 'OffboardingCase',
      entityId: created.id,
    });

    return created;
  }

  async updateOnboardingCase(
    actorId: string | undefined,
    id: string,
    input: { status?: WorkflowStatus; dueDate?: Date | null; notes?: string | null; completionRate?: number },
  ) {
    const existing = await prisma.onboardingCase.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Parcours d’arrivée introuvable.');

    const updated = await prisma.onboardingCase.update({ where: { id }, data: input });

    await auditService.createLog({
      actorId,
      action: 'workflow.onboarding.update',
      entityType: 'OnboardingCase',
      entityId: updated.id,
    });

    return updated;
  }

  async updateOffboardingCase(
    actorId: string | undefined,
    id: string,
    input: { status?: WorkflowStatus; dueDate?: Date | null; notes?: string | null; completionRate?: number },
  ) {
    const existing = await prisma.offboardingCase.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Parcours de départ introuvable.');

    const updated = await prisma.offboardingCase.update({ where: { id }, data: input });

    await auditService.createLog({
      actorId,
      action: 'workflow.offboarding.update',
      entityType: 'OffboardingCase',
      entityId: updated.id,
    });

    return updated;
  }
}

export const workflowsService = new WorkflowsService();
