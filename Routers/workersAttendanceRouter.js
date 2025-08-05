import express from "express";
import {
  getWorkerAttendance,
  updateWorkerAttendance,
  bulkUpdateWorkerAttendanceByDate,
  getWorkerAttendanceByDate,
  bulkUpdateWorkerAttendanceStatus,
  getBulkWorkerDataReport,
  getWorkerDailyReport,
  getWorkerWeeklyReport,
  getWorkerMonthlyReport,
  getWorkerDailyAttendanceReport,
  getWorkerDateRangeReport,
  getWorkerMonthlyAttendanceReport,
} from "../Controllers/workersAttendanceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Worker Attendance Routes
router.get("/attendance/workers", authMiddleware, getWorkerAttendance);
router.put("/yes/workers/attendance/:id", authMiddleware, updateWorkerAttendance);
router.put("/workers/attendance/bulk-by-date", authMiddleware, bulkUpdateWorkerAttendanceByDate);
router.get("/yes/workers/attendance/:day/:month/:year", authMiddleware, getWorkerAttendanceByDate);
router.put("/workers/attendance/bulk-by-status", authMiddleware, bulkUpdateWorkerAttendanceStatus);
router.get('/workers/attendance/reports', authMiddleware, getBulkWorkerDataReport);

// Worker Report Routes
router.get("/workers/reports/daily/:DD/:MM/:YYYY", authMiddleware, getWorkerDailyReport);
router.get("/workers/reports/weekly/:MM/:YYYY/:week", authMiddleware, getWorkerWeeklyReport);
router.get("/workers/reports/monthly/:MM/:YYYY", authMiddleware, getWorkerMonthlyReport);

// Flexible Report Routes
router.post("/workers/reports/daily", authMiddleware, getWorkerDailyAttendanceReport);
router.post("/workers/reports/date-range", authMiddleware, getWorkerDateRangeReport);
router.post("/workers/reports/monthly", authMiddleware, getWorkerMonthlyAttendanceReport);

export default router;