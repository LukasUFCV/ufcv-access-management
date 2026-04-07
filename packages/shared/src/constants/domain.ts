export const ACTOR_TYPES = [
  'SALARIE',
  'ADHERENT',
  'BENEVOLE',
  'VOLONTAIRE',
  'STAGIAIRE',
  'INTERVENANT_EXTERNE',
] as const;

export type ActorTypeCode = (typeof ACTOR_TYPES)[number];

export const PERSON_STATUSES = [
  'PREPARATION',
  'ACTIVE',
  'TRANSITION',
  'SORTIE',
  'ARCHIVEE',
] as const;

export type PersonStatusCode = (typeof PERSON_STATUSES)[number];

export const ACCESS_STATUSES = ['PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED', 'RETURNED'] as const;
export type AccessStatusCode = (typeof ACCESS_STATUSES)[number];

export const DOCUMENT_STATUSES = ['A_LIRE', 'A_SIGNER', 'SIGNE', 'EXPIRE', 'REMPLACE'] as const;
export type DocumentStatusCode = (typeof DOCUMENT_STATUSES)[number];

export const WORKFLOW_STATUSES = [
  'BROUILLON',
  'EN_COURS',
  'EN_ATTENTE',
  'TERMINE',
  'BLOQUE',
] as const;

export type WorkflowStatusCode = (typeof WORKFLOW_STATUSES)[number];

