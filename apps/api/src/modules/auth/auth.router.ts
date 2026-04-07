import { Router } from 'express';

import { env } from '../../config/env.js';
import { AppError } from '../../core/errors/app-error.js';
import { asyncHandler } from '../../core/http/async-handler.js';
import { validateRequest } from '../../core/http/validate.js';
import { signAuthToken, verifyAuthToken } from '../../core/security/jwt.js';
import { requireAuth } from '../../core/security/permissions.js';
import { auditService } from '../audit/audit.service.js';
import { loginSchema } from './auth.schemas.js';
import { authService } from './auth.service.js';

const router = Router();

router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  asyncHandler(async (request, response) => {
    const sessionUser = await authService.login(request.body.login, request.body.password);
    const signedToken = signAuthToken({
      userId: sessionUser.userId,
    });

    response.cookie(env.COOKIE_NAME, signedToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
    });

    await auditService.createLog({
      actorId: sessionUser.userId,
      action: 'auth.login',
      entityType: 'User',
      entityId: sessionUser.userId,
      metadata: {
        role: sessionUser.role,
      },
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });

    response.json({
      user: sessionUser,
    });
  }),
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (request, response) => {
    await auditService.createLog({
      actorId: request.auth?.userId,
      action: 'auth.logout',
      entityType: 'User',
      entityId: request.auth?.userId,
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });

    response.clearCookie(env.COOKIE_NAME);
    response.status(204).send();
  }),
);

router.get(
  '/me',
  asyncHandler(async (request, response) => {
    const token = request.cookies?.[env.COOKIE_NAME];

    if (!token) {
      throw new AppError(401, 'Session absente.');
    }

    const payload = verifyAuthToken(token);
    const sessionUser = await authService.getSessionUser(payload.userId);

    if (!sessionUser) {
      throw new AppError(401, 'Session invalide.');
    }

    response.json({
      user: sessionUser,
    });
  }),
);

export { router as authRouter };
