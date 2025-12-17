import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import prisma from '../../src/config/database.js';
import { hashPassword } from '../../src/utils/password.js';

// Create a minimal app for testing
import express from 'express';
import cors from 'cors';
import studentMobileRoutes from '../../src/routes/mobile/student/index.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/mobile/student', studentMobileRoutes);

describe('Mobile Student API', () => {
  let studentToken;
  let testStudent;
  let testCourse;

  beforeAll(async () => {
    // Create test student
    const hashedPassword = await hashPassword('password123');
    testStudent = await prisma.user.create({
      data: {
        nameAr: 'طالب تجريبي',
        nameEn: 'Test Student',
        email: 'teststudentmobile@test.com',
        password: hashedPassword,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teststudentmobile@test.com',
        password: 'password123',
        role: 'STUDENT',
      });
    studentToken = loginResponse.body.data.accessToken;

    // Create test category and course
    const category = await prisma.category.create({
      data: {
        nameAr: 'فئة تجريبية',
        nameEn: 'Test Category',
      },
    });

    const teacher = await prisma.user.create({
      data: {
        nameAr: 'معلم تجريبي',
        nameEn: 'Test Teacher',
        email: `testteacher${Date.now()}@test.com`,
        password: hashedPassword,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    });

    testCourse = await prisma.course.create({
      data: {
        titleAr: 'دورة تجريبية',
        titleEn: 'Test Course',
        teacherId: teacher.id,
        categoryId: category.id,
        price: 100,
        discount: 0,
        finalPrice: 100,
        status: 'PUBLISHED',
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.purchase.deleteMany({
      where: { studentId: testStudent.id },
    });
    await prisma.course.deleteMany({
      where: { titleEn: { contains: 'Test' } },
    });
    await prisma.category.deleteMany({
      where: { nameEn: { contains: 'Test' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: '@test.com' },
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/mobile/student/home', () => {
    it('should get home data', async () => {
      const response = await request(app)
        .get('/api/mobile/student/home')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('featuredCourses');
      expect(response.body.data).toHaveProperty('basicCourses');
      expect(response.body.data).toHaveProperty('categories');
    });
  });

  describe('GET /api/mobile/student/courses', () => {
    it('should get all courses', async () => {
      const response = await request(app)
        .get('/api/mobile/student/courses')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.courses)).toBe(true);
    });

    it('should get course by ID', async () => {
      const response = await request(app)
        .get(`/api/mobile/student/courses/${testCourse.id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.course.id).toBe(testCourse.id);
    });
  });

  describe('GET /api/mobile/student/my-courses', () => {
    it('should get student enrolled courses', async () => {
      const response = await request(app)
        .get('/api/mobile/student/my-courses')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('courses');
    });
  });

  describe('POST /api/mobile/student/cart', () => {
    it('should add course to cart', async () => {
      const response = await request(app)
        .post('/api/mobile/student/cart')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: testCourse.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/mobile/student/cart', () => {
    it('should get student cart', async () => {
      const response = await request(app)
        .get('/api/mobile/student/cart')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cart');
    });
  });
});


