


import express from "express";
import {
  createSupervisor,
  getAllSupervisors,
  getSupervisorById,
  updateSupervisorById,
  deleteSupervisorById,
  upload
} from "../../Controllers/centeringSupervisorController.js";

import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/centering/supervisors", upload,authMiddleware, createSupervisor);
router.get("/centering/supervisors",authMiddleware, getAllSupervisors);
router.get("/centering/supervisors/:id",authMiddleware, getSupervisorById);
router.put("/centering/supervisors/:id", upload,authMiddleware, updateSupervisorById);
router.delete("/centering/supervisors/:id",authMiddleware, deleteSupervisorById);


export default router;