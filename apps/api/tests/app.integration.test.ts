import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/ufcv_access_management?schema=public';
process.env.JWT_SECRET = '0123456789abcdef0123456789abcdef';
process.env.APP_URL = 'http://localhost:4000';
process.env.WEB_URL = 'http://localhost:5173';
process.env.CORS_ORIGIN = 'http://localhost:5173';

const authServiceMock = {
  login: vi.fn(),
  getSessionUser: vi.fn(),
};

const peopleServiceMock = {
  listPeople: vi.fn(),
};

const documentsServiceMock = {
  signDocument: vi.fn(),
};

const accessManagementServiceMock = {
  createSoftwareAssignment: vi.fn(),
};

const auditServiceMock = {
  createLog: vi.fn(),
  listLogs: vi.fn(),
};

vi.mock('../src/modules/auth/auth.service.js', () => ({
  authService: authServiceMock,
}));

vi.mock('../src/modules/people/people.service.js', () => ({
  peopleService: peopleServiceMock,
}));

vi.mock('../src/modules/documents/documents.service.js', () => ({
  documentsService: documentsServiceMock,
}));

vi.mock('../src/modules/access-management/access.service.js', () => ({
  accessManagementService: accessManagementServiceMock,
}));

vi.mock('../src/modules/audit/audit.service.js', () => ({
  auditService: auditServiceMock,
}));

const { createApp } = await import('../src/app.js');
const { signAuthToken } = await import('../src/core/security/jwt.js');

const makeSessionUser = (permissions: string[]) => ({
  id: 'user-1',
  userId: 'user-1',
  personId: 'person-1',
  displayName: 'Demo User',
  email: 'demo@ufcv.test',
  role: 'SUPER_ADMIN' as const,
  permissions,
});

describe('API integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/v1/auth/login authenticates and sets a cookie', async () => {
    authServiceMock.login.mockResolvedValue(makeSessionUser(['dashboard:read']));

    const app = createApp();
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ login: 'superadmin', password: 'demo1234' });

    expect(response.status).toBe(200);
    expect(response.body.user.displayName).toBe('Demo User');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('GET /api/v1/people returns paginated people data for authorized users', async () => {
    authServiceMock.getSessionUser.mockResolvedValue(makeSessionUser(['people:read']));
    peopleServiceMock.listPeople.mockResolvedValue({
      items: [
        {
          id: 'person-1',
          firstName: 'Lucie',
          lastName: 'Moreau',
          emailProfessional: 'lucie@ufcv.test',
          actorType: 'SALARIE',
          status: 'ACTIVE',
          position: 'Responsable regionale',
          region: 'AURA',
          city: 'Lyon',
          managerName: null,
          isExternal: false,
          startDate: null,
          endDate: null,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    const cookie = `ufcv_access_token=${signAuthToken({ userId: 'user-1' })}`;
    const app = createApp();
    const response = await request(app).get('/api/v1/people').set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(peopleServiceMock.listPeople).toHaveBeenCalled();
  });

  it('POST /api/v1/documents/:id/sign signs a document for an authorized user', async () => {
    authServiceMock.getSessionUser.mockResolvedValue(makeSessionUser(['documents:sign']));
    documentsServiceMock.signDocument.mockResolvedValue({ id: 'signature-1' });

    const cookie = `ufcv_access_token=${signAuthToken({ userId: 'user-1' })}`;
    const app = createApp();
    const response = await request(app)
      .post('/api/v1/documents/doc-1/sign')
      .set('Cookie', cookie)
      .send({});

    expect(response.status).toBe(201);
    expect(documentsServiceMock.signDocument).toHaveBeenCalledWith(
      'user-1',
      'doc-1',
      expect.any(Object),
      expect.any(Object),
    );
  });

  it('POST /api/v1/software-assignments creates an assignment for authorized users', async () => {
    authServiceMock.getSessionUser.mockResolvedValue(makeSessionUser(['software:write']));
    accessManagementServiceMock.createSoftwareAssignment.mockResolvedValue({ id: 'assign-1' });

    const cookie = `ufcv_access_token=${signAuthToken({ userId: 'user-1' })}`;
    const app = createApp();
    const response = await request(app)
      .post('/api/v1/software-assignments')
      .set('Cookie', cookie)
      .send({
        personId: 'person-1',
        resourceId: 'resource-1',
        startDate: '2026-04-07T09:00:00.000Z',
      });

    expect(response.status).toBe(201);
    expect(accessManagementServiceMock.createSoftwareAssignment).toHaveBeenCalled();
  });
});
