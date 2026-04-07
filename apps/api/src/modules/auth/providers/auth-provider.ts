import type { SessionUser } from '../../../contracts/types.js';

export type LoginInput = {
  login: string;
  password: string;
};

export interface AuthProvider {
  login(input: LoginInput): Promise<SessionUser>;
  getSessionUser(userId: string): Promise<SessionUser | null>;
}
