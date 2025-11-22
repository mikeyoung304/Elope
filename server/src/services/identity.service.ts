/**
 * Identity domain service
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { UserRepository, TokenPayload } from '../lib/ports';
import { UnauthorizedError } from '../lib/errors';

export class IdentityService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtSecret: string
  ) {}

  async login(email: string, password: string): Promise<{ token: string }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      algorithm: 'HS256',  // Explicit algorithm prevents confusion attacks
      expiresIn: '7d',     // Token expiration (7 days)
    });
    return { token };
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],  // Only allow HS256, reject others
      }) as TokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
