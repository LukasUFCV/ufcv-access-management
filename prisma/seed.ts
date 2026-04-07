import 'dotenv/config';

import {
  PrismaClient,
  AccessStatus,
  AuditSeverity,
  ConnectorStatus,
  ConnectorType,
  DocumentAssignmentStatus,
  DocumentValueType,
  MaterialState,
  NotificationType,
  PersonStatus,
  SyncDirection,
  UserStatus,
  WorkflowStatus,
  WorkflowTaskStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const now = new Date('2026-04-07T09:00:00.000Z');
const demoPassword = process.env.SEED_DEMO_PASSWORD ?? 'demo1234';

const permissions = [
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
];

const rolePermissions: Record<string, string[]> = {
  SUPER_ADMIN: permissions,
  RH_ADMIN: [
    'dashboard:read',
    'people:read',
    'people:write',
    'organization:read',
    'organization:write',
    'documents:read',
    'documents:write',
    'workflow:read',
    'workflow:write',
    'audit:read',
    'notifications:read',
    'admin:read',
  ],
  DSI_ADMIN: [
    'dashboard:read',
    'people:read',
    'organization:read',
    'assets:read',
    'assets:write',
    'software:read',
    'software:write',
    'information:read',
    'information:write',
    'documents:read',
    'workflow:read',
    'audit:read',
    'notifications:read',
    'admin:read',
  ],
  MANAGER: [
    'dashboard:read',
    'people:read',
    'organization:read',
    'documents:read',
    'documents:sign',
    'workflow:read',
    'notifications:read',
  ],
  STANDARD_USER: ['dashboard:read', 'documents:read', 'documents:sign', 'notifications:read'],
  EXTERNAL_USER: ['documents:read', 'documents:sign', 'notifications:read'],
};

const cleanup = async () => {
  await prisma.$transaction([
    prisma.syncJob.deleteMany(),
    prisma.externalConnectorConfig.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.workflowTask.deleteMany(),
    prisma.onboardingCase.deleteMany(),
    prisma.offboardingCase.deleteMany(),
    prisma.documentSignature.deleteMany(),
    prisma.documentAssignment.deleteMany(),
    prisma.document.deleteMany(),
    prisma.documentCategory.deleteMany(),
    prisma.accessHistory.deleteMany(),
    prisma.materialAssignment.deleteMany(),
    prisma.softwareAssignment.deleteMany(),
    prisma.informationAssignment.deleteMany(),
    prisma.materialAsset.deleteMany(),
    prisma.softwareResource.deleteMany(),
    prisma.informationResource.deleteMany(),
    prisma.accessCategory.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.user.deleteMany(),
    prisma.personStatusHistory.deleteMany(),
    prisma.person.deleteMany(),
    prisma.orgNode.deleteMany(),
    prisma.position.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.domain.deleteMany(),
    prisma.jobType.deleteMany(),
    prisma.city.deleteMany(),
    prisma.region.deleteMany(),
    prisma.actorType.deleteMany(),
    prisma.rolePermission.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.role.deleteMany(),
  ]);
};

async function main() {
  await cleanup();

  const passwordHash = await bcrypt.hash(demoPassword, 10);

  const permissionRecords = await Promise.all(
    permissions.map((code) =>
      prisma.permission.create({
        data: {
          code,
          name: code,
          description: `Permission ${code}`,
        },
      }),
    ),
  );
  const permissionMap = new Map(permissionRecords.map((item) => [item.code, item.id]));

  const roleRecords = await Promise.all(
    Object.keys(rolePermissions).map((code) =>
      prisma.role.create({
        data: {
          code,
          name: code.replaceAll('_', ' '),
          description: `Role systeme ${code}`,
          isSystem: true,
          permissions: {
            create: rolePermissions[code].map((permissionCode) => ({
              permissionId: permissionMap.get(permissionCode)!,
            })),
          },
        },
      }),
    ),
  );
  const roleMap = new Map(roleRecords.map((item) => [item.code, item.id]));

  const actorTypes = await Promise.all([
    prisma.actorType.create({ data: { code: 'SALARIE', label: 'Salarie' } }),
    prisma.actorType.create({ data: { code: 'BENEVOLE', label: 'Benevole' } }),
    prisma.actorType.create({ data: { code: 'STAGIAIRE', label: 'Stagiaire' } }),
    prisma.actorType.create({ data: { code: 'INTERVENANT_EXTERNE', label: 'Intervenant externe' } }),
    prisma.actorType.create({ data: { code: 'VOLONTAIRE', label: 'Volontaire' } }),
  ]);
  const actorTypeMap = new Map(actorTypes.map((item) => [item.code, item.id]));

  await Promise.all([
    prisma.accessCategory.create({ data: { code: 'material', label: 'Acces materiel' } }),
    prisma.accessCategory.create({ data: { code: 'software', label: 'Acces logiciel' } }),
    prisma.accessCategory.create({ data: { code: 'information', label: "Acces a l'information" } }),
  ]);

  const idf = await prisma.region.create({ data: { code: 'IDF', name: 'Ile-de-France' } });
  const aura = await prisma.region.create({ data: { code: 'AURA', name: 'Auvergne-Rhone-Alpes' } });
  const naq = await prisma.region.create({ data: { code: 'NAQ', name: 'Nouvelle-Aquitaine' } });

  const paris = await prisma.city.create({ data: { name: 'Paris', postalCode: '75000', regionId: idf.id } });
  const creteil = await prisma.city.create({ data: { name: 'Creteil', postalCode: '94000', regionId: idf.id } });
  const lyon = await prisma.city.create({ data: { name: 'Lyon', postalCode: '69000', regionId: aura.id } });
  const bordeaux = await prisma.city.create({ data: { name: 'Bordeaux', postalCode: '33000', regionId: naq.id } });

  const rhDomain = await prisma.domain.create({ data: { code: 'RH', name: 'Ressources humaines' } });
  const itDomain = await prisma.domain.create({ data: { code: 'IT', name: 'DSI / DPMO' } });
  const opsDomain = await prisma.domain.create({ data: { code: 'OPS', name: 'Operations territoriales' } });
  const pedagogyDomain = await prisma.domain.create({ data: { code: 'PEDA', name: 'Pedagogie' } });

  const activityHr = await prisma.activity.create({ data: { code: 'HR-GEST', name: 'Gestion RH', domainId: rhDomain.id } });
  const activitySupport = await prisma.activity.create({ data: { code: 'IT-SUP', name: 'Support SI', domainId: itDomain.id } });
  const activityDeployment = await prisma.activity.create({ data: { code: 'OPS-REG', name: 'Animation regionale', domainId: opsDomain.id } });
  const activityTraining = await prisma.activity.create({ data: { code: 'PEDA-FORM', name: 'Accompagnement pedagogique', domainId: pedagogyDomain.id } });

  const cdi = await prisma.jobType.create({ data: { code: 'CDI', name: 'CDI' } });
  const cdd = await prisma.jobType.create({ data: { code: 'CDD', name: 'CDD' } });
  const benevolat = await prisma.jobType.create({ data: { code: 'BENEVOLAT', name: 'Benevolat' } });
  const stage = await prisma.jobType.create({ data: { code: 'STAGE', name: 'Stage' } });
  const prestation = await prisma.jobType.create({ data: { code: 'PRESTA', name: 'Prestation' } });

  const directorPosition = await prisma.position.create({
    data: {
      code: 'DIR-TRANSFO',
      title: 'Directrice transformation interne',
      hierarchicalLevel: 'N1',
      domainId: rhDomain.id,
      activityId: activityHr.id,
      jobTypeId: cdi.id,
    },
  });
  const rhAdminPosition = await prisma.position.create({
    data: {
      code: 'RH-ADMIN',
      title: 'Administratrice RH',
      hierarchicalLevel: 'N2',
      domainId: rhDomain.id,
      activityId: activityHr.id,
      jobTypeId: cdi.id,
    },
  });
  const itAdminPosition = await prisma.position.create({
    data: {
      code: 'IT-ADMIN',
      title: 'Administrateur DSI / DPMO',
      hierarchicalLevel: 'N2',
      domainId: itDomain.id,
      activityId: activitySupport.id,
      jobTypeId: cdi.id,
    },
  });
  const managerPosition = await prisma.position.create({
    data: {
      code: 'MGR-REG',
      title: 'Responsable regional',
      hierarchicalLevel: 'N3',
      domainId: opsDomain.id,
      activityId: activityDeployment.id,
      jobTypeId: cdi.id,
    },
  });
  const coordinatorPosition = await prisma.position.create({
    data: {
      code: 'COORD-PEDA',
      title: 'Coordinatrice pedagogique',
      hierarchicalLevel: 'N3',
      domainId: pedagogyDomain.id,
      activityId: activityTraining.id,
      jobTypeId: cdd.id,
    },
  });
  const volunteerPosition = await prisma.position.create({
    data: {
      code: 'BENEV-REF',
      title: 'Benevole referent',
      hierarchicalLevel: 'N4',
      domainId: opsDomain.id,
      activityId: activityDeployment.id,
      jobTypeId: benevolat.id,
    },
  });
  const traineePosition = await prisma.position.create({
    data: {
      code: 'STAG-OPS',
      title: 'Stagiaire operations',
      hierarchicalLevel: 'N5',
      domainId: opsDomain.id,
      activityId: activityDeployment.id,
      jobTypeId: stage.id,
    },
  });
  const consultantPosition = await prisma.position.create({
    data: {
      code: 'EXT-CONS',
      title: 'Intervenant externe',
      hierarchicalLevel: 'N4',
      domainId: itDomain.id,
      activityId: activitySupport.id,
      jobTypeId: prestation.id,
    },
  });

  const orgNational = await prisma.orgNode.create({
    data: {
      code: 'ORG-NAT',
      name: 'UFCV National',
      type: 'ROOT',
      regionId: idf.id,
      cityId: paris.id,
    },
  });
  const orgRh = await prisma.orgNode.create({
    data: {
      code: 'ORG-RH',
      name: 'Direction RH',
      type: 'DEPARTMENT',
      parentId: orgNational.id,
      regionId: idf.id,
      cityId: paris.id,
      domainId: rhDomain.id,
      activityId: activityHr.id,
      positionId: rhAdminPosition.id,
    },
  });
  const orgIt = await prisma.orgNode.create({
    data: {
      code: 'ORG-IT',
      name: 'DSI / DPMO',
      type: 'DEPARTMENT',
      parentId: orgNational.id,
      regionId: idf.id,
      cityId: creteil.id,
      domainId: itDomain.id,
      activityId: activitySupport.id,
      positionId: itAdminPosition.id,
    },
  });
  const orgIdf = await prisma.orgNode.create({
    data: {
      code: 'ORG-IDF',
      name: 'Region Ile-de-France',
      type: 'REGION',
      parentId: orgNational.id,
      regionId: idf.id,
      cityId: paris.id,
      domainId: opsDomain.id,
      activityId: activityDeployment.id,
      positionId: managerPosition.id,
    },
  });
  const orgAura = await prisma.orgNode.create({
    data: {
      code: 'ORG-AURA',
      name: 'Region AURA',
      type: 'REGION',
      parentId: orgNational.id,
      regionId: aura.id,
      cityId: lyon.id,
      domainId: opsDomain.id,
      activityId: activityDeployment.id,
      positionId: managerPosition.id,
    },
  });
  const orgPeda = await prisma.orgNode.create({
    data: {
      code: 'ORG-PEDA',
      name: 'Pole pedagogique',
      type: 'TEAM',
      parentId: orgAura.id,
      regionId: aura.id,
      cityId: lyon.id,
      domainId: pedagogyDomain.id,
      activityId: activityTraining.id,
      positionId: coordinatorPosition.id,
    },
  });

  const people = await Promise.all([
    prisma.person.create({
      data: {
        firstName: 'Sophie',
        lastName: 'Martin',
        sessionIdentifier: 'sophie.martin',
        emailProfessional: 'sophie.martin@ufcv.demo',
        phoneProfessional: '0102030405',
        actorTypeId: actorTypeMap.get('SALARIE')!,
        positionId: directorPosition.id,
        domainId: rhDomain.id,
        activityId: activityHr.id,
        regionId: idf.id,
        cityId: paris.id,
        orgNodeId: orgNational.id,
        hierarchyLevel: 'N1',
        startDate: new Date('2024-01-10T08:00:00.000Z'),
        status: PersonStatus.ACTIVE,
      },
    }),
    prisma.person.create({
      data: {
        firstName: 'Claire',
        lastName: 'Robert',
        sessionIdentifier: 'claire.robert',
        emailProfessional: 'claire.robert@ufcv.demo',
        phoneProfessional: '0102030406',
        actorTypeId: actorTypeMap.get('SALARIE')!,
        positionId: rhAdminPosition.id,
        domainId: rhDomain.id,
        activityId: activityHr.id,
        regionId: idf.id,
        cityId: paris.id,
        orgNodeId: orgRh.id,
        hierarchyLevel: 'N2',
        startDate: new Date('2024-02-01T08:00:00.000Z'),
        status: PersonStatus.ACTIVE,
      },
    }),
    prisma.person.create({
      data: {
        firstName: 'Karim',
        lastName: 'Benali',
        sessionIdentifier: 'karim.benali',
        emailProfessional: 'karim.benali@ufcv.demo',
        phoneProfessional: '0102030407',
        actorTypeId: actorTypeMap.get('SALARIE')!,
        positionId: itAdminPosition.id,
        domainId: itDomain.id,
        activityId: activitySupport.id,
        regionId: idf.id,
        cityId: creteil.id,
        orgNodeId: orgIt.id,
        hierarchyLevel: 'N2',
        startDate: new Date('2024-02-15T08:00:00.000Z'),
        status: PersonStatus.ACTIVE,
      },
    }),
    prisma.person.create({
      data: {
        firstName: 'Lucie',
        lastName: 'Moreau',
        sessionIdentifier: 'lucie.moreau',
        emailProfessional: 'lucie.moreau@ufcv.demo',
        phoneProfessional: '0102030408',
        actorTypeId: actorTypeMap.get('SALARIE')!,
        positionId: managerPosition.id,
        domainId: opsDomain.id,
        activityId: activityDeployment.id,
        regionId: aura.id,
        cityId: lyon.id,
        orgNodeId: orgAura.id,
        hierarchyLevel: 'N3',
        startDate: new Date('2024-03-10T08:00:00.000Z'),
        status: PersonStatus.ACTIVE,
      },
    }),
    prisma.person.create({
      data: {
        firstName: 'Thomas',
        lastName: 'Petit',
        sessionIdentifier: 'thomas.petit',
        emailProfessional: 'thomas.petit@ufcv.demo',
        phoneProfessional: '0102030409',
        actorTypeId: actorTypeMap.get('SALARIE')!,
        positionId: coordinatorPosition.id,
        domainId: pedagogyDomain.id,
        activityId: activityTraining.id,
        regionId: aura.id,
        cityId: lyon.id,
        orgNodeId: orgPeda.id,
        hierarchyLevel: 'N4',
        startDate: new Date('2025-01-05T08:00:00.000Z'),
        status: PersonStatus.ACTIVE,
      },
    }),
    prisma.person.create({
      data: {
        firstName: 'Emma',
        lastName: 'Dubois',
        sessionIdentifier: 'emma.dubois',
        emailProfessional: 'emma.dubois@ufcv.demo',
        actorTypeId: actorTypeMap.get('BENEVOLE')!,
        positionId: volunteerPosition.id,
        domainId: opsDomain.id,
        activityId: activityDeployment.id,
        regionId: idf.id,
        cityId: paris.id,
        orgNodeId: orgIdf.id,
        hierarchyLevel: 'N4',
        startDate: new Date('2025-05-12T08:00:00.000Z'),
        status: PersonStatus.ACTIVE,
      },
    }),
    prisma.person.create({
      data: {
        firstName: 'Hugo',
        lastName: 'Bernard',
        sessionIdentifier: 'hugo.bernard',
        emailProfessional: 'hugo.bernard@ufcv.demo',
        actorTypeId: actorTypeMap.get('SALARIE')!,
        positionId: managerPosition.id,
        domainId: opsDomain.id,
        activityId: activityDeployment.id,
        regionId: naq.id,
        cityId: bordeaux.id,
        hierarchyLevel: 'N3',
        startDate: new Date('2023-09-01T08:00:00.000Z'),
        endDate: new Date('2026-04-30T17:00:00.000Z'),
        status: PersonStatus.TRANSITION,
      },
    }),
    prisma.person.create({
      data: {
        firstName: 'Nina',
        lastName: 'Lopez',
        sessionIdentifier: 'nina.lopez',
        emailProfessional: 'nina.lopez@ufcv.demo',
        actorTypeId: actorTypeMap.get('STAGIAIRE')!,
        positionId: traineePosition.id,
        domainId: opsDomain.id,
        activityId: activityDeployment.id,
        regionId: aura.id,
        cityId: lyon.id,
        orgNodeId: orgAura.id,
        hierarchyLevel: 'N5',
        startDate: new Date('2026-04-15T08:00:00.000Z'),
        status: PersonStatus.PREPARATION,
      },
    }),
    prisma.person.create({
      data: {
        firstName: 'Paul',
        lastName: 'Girard',
        sessionIdentifier: 'paul.girard.ext',
        emailProfessional: 'paul.girard.ext@ufcv.demo',
        actorTypeId: actorTypeMap.get('INTERVENANT_EXTERNE')!,
        positionId: consultantPosition.id,
        domainId: itDomain.id,
        activityId: activitySupport.id,
        regionId: idf.id,
        cityId: creteil.id,
        orgNodeId: orgIt.id,
        hierarchyLevel: 'N4',
        startDate: new Date('2025-10-01T08:00:00.000Z'),
        endDate: new Date('2026-12-31T17:00:00.000Z'),
        status: PersonStatus.ACTIVE,
        isExternal: true,
      },
    }),
  ]);

  const personMap = new Map(people.map((item) => [`${item.firstName} ${item.lastName}`, item]));

  await prisma.person.update({ where: { id: personMap.get('Claire Robert')!.id }, data: { managerId: personMap.get('Sophie Martin')!.id } });
  await prisma.person.update({ where: { id: personMap.get('Karim Benali')!.id }, data: { managerId: personMap.get('Sophie Martin')!.id } });
  await prisma.person.update({ where: { id: personMap.get('Lucie Moreau')!.id }, data: { managerId: personMap.get('Sophie Martin')!.id } });
  await prisma.person.updateMany({
    where: {
      id: { in: [personMap.get('Thomas Petit')!.id, personMap.get('Emma Dubois')!.id, personMap.get('Nina Lopez')!.id, personMap.get('Hugo Bernard')!.id] },
    },
    data: { managerId: personMap.get('Lucie Moreau')!.id },
  });
  await prisma.person.update({ where: { id: personMap.get('Paul Girard')!.id }, data: { managerId: personMap.get('Karim Benali')!.id } });

  await Promise.all(
    people.map((person) =>
      prisma.personStatusHistory.create({
        data: {
          personId: person.id,
          toStatus: person.status,
          effectiveAt: person.startDate ?? now,
        },
      }),
    ),
  );

  const users = await Promise.all([
    prisma.user.create({
      data: {
        login: 'superadmin',
        email: 'superadmin@ufcv.demo',
        passwordHash,
        status: UserStatus.ACTIVE,
        personId: personMap.get('Sophie Martin')!.id,
        roles: { create: [{ roleId: roleMap.get('SUPER_ADMIN')! }] },
      },
    }),
    prisma.user.create({
      data: {
        login: 'rh_admin',
        email: 'rh_admin@ufcv.demo',
        passwordHash,
        status: UserStatus.ACTIVE,
        personId: personMap.get('Claire Robert')!.id,
        roles: { create: [{ roleId: roleMap.get('RH_ADMIN')! }] },
      },
    }),
    prisma.user.create({
      data: {
        login: 'dpmo_admin',
        email: 'dpmo_admin@ufcv.demo',
        passwordHash,
        status: UserStatus.ACTIVE,
        personId: personMap.get('Karim Benali')!.id,
        roles: { create: [{ roleId: roleMap.get('DSI_ADMIN')! }] },
      },
    }),
    prisma.user.create({
      data: {
        login: 'manager_demo',
        email: 'manager_demo@ufcv.demo',
        passwordHash,
        status: UserStatus.ACTIVE,
        personId: personMap.get('Lucie Moreau')!.id,
        roles: { create: [{ roleId: roleMap.get('MANAGER')! }] },
      },
    }),
    prisma.user.create({
      data: {
        login: 'user_demo',
        email: 'user_demo@ufcv.demo',
        passwordHash,
        status: UserStatus.ACTIVE,
        personId: personMap.get('Thomas Petit')!.id,
        roles: { create: [{ roleId: roleMap.get('STANDARD_USER')! }] },
      },
    }),
    prisma.user.create({
      data: {
        login: 'external_demo',
        email: 'external_demo@ufcv.demo',
        passwordHash,
        status: UserStatus.ACTIVE,
        personId: personMap.get('Paul Girard')!.id,
        roles: { create: [{ roleId: roleMap.get('EXTERNAL_USER')! }] },
      },
    }),
  ]);
  const userMap = new Map(users.map((item) => [item.login, item]));

  const materialLaptopThomas = await prisma.materialAsset.create({
    data: {
      assetTag: 'MAT-001',
      name: 'Dell Latitude 7440',
      assetType: 'Ordinateur',
      serialNumber: 'DL7440-THOMAS',
      state: MaterialState.ASSIGNED,
    },
  });
  const materialPhoneThomas = await prisma.materialAsset.create({
    data: {
      assetTag: 'MAT-002',
      name: 'iPhone SE',
      assetType: 'Telephone',
      serialNumber: 'IPHSE-2026',
      state: MaterialState.ASSIGNED,
    },
  });
  const materialBadgeHugo = await prisma.materialAsset.create({
    data: {
      assetTag: 'MAT-003',
      name: 'Badge acces Bordeaux',
      assetType: 'Badge',
      state: MaterialState.ASSIGNED,
    },
  });
  const materialKeyLucie = await prisma.materialAsset.create({
    data: {
      assetTag: 'MAT-004',
      name: 'Cle local regional',
      assetType: 'Cle',
      state: MaterialState.ASSIGNED,
    },
  });
  await prisma.materialAsset.create({
    data: {
      assetTag: 'MAT-005',
      name: 'Tablette Samsung',
      assetType: 'Tablette',
      state: MaterialState.AVAILABLE,
    },
  });

  const thomasLaptopAssignment = await prisma.materialAssignment.create({
    data: {
      personId: personMap.get('Thomas Petit')!.id,
      assetId: materialLaptopThomas.id,
      status: AccessStatus.ACTIVE,
      assignedAt: new Date('2025-01-07T09:00:00.000Z'),
      dueBackAt: new Date('2026-12-31T17:00:00.000Z'),
    },
  });
  const thomasPhoneAssignment = await prisma.materialAssignment.create({
    data: {
      personId: personMap.get('Thomas Petit')!.id,
      assetId: materialPhoneThomas.id,
      status: AccessStatus.ACTIVE,
      assignedAt: new Date('2025-01-07T09:30:00.000Z'),
      dueBackAt: new Date('2026-12-31T17:00:00.000Z'),
    },
  });
  const hugoBadgeAssignment = await prisma.materialAssignment.create({
    data: {
      personId: personMap.get('Hugo Bernard')!.id,
      assetId: materialBadgeHugo.id,
      status: AccessStatus.ACTIVE,
      assignedAt: new Date('2024-01-02T08:00:00.000Z'),
      dueBackAt: new Date('2026-04-30T17:00:00.000Z'),
    },
  });
  await prisma.materialAssignment.create({
    data: {
      personId: personMap.get('Lucie Moreau')!.id,
      assetId: materialKeyLucie.id,
      status: AccessStatus.ACTIVE,
      assignedAt: new Date('2024-03-12T08:00:00.000Z'),
      dueBackAt: new Date('2026-09-30T17:00:00.000Z'),
    },
  });

  await prisma.accessHistory.createMany({
    data: [
      { categoryCode: 'material', eventType: 'ASSIGNED', materialAssignmentId: thomasLaptopAssignment.id, createdAt: new Date('2025-01-07T09:00:00.000Z') },
      { categoryCode: 'material', eventType: 'ASSIGNED', materialAssignmentId: thomasPhoneAssignment.id, createdAt: new Date('2025-01-07T09:30:00.000Z') },
      { categoryCode: 'material', eventType: 'ASSIGNED', materialAssignmentId: hugoBadgeAssignment.id, createdAt: new Date('2024-01-02T08:00:00.000Z') },
    ],
  });

  const office365 = await prisma.softwareResource.create({ data: { name: 'Microsoft 365', slug: 'm365', licenseType: 'E3', provisioningKey: 'grp-m365-standard' } });
  const sirh = await prisma.softwareResource.create({ data: { name: 'Portail RH interne', slug: 'sirh', licenseType: 'Standard', provisioningKey: 'app-sirh' } });
  const helpdesk = await prisma.softwareResource.create({ data: { name: 'Helpdesk UFCV', slug: 'helpdesk', licenseType: 'Agent' } });
  const lms = await prisma.softwareResource.create({ data: { name: 'Plateforme LMS', slug: 'lms', licenseType: 'Contributeur' } });

  const softwareAssignments = await Promise.all([
    prisma.softwareAssignment.create({ data: { personId: personMap.get('Thomas Petit')!.id, resourceId: office365.id, status: AccessStatus.ACTIVE, startDate: new Date('2025-01-07T08:00:00.000Z') } }),
    prisma.softwareAssignment.create({ data: { personId: personMap.get('Thomas Petit')!.id, resourceId: lms.id, status: AccessStatus.ACTIVE, startDate: new Date('2025-01-07T08:00:00.000Z'), endDate: new Date('2026-04-15T17:00:00.000Z'), justification: 'Acces pedagogique en renouvellement' } }),
    prisma.softwareAssignment.create({ data: { personId: personMap.get('Claire Robert')!.id, resourceId: sirh.id, status: AccessStatus.ACTIVE, startDate: new Date('2024-02-01T08:00:00.000Z') } }),
    prisma.softwareAssignment.create({ data: { personId: personMap.get('Karim Benali')!.id, resourceId: helpdesk.id, status: AccessStatus.ACTIVE, startDate: new Date('2024-02-15T08:00:00.000Z') } }),
    prisma.softwareAssignment.create({ data: { personId: personMap.get('Hugo Bernard')!.id, resourceId: office365.id, status: AccessStatus.REVOKED, startDate: new Date('2023-09-01T08:00:00.000Z'), endDate: new Date('2026-04-20T17:00:00.000Z'), justification: 'Revocation programmee dans le cadre du depart' } }),
  ]);

  await prisma.accessHistory.createMany({
    data: softwareAssignments.map((assignment, index) => ({
      categoryCode: 'software',
      eventType: index === 4 ? 'REVOKED' : 'ASSIGNED',
      softwareAssignmentId: assignment.id,
    })),
  });

  const teamsRh = await prisma.informationResource.create({ data: { name: 'Teams Direction RH', slug: 'teams-rh', resourceType: 'Teams', owner: 'Direction RH' } });
  const sharedPeda = await prisma.informationResource.create({ data: { name: 'Repertoire pedagogique', slug: 'shared-peda', resourceType: 'Dossier partage', owner: 'Pole pedagogique' } });
  const mailingIdf = await prisma.informationResource.create({ data: { name: 'Liste diffusion IDF', slug: 'ld-idf', resourceType: 'Liste de diffusion', owner: 'Region Ile-de-France' } });
  const financeShared = await prisma.informationResource.create({ data: { name: 'Finance - budget regional', slug: 'finance-budget', resourceType: 'Dossier partage', owner: 'Controle de gestion' } });

  const informationAssignments = await Promise.all([
    prisma.informationAssignment.create({ data: { personId: personMap.get('Claire Robert')!.id, resourceId: teamsRh.id, status: AccessStatus.ACTIVE, startDate: new Date('2024-02-01T08:00:00.000Z') } }),
    prisma.informationAssignment.create({ data: { personId: personMap.get('Thomas Petit')!.id, resourceId: sharedPeda.id, status: AccessStatus.ACTIVE, startDate: new Date('2025-01-07T08:00:00.000Z') } }),
    prisma.informationAssignment.create({ data: { personId: personMap.get('Emma Dubois')!.id, resourceId: mailingIdf.id, status: AccessStatus.ACTIVE, startDate: new Date('2025-05-15T08:00:00.000Z') } }),
    prisma.informationAssignment.create({ data: { personId: personMap.get('Hugo Bernard')!.id, resourceId: financeShared.id, status: AccessStatus.REVOKED, startDate: new Date('2023-09-01T08:00:00.000Z'), endDate: new Date('2026-04-20T17:00:00.000Z') } }),
  ]);

  await prisma.accessHistory.createMany({
    data: informationAssignments.map((assignment, index) => ({
      categoryCode: 'information',
      eventType: index === 3 ? 'REVOKED' : 'ASSIGNED',
      informationAssignmentId: assignment.id,
    })),
  });

  const chartes = await prisma.documentCategory.create({ data: { code: 'CHARTE', label: 'Chartes internes' } });
  const engagements = await prisma.documentCategory.create({ data: { code: 'ENG', label: 'Engagements' } });
  const procedures = await prisma.documentCategory.create({ data: { code: 'PROC', label: 'Procedures' } });

  const charteItVersion = await prisma.documentVersion.create({
    data: {
      document: {
        create: {
          code: 'DOC-CHARTE-IT',
          title: 'Charte informatique UFCV',
          categoryId: chartes.id,
          valueType: DocumentValueType.ORGANISATIONNELLE,
          consequenceText: 'Suspension temporaire des acces en cas de non-respect constate.',
        },
      },
      versionLabel: 'v2026.1',
      contentMarkdown: '# Charte informatique\n\nRespect des usages, de la confidentialite et des moyens numeriques UFCV.',
      checksum: 'charte-it-v2026-1',
      publishedAt: new Date('2026-01-15T09:00:00.000Z'),
    },
    include: { document: true },
  });
  await prisma.document.update({ where: { id: charteItVersion.documentId }, data: { currentVersionId: charteItVersion.id } });

  const confidentialityVersion = await prisma.documentVersion.create({
    data: {
      document: {
        create: {
          code: 'DOC-CONF',
          title: 'Engagement de confidentialite',
          categoryId: engagements.id,
          valueType: DocumentValueType.INTERNE_MORALE,
          consequenceText: 'Rappel formel au cadre de confidentialite interne et revue manageriale.',
        },
      },
      versionLabel: 'v2026.2',
      contentMarkdown: '# Confidentialite\n\nJe m engage a proteger les informations auxquelles j ai acces.',
      checksum: 'eng-conf-v2026-2',
      publishedAt: new Date('2026-02-01T09:00:00.000Z'),
    },
    include: { document: true },
  });
  await prisma.document.update({ where: { id: confidentialityVersion.documentId }, data: { currentVersionId: confidentialityVersion.id } });

  const onboardingGuideVersion = await prisma.documentVersion.create({
    data: {
      document: {
        create: {
          code: 'DOC-ONBOARD',
          title: "Guide d'onboarding managers",
          categoryId: procedures.id,
          valueType: DocumentValueType.ORGANISATIONNELLE,
        },
      },
      versionLabel: 'v2026.1',
      contentMarkdown: "# Guide d'onboarding\n\nChecklist de prise de poste et points de vigilance.",
      checksum: 'guide-onboard-v2026-1',
      publishedAt: new Date('2026-03-01T09:00:00.000Z'),
    },
    include: { document: true },
  });
  await prisma.document.update({ where: { id: onboardingGuideVersion.documentId }, data: { currentVersionId: onboardingGuideVersion.id } });

  const thomasCharteAssignment = await prisma.documentAssignment.create({
    data: {
      documentId: charteItVersion.documentId,
      versionId: charteItVersion.id,
      personId: personMap.get('Thomas Petit')!.id,
      assignedByUserId: userMap.get('rh_admin')!.id,
      status: DocumentAssignmentStatus.A_SIGNER,
      dueDate: new Date('2026-04-20T17:00:00.000Z'),
    },
  });
  const thomasConfAssignment = await prisma.documentAssignment.create({
    data: {
      documentId: confidentialityVersion.documentId,
      versionId: confidentialityVersion.id,
      personId: personMap.get('Thomas Petit')!.id,
      assignedByUserId: userMap.get('rh_admin')!.id,
      status: DocumentAssignmentStatus.SIGNE,
      dueDate: new Date('2026-03-15T17:00:00.000Z'),
      acknowledgedAt: new Date('2026-03-10T11:30:00.000Z'),
      signedAt: new Date('2026-03-10T11:30:00.000Z'),
    },
  });
  const ninaCharteAssignment = await prisma.documentAssignment.create({
    data: {
      documentId: charteItVersion.documentId,
      versionId: charteItVersion.id,
      personId: personMap.get('Nina Lopez')!.id,
      assignedByUserId: userMap.get('rh_admin')!.id,
      status: DocumentAssignmentStatus.A_LIRE,
      dueDate: new Date('2026-04-18T17:00:00.000Z'),
    },
  });

  const signature = await prisma.documentSignature.create({
    data: {
      documentAssignmentId: thomasConfAssignment.id,
      versionId: confidentialityVersion.id,
      userId: userMap.get('user_demo')!.id,
      signedAt: new Date('2026-03-10T11:30:00.000Z'),
      ipAddress: '127.0.0.1',
      userAgent: 'seed/browser',
      acknowledgementText: 'Lecture et signature interne validees.',
    },
  });

  const onboardingCase = await prisma.onboardingCase.create({
    data: {
      personId: personMap.get('Nina Lopez')!.id,
      status: WorkflowStatus.EN_COURS,
      dueDate: new Date('2026-04-22T17:00:00.000Z'),
      completionRate: 50,
      notes: 'Preparation de poste en cours pour le stage operations.',
      tasks: {
        create: [
          { title: 'Creer le dossier RH', order: 1, status: WorkflowTaskStatus.DONE, completedAt: new Date('2026-04-03T09:00:00.000Z') },
          { title: 'Preparer le poste et les acces', order: 2, status: WorkflowTaskStatus.IN_PROGRESS },
          { title: 'Partager les documents internes', order: 3, status: WorkflowTaskStatus.TODO },
          { title: "Planifier l'accueil manager", order: 4, status: WorkflowTaskStatus.TODO },
        ],
      },
    },
  });

  const offboardingCase = await prisma.offboardingCase.create({
    data: {
      personId: personMap.get('Hugo Bernard')!.id,
      status: WorkflowStatus.EN_COURS,
      dueDate: new Date('2026-04-30T17:00:00.000Z'),
      completionRate: 60,
      notes: 'Depart manager Bordeaux, revocations a finaliser.',
      tasks: {
        create: [
          { title: 'Notifier la DSI', order: 1, status: WorkflowTaskStatus.DONE, completedAt: new Date('2026-04-02T09:00:00.000Z') },
          { title: 'Revoquer les acces logiciels', order: 2, status: WorkflowTaskStatus.IN_PROGRESS },
          { title: "Retirer les acces a l'information", order: 3, status: WorkflowTaskStatus.IN_PROGRESS },
          { title: 'Recuperer badge et materiel', order: 4, status: WorkflowTaskStatus.TODO },
          { title: 'Cloturer le dossier', order: 5, status: WorkflowTaskStatus.TODO },
        ],
      },
    },
  });

  const connectors = await Promise.all([
    prisma.externalConnectorConfig.create({ data: { code: 'local-auth', name: 'Local Auth Provider', type: ConnectorType.AUTH, status: ConnectorStatus.ACTIVE, baseUrl: 'local://auth', config: { strategy: 'local-demo' } } }),
    prisma.externalConnectorConfig.create({ data: { code: 'mock-directory', name: 'Mock Directory Sync', type: ConnectorType.DIRECTORY, status: ConnectorStatus.ACTIVE, baseUrl: 'mock://directory', config: { adapter: 'mock' } } }),
    prisma.externalConnectorConfig.create({ data: { code: 'mock-graph', name: 'Mock Microsoft Graph', type: ConnectorType.GRAPH, status: ConnectorStatus.INACTIVE, baseUrl: 'mock://graph', config: { adapter: 'mock' } } }),
  ]);

  await Promise.all([
    prisma.syncJob.create({ data: { connectorId: connectors[1].id, name: 'Synchronisation annuaire demo', direction: SyncDirection.BIDIRECTIONAL, status: ConnectorStatus.ACTIVE, lastStartedAt: new Date('2026-04-06T09:00:00.000Z'), lastEndedAt: new Date('2026-04-06T09:02:00.000Z'), result: { updatedPeople: 4 } } }),
    prisma.syncJob.create({ data: { connectorId: connectors[2].id, name: 'Provisioning Graph mock', direction: SyncDirection.OUTBOUND, status: ConnectorStatus.INACTIVE } }),
  ]);

  await prisma.notification.createMany({
    data: [
      { userId: userMap.get('user_demo')!.id, title: 'Document a signer', body: 'La charte informatique UFCV attend votre signature avant le 20 avril 2026.', type: NotificationType.ACTION_REQUIRED, isRead: false },
      { userId: userMap.get('manager_demo')!.id, title: 'Onboarding en cours', body: 'Le dossier de Nina Lopez est a 50% et necessite une validation manager.', type: NotificationType.INFO, isRead: false },
      { userId: userMap.get('dpmo_admin')!.id, title: "Acces logiciel proche de l'expiration", body: 'La licence LMS de Thomas Petit expire dans moins de 10 jours.', type: NotificationType.WARNING, isRead: false },
      { userId: userMap.get('rh_admin')!.id, title: 'Offboarding a finaliser', body: 'Le depart de Hugo Bernard reste ouvert avec du materiel a recuperer.', type: NotificationType.ACTION_REQUIRED, isRead: false },
      { userId: userMap.get('external_demo')!.id, title: 'Acces externe valide', body: "Votre acces restreint reste actif jusqu'au 31 decembre 2026.", type: NotificationType.SUCCESS, isRead: true, readAt: new Date('2026-04-01T08:00:00.000Z') },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { actorId: userMap.get('superadmin')!.id, action: 'auth.login', entityType: 'User', entityId: userMap.get('superadmin')!.id, severity: AuditSeverity.INFO, metadata: { role: 'SUPER_ADMIN' }, createdAt: new Date('2026-04-07T08:00:00.000Z') },
      { actorId: userMap.get('rh_admin')!.id, action: 'people.create', entityType: 'Person', entityId: personMap.get('Nina Lopez')!.id, severity: AuditSeverity.INFO, metadata: { status: 'PREPARATION' }, createdAt: new Date('2026-04-03T09:00:00.000Z') },
      { actorId: userMap.get('dpmo_admin')!.id, action: 'software.update', entityType: 'SoftwareAssignment', entityId: softwareAssignments[4].id, severity: AuditSeverity.WARNING, metadata: { status: 'REVOKED' }, createdAt: new Date('2026-04-05T11:00:00.000Z') },
      { actorId: userMap.get('user_demo')!.id, action: 'documents.sign', entityType: 'DocumentSignature', entityId: signature.id, severity: AuditSeverity.INFO, createdAt: new Date('2026-03-10T11:30:00.000Z') },
      { actorId: userMap.get('manager_demo')!.id, action: 'workflow.onboarding.update', entityType: 'OnboardingCase', entityId: onboardingCase.id, severity: AuditSeverity.INFO, createdAt: new Date('2026-04-06T15:00:00.000Z') },
      { actorId: userMap.get('rh_admin')!.id, action: 'workflow.offboarding.update', entityType: 'OffboardingCase', entityId: offboardingCase.id, severity: AuditSeverity.WARNING, createdAt: new Date('2026-04-06T16:00:00.000Z') },
    ],
  });

  console.log('Seed termine.');
  console.log(`Comptes demo disponibles (mot de passe: ${demoPassword})`);
  console.log('- superadmin');
  console.log('- rh_admin');
  console.log('- dpmo_admin');
  console.log('- manager_demo');
  console.log('- user_demo');
  console.log('- external_demo');
  console.log(`Documents en attente: ${thomasCharteAssignment.id}, ${ninaCharteAssignment.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
