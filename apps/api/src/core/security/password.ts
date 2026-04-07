import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => bcrypt.hash(password, 10);

export const comparePassword = async (
  password: string,
  passwordHash: string,
): Promise<boolean> => bcrypt.compare(password, passwordHash);

