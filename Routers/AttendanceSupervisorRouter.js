
// import express from "express";
// import { 
//   getAttendance, 
//   updateAttendance,
//   updateStatus 
// } from "../Controllers/attendanceSupervisorController.js";
// import authMiddleware from "../middleware/authMiddleware.js";
// import defaultAttendance from "../middleware/defaultAttendance.js";


// const router = express.Router();

// router.get("/supervisor/attendance", authMiddleware, defaultAttendance, getAttendance);
// router.put("/supervisor/attendance/:id", authMiddleware, updateAttendance);
// router.put("/supervisor/attendance/status/:supervisorId", authMiddleware, updateStatus);

// export default router;



import express from 'express';
import {
  getAllAttendance,
  updateAttendanceById,
  updateStatusBySupervisorAndDate
} from '../Controllers/attendanceSupervisorController.js';
import authMiddleware from "../middleware/authMiddleware.js";
import defaultAttendance from "../middleware/defaultAttendance.js";
const router = express.Router();

router.get('/attendance',defaultAttendance, authMiddleware, getAllAttendance);
router.put('/attendance/:id',authMiddleware, updateAttendanceById);
router.put('/attendance/status/:supervisorId',authMiddleware, updateStatusBySupervisorAndDate);

export default router;