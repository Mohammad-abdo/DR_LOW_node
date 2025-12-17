import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import prisma from '../src/config/database.js';
import { hashPassword } from '../src/utils/password.js';

// Create a minimal app for testing
import express from 'express';
import cors from 'cors';
import authRoutes from '../src/routes/auth.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication API', () => {
  let adminToken;
  let studentToken;
  let testAdmin;
  let testStudent;

  beforeAll(async () => {
    // Hash passwords properly
    const hashedPassword = await hashPassword('password123');
    
    // Create test admin user
    testAdmin = await prisma.user.create({
      data: {
        nameAr: 'مسؤول تجريبي',
        nameEn: 'Test Admin',
        email: 'testadmin@test.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Create test student user
    testStudent = await prisma.user.create({
      data: {
        nameAr: 'طالب تجريبي',
        nameEn: 'Test Student',
        email: 'teststudent@test.com',
        password: hashedPassword,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['testadmin@test.com', 'teststudent@test.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('should login admin successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testadmin@test.com',
          password: 'password123',
          role: 'ADMIN',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.role).toBe('ADMIN');

      adminToken = response.body.data.accessToken;
    });

    it('should login student successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teststudent@test.com',
          password: 'password123',
          role: 'STUDENT',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user.role).toBe('STUDENT');

      studentToken = response.body.data.accessToken;
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testadmin@test.com',
          password: 'wrongpassword',
          role: 'ADMIN',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testadmin@test.com',
          // missing password and role
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('testadmin@test.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

