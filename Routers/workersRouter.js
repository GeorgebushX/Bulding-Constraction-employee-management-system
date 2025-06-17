import express from "express";
import {
  addWorker,
  getWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
  removeIdProof,
  upload
} from "../Controllers/workersController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/workers", upload,authMiddleware, addWorker);
router.get("/workers",authMiddleware, getWorkers);
router.get("/workers/:id",authMiddleware, getWorkerById);
router.put("/workers/:id", upload,authMiddleware, updateWorker);
router.delete("/workers/:id",authMiddleware, deleteWorker);
//  Remove ID Proof
router.delete("/:id/proofs/:proofUrl", removeIdProof);

export default router;