export const USER_ROLES = [
  'SUPER_ADMIN',
  'RH_ADMIN',
  'DSI_ADMIN',
  'MANAGER',
  'STANDARD_USER',
  'EXTERNAL_USER',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const PERMISSIONS = [
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

export type PermissionCode = (typeof PERMISSIONS)[number];

