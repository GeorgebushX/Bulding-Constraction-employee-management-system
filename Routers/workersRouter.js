import express from "express";
import {
  addWorker,
  getWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
  getWorkerTypes,
  upload
} from "../Controllers/workersController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/workers", upload,authMiddleware, addWorker);
router.get("/workers",authMiddleware, getWorkers);
router.get("/workers/:id",authMiddleware, getWorkerById);
router.put("/workers/:id", upload,authMiddleware, updateWorker);
router.delete("/workers/:id",authMiddleware, deleteWorker); 

// Get valid worker types for a contractor
router.get("/workers/types/:contractorId", authMiddleware, getWorkerTypes);

export default router;

// import express from 'express';
// import {
//   createWorker,
//   getAllWorkers,
//   getWorkerById,
//   updateWorker,
//   deleteWorker,
//   deleteAllWorkers  
// } from '../Controllers/workersController.js';
// import authMiddleware from "../middleware/authMiddleware.js";
// const router = express.Router();

// router.post('/', createWorker);
// router.get('/', getAllWorkers);
// router.get('/:id', getWorkerById);
// router.put('/:id', updateWorker);
// router.delete('/:id', deleteWorker);
// router.delete('/', deleteAllWorkers);

// export default router;