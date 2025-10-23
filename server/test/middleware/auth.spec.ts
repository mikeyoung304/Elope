/**
 * Auth middleware unit tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware } from '../../src/middleware/auth';
import { IdentityService } from '../../src/domains/identity/service';
import { UnauthorizedError } from '../../src/lib/core/errors';
import type { TokenPayload } from '../../src/domains/identity/port';

describe('Auth Middleware', () => {
  let identityService: IdentityService;
  let authMiddleware: ReturnType<typeof createAuthMiddleware>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    // Mock IdentityService
    identityService = {
      verifyToken: vi.fn(),
    } as any;

    authMiddleware = createAuthMiddleware(identityService);

    // Mock Express request/response
    req = {
      get: vi.fn(),
    };

    res = {
      locals: {
        logger: {
          info: vi.fn(),
        },
      },
    };

    next = vi.fn();
  });

  describe('Success Cases', () => {
    it('should authenticate valid Bearer token', () => {
      const mockPayload: TokenPayload = {
        userId: 'user_admin',
        email: 'admin@elope.com',
        role: 'admin',
      };

      (req.get as any).mockReturnValue('Bearer valid-token-123');
      (identityService.verifyToken as any).mockReturnValue(mockPayload);

      authMiddleware(req as Request, res as Response, next);

      expect(req.get).toHaveBeenCalledWith('Authorization');
      expect(identityService.verifyToken).toHaveBeenCalledWith('valid-token-123');
      expect(res.locals!.admin).toEqual(mockPayload);
      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should log authentication success', () => {
      const mockPayload: TokenPayload = {
        userId: 'user_admin',
        email: 'admin@elope.com',
        role: 'admin',
      };

      (req.get as any).mockReturnValue('Bearer valid-token-123');
      (identityService.verifyToken as any).mockReturnValue(mockPayload);

      authMiddleware(req as Request, res as Response, next);

      expect(res.locals!.logger.info).toHaveBeenCalledWith(
        { userId: 'user_admin', email: 'admin@elope.com' },
        'Admin authenticated'
      );
    });
  });

  describe('Failure Cases - Missing Token', () => {
    it('should reject request without Authorization header', () => {
      (req.get as any).mockReturnValue(undefined);

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Missing Authorization header');
    });

    it('should reject request with empty Authorization header', () => {
      (req.get as any).mockReturnValue('');

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('Failure Cases - Invalid Format', () => {
    it('should reject Authorization header without Bearer prefix', () => {
      (req.get as any).mockReturnValue('Basic dXNlcjpwYXNz');

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toContain('Invalid Authorization header format');
    });

    it('should reject malformed Bearer token (no space)', () => {
      (req.get as any).mockReturnValue('Bearertoken123');

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject Bearer with empty token', () => {
      (req.get as any).mockReturnValue('Bearer ');

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Missing token');
    });

    it('should reject Bearer with only whitespace', () => {
      (req.get as any).mockReturnValue('Bearer   ');

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('Failure Cases - Invalid Token', () => {
    it('should reject expired token', () => {
      (req.get as any).mockReturnValue('Bearer expired-token');
      (identityService.verifyToken as any).mockImplementation(() => {
        throw new UnauthorizedError('Invalid or expired token');
      });

      authMiddleware(req as Request, res as Response, next);

      expect(identityService.verifyToken).toHaveBeenCalledWith('expired-token');
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = (next as any).mock.calls[0][0];
      expect(error.message).toBe('Invalid or expired token');
    });

    it('should reject tampered token', () => {
      (req.get as any).mockReturnValue('Bearer tampered-token');
      (identityService.verifyToken as any).mockImplementation(() => {
        throw new UnauthorizedError('Invalid or expired token');
      });

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject malformed JWT', () => {
      (req.get as any).mockReturnValue('Bearer not.a.jwt');
      (identityService.verifyToken as any).mockImplementation(() => {
        throw new UnauthorizedError('Invalid or expired token');
      });

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('Error Handling', () => {
    it('should not attach admin to res.locals on failure', () => {
      (req.get as any).mockReturnValue(undefined);

      authMiddleware(req as Request, res as Response, next);

      expect(res.locals!.admin).toBeUndefined();
    });

    it('should pass error to next() without throwing', () => {
      (req.get as any).mockReturnValue('Bearer invalid');
      (identityService.verifyToken as any).mockImplementation(() => {
        throw new UnauthorizedError('Invalid token');
      });

      // Should not throw
      expect(() => {
        authMiddleware(req as Request, res as Response, next);
      }).not.toThrow();

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle multiple admin roles', () => {
      const mockPayload: TokenPayload = {
        userId: 'user_super_admin',
        email: 'super@elope.com',
        role: 'super_admin' as any,
      };

      (req.get as any).mockReturnValue('Bearer super-admin-token');
      (identityService.verifyToken as any).mockReturnValue(mockPayload);

      authMiddleware(req as Request, res as Response, next);

      expect(res.locals!.admin).toEqual(mockPayload);
      expect(next).toHaveBeenCalledWith();
    });

    it('should work without logger in res.locals', () => {
      res.locals = {}; // No logger

      const mockPayload: TokenPayload = {
        userId: 'user_admin',
        email: 'admin@elope.com',
        role: 'admin',
      };

      (req.get as any).mockReturnValue('Bearer valid-token');
      (identityService.verifyToken as any).mockReturnValue(mockPayload);

      // Should not throw
      expect(() => {
        authMiddleware(req as Request, res as Response, next);
      }).not.toThrow();

      expect(res.locals!.admin).toEqual(mockPayload);
      expect(next).toHaveBeenCalledWith();
    });
  });
});
