import type { DocumentAssignmentItem } from '../../contracts/types.js';
import { DocumentAssignmentStatus, Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../core/errors/app-error.js';
import { auditService } from '../audit/audit.service.js';

export class DocumentsService {
  async listDocuments() {
    return prisma.document.findMany({
      include: {
        category: true,
        currentVersion: true,
        assignments: true,
      },
      orderBy: { title: 'asc' },
    });
  }

  async createDocument(
    actorId: string | undefined,
    input: {
      code: string;
      title: string;
      description?: string | null;
      categoryId: string;
      valueType: Prisma.DocumentCreateInput['valueType'];
      consequenceText?: string | null;
      versionLabel: string;
      contentMarkdown: string;
      expiresAt?: Date | null;
    },
    context: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const checksum = createHash('sha256').update(input.contentMarkdown).digest('hex');

    const document = await prisma.document.create({
      data: {
        code: input.code,
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        valueType: input.valueType,
        consequenceText: input.consequenceText,
        versions: {
          create: {
            versionLabel: input.versionLabel,
            contentMarkdown: input.contentMarkdown,
            checksum,
            expiresAt: input.expiresAt,
          },
        },
      },
      include: { versions: true },
    });

    const version = document.versions[0];
    if (!version) {
      throw new AppError(500, 'Version de document non generee.');
    }

    await prisma.document.update({
      where: { id: document.id },
      data: { currentVersionId: version.id },
    });

    await auditService.createLog({
      actorId,
      action: 'documents.create',
      entityType: 'Document',
      entityId: document.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return this.getDocument(document.id);
  }

  async getDocument(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        category: true,
        currentVersion: true,
        versions: { orderBy: { publishedAt: 'desc' } },
        assignments: {
          include: {
            person: true,
            signature: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!document) {
      throw new AppError(404, 'Document introuvable.');
    }

    return document;
  }

  async assignDocument(
    actorId: string | undefined,
    documentId: string,
    input: {
      personIds: string[];
      dueDate?: Date | null;
      status?: DocumentAssignmentStatus;
      notes?: string | null;
    },
    context: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { currentVersion: true },
    });

    if (!document?.currentVersion) {
      throw new AppError(404, 'Document ou version courante introuvable.');
    }

    const created = await prisma.$transaction(
      input.personIds.map((personId) =>
        prisma.documentAssignment.create({
          data: {
            documentId,
            versionId: document.currentVersion!.id,
            personId,
            assignedByUserId: actorId ?? null,
            dueDate: input.dueDate,
            status: input.status ?? DocumentAssignmentStatus.A_SIGNER,
            notes: input.notes,
          },
        }),
      ),
    );

    await auditService.createLog({
      actorId,
      action: 'documents.assign',
      entityType: 'Document',
      entityId: documentId,
      metadata: { personIds: input.personIds },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return created;
  }

  async signDocument(
    userId: string,
    documentId: string,
    input: { assignmentId?: string; acknowledgementText: string },
    context: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.personId) throw new AppError(400, 'Aucun profil de personne lie a cet utilisateur.');

    const assignment = input.assignmentId
      ? await prisma.documentAssignment.findUnique({
          where: { id: input.assignmentId },
          include: { document: true, version: true },
        })
      : await prisma.documentAssignment.findFirst({
          where: {
            documentId,
            personId: user.personId,
            status: {
              in: [DocumentAssignmentStatus.A_LIRE, DocumentAssignmentStatus.A_SIGNER],
            },
          },
          include: { document: true, version: true },
          orderBy: { createdAt: 'desc' },
        });

    if (!assignment || assignment.documentId !== documentId) {
      throw new AppError(404, 'Assignation de document introuvable.');
    }

    if (assignment.personId !== user.personId) {
      throw new AppError(403, 'Vous ne pouvez signer que vos propres documents.');
    }

    const signature = await prisma.documentSignature.create({
      data: {
        documentAssignmentId: assignment.id,
        versionId: assignment.versionId,
        userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        acknowledgementText: input.acknowledgementText,
      },
    });

    await prisma.documentAssignment.update({
      where: { id: assignment.id },
      data: {
        status: DocumentAssignmentStatus.SIGNE,
        acknowledgedAt: new Date(),
        signedAt: signature.signedAt,
      },
    });

    await auditService.createLog({
      actorId: userId,
      action: 'documents.sign',
      entityType: 'DocumentSignature',
      entityId: signature.id,
      metadata: {
        documentId,
        assignmentId: assignment.id,
        versionId: assignment.versionId,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return signature;
  }

  async getMyDocuments(userId: string): Promise<DocumentAssignmentItem[]> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.personId) return [];

    const assignments = await prisma.documentAssignment.findMany({
      where: { personId: user.personId },
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

  async getMySignatures(userId: string) {
    const signatures = await prisma.documentSignature.findMany({
      where: { userId },
      include: {
        documentAssignment: { include: { document: true } },
        version: true,
      },
      orderBy: { signedAt: 'desc' },
    });

    return signatures.map((signature) => ({
      id: signature.id,
      signedAt: signature.signedAt.toISOString(),
      documentTitle: signature.documentAssignment.document.title,
      versionLabel: signature.version.versionLabel,
      ipAddress: signature.ipAddress,
    }));
  }
}

export const documentsService = new DocumentsService();
