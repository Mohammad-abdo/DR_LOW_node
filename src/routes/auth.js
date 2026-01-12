import express from 'express';
import {
  login,
  registerStudent,
  registerTeacher,
  refreshToken,
  logout,
  getMe,
  forgetPassword,
  resetPassword,
} from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register/student', registerStudent);
router.post('/refresh', refreshToken);
router.post('/forget-password/student', forgetPassword);
router.post('/reset-password/student', resetPassword);


// Protected routes
router.post('/register/teacher', authMiddleware, registerTeacher);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);

export default router;



