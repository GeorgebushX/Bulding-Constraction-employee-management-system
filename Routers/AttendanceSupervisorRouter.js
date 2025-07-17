

import express from 'express';
import {
  getAllAttendance,
  getDailyAttendance,
  updateAttendanceById,
  updateStatusBySupervisorAndDate,
  // get date today
  getTodaySupervisorAttendance,
  // date filte
  // update corn
  getAttendance,
  getAttendanceByDate,
  applyStatusToAll,
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport
} from '../Controllers/attendanceSupervisorController.js';
import authMiddleware from "../middleware/authMiddleware.js";
import defaultAttendance from "../middleware/defaultAttendance.js";

const router = express.Router();

// Basic attendance routes
router.get('/attendance',defaultAttendance, authMiddleware, getAllAttendance);
router.get('/attendance/daily',defaultAttendance, authMiddleware, getDailyAttendance);
router.get('/attendance/day', defaultAttendance, authMiddleware, getAttendance);
// router.get('/attendance/day',authMiddleware, getAllAttendance);
router.put('/attendance/:id', authMiddleware, updateAttendanceById);
router.put('/attendance/status/:supervisorId', authMiddleware, updateStatusBySupervisorAndDate);
  
// getTodaySupervisorAttendance     
router.get('/attendance/today', authMiddleware, getTodaySupervisorAttendance);
// filter by date:
router.get('/attendance/date/:day/:month/:year',authMiddleware, getAttendanceByDate);
router.post('/attendance/apply-to-all',authMiddleware, applyStatusToAll);


// Report routes
router.get('/reports/daily', authMiddleware, getDailyReport);
// API METHOD: https://bulding-constraction-employee-management.onrender.com/api/reports/daily?date=2025-07-09
router.get('/reports/weekly', authMiddleware, getWeeklyReport);
// API METHOD:https://bulding-constraction-employee-management.onrender.com/api/reports/weekly?date=2025-07-09
router.get('/reports/monthly', authMiddleware, getMonthlyReport);
// API METHOD: https://bulding-constraction-employee-management.onrender.com/api/reports/monthly?year=2025&month=07

export default router;


