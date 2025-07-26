
import express from "express";
import {
  getContractorAttendance,
  updateContractorAttendance,
  bulkUpdateContractorAttendanceByDate,
  getContractorAttendanceByDate,
  bulkUpdateContractorAttendanceStatus,
  getBulkDataReport,
  getContractorDailyReport,
  getContractorWeeklyReport,
  getContractorMonthlyReport,
  getContractorDailyAttendanceReport,
  getContractorDateRangeReport,
  getContractorMonthlyAttendanceReport,
} from "../Controllers/contractorAttendanceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Attendance routes
router.get("/yes/contractors/attendance", authMiddleware, getContractorAttendance);
router.put("/yes/contractors/attendance/:id",authMiddleware,updateContractorAttendance);
router.put("/contractors/attendance/bulk-by-date",authMiddleware,bulkUpdateContractorAttendanceByDate);
router.get("/contractors/attendance/:day/:month/:year",authMiddleware,getContractorAttendanceByDate);
router.put("/contractors/attendance/bulk-by-status",authMiddleware,bulkUpdateContractorAttendanceStatus);
router.get('/contractors/attendance/reports',authMiddleware, getBulkDataReport);
// Report routes
router.get("/contractors/attendance/reports/daily/:DD/:MM/:YYYY",authMiddleware,getContractorDailyReport);
router.get("/contractors/attendance/reports/weekly/:MM/:YYYY/:week",authMiddleware,getContractorWeeklyReport);
router.get("/contractors/attendance/reports/monthly/:MM/:YYYY",authMiddleware,getContractorMonthlyReport);

// Flexible report routes
router.get("/yes/contractors/attendance/reports/daily", authMiddleware,getContractorDailyAttendanceReport);
router.post("/contractors/attendance/reports/range",authMiddleware,getContractorDateRangeReport);
router.post("/contractors/attendance/reports/monthly",authMiddleware,getContractorMonthlyAttendanceReport);

export default router;