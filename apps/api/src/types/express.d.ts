import type { SessionUser } from '../contracts/types.js';

declare global {
  namespace Express {
    interface Request {
      auth?: SessionUser;
    }
  }
}

export {};
