import express from 'express';
import {
  login,
  registerStudent,
  registerTeacher,
  refreshToken,
  logout,
  getMe,
} from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register/student', registerStudent);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/register/teacher', authMiddleware, registerTeacher);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);

export default router;



