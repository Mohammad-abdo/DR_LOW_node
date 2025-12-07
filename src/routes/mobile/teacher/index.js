import express from 'express';
import { authMiddleware, roleMiddleware } from '../../../middlewares/auth.js';
import { ROLES } from '../../../config/constants.js';
import { uploadSingle } from '../../../middlewares/upload.js';

// Course routes
import * as courseController from '../../../controllers/mobile/teacher/courseController.js';

// Exam routes
import * as examController from '../../../controllers/mobile/teacher/examController.js';

// Notification routes
import * as notificationController from '../../../controllers/mobile/teacher/notificationController.js';

const router = express.Router();

// All teacher routes require authentication and teacher role
router.use(authMiddleware);
router.use(roleMiddleware(ROLES.TEACHER));

// Courses
router.get('/courses', courseController.getMyCourses);
router.get('/courses/:id', courseController.getCourseById);
router.post('/courses', uploadSingle('cover_image'), courseController.createCourse);
router.put('/courses/:id', uploadSingle('cover_image'), courseController.updateCourse);
router.post('/courses/:courseId/content', courseController.addCourseContent);
router.put('/courses/:courseId/content/:contentId', courseController.updateCourseContent);
router.delete('/courses/:courseId/content/:contentId', courseController.deleteCourseContent);

// Exams
router.get('/exams', examController.getMyExams);
router.get('/exams/:id', examController.getExamById);
router.post('/exams', examController.createExam);
router.put('/exams/:id', examController.updateExam);
router.post('/exams/:examId/questions', examController.addExamQuestion);
router.put('/exams/:examId/questions/:questionId', examController.updateExamQuestion);
router.delete('/exams/:examId/questions/:questionId', examController.deleteExamQuestion);
router.get('/exams/:examId/results', examController.getExamResults);

// Notifications
router.post('/notifications', notificationController.sendNotification);
router.get('/notifications', notificationController.getMyNotifications);

export default router;



