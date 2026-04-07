import type { PermissionCode, UserRole } from '../constants/auth';
import type {
  AccessStatusCode,
  ActorTypeCode,
  DocumentStatusCode,
  PersonStatusCode,
  WorkflowStatusCode,
} from '../constants/domain';

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type SessionUser = {
  id: string;
  userId: string;
  personId: string | null;
  displayName: string;
  email: string;
  role: UserRole;
  permissions: PermissionCode[];
};

export type DashboardSummary = {
  activePeople: number;
  onboardingsInProgress: number;
  offboardingsInProgress: number;
  documentsPendingSignature: number;
  expiringAccesses: number;
  materialPendingReturn: number;
};

export type PersonListItem = {
  id: string;
  firstName: string;
  lastName: string;
  emailProfessional: string;
  actorType: ActorTypeCode;
  status: PersonStatusCode;
  position: string;
  region: string;
  city: string;
  managerName: string | null;
  isExternal: boolean;
  startDate: string | null;
  endDate: string | null;
};

export type PersonDetail = PersonListItem & {
  phoneProfessional: string | null;
  photoUrl: string | null;
  domain: string | null;
  activity: string | null;
  hierarchicalLevel: string | null;
  notes: string | null;
};

export type MaterialAssignmentItem = {
  id: string;
  assetName: string;
  assetTag: string;
  status: AccessStatusCode;
  assignedAt: string;
  dueBackAt: string | null;
  returnedAt: string | null;
};

export type SoftwareAssignmentItem = {
  id: string;
  resourceName: string;
  licenseType: string;
  status: AccessStatusCode;
  startDate: string;
  endDate: string | null;
  justification: string | null;
};

export type InformationAssignmentItem = {
  id: string;
  resourceName: string;
  resourceType: string;
  status: AccessStatusCode;
  startDate: string;
  endDate: string | null;
};

export type DocumentAssignmentItem = {
  id: string;
  documentTitle: string;
  versionLabel: string;
  status: DocumentStatusCode;
  dueDate: string | null;
  signedAt: string | null;
};

export type WorkflowCaseItem = {
  id: string;
  type: 'ONBOARDING' | 'OFFBOARDING';
  personName: string;
  status: WorkflowStatusCode;
  progress: number;
  dueDate: string | null;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: 'INFO' | 'WARNING' | 'ACTION_REQUIRED' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
};

export type AuditLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorName: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};
