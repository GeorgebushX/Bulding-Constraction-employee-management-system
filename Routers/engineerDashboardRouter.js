// import express from 'express';
// import {
//   getDashboardStats,
//   getSiteDetails,
//   getSupervisorAttendanceDetails
// } from '../Controllers/engineerDashboardController.js';

// const router = express.Router();

// // Get dashboard statistics
// router.get('/stats', getDashboardStats);

// // Get site details with supervisors
// router.get('/site/:siteId', getSiteDetails);

// // Get supervisor attendance details
// router.get('/supervisor/:supervisorId/attendance', getSupervisorAttendanceDetails);

// export default router;



import express from 'express';
import {
  getDashboardStats,
  getSiteDetails,
  getSupervisorAttendanceDetails,
  getAllSupervisors
} from '../Controllers/engineerDashboardController.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', getDashboardStats);

// Get site details with supervisors
router.get('/site/:siteId', getSiteDetails);

// Get supervisor attendance details
router.get('/supervisor/:supervisorId/attendance', getSupervisorAttendanceDetails);

// Get all supervisors with details
router.get('/supervisors', getAllSupervisors);

export default router;