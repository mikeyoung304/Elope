/**
 * Identity domain port
 */

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin';
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}
