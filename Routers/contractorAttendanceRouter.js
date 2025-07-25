// routes/contractorAttendanceRoutes.js
import express from 'express';
import { 
  getContractorAttendance,
  updateContractorAttendance,
  bulkUpdateContractorAttendanceByDate,
  bulkUpdateContractorAttendanceStatus,
  getContractorAttendanceByDate,
  getContractorDailyReport,
  getContractorWeeklyReport,
  getContractorMonthlyReport,
  getContractorDailyAttendanceReport,
  getContractorDateRangeReport,
  getContractorMonthlyAttendanceReport,
  getContractorDateRangeReportFromPath
} from '../Controllers/contractorAttendanceController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Basic attendance routes
router.get("/yes/contractors/Attendance",authMiddleware, getContractorAttendance);
router.put("/yes/contractors/Attendance/:contractorId", authMiddleware, updateContractorAttendance);
router.post('/yes/contractors/Attendance/bulk-by-date', authMiddleware, bulkUpdateContractorAttendanceByDate);
router.get('/yes/contractors/Attendance/:day/:month/:year', authMiddleware, getContractorAttendanceByDate);
router.put('/yes/contractors/bulk-by-status', authMiddleware, bulkUpdateContractorAttendanceStatus);

// Report routes with date in path
router.get('/yes/contractors/Attendance/reports/daily/:DD/:MM/:YYYY', authMiddleware, getContractorDailyReport);
router.get('/yes/contractors/Attendance/reports/weekly/:MM/:YYYY/:week', authMiddleware, getContractorWeeklyReport);
router.get('/yes/contractors/Attendance/reports/monthly/:MM/:YYYY', authMiddleware, getContractorMonthlyReport);

// Route with optional dateRange parameter
router.get('/yes/contractors/Attendance/reports/:dateRange', authMiddleware, getContractorDateRangeReportFromPath);
router.get('/yes/contractors/Attendance/reports', getContractorDateRangeReportFromPath);

// Report routes with data in body
router.post('/yes/contractors/Attendance/reports/daily/range', authMiddleware, getContractorDailyAttendanceReport);
router.post('/yes/contractors/Attendance/reports/range', authMiddleware, getContractorDateRangeReport);
router.post('/yes/contractors/Attendance/reports/monthly', authMiddleware, getContractorMonthlyAttendanceReport);

export default router;