import express from 'express';
import { authMiddleware, roleMiddleware } from '../../../middlewares/auth.js';
import { ROLES } from '../../../config/constants.js';

// Course routes
import * as courseController from '../../../controllers/mobile/student/courseController.js';

// Home routes
import * as homeController from '../../../controllers/mobile/student/homeController.js';

// Cart routes
import * as cartController from '../../../controllers/mobile/student/cartController.js';

// Wishlist routes
import * as wishlistController from '../../../controllers/mobile/student/wishlistController.js';

// Payment routes
import * as paymentController from '../../../controllers/mobile/student/paymentController.js';

// Learning routes
import * as learningController from '../../../controllers/mobile/student/learningController.js';

// Exam routes
import * as examController from '../../../controllers/mobile/student/examController.js';

// Rating routes
import * as ratingController from '../../../controllers/mobile/student/ratingController.js';

// Quiz routes
import * as quizController from '../../../controllers/mobile/student/quizController.js';

// Profile routes
import * as profileController from '../../../controllers/mobile/student/profileController.js';

// Support routes
import * as supportController from '../../../controllers/mobile/student/supportController.js';

const router = express.Router();

// All student routes require authentication and student role
router.use(authMiddleware);
router.use(roleMiddleware(ROLES.STUDENT));

// Home
router.get('/home', homeController.getHomeData);
router.get('/categories/:categoryId/courses', homeController.getCoursesByCategory);
router.get('/courses/featured', homeController.getFeaturedCourses);
router.get('/courses/featured/all-years', homeController.getFeaturedCoursesByAllYears);
router.get('/courses/basic', homeController.getBasicCourses);
router.get('/courses/basic/by-year', homeController.getBasicCoursesByYear);
router.get('/courses/featured/by-year', homeController.getFeaturedCoursesByYear);

// Courses
router.get('/courses', courseController.getAllCourses);
router.get('/courses/:id', courseController.getCourseById);

// Search
router.get('/search', courseController.searchCourses);

// Cart
router.get('/cart', cartController.getCart);
router.post('/cart', cartController.addToCart);
router.delete('/cart/:courseId', cartController.removeFromCart);
router.delete('/cart', cartController.clearCart);

// Wishlist
router.get('/wishlist', wishlistController.getWishlist);
router.post('/wishlist', wishlistController.addToWishlist);
router.delete('/wishlist/:courseId', wishlistController.removeFromWishlist);

// Payments
router.post('/payments', paymentController.createPayment);
router.get('/payments', paymentController.getMyPayments);

// Learning
router.get('/my-courses', learningController.getMyCourses);
router.get('/courses/:courseId/content', learningController.getCourseContent);
router.post('/progress', learningController.markContentComplete);

// Exams
router.get('/exams', examController.getMyExams);
router.get('/exams/course/:courseID', examController.getExamsByCourseId); // Get exams by course ID
router.get('/exams/:id', examController.getExamById);
router.post('/exams/:examId/submit', examController.submitExam);
router.get('/exams/:id/result', examController.getExamResult);

// Ratings
router.post('/ratings/course', ratingController.rateCourse);
router.post('/ratings/teacher', ratingController.rateTeacher);

// Quizzes
router.get('/content/:contentId/quiz', quizController.getQuizByContent);
router.post('/content/:contentId/quiz/submit', quizController.submitQuiz);
router.get('/content/:contentId/quiz/result', quizController.getQuizResult);

// Profile
router.delete('/profile', profileController.deleteAccount);
router.get('/share', profileController.shareApp);

// Support
router.get('/help', supportController.getHelpContent);
router.post('/support/tickets', supportController.createTicket);
router.get('/support/tickets', supportController.getMyTickets);

export default router;



