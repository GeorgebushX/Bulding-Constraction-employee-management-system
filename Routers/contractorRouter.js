import express from "express";
import {
  addContractor,
  getContractors,
  getContractorById,
  updateContractor,
  deleteContractor,
  upload
} from "../Controllers/contractorController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/contractors",upload,authMiddleware, addContractor);
router.get("/contractors",authMiddleware, getContractors);
router.get("/contractors/:id",authMiddleware, getContractorById);
router.put("/contractors/:id", upload,authMiddleware, updateContractor);
router.delete("/contractors/:id",authMiddleware, deleteContractor);


export default router;