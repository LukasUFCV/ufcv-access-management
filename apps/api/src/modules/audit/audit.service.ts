import { AuditSeverity, Prisma } from '@prisma/client';
import type { AuditLogItem, PaginatedResponse } from '../../contracts/types.js';

import { prisma } from '../../config/prisma.js';
import { parsePagination } from '../../core/utils/pagination.js';

type CreateAuditLogInput = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  severity?: AuditSeverity;
  metadata?: Prisma.JsonObject | Prisma.JsonArray | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class AuditService {
  async createLog(input: CreateAuditLogInput) {
    return prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        severity: input.severity ?? AuditSeverity.INFO,
        metadata: input.metadata ?? Prisma.JsonNull,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }

  async listLogs(params: {
    page?: number;
    pageSize?: number;
    action?: string;
    entityType?: string;
  }): Promise<PaginatedResponse<AuditLogItem>> {
    const pagination = parsePagination(params.page, params.pageSize);
    const where: Prisma.AuditLogWhereInput = {};

    if (params.action) {
      where.action = { contains: params.action, mode: 'insensitive' };
    }

    if (params.entityType) {
      where.entityType = { equals: params.entityType, mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            include: {
              person: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.pageSize,
      }),
    ]);

    const mappedItems: AuditLogItem[] = items.map((item) => ({
        id: item.id,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        actorName: item.actor?.person
          ? `${item.actor.person.firstName} ${item.actor.person.lastName}`
          : item.actor?.login ?? null,
        createdAt: item.createdAt.toISOString(),
        metadata: (item.metadata as Record<string, unknown> | null) ?? null,
      }));

    return {
      items: mappedItems,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  }
}

export const auditService = new AuditService();
