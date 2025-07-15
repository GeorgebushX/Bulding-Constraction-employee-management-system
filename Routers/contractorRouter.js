import express from "express";
import {
  createContractor,
  getAllContractors,
  getContractorById,
  updateContractorById,
  deleteContractorById,
  deleteAllContractors,
  upload
} from "../Controllers/contractorController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/centering/contractors",upload,authMiddleware, createContractor);
router.get("/centering/contractors",authMiddleware, getAllContractors);
router.get("/centering/contractors/:id",authMiddleware, getContractorById);
router.get("/centering/contractors/:id",authMiddleware, getContractorById);
router.put("/centering/contractors/:id", upload,authMiddleware, updateContractorById);
router.delete("/centering/contractors/:id",authMiddleware, deleteContractorById);
router.delete("/centering/contractors",authMiddleware, deleteAllContractors);


export default router;