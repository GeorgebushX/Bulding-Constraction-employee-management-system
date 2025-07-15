


import express from "express";
import {
  createSupervisor,
  getAllSupervisors,
  getSupervisorById,
  updateSupervisorById,
  deleteSupervisorById,
  upload
} from "../../Controllers/painterSupervisorContractor.js";

import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/painter/supervisors", upload,authMiddleware, createSupervisor);
router.get("/painter/supervisors",authMiddleware, getAllSupervisors);
router.get("/painter/supervisors/:id",authMiddleware, getSupervisorById);
router.put("/painter/supervisors/:id", upload,authMiddleware, updateSupervisorById);
router.delete("/painter/supervisors/:id",authMiddleware, deleteSupervisorById);


export default router;