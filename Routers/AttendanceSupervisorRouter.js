
// import express from 'express';
// import {
//   getAllAttendance,
//   updateAttendanceById,
//   updateStatusBySupervisorAndDate,
//   getAttendanceReport
// } from '../Controllers/attendanceSupervisorController.js';
// import authMiddleware from "../middleware/authMiddleware.js";
// import defaultAttendance from "../middleware/defaultAttendance.js";
// const router = express.Router();

// router.get('/attendance',defaultAttendance, authMiddleware, getAllAttendance);
// router.put('/attendance/:id',authMiddleware, updateAttendanceById);
// router.put('/attendance/status/:supervisorId',authMiddleware, updateStatusBySupervisorAndDate);
// router.get('/attendance/report', authMiddleware, getAttendanceReport);
// export default router;

import express from 'express';
import {
  getAllAttendance,
  updateAttendanceById,
  updateStatusBySupervisorAndDate,
  // date filte
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
router.get('/attendance', defaultAttendance, authMiddleware, getAllAttendance);
router.put('/attendance/:id', authMiddleware, updateAttendanceById);
router.put('/attendance/status/:supervisorId', authMiddleware, updateStatusBySupervisorAndDate);

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



// // 4. Get Attendance Report (JSON)
// // Request:

// // text
// // GET /api/attendance/report?date=2023-07-15&period=daily
// // Response:

// // json
// // {
// //   "success": true,
// //   "period": "daily",
// //   "data": {
// //     "15/07/2023": [
// //       {
// //         "_id": 123,
// //         "name": "John Doe",
// //         "email": "john@example.com",
// //         "photo": "uploads/supervisors/123.jpg",
// //         "status": "Fullday"
// //       },
// //       {
// //         "_id": 124,
// //         "name": "Jane Smith",
// //         "email": "jane@example.com",
// //         "photo": "uploads/supervisors/124.jpg",
// //         "status": "Halfday"
// //       }
// //     ]
// //   }
// // }
// // 5. Get Attendance Report (PDF)
// // Request:

// // text
// // GET /api/attendance/report?date=2023-07&period=monthly&format=pdf
// // Response:

// // Returns a PDF file download

// // 6. Get Attendance Report (Excel)
// // Request:

// // text
// // GET /api/attendance/report?date=2023-07-10&period=weekly&format=excel
// // Response:

// // Returns an Excel file download