import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { errorHandler } from './core/errors/error-handler.js';
import { sessionMiddleware } from './core/security/session-middleware.js';
import { accessManagementRouter } from './modules/access-management/access.router.js';
import { auditRouter } from './modules/audit/audit.router.js';
import { authRouter } from './modules/auth/auth.router.js';
import { dashboardRouter } from './modules/dashboard/dashboard.router.js';
import { documentsRouter } from './modules/documents/documents.router.js';
import { integrationsRouter } from './modules/integrations/integrations.router.js';
import { notificationsRouter } from './modules/notifications/notifications.router.js';
import { organizationRouter } from './modules/organization/organization.router.js';
import { peopleRouter } from './modules/people/people.router.js';
import { workflowsRouter } from './modules/workflows/workflows.router.js';

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(sessionMiddleware);

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/people', peopleRouter);
  app.use('/api/v1', organizationRouter);
  app.use('/api/v1', accessManagementRouter);
  app.use('/api/v1/documents', documentsRouter);
  app.use('/api/v1', workflowsRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/audit-logs', auditRouter);
  app.use('/api/v1/integrations', integrationsRouter);

  app.use(errorHandler);

  return app;
};

