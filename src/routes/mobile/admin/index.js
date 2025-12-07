import express from 'express';
import { authMiddleware, roleMiddleware } from '../../../middlewares/auth.js';
import { ROLES } from '../../../config/constants.js';

const router = express.Router();

// All mobile admin routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware(ROLES.ADMIN));

// Dashboard Stats (Mobile optimized)
import * as dashboardController from '../../../controllers/admin/dashboardController.js';
router.get('/dashboard/stats', dashboardController.getDashboardStats);

// Users (Mobile optimized)
import * as userController from '../../../controllers/admin/userController.js';
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);

// Categories (Mobile optimized)
import * as categoryController from '../../../controllers/admin/categoryController.js';
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);

// Courses (Mobile optimized)
import * as courseController from '../../../controllers/admin/courseController.js';
router.get('/courses', courseController.getAllCourses);
router.get('/courses/:id', courseController.getCourseById);

// Payments (Mobile optimized)
import * as paymentController from '../../../controllers/admin/paymentController.js';
router.get('/payments', paymentController.getAllPayments);
router.get('/payments/:id', paymentController.getPaymentById);

// Notifications (Mobile optimized)
import * as notificationController from '../../../controllers/admin/notificationController.js';
router.get('/notifications', notificationController.getAllNotifications);
router.post('/notifications', notificationController.createNotification);

// Tickets (Mobile optimized)
import * as ticketController from '../../../controllers/admin/ticketController.js';
router.get('/tickets', ticketController.getAllTickets);
router.get('/tickets/:id', ticketController.getTicketById);
router.post('/tickets/:id/reply', ticketController.replyToTicket);
router.put('/tickets/:id/status', ticketController.updateTicketStatus);

// Ratings (Mobile optimized)
import * as ratingController from '../../../controllers/admin/ratingController.js';
router.get('/ratings', ratingController.getAllRatings);

export default router;


