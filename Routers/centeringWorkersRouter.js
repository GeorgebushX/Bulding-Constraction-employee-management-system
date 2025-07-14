import express from "express";
import {
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorkerById,
  deleteWorkerById,
  deleteAllWorkers,
  upload
} from "../Controllers/centeringWorkersController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/centering/workers", upload,authMiddleware, createWorker);
router.get("/centering/workers",authMiddleware, getAllWorkers);
router.get("/centering/workers/:id",authMiddleware, getWorkerById);
router.put("/centering/workers/:id", upload,authMiddleware, updateWorkerById);
router.delete("/centering/workers/:id",authMiddleware, deleteWorkerById); 
router.delete("/centering/workers/:id",authMiddleware, deleteAllWorkers); 

export default router;
