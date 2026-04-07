import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const sessionUser = {
  id: 'user-1',
  userId: 'user-1',
  personId: 'person-1',
  displayName: 'Lucie Moreau',
  email: 'manager@ufcv.demo',
  role: 'SUPER_ADMIN',
  permissions: [
    'dashboard:read',
    'people:read',
    'assets:read',
    'assets:write',
    'software:read',
    'software:write',
    'documents:read',
    'documents:write',
    'documents:sign',
    'workflow:read',
    'workflow:write',
    'audit:read',
    'notifications:read',
    'admin:read',
  ],
};

const mockApi = async (page: Parameters<typeof test>[0]['page']) => {
  let authenticated = false;

  await page.route('**/api/v1/auth/me', async (route) => {
    if (authenticated) {
      await route.fulfill({ json: { user: sessionUser } });
      return;
    }

    await route.fulfill({ status: 401, json: { message: 'Session absente.' } });
  });

  await page.route('**/api/v1/auth/login', async (route) => {
    authenticated = true;
    await route.fulfill({ json: { user: sessionUser } });
  });

  await page.route('**/api/v1/dashboard/summary', async (route) => {
    await route.fulfill({
      json: {
        activePeople: 42,
        onboardingsInProgress: 3,
        offboardingsInProgress: 2,
        documentsPendingSignature: 5,
        expiringAccesses: 4,
        materialPendingReturn: 1,
      },
    });
  });

  await page.route('**/api/v1/notifications', async (route) => {
    await route.fulfill({
      json: [
        {
          id: 'notif-1',
          title: 'Document à signer',
          type: 'ACTION_REQUIRED',
          isRead: false,
        },
      ],
    });
  });

  await page.route('**/api/v1/people?*', async (route) => {
    await route.fulfill({
      json: {
        items: [
          {
            id: 'person-1',
            firstName: 'Lucie',
            lastName: 'Moreau',
            emailProfessional: 'lucie@ufcv.demo',
            actorType: 'SALARIE',
            status: 'ACTIVE',
            position: 'Responsable régionale',
            region: 'Auvergne-Rhône-Alpes',
            city: 'Lyon',
          },
        ],
        total: 1,
      },
    });
  });

  await page.route('**/api/v1/people/person-1', async (route) => {
    await route.fulfill({
      json: {
        id: 'person-1',
        firstName: 'Lucie',
        lastName: 'Moreau',
        emailProfessional: 'lucie@ufcv.demo',
        position: 'Responsable régionale',
        managerName: 'Sophie Martin',
        status: 'ACTIVE',
      },
    });
  });

  await page.route('**/api/v1/people/person-1/accesses', async (route) => {
    await route.fulfill({
      json: {
        material: [{ id: 'mat-1', assetName: 'Dell Latitude', assetTag: 'MAT-001', status: 'ACTIVE' }],
        software: [{ id: 'soft-1', resourceName: 'Microsoft 365', licenseType: 'E3', status: 'ACTIVE' }],
        information: [],
      },
    });
  });

  await page.route('**/api/v1/people/person-1/documents', async (route) => {
    await route.fulfill({
      json: [{ id: 'doc-assignment-1', documentTitle: 'Charte informatique', versionLabel: 'v2026.1', status: 'A_SIGNER' }],
    });
  });

  await page.route('**/api/v1/people/person-1/audit', async (route) => {
    await route.fulfill({ json: { items: [] } });
  });

  await page.route('**/api/v1/documents', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: [
          {
            id: 'doc-1',
            title: 'Charte informatique',
            category: { label: 'Chartes internes' },
            currentVersion: { versionLabel: 'v2026.1' },
          },
        ],
      });
      return;
    }

    await route.fulfill({ status: 201, json: { id: 'doc-created' } });
  });

  await page.route('**/api/v1/documents/doc-1', async (route) => {
    await route.fulfill({
      json: {
        id: 'doc-1',
        title: 'Charte informatique',
        currentVersion: { contentMarkdown: 'Contenu document' },
      },
    });
  });

  await page.route('**/api/v1/documents/doc-1/sign', async (route) => {
    await route.fulfill({ status: 201, json: { id: 'signature-1' } });
  });

  await page.route('**/api/v1/assets/material', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: [{ id: 'asset-1', name: 'Dell Latitude', assetType: 'Ordinateur', state: 'AVAILABLE' }] });
      return;
    }

    await route.fulfill({ status: 201, json: { id: 'asset-created' } });
  });

  await page.route('**/api/v1/assets/material/asset-1/assign', async (route) => {
    await route.fulfill({ status: 201, json: { id: 'assignment-1' } });
  });

  await page.route('**/api/v1/actor-types', async (route) => {
    await route.fulfill({ json: [{ id: 'actor-1', label: 'Salarié' }] });
  });
};

test('login, consultation personne, signature, attribution et theme', async ({ page }) => {
  await mockApi(page);

  await page.goto('/login');
  await page.getByLabel('Identifiant').fill('superadmin');
  await page.getByLabel('Mot de passe').fill('demo1234');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();

  await page.goto('/people');
  await page.getByRole('link', { name: /Lucie Moreau/i }).click();
  await expect(page.getByText('Responsable régionale')).toBeVisible();

  await page.goto('/documents');
  await page.getByRole('button', { name: /Charte informatique/i }).click();
  await page.getByRole('button', { name: 'Signer le document' }).click();
  await expect(page.getByText('Signature interne', { exact: true })).toBeVisible();

  await page.goto('/assets/material');
  await page.locator('select').nth(0).selectOption('asset-1');
  await page.locator('select').nth(1).selectOption('person-1');
  await page.getByRole('button', { name: 'Attribuer' }).click();

  await page.getByRole('button', { name: /sombre/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('basic accessibility on login', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
