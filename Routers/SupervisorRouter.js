


import express from "express";
import {
  createSupervisor,
  getAllSupervisors,
  getSupervisorById,
  updateSupervisorById,
  deleteSupervisorById,
  // attendance
  getSupervisorAttendance,
  upload
} from "../Controllers/SupervisorController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/supervisors", upload,authMiddleware, createSupervisor);
router.get("/supervisors",authMiddleware, getAllSupervisors);
router.get("/supervisors/:id",authMiddleware, getSupervisorById);
router.put("/supervisors/:id", upload,authMiddleware, updateSupervisorById);
router.delete("/supervisors/:id",authMiddleware, deleteSupervisorById);


// attendace
router.get("/supervisors/Attendance", authMiddleware, getSupervisorAttendance);

export default router;