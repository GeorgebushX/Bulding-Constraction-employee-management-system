import express from 'express';
import {
  upload,
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorkerById,
  deleteWorkerById,
  getWorkersByRole,
  getSubRoles,
  getContractorsByWorkerRole
} from '../Controllers/workerController.js';

const router = express.Router();

// Get all workers
router.get('/workers', getAllWorkers);

// Get workers by role
router.get('/workers/role/:workerRole', getWorkersByRole);

// Get contractors by worker role
router.get('/workers/contractors/:workerRole', getContractorsByWorkerRole);

// Get valid sub-roles for a worker role
router.get('/workers/subroles/:workerRole', getSubRoles);

// Get worker by ID
router.get('/workers/:id', getWorkerById);

// Create new worker
router.post('/yes/workers', upload, createWorker);

// Update worker by ID
router.put('/workers/:id', upload, updateWorkerById);

// Delete worker by ID
router.delete('/workers/:id', deleteWorkerById);

export default router;