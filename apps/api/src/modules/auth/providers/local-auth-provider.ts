import type { SessionUser } from '../../../contracts/types.js';
import type { Prisma } from '@prisma/client';

import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../core/errors/app-error.js';
import { comparePassword } from '../../../core/security/password.js';
import type { AuthProvider, LoginInput } from './auth-provider.js';

const rolePriority = [
  'SUPER_ADMIN',
  'RH_ADMIN',
  'DSI_ADMIN',
  'MANAGER',
  'STANDARD_USER',
  'EXTERNAL_USER',
] as const;

type UserWithRoles = Prisma.UserGetPayload<{
  include: {
    person: true;
    roles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
  };
}>;

const buildSessionUser = (user: UserWithRoles): SessionUser => {
  const roles = [...user.roles].sort(
    (left, right) =>
      rolePriority.indexOf(left.role.code as (typeof rolePriority)[number]) -
      rolePriority.indexOf(right.role.code as (typeof rolePriority)[number]),
  );

  const primaryRole = roles[0]?.role.code;

  if (!primaryRole) {
    throw new AppError(500, "L'utilisateur n'a aucun rôle attribué.");
  }

  const permissions = new Set<string>();
  roles.forEach((entry) => {
    entry.role.permissions.forEach((permissionEntry) => {
      permissions.add(permissionEntry.permission.code);
    });
  });

  return {
    id: user.id,
    userId: user.id,
    personId: user.personId,
    displayName: user.person ? `${user.person.firstName} ${user.person.lastName}` : user.login,
    email: user.email,
    role: primaryRole as SessionUser['role'],
    permissions: Array.from(permissions) as SessionUser['permissions'],
  };
};

export class LocalAuthProvider implements AuthProvider {
  async login(input: LoginInput): Promise<SessionUser> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ login: input.login }, { email: input.login }],
      },
      include: {
        person: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError(401, 'Identifiants invalides.');
    }

    const matches = await comparePassword(input.password, user.passwordHash);

    if (!matches) {
      throw new AppError(401, 'Identifiants invalides.');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return buildSessionUser(user);
  }

  async getSessionUser(userId: string): Promise<SessionUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        person: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return buildSessionUser(user);
  }
}

export const localAuthProvider = new LocalAuthProvider();
