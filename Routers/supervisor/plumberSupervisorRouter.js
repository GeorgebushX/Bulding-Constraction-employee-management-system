
import express from "express";
import {
  createSupervisor,
  getAllSupervisors,
  getSupervisorById,
  updateSupervisorById,
  deleteSupervisorById,
  upload
} from "../../Controllers/plumberSupervisorController.js";

import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/plumber/supervisors", upload,authMiddleware, createSupervisor);
router.get("/plumber/supervisors",authMiddleware, getAllSupervisors);
router.get("/plumber/supervisors/:id",authMiddleware, getSupervisorById);
router.put("/plumber/supervisors/:id", upload,authMiddleware, updateSupervisorById);
router.delete("/plumber/supervisors/:id",authMiddleware, deleteSupervisorById);


export default router;