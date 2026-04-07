import type { PermissionCode, SessionUser } from '../../contracts/types.js';

import type { RequestHandler } from 'express';

import { AppError } from '../errors/app-error.js';

export const requireAuth: RequestHandler = (request, _response, next) => {
  if (!request.auth) {
    return next(new AppError(401, 'Authentification requise.'));
  }

  next();
};

export const requirePermissions = (...permissions: PermissionCode[]): RequestHandler => {
  return (request, _response, next) => {
    const auth = request.auth;

    if (!auth) {
      return next(new AppError(401, 'Authentification requise.'));
    }

    const hasPermissions = permissions.every((permission) => auth.permissions.includes(permission));

    if (!hasPermissions) {
      return next(new AppError(403, 'Accès insuffisant pour cette action.'));
    }

    next();
  };
};

export const hasPermission = (user: SessionUser, permission: PermissionCode): boolean => {
  return user.permissions.includes(permission);
};
