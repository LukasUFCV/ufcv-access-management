export const apiPermissionCodes = [
  'dashboard:read',
  'people:read',
  'people:write',
  'organization:read',
  'organization:write',
  'assets:read',
  'assets:write',
  'software:read',
  'software:write',
  'information:read',
  'information:write',
  'documents:read',
  'documents:write',
  'documents:sign',
  'workflow:read',
  'workflow:write',
  'audit:read',
  'notifications:read',
  'admin:read',
  'admin:write',
] as const;

export type PermissionCode = (typeof apiPermissionCodes)[number];
export type UserRole =
  | 'SUPER_ADMIN'
  | 'RH_ADMIN'
  | 'DSI_ADMIN'
  | 'MANAGER'
  | 'STANDARD_USER'
  | 'EXTERNAL_USER';

export type SessionUser = {
  id: string;
  userId: string;
  personId: string | null;
  displayName: string;
  email: string;
  role: UserRole;
  permissions: PermissionCode[];
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
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
  actorType:
    | 'SALARIE'
    | 'ADHERENT'
    | 'BENEVOLE'
    | 'VOLONTAIRE'
    | 'STAGIAIRE'
    | 'INTERVENANT_EXTERNE';
  status: 'PREPARATION' | 'ACTIVE' | 'TRANSITION' | 'SORTIE' | 'ARCHIVEE';
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
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'RETURNED';
  assignedAt: string;
  dueBackAt: string | null;
  returnedAt: string | null;
};

export type SoftwareAssignmentItem = {
  id: string;
  resourceName: string;
  licenseType: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'RETURNED';
  startDate: string;
  endDate: string | null;
  justification: string | null;
};

export type InformationAssignmentItem = {
  id: string;
  resourceName: string;
  resourceType: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'RETURNED';
  startDate: string;
  endDate: string | null;
};

export type DocumentAssignmentItem = {
  id: string;
  documentTitle: string;
  versionLabel: string;
  status: 'A_LIRE' | 'A_SIGNER' | 'SIGNE' | 'EXPIRE' | 'REMPLACE';
  dueDate: string | null;
  signedAt: string | null;
};

export type WorkflowCaseItem = {
  id: string;
  type: 'ONBOARDING' | 'OFFBOARDING';
  personName: string;
  status: 'BROUILLON' | 'EN_COURS' | 'EN_ATTENTE' | 'TERMINE' | 'BLOQUE';
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
