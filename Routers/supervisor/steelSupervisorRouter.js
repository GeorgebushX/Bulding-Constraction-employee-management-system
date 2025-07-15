


import express from "express";
import {
  createSupervisor,
  getAllSupervisors,
  getSupervisorById,
  updateSupervisorById,
  deleteSupervisorById,
  upload
} from "../../Controllers/steelSupervisorController.js";

import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/steel/supervisors", upload,authMiddleware, createSupervisor);
router.get("/steel/supervisors",authMiddleware, getAllSupervisors);
router.get("/steel/supervisors/:id",authMiddleware, getSupervisorById);
router.put("/steel/supervisors/:id", upload,authMiddleware, updateSupervisorById);
router.delete("/steel/supervisors/:id",authMiddleware, deleteSupervisorById);


export default router;