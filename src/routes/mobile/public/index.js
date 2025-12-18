import express from 'express';
import * as appController from '../../../controllers/mobile/public/appController.js';

const router = express.Router();

// Public routes - No authentication required
// These endpoints are for mobile app students (and anyone else)

// About App
router.get('/about', appController.getAboutApp);

// Help & Support
router.get('/help-support', appController.getHelpSupport);

// Privacy Policy
router.get('/privacy-policy', appController.getPrivacyPolicy);

// Terms & Conditions
router.get('/terms', appController.getTermsAndConditions);

// All Policies
router.get('/policies', appController.getAllPolicies);

export default router;





