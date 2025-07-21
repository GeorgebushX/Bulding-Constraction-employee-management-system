import express from "express";
import {
   getSupervisorAttendance,
   updateSupervisorAttendance,
   bulkUpdateAttendanceByDate,
   getAttendanceByDate,
   bulkUpdateAttendanceStatus,
   getDailyReport,
   getWeeklyReport,
   getMonthlyReport,
    getDailyAttendanceReport,
    getDateRangeReport,
    getMonthlyAttendanceReport,
  createSupervisor,
  getAllSupervisors,
  getSupervisorById,
  updateSupervisorById,
  deleteSupervisorById,
  upload
} from "../Controllers/SupervisorController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/supervisors/Attendance", authMiddleware, getSupervisorAttendance);
router.put("/supervisors/Attendance/:supervisorId", authMiddleware, updateSupervisorAttendance);
router.put('/supervisors/bulk-by-date',authMiddleware, bulkUpdateAttendanceByDate);
router.get('/supervisors/:day/:month/:year',authMiddleware, getAttendanceByDate);
router.put('/supervisors/bulk-by-status',authMiddleware, bulkUpdateAttendanceStatus);
// Report routes
router.get('/supervisors/Attendance/reports/daily/:DD/:MM/:YYYY', getDailyReport);
router.get('/supervisors/Attendance/reports/weekly/:MM/:YYYY/:week', getWeeklyReport);
router.get('/supervisors/Attendance/reports/monthly/:MM/:YYYY', getMonthlyReport);
// Daily report route
router.get('/supervisors/Attendance/reports/daily/range',authMiddleware, getDailyAttendanceReport);
// Date range report route
router.get('/supervisors/Attendance/reports/range',authMiddleware, getDateRangeReport);
// Monthly report route
router.get('/supervisors/Attendance/reports/monthly',authMiddleware, getMonthlyAttendanceReport);

router.post("/supervisors", upload,authMiddleware, createSupervisor);
router.get("/supervisors",authMiddleware, getAllSupervisors);
router.get("/supervisors/:id",authMiddleware, getSupervisorById);
router.put("/supervisors/:id", upload,authMiddleware, updateSupervisorById);
router.delete("/supervisors/:id",authMiddleware, deleteSupervisorById);


export default router;