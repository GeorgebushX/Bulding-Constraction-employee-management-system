import express from 'express';
import {
  upload,
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorkerById,
  deleteWorkerById
} from '../Controllers/workerController.js';

const router = express.Router();


// Create new worker
router.post('/workers', upload, createWorker);

// Get all workers
router.get('/workers', getAllWorkers);

// Get worker by ID
router.get('/workers/:id', getWorkerById);
// Update worker by ID
router.put('/workers/:id', upload, updateWorkerById);

// Delete worker by ID
router.delete('/workers/:id', deleteWorkerById);

// Get workers by role
// router.get('/workers/role/:workerRole', getWorkersByRole);

// Get contractors by worker role
// router.get('/workers/contractors/:workerRole', getContractorsByWorkerRole);

// Get valid sub-roles for a worker role
// router.get('/workers/subroles/:workerRole', getSubRoles);

export default router;