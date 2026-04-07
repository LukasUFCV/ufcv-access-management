import { ConnectorStatus, ConnectorType, Prisma } from '@prisma/client';

import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../core/errors/app-error.js';

export class IntegrationsService {
  async listConnectors() {
    return prisma.externalConnectorConfig.findMany({
      include: {
        syncJobs: {
          orderBy: { updatedAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateConnector(
    id: string,
    input: {
      status?: ConnectorStatus;
      baseUrl?: string | null;
      config?: Record<string, unknown> | null;
    },
  ) {
    const existing = await prisma.externalConnectorConfig.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Connecteur introuvable.');

    return prisma.externalConnectorConfig.update({
      where: { id },
      data: {
        status: input.status,
        baseUrl: input.baseUrl,
        config: (input.config as Prisma.InputJsonValue | undefined) ?? undefined,
      },
    });
  }

  async getArchitectureReadiness() {
    return {
      mockConnectorsEnabled: env.MOCK_CONNECTORS_ENABLED,
      graphBaseUrl: env.GRAPH_BASE_URL,
      directorySyncStrategy: env.DIRECTORY_SYNC_STRATEGY,
      plannedConnectors: [
        ConnectorType.AUTH,
        ConnectorType.DIRECTORY,
        ConnectorType.GRAPH,
        ConnectorType.ACCESS_PROVISIONING,
        ConnectorType.NOTIFICATIONS,
      ],
      supportedStatuses: [ConnectorStatus.ACTIVE, ConnectorStatus.INACTIVE, ConnectorStatus.ERROR],
    };
  }
}

export const integrationsService = new IntegrationsService();
