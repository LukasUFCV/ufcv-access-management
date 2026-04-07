import type { RequestHandler } from 'express';

import { env } from '../../config/env.js';
import { authService } from '../../modules/auth/auth.service.js';
import { verifyAuthToken } from './jwt.js';

export const sessionMiddleware: RequestHandler = async (request, _response, next) => {
  const token = request.cookies?.[env.COOKIE_NAME];

  if (!token) {
    return next();
  }

  try {
    const payload = verifyAuthToken(token);
    const sessionUser = await authService.getSessionUser(payload.userId);

    if (sessionUser) {
      request.auth = sessionUser;
    }
  } catch {
    // Session ignorée si invalide ou expirée.
  }

  next();
};

