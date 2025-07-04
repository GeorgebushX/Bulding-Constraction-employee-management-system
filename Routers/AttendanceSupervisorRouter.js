// import express from "express";
// import { getAttendance } from "../Controllers/attendanceSupervisorController.js";

// const router = express.Router();

// router.get("/supervisor/attendance", getAttendance);

// export default router;

import express from "express";
import { getAttendance } from "../Controllers/attendanceSupervisorController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

// Make sure this matches your frontend request
router.get("/attendance", authMiddleware, getAttendance);

export default router;