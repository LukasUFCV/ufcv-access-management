import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { cacheStore, defaultCacheTtlSeconds } from '../../core/cache/index.js';
import { AppError } from '../../core/errors/app-error.js';

type OrgTreeNode = {
  id: string;
  name: string;
  code: string;
  type: string;
  parentId: string | null;
  domain: string | null;
  activity: string | null;
  region: string | null;
  city: string | null;
  position: string | null;
  peopleCount: number;
  children: OrgTreeNode[];
};

const buildOrgTree = (
  nodes: Array<
    Prisma.OrgNodeGetPayload<{
      include: {
        domain: true;
        activity: true;
        region: true;
        city: true;
        position: true;
        people: true;
      };
    }>
  >,
): OrgTreeNode[] => {
  const map = new Map<string, OrgTreeNode>();
  const roots: OrgTreeNode[] = [];

  nodes.forEach((node) => {
    map.set(node.id, {
      id: node.id,
      name: node.name,
      code: node.code,
      type: node.type,
      parentId: node.parentId,
      domain: node.domain?.name ?? null,
      activity: node.activity?.name ?? null,
      region: node.region?.name ?? null,
      city: node.city?.name ?? null,
      position: node.position?.title ?? null,
      peopleCount: node.people.length,
      children: [],
    });
  });

  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

export class OrganizationService {
  private invalidateReferenceCache() {
    cacheStore.clear();
  }

  async getOrgTree(filters: { regionId?: string; domainId?: string; activityId?: string }) {
    const key = `org-tree:${JSON.stringify(filters)}`;
    const cached = cacheStore.get<OrgTreeNode[]>(key);

    if (cached) {
      return cached;
    }

    const nodes = await prisma.orgNode.findMany({
      where: {
        regionId: filters.regionId,
        domainId: filters.domainId,
        activityId: filters.activityId,
      },
      include: {
        domain: true,
        activity: true,
        region: true,
        city: true,
        position: true,
        people: true,
      },
      orderBy: [{ name: 'asc' }],
    });

    const tree = buildOrgTree(nodes);
    cacheStore.set(key, tree, defaultCacheTtlSeconds);
    return tree;
  }

  async listDomains() {
    return prisma.domain.findMany({ orderBy: { name: 'asc' } });
  }

  async createDomain(input: { code: string; name: string; description?: string }) {
    const item = await prisma.domain.create({ data: input });
    this.invalidateReferenceCache();
    return item;
  }

  async updateDomain(id: string, input: { code?: string; name?: string; description?: string }) {
    const existing = await prisma.domain.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Domaine introuvable.');
    const item = await prisma.domain.update({ where: { id }, data: input });
    this.invalidateReferenceCache();
    return item;
  }

  async listActivities() {
    return prisma.activity.findMany({
      include: { domain: true },
      orderBy: [{ domain: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async createActivity(input: {
    code: string;
    name: string;
    description?: string;
    domainId: string;
  }) {
    const item = await prisma.activity.create({ data: input, include: { domain: true } });
    this.invalidateReferenceCache();
    return item;
  }

  async updateActivity(
    id: string,
    input: { code?: string; name?: string; description?: string; domainId?: string | null },
  ) {
    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Activité introuvable.');
    const item = await prisma.activity.update({
      where: { id },
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        domainId: input.domainId ?? undefined,
      },
      include: { domain: true },
    });
    this.invalidateReferenceCache();
    return item;
  }

  async listJobTypes() {
    return prisma.jobType.findMany({ orderBy: { name: 'asc' } });
  }

  async createJobType(input: { code: string; name: string; description?: string }) {
    const item = await prisma.jobType.create({ data: input });
    this.invalidateReferenceCache();
    return item;
  }

  async updateJobType(id: string, input: { code?: string; name?: string; description?: string }) {
    const existing = await prisma.jobType.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Type de poste introuvable.');
    const item = await prisma.jobType.update({ where: { id }, data: input });
    this.invalidateReferenceCache();
    return item;
  }

  async listPositions() {
    return prisma.position.findMany({
      include: { domain: true, activity: true, jobType: true },
      orderBy: { title: 'asc' },
    });
  }

  async createPosition(input: {
    code: string;
    title?: string;
    name?: string;
    description?: string;
    domainId?: string | null;
    activityId?: string | null;
    jobTypeId?: string | null;
  }) {
    const item = await prisma.position.create({
      data: {
        code: input.code,
        title: input.title ?? input.name ?? input.code,
        description: input.description,
        domainId: input.domainId ?? null,
        activityId: input.activityId ?? null,
        jobTypeId: input.jobTypeId ?? null,
      },
      include: { domain: true, activity: true, jobType: true },
    });
    this.invalidateReferenceCache();
    return item;
  }

  async updatePosition(
    id: string,
    input: {
      code?: string;
      title?: string;
      name?: string;
      description?: string;
      domainId?: string | null;
      activityId?: string | null;
      jobTypeId?: string | null;
    },
  ) {
    const existing = await prisma.position.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Poste introuvable.');
    const item = await prisma.position.update({
      where: { id },
      data: {
        code: input.code,
        title: input.title ?? input.name,
        description: input.description,
        domainId: input.domainId,
        activityId: input.activityId,
        jobTypeId: input.jobTypeId,
      },
      include: { domain: true, activity: true, jobType: true },
    });
    this.invalidateReferenceCache();
    return item;
  }

  async listRegions() {
    return prisma.region.findMany({
      include: { cities: true },
      orderBy: { name: 'asc' },
    });
  }

  async listActorTypes() {
    return prisma.actorType.findMany({ orderBy: { label: 'asc' } });
  }

  async listRoles() {
    return prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async listPermissions() {
    return prisma.permission.findMany({ orderBy: { code: 'asc' } });
  }
}

export const organizationService = new OrganizationService();
