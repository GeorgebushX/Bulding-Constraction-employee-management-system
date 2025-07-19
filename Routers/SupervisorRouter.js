import express from "express";
import {
   getSupervisorAttendance,
   updateSupervisorAttendance,
   bulkUpdateAttendanceByDate,
   getAttendanceByDate,
   bulkUpdateAttendanceByStatus,
   getDailyReport,
   getWeeklyReport,
   getMonthlyReport,
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
router.put('/supervisors/bulk-by-status',authMiddleware, bulkUpdateAttendanceByStatus);
// Report routes
router.get('/supervisors/Attendance/reports/daily/:DD/:MM/:YYYY', getDailyReport);
router.get('/supervisors/Attendance/reports/weekly/:MM/:YYYY/:week', getWeeklyReport);
router.get('/supervisors/Attendance/reports/monthly/:MM/:YYYY', getMonthlyReport);
// Apply attendance for all supervisors with specified status
router.post("/supervisors", upload,authMiddleware, createSupervisor);
router.get("/supervisors",authMiddleware, getAllSupervisors);
router.get("/supervisors/:id",authMiddleware, getSupervisorById);
router.put("/supervisors/:id", upload,authMiddleware, updateSupervisorById);
router.delete("/supervisors/:id",authMiddleware, deleteSupervisorById);


export default router;