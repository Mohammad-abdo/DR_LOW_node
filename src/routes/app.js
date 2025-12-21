import express from 'express';
import * as aboutAppController from '../controllers/aboutAppController.js';
import * as helpSupportController from '../controllers/helpSupportController.js';
import * as appPolicyController from '../controllers/appPolicyController.js';

const router = express.Router();

// Public routes for mobile app
// About App
router.get('/about', aboutAppController.getAboutApp);

// Help & Support
router.get('/help-support', helpSupportController.getHelpSupport);

// App Policies
router.get('/policies', appPolicyController.getAppPolicies);

export default router;








