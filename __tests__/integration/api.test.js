import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import prisma from '../../src/config/database.js';
import { hashPassword } from '../../src/utils/password.js';

// Create a minimal app for testing
import express from 'express';
import cors from 'cors';
import authRoutes from '../../src/routes/auth.js';
import adminRoutes from '../../src/routes/admin/index.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

describe('API Integration Tests', () => {
  let adminToken;
  let studentToken;
  let testAdmin;
  let testStudent;

  beforeAll(async () => {
    // Create test users
    const hashedPassword = await hashPassword('password123');
    
    testAdmin = await prisma.user.create({
      data: {
        nameAr: 'مسؤول تجريبي',
        nameEn: 'Test Admin',
        email: `testadmin${Date.now()}@test.com`,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    testStudent = await prisma.user.create({
      data: {
        nameAr: 'طالب تجريبي',
        nameEn: 'Test Student',
        email: `teststudent${Date.now()}@test.com`,
        password: hashedPassword,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testAdmin.email,
        password: 'password123',
        role: 'ADMIN',
      });
    adminToken = adminLogin.body.data.accessToken;

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testStudent.email,
        password: 'password123',
        role: 'STUDENT',
      });
    studentToken = studentLogin.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up
    await prisma.user.deleteMany({
      where: {
        email: { contains: '@test.com' },
      },
    });
    await prisma.$disconnect();
  });

  describe('Health Check', () => {
    it('should return 200 for health check', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.text).toBe('OK');
    });
  });

  describe('Authentication Flow', () => {
    it('should login and get token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testAdmin.email,
          password: 'password123',
          role: 'ADMIN',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should get current user with token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe(testAdmin.email);
    });
  });

  describe('Protected Routes', () => {
    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats');

      expect(response.status).toBe(401);
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should either succeed or return 200/404 depending on data
      expect([200, 404]).toContain(response.status);
    });
  });
});


