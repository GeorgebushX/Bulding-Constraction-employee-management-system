  // routes/contractorRoutes.js
  import express from 'express';
  import {
    createContractor,
    getAllContractors,
    getContractorById,
    updateContractorById,
    deleteContractorById,
    getSupervisorsByContractorRole,
    upload
  } from '../Controllers/contractorController.js';
import authMiddleware from "../middleware/authMiddleware.js";
  const router = express.Router();

  // Get supervisors by contractor role
  // router.get('/api/supervisors/role/:role', getSupervisorsByContractorRole);
  router.get('/supervisors/role/:contractorRole',authMiddleware, getSupervisorsByContractorRole);
  // Create new contractor
  router.post('/contractors', upload, authMiddleware,createContractor);
  // Get all contractors
  router.get('/contractors',authMiddleware, getAllContractors);
  // Get contractor by ID
  router.get('/contractors/:id',authMiddleware, getContractorById);
  // Update contractor by ID
  router.put('/contractors/:id', upload,authMiddleware, updateContractorById);
  // Delete contractor by ID
  router.delete('/contractors/:id', authMiddleware, deleteContractorById);

  export default router;