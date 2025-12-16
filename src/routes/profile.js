import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { uploadSingle } from '../middlewares/upload.js';
import * as profileController from '../controllers/profileController.js';
import * as ticketController from '../controllers/ticketController.js';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Profile
router.get('/profile', profileController.getProfile);
router.put('/profile', uploadSingle('avatar'), profileController.updateProfile);
router.post('/profile/change-password', profileController.changePassword);

// Tickets
router.post('/tickets', ticketController.createTicket);
router.get('/tickets', ticketController.getMyTickets);
router.get('/tickets/:id', ticketController.getTicketById);

// Notifications
router.get('/notifications', notificationController.getMyNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount); // Lightweight endpoint for polling
router.post('/notifications/:id/read', notificationController.markAsRead);
router.post('/notifications/read-all', notificationController.markAllAsRead);

export default router;



