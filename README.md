# Habilitations UFCV

Application web interne full-stack pour gerer le cycle de vie des personnes, leurs habilitations, leurs acces, leurs documents internes et les workflows d'onboarding / offboarding.

## Stack

- Front-end : React, Vite, TypeScript, React Router, CSS custom, theme clair / sombre / systeme
- Back-end : Node.js, Express, TypeScript, JWT cookie httpOnly, validation Zod, architecture modulaire
- Base de donnees : PostgreSQL, Prisma ORM, migration SQL initiale, seed riche de demonstration
- Tests : Vitest, Supertest, Testing Library, Playwright, axe-core Playwright
- Outillage : npm workspaces, Docker Compose, ESLint, Prettier

## Structure

```text
apps/
  api/        API REST Express + modules metier
  web/        SPA React/Vite
packages/
  config/     config TypeScript / ESLint partagee
  shared/     types et constantes partagees
prisma/
  schema.prisma
  seed.ts
  migrations/20260402110000_init/migration.sql
docs/
  openapi.yaml
docker-compose.yml
.env.example
ASSUMPTIONS.md
README.md
```

## Fonctionnalites couvertes

- Authentification locale de demonstration avec session JWT en cookie httpOnly
- RBAC par roles et permissions
- Annuaire personnes avec recherche, filtres, creation, detail et archivage logique
- Referentiels organisationnels : domaines, activites, job types, positions, regions, org tree
- Gestion des acces materiels, logiciels et informationnels
- Documents internes a lire / signer avec traçabilite de signature
- Espace `Mon espace` pour le collaborateur
- Workflows onboarding / offboarding avec checklist
- Tableau de bord synthétique
- Journal d'audit consultable
- Centre de notifications interne
- Connecteurs mock pour futures integrations Microsoft / AD / Graph / provisioning

## Roles demo

- `SUPER_ADMIN`
- `RH_ADMIN`
- `DSI_ADMIN`
- `MANAGER`
- `STANDARD_USER`
- `EXTERNAL_USER`

## Comptes de demonstration

Le seed cree les comptes suivants avec le mot de passe defini par `SEED_DEMO_PASSWORD` ou `demo1234` par defaut :

- `superadmin`
- `rh_admin`
- `dpmo_admin`
- `manager_demo`
- `user_demo`
- `external_demo`

## Installation locale

### 1. Variables d'environnement

Copier `.env.example` en `.env` puis ajuster si besoin.

Les scripts Prisma de la racine synchronisent automatiquement ce fichier vers `prisma/.env` avant execution.

Variables importantes :

- `DATABASE_URL`
- `JWT_SECRET`
- `APP_URL`
- `WEB_URL`
- `VITE_API_URL`
- `SEED_DEMO_PASSWORD`
- `MOCK_CONNECTORS_ENABLED`

### 2. Installer les dependances

```bash
npm install
```

### 3. Demarrer PostgreSQL

```bash
docker compose up -d postgres
```

Note : lors de la verification dans cet environnement, Docker Desktop n'etait pas lance. Si vous obtenez une erreur sur `dockerDesktopLinuxEngine`, demarrez Docker Desktop puis relancez la commande.

### 4. Generer Prisma et appliquer la base

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 5. Lancer le projet

```bash
npm run dev
```

Applications disponibles :

- API : [http://localhost:4000](http://localhost:4000)
- Front : [http://localhost:5173](http://localhost:5173)

## Scripts utiles

```bash
npm run dev
npm run build
npm run test
npm run e2e
npm run db:up
npm run db:down
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Par workspace

```bash
npm run build -w @ufcv/api
npm run build -w @ufcv/web
npm run test -w @ufcv/api
npm run test -w @ufcv/web
npm run e2e -w @ufcv/web
```

## Architecture API

Routes principales sous `/api/v1` :

- `/auth`
- `/dashboard`
- `/people`
- `/org/tree`, `/domains`, `/activities`, `/job-types`, `/positions`, `/regions`, `/actor-types`
- `/assets/material`
- `/resources/software`, `/software-assignments`
- `/resources/information`, `/information-assignments`
- `/documents`
- `/onboarding`, `/offboarding`
- `/notifications`
- `/audit-logs`
- `/integrations/connectors`

Organisation interne de `apps/api/src/modules` :

- `auth`
- `audit`
- `dashboard`
- `organization`
- `people`
- `access-management`
- `documents`
- `workflows`
- `notifications`
- `integrations`

Socle transverse :

- `config/` : env + Prisma client
- `core/cache/` : cache mémoire TTL remplaçable plus tard par Redis
- `core/errors/` : erreurs centralisees
- `core/security/` : JWT, mot de passe, middleware de session, permissions
- `contracts/` : types API internes au back

## Modele de donnees

Le schema Prisma couvre notamment :

- Roles / permissions / users
- Referentiels RH et organisationnels
- People + historique de statut
- Materiel, logiciels, ressources informationnelles + assignments + access history
- Documents, versions, assignations, signatures
- Onboarding / offboarding + workflow tasks
- Audit logs
- Notifications
- Connecteurs externes + sync jobs

Fichiers clefs :

- [schema.prisma](/C:/Users/lmauffre/Documents/ufcv-access-management/prisma/schema.prisma)
- [seed.ts](/C:/Users/lmauffre/Documents/ufcv-access-management/prisma/seed.ts)
- [migration.sql](/C:/Users/lmauffre/Documents/ufcv-access-management/prisma/migrations/20260402110000_init/migration.sql)

## Signature interne

Le systeme de signature implemente :

- l'assignation d'un document a une personne
- la conservation de la version exacte signee
- l'horodatage
- l'utilisateur signataire
- l'adresse IP si disponible
- le user-agent si disponible

Le systeme ne se presente pas comme une signature electronique qualifiee. Il s'agit d'une preuve interne de lecture / engagement.

## Connecteurs mock

La v1 n'appelle aucun systeme externe reel. Les connecteurs sont prepares dans la base et exposes dans l'UI admin.

Connecteurs demo :

- `local-auth`
- `mock-directory`
- `mock-graph`

L'architecture est prete a accueillir des implementations concretes pour :

- Entra / Azure AD
- Microsoft Graph
- annuaire / provisioning
- notifications email

## RGPD / privacy

- Pas d'analytics tiers active par defaut
- Donnees strictement necessaires a la gestion des habilitations
- Pas de tracking marketing
- Cookies limites au besoin de session technique
- Journalisation reservee aux actions sensibles metier

## Verification effectuee

Verifications passees dans cet environnement :

- `npm install`
- `npm run prisma:generate -w @ufcv/api`
- `npm run build -w @ufcv/shared`
- `npm run build -w @ufcv/api`
- `npm run build -w @ufcv/web`
- `npm run test -w @ufcv/api`
- `npm run test -w @ufcv/web`
- `npm run e2e -w @ufcv/web`

Point restant dependant de la machine :

- `docker compose up -d postgres` a echoue ici car Docker Desktop n'etait pas demarre

## Documentation API

Spec OpenAPI simplifiee :

- [openapi.yaml](/C:/Users/lmauffre/Documents/ufcv-access-management/docs/openapi.yaml)
