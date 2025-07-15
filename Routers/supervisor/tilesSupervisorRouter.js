


import express from "express";
import {
  createSupervisor,
  getAllSupervisors,
  getSupervisorById,
  updateSupervisorById,
  deleteSupervisorById,
  upload
} from "../../Controllers/tilesSupervisorController.js";

import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/tiles/supervisors", upload,authMiddleware, createSupervisor);
router.get("/tiles/supervisors",authMiddleware, getAllSupervisors);
router.get("/tiles/supervisors/:id",authMiddleware, getSupervisorById);
router.put("/tiles/supervisors/:id", upload,authMiddleware, updateSupervisorById);
router.delete("/tiles/supervisors/:id",authMiddleware, deleteSupervisorById);


export default router;