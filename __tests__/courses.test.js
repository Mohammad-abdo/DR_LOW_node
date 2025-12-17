import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import prisma from '../src/config/database.js';
import { hashPassword } from '../src/utils/password.js';

// Create a minimal app for testing
import express from 'express';
import cors from 'cors';
import adminRoutes from '../src/routes/admin/index.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Courses API', () => {
  let adminToken;
  let testAdmin;
  let testCategory;
  let testCourse;

  beforeAll(async () => {
    // Hash password properly
    const hashedPassword = await hashPassword('password123');
    
    // Create test admin
    testAdmin = await prisma.user.create({
      data: {
        nameAr: 'مسؤول تجريبي',
        nameEn: 'Test Admin',
        email: 'testadmincourses@test.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testadmincourses@test.com',
        password: 'password123',
        role: 'ADMIN',
      });
    adminToken = loginResponse.body.data.accessToken;

    // Create test category
    testCategory = await prisma.category.create({
      data: {
        nameAr: 'فئة تجريبية',
        nameEn: 'Test Category',
        descriptionAr: 'وصف تجريبي',
        descriptionEn: 'Test Description',
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.course.deleteMany({
      where: { titleEn: { contains: 'Test Course' } },
    });
    await prisma.category.deleteMany({
      where: { nameEn: { contains: 'Test' } },
    });
    await prisma.user.deleteMany({
      where: { email: 'testadmincourses@test.com' },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/admin/courses', () => {
    it('should create a new course', async () => {
      const response = await request(app)
        .post('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titleAr: 'دورة تجريبية',
          titleEn: 'Test Course',
          descriptionAr: 'وصف الدورة',
          descriptionEn: 'Course Description',
          teacherId: testAdmin.id,
          categoryId: testCategory.id,
          price: 100,
          discount: 10,
          level: 'BEGINNER',
          status: 'PUBLISHED',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.course.titleEn).toBe('Test Course');
      
      testCourse = response.body.data.course;
    });

    it('should reject course creation without required fields', async () => {
      const response = await request(app)
        .post('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titleEn: 'Incomplete Course',
          // missing required fields
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/courses', () => {
    it('should get all courses', async () => {
      const response = await request(app)
        .get('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.courses)).toBe(true);
    });

    it('should get course by ID', async () => {
      if (testCourse) {
        const response = await request(app)
          .get(`/api/admin/courses/${testCourse.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.course.id).toBe(testCourse.id);
      }
    });
  });
});

