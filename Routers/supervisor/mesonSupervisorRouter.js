


import express from "express";
import {
  createSupervisor,
  getAllSupervisors,
  getSupervisorById,
  updateSupervisorById,
  deleteSupervisorById,
  upload
} from "../../Controllers/mesonSupervisorController.js";

import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/meson/supervisors", upload,authMiddleware, createSupervisor);
router.get("/meson/supervisors",authMiddleware, getAllSupervisors);
router.get("/meson/supervisors/:id",authMiddleware, getSupervisorById);
router.put("/meson/supervisors/:id", upload,authMiddleware, updateSupervisorById);
router.delete("/meson/supervisors/:id",authMiddleware, deleteSupervisorById);


export default router;