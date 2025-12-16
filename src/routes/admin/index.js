import express from 'express';
import { authMiddleware, roleMiddleware } from '../../middlewares/auth.js';
import { ROLES } from '../../config/constants.js';
import { uploadSingle, uploadFields } from '../../middlewares/upload.js';

// User routes
import * as userController from '../../controllers/admin/userController.js';

// Category routes
import * as categoryController from '../../controllers/admin/categoryController.js';

// Course routes
import * as courseController from '../../controllers/admin/courseController.js';

// Banner routes
import * as bannerController from '../../controllers/admin/bannerController.js';

// Dashboard routes
import * as dashboardController from '../../controllers/admin/dashboardController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware(ROLES.ADMIN));

// Dashboard
router.get('/dashboard/stats', dashboardController.getDashboardStats);
router.get('/dashboard/analytics', dashboardController.getAnalytics);

// Users
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.post('/users/:id/block', userController.blockUser);
router.post('/users/:id/unblock', userController.unblockUser);
router.delete('/users/:id', userController.deleteUser);
router.post('/users/:id/reset-password', userController.resetUserPassword);

// Categories
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.post('/categories', uploadSingle('image'), categoryController.createCategory);
router.put('/categories/:id', uploadSingle('image'), categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Courses
router.get('/courses', courseController.getAllCourses);
router.get('/courses/:id', courseController.getCourseById);
router.post('/courses', uploadSingle('cover_image'), courseController.createCourse);
router.put('/courses/:id', uploadSingle('cover_image'), courseController.updateCourse);
router.delete('/courses/:id', courseController.deleteCourse);

// Banners
router.get('/banners', bannerController.getAllBanners);
router.get('/banners/:id', bannerController.getBannerById);
router.post('/banners', uploadSingle('image'), bannerController.createBanner);
router.put('/banners/:id', uploadSingle('image'), bannerController.updateBanner);
router.delete('/banners/:id', bannerController.deleteBanner);

// Payments
import * as paymentController from '../../controllers/admin/paymentController.js';
router.get('/payments', paymentController.getAllPayments);
router.get('/payments/:id', paymentController.getPaymentById);
router.put('/payments/:id/status', paymentController.updatePaymentStatus);

// Reports
import * as reportController from '../../controllers/admin/reportController.js';
router.get('/reports/student', reportController.generateStudentReport);
router.get('/reports/teacher', reportController.generateTeacherReport);
router.get('/reports/students', reportController.generateAllStudentsReport);
router.get('/reports/teachers', reportController.generateAllTeachersReport);
router.get('/reports/courses', reportController.generateAllCoursesReport);
router.get('/reports/financial', reportController.generateFinancialReport);

// Notifications
import * as notificationController from '../../controllers/admin/notificationController.js';
router.get('/notifications', notificationController.getAllNotifications);
router.post('/notifications', notificationController.createNotification);
router.delete('/notifications/:id', notificationController.deleteNotification);

// Tickets
import * as ticketController from '../../controllers/admin/ticketController.js';
router.get('/tickets', ticketController.getAllTickets);
router.get('/tickets/:id', ticketController.getTicketById);
router.post('/tickets/:id/reply', ticketController.replyToTicket);
router.put('/tickets/:id/status', ticketController.updateTicketStatus);

// Ratings
import * as ratingController from '../../controllers/admin/ratingController.js';
router.get('/ratings', ratingController.getAllRatings);
router.get('/ratings/:type/:id', ratingController.getRatingById);
router.delete('/ratings/:type/:id', ratingController.deleteRating);

// Chapters
import * as chapterController from '../../controllers/admin/chapterController.js';
router.get('/courses/:courseId/chapters', chapterController.getChapters);
router.post('/courses/:courseId/chapters', chapterController.createChapter);
router.put('/courses/:courseId/chapters/:chapterId', chapterController.updateChapter);
router.delete('/courses/:courseId/chapters/:chapterId', chapterController.deleteChapter);

// Course Content
import * as courseContentController from '../../controllers/admin/courseContentController.js';
router.get('/courses/:courseId/content', courseContentController.getCourseContent);
router.post('/courses/:courseId/content', uploadFields([{ name: 'video', maxCount: 1 }, { name: 'file', maxCount: 1 }]), courseContentController.createCourseContent);
router.put('/courses/:courseId/content/:contentId', uploadFields([{ name: 'video', maxCount: 1 }, { name: 'file', maxCount: 1 }]), courseContentController.updateCourseContent);
router.delete('/courses/:courseId/content/:contentId', courseContentController.deleteCourseContent);

// Quizzes
import * as quizController from '../../controllers/admin/quizController.js';
router.get('/courses/:courseId/content/:contentId/quiz', quizController.getQuizByContent);
router.post('/courses/:courseId/content/:contentId/quiz', quizController.createQuiz);
router.put('/courses/:courseId/content/:contentId/quiz/:quizId', quizController.updateQuiz);
router.delete('/courses/:courseId/content/:contentId/quiz/:quizId', quizController.deleteQuiz);
router.post('/courses/:courseId/content/:contentId/quiz/:quizId/questions', quizController.addQuizQuestion);
router.put('/courses/:courseId/content/:contentId/quiz/:quizId/questions/:questionId', quizController.updateQuizQuestion);
router.delete('/courses/:courseId/content/:contentId/quiz/:quizId/questions/:questionId', quizController.deleteQuizQuestion);

// Exams
import * as examController from '../../controllers/admin/examController.js';
router.get('/exams', examController.getAllExams);
router.get('/exams/:id', examController.getExamById);
router.post('/exams', examController.createExam);
router.put('/exams/:id', examController.updateExam);
router.delete('/exams/:id', examController.deleteExam);
router.post('/exams/:examId/questions', examController.addExamQuestion);
router.put('/exams/:examId/questions/:questionId', examController.updateExamQuestion);
router.delete('/exams/:examId/questions/:questionId', examController.deleteExamQuestion);

// System Settings
import * as settingsController from '../../controllers/admin/settingsController.js';
router.get('/settings', settingsController.getAllSettings);
router.get('/settings/:key', settingsController.getSettingByKey);
router.post('/settings', settingsController.createOrUpdateSetting);
router.put('/settings/:key', settingsController.createOrUpdateSetting);
router.delete('/settings/:key', settingsController.deleteSetting);

// Student Progress (Admin/Teacher)
import * as progressController from '../../controllers/admin/progressController.js';
router.get('/courses/:courseId/students/progress', progressController.getCourseStudentsProgress);
router.get('/courses/:courseId/students/:studentId/progress', progressController.getStudentCourseProgress);
router.get('/students/:studentId/progress', progressController.getStudentAllProgress);

export default router;

