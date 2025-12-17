import { describe, it, expect, beforeEach } from '@jest/globals';
import { authMiddleware, roleMiddleware } from '../../src/middlewares/auth.js';
import { generateAccessToken } from '../../src/utils/jwt.js';
import prisma from '../../src/config/database.js';
import { hashPassword } from '../../src/utils/password.js';

// Mock Express request, response, next
const createMockRequest = (headers = {}) => {
  const req = {
    headers: {
      authorization: headers.authorization || '',
      ...headers,
    },
    user: null,
  };
  return req;
};

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

describe('Auth Middleware', () => {
  let testUser;
  let testToken;

  afterEach(async () => {
    // Clean up
    await prisma.user.deleteMany({
      where: {
        email: { contains: '@test.com' },
      },
    });
  });

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await hashPassword('password123');
    testUser = await prisma.user.create({
      data: {
        nameAr: 'مسؤول تجريبي',
        nameEn: 'Test Admin',
        email: `testadmin${Date.now()}@test.com`,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    testToken = generateAccessToken({ userId: testUser.id, role: testUser.role });
  });

  afterEach(async () => {
    // Clean up
    await prisma.user.deleteMany({
      where: {
        email: { contains: '@test.com' },
      },
    });
  });

  describe('authMiddleware', () => {
    it('should allow request with valid token', async () => {
      const req = createMockRequest({
        authorization: `Bearer ${testToken}`,
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock prisma calls
      const originalFindUnique = prisma.tokenBlacklist.findUnique;
      const originalUserFindUnique = prisma.user.findUnique;
      
      prisma.tokenBlacklist.findUnique = jest.fn().mockResolvedValue(null);
      prisma.user.findUnique = jest.fn().mockResolvedValue({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        status: testUser.status,
        nameAr: testUser.nameAr,
        nameEn: testUser.nameEn,
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      
      // Restore
      prisma.tokenBlacklist.findUnique = originalFindUnique;
      prisma.user.findUnique = originalUserFindUnique;
    });

    it('should reject request without token', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      const req = createMockRequest({
        authorization: 'Bearer invalid-token',
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mock prisma
      prisma.tokenBlacklist.findUnique = jest.fn().mockResolvedValue(null);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('roleMiddleware', () => {
    it('should allow access for correct role', () => {
      const req = createMockRequest();
      req.user = { role: 'ADMIN' };
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = roleMiddleware('ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject access for incorrect role', () => {
      const req = createMockRequest();
      req.user = { role: 'STUDENT' };
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = roleMiddleware('ADMIN');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });
});

