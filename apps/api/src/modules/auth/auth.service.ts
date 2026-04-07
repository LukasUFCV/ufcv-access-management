import type { SessionUser } from '../../contracts/types.js';

import { prisma } from '../../config/prisma.js';
import type { AuthProvider } from './providers/auth-provider.js';
import { localAuthProvider } from './providers/local-auth-provider.js';

export class AuthService {
  constructor(private readonly provider: AuthProvider = localAuthProvider) {}

  async login(login: string, password: string): Promise<SessionUser> {
    return this.provider.login({ login, password });
  }

  async getSessionUser(userId: string): Promise<SessionUser | null> {
    return this.provider.getSessionUser(userId);
  }

  async touchLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}

export const authService = new AuthService();
