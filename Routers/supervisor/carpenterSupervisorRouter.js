


import express from "express";
import {
  createSupervisor,
  getAllSupervisors,
  getSupervisorById,
  updateSupervisorById,
  deleteSupervisorById,
  upload
} from "../../Controllers/carpenter SupervisorController.js";

import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/carpenter/supervisors", upload,authMiddleware, createSupervisor);
router.get("/carpenter/supervisors",authMiddleware, getAllSupervisors);
router.get("/carpenter/supervisors/:id",authMiddleware, getSupervisorById);
router.put("/carpenter/supervisors/:id", upload,authMiddleware, updateSupervisorById);
router.delete("/carpenter/supervisors/:id",authMiddleware, deleteSupervisorById);


export default router;