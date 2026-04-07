import type {
  DocumentAssignmentItem,
  InformationAssignmentItem,
  MaterialAssignmentItem,
  PaginatedResponse,
  PersonDetail,
  PersonListItem,
  SoftwareAssignmentItem,
} from '../../contracts/types.js';
import { PersonStatus, Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../core/errors/app-error.js';
import { parsePagination } from '../../core/utils/pagination.js';
import { auditService } from '../audit/audit.service.js';

const personBaseInclude = {
  actorType: true,
  position: true,
  domain: true,
  activity: true,
  region: true,
  city: true,
  manager: true,
} satisfies Prisma.PersonInclude;

const mapPersonListItem = (
  person: Prisma.PersonGetPayload<{
    include: typeof personBaseInclude;
  }>,
): PersonListItem => ({
  id: person.id,
  firstName: person.firstName,
  lastName: person.lastName,
  emailProfessional: person.emailProfessional,
  actorType: person.actorType.code as PersonListItem['actorType'],
  status: person.status as PersonListItem['status'],
  position: person.position?.title ?? 'Non renseigne',
  region: person.region?.name ?? 'Non renseignee',
  city: person.city?.name ?? 'Non renseignee',
  managerName: person.manager ? `${person.manager.firstName} ${person.manager.lastName}` : null,
  isExternal: person.isExternal,
  startDate: person.startDate?.toISOString() ?? null,
  endDate: person.endDate?.toISOString() ?? null,
});

export class PeopleService {
  async listPeople(query: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: PersonStatus;
    actorTypeId?: string;
    regionId?: string;
    domainId?: string;
    activityId?: string;
    sortBy?: 'lastName' | 'startDate' | 'status';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<PersonListItem>> {
    const pagination = parsePagination(query.page, query.pageSize);
    const where: Prisma.PersonWhereInput = {
      archivedAt: null,
      status: query.status,
      actorTypeId: query.actorTypeId,
      regionId: query.regionId,
      domainId: query.domainId,
      activityId: query.activityId,
      OR: query.search
        ? [
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
            { emailProfessional: { contains: query.search, mode: 'insensitive' } },
            { sessionIdentifier: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const orderBy = {
      [query.sortBy ?? 'lastName']: query.sortOrder ?? 'asc',
    } as Prisma.PersonOrderByWithRelationInput;

    const [total, items] = await Promise.all([
      prisma.person.count({ where }),
      prisma.person.findMany({
        where,
        include: personBaseInclude,
        orderBy,
        skip: pagination.skip,
        take: pagination.pageSize,
      }),
    ]);

    return {
      items: items.map(mapPersonListItem),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  }

  async getPersonById(personId: string): Promise<PersonDetail> {
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: personBaseInclude,
    });

    if (!person) {
      throw new AppError(404, 'Personne introuvable.');
    }

    return {
      ...mapPersonListItem(person),
      phoneProfessional: person.phoneProfessional,
      photoUrl: person.photoUrl,
      domain: person.domain?.name ?? null,
      activity: person.activity?.name ?? null,
      hierarchicalLevel: person.hierarchyLevel ?? null,
      notes: person.notes ?? null,
    };
  }

  async createPerson(
    actorId: string | undefined,
    input: Prisma.PersonUncheckedCreateInput,
    context: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const person = await prisma.person.create({
      data: input,
      include: personBaseInclude,
    });

    await prisma.personStatusHistory.create({
      data: {
        personId: person.id,
        toStatus: person.status,
        reason: 'Creation du dossier',
      },
    });

    await auditService.createLog({
      actorId,
      action: 'people.create',
      entityType: 'Person',
      entityId: person.id,
      metadata: { status: person.status },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return this.getPersonById(person.id);
  }

  async updatePerson(
    actorId: string | undefined,
    personId: string,
    input: Prisma.PersonUncheckedUpdateInput,
    context: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const existing = await prisma.person.findUnique({ where: { id: personId } });
    if (!existing) throw new AppError(404, 'Personne introuvable.');

    const person = await prisma.person.update({
      where: { id: personId },
      data: input,
      include: personBaseInclude,
    });

    if (input.status && input.status !== existing.status) {
      await prisma.personStatusHistory.create({
        data: {
          personId: person.id,
          fromStatus: existing.status,
          toStatus: input.status as PersonStatus,
          reason: 'Mise a jour du dossier',
        },
      });
    }

    await auditService.createLog({
      actorId,
      action: 'people.update',
      entityType: 'Person',
      entityId: person.id,
      metadata: {
        changes: input as unknown as Prisma.JsonObject,
      } as Prisma.JsonObject,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return this.getPersonById(person.id);
  }

  async archivePerson(actorId: string | undefined, personId: string) {
    const existing = await prisma.person.findUnique({ where: { id: personId } });
    if (!existing) throw new AppError(404, 'Personne introuvable.');

    await prisma.person.update({
      where: { id: personId },
      data: {
        archivedAt: new Date(),
        status: PersonStatus.ARCHIVEE,
      },
    });

    await prisma.personStatusHistory.create({
      data: {
        personId,
        fromStatus: existing.status,
        toStatus: PersonStatus.ARCHIVEE,
        reason: 'Archivage logique',
      },
    });

    await auditService.createLog({
      actorId,
      action: 'people.archive',
      entityType: 'Person',
      entityId: personId,
    });
  }

  async getPersonAccesses(personId: string): Promise<{
    material: MaterialAssignmentItem[];
    software: SoftwareAssignmentItem[];
    information: InformationAssignmentItem[];
  }> {
    const [material, software, information] = await Promise.all([
      prisma.materialAssignment.findMany({
        where: { personId },
        include: { asset: true },
        orderBy: { assignedAt: 'desc' },
      }),
      prisma.softwareAssignment.findMany({
        where: { personId },
        include: { resource: true },
        orderBy: { startDate: 'desc' },
      }),
      prisma.informationAssignment.findMany({
        where: { personId },
        include: { resource: true },
        orderBy: { startDate: 'desc' },
      }),
    ]);

    return {
      material: material.map((assignment) => ({
        id: assignment.id,
        assetName: assignment.asset.name,
        assetTag: assignment.asset.assetTag,
        status: assignment.status as MaterialAssignmentItem['status'],
        assignedAt: assignment.assignedAt.toISOString(),
        dueBackAt: assignment.dueBackAt?.toISOString() ?? null,
        returnedAt: assignment.returnedAt?.toISOString() ?? null,
      })),
      software: software.map((assignment) => ({
        id: assignment.id,
        resourceName: assignment.resource.name,
        licenseType: assignment.resource.licenseType,
        status: assignment.status as SoftwareAssignmentItem['status'],
        startDate: assignment.startDate.toISOString(),
        endDate: assignment.endDate?.toISOString() ?? null,
        justification: assignment.justification,
      })),
      information: information.map((assignment) => ({
        id: assignment.id,
        resourceName: assignment.resource.name,
        resourceType: assignment.resource.resourceType,
        status: assignment.status as InformationAssignmentItem['status'],
        startDate: assignment.startDate.toISOString(),
        endDate: assignment.endDate?.toISOString() ?? null,
      })),
    };
  }

  async getPersonDocuments(personId: string): Promise<DocumentAssignmentItem[]> {
    const assignments = await prisma.documentAssignment.findMany({
      where: { personId },
      include: { document: true, version: true },
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map((assignment) => ({
      id: assignment.id,
      documentTitle: assignment.document.title,
      versionLabel: assignment.version.versionLabel,
      status: assignment.status as DocumentAssignmentItem['status'],
      dueDate: assignment.dueDate?.toISOString() ?? null,
      signedAt: assignment.signedAt?.toISOString() ?? null,
    }));
  }

  async getPersonAudit(personId: string) {
    const result = await auditService.listLogs({
      page: 1,
      pageSize: 50,
      entityType: 'Person',
    });

    return {
      ...result,
      items: result.items.filter((item) => item.entityId === personId),
    };
  }

  async getMyProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { person: true },
    });

    if (!user?.personId) {
      throw new AppError(404, 'Profil introuvable.');
    }

    return this.getPersonById(user.personId);
  }
}

export const peopleService = new PeopleService();
