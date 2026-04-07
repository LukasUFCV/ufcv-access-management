import type { DashboardSummary } from '../../contracts/types.js';

import { AccessStatus, DocumentAssignmentStatus, MaterialState, PersonStatus, WorkflowStatus } from '@prisma/client';

import { prisma } from '../../config/prisma.js';

export class DashboardService {
  async getSummary(): Promise<DashboardSummary> {
    const now = new Date();
    const inTwoWeeks = new Date(now);
    inTwoWeeks.setDate(now.getDate() + 14);

    const [
      activePeople,
      onboardingsInProgress,
      offboardingsInProgress,
      documentsPendingSignature,
      expiringAccesses,
      materialPendingReturn,
    ] = await Promise.all([
      prisma.person.count({
        where: {
          status: PersonStatus.ACTIVE,
          archivedAt: null,
        },
      }),
      prisma.onboardingCase.count({
        where: {
          status: {
            in: [WorkflowStatus.EN_COURS, WorkflowStatus.EN_ATTENTE],
          },
        },
      }),
      prisma.offboardingCase.count({
        where: {
          status: {
            in: [WorkflowStatus.EN_COURS, WorkflowStatus.EN_ATTENTE],
          },
        },
      }),
      prisma.documentAssignment.count({
        where: {
          status: {
            in: [DocumentAssignmentStatus.A_LIRE, DocumentAssignmentStatus.A_SIGNER],
          },
        },
      }),
      prisma.softwareAssignment.count({
        where: {
          status: AccessStatus.ACTIVE,
          endDate: {
            gte: now,
            lte: inTwoWeeks,
          },
        },
      }),
      prisma.materialAssignment.count({
        where: {
          status: AccessStatus.ACTIVE,
          asset: {
            state: MaterialState.ASSIGNED,
          },
          dueBackAt: {
            lte: inTwoWeeks,
          },
        },
      }),
    ]);

    return {
      activePeople,
      onboardingsInProgress,
      offboardingsInProgress,
      documentsPendingSignature,
      expiringAccesses,
      materialPendingReturn,
    };
  }
}

export const dashboardService = new DashboardService();
