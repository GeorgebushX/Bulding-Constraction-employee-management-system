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

router.post("/contractors",upload,authMiddleware, createContractor);
router.get("/contractors",authMiddleware, getAllContractors);
router.get("/contractors/:id",authMiddleware, getContractorById);
router.put("/contractors/:id", upload,authMiddleware, updateContractorById);
router.delete("/contractors/:id",authMiddleware, deleteContractorById);
router.delete("/contractors",authMiddleware, deleteAllContractors);


export default router;