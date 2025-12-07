import express from 'express';
import * as landingController from '../../controllers/web/landingController.js';
import * as courseController from '../../controllers/web/courseController.js';
import * as bannerController from '../../controllers/web/bannerController.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/landing', landingController.getLandingPageData);
router.get('/about', landingController.getAboutSection);
router.get('/courses', courseController.getAllCourses);
router.get('/courses/:id', courseController.getCourseById);
router.get('/categories', courseController.getAllCategories);
router.get('/banners', bannerController.getBanners);

export default router;



