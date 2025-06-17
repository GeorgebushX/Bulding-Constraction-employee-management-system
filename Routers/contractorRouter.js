import express from "express";
import {
  addContractor,
  getContractors,
  getContractorById,
  updateContractor,
  deleteContractor,
  removeIdProof,
  upload
} from "../Controllers/contractorController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/contractors", upload,authMiddleware, addContractor);
router.get("/contractors",authMiddleware, getContractors);
router.get("/contractors/:id",authMiddleware, getContractorById);
router.put("/contractors/:id", upload,authMiddleware, updateContractor);
router.delete("/contractors/:id",authMiddleware, deleteContractor);
//Remove ID Proof
router.delete("/:id/proofs/:proofUrl", removeIdProof);

export default router;