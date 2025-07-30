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

  const router = express.Router();

  // Get supervisors by contractor role
  // router.get('/api/supervisors/role/:role', getSupervisorsByContractorRole);
  router.get('/supervisors/role/:contractorRole', getSupervisorsByContractorRole);
  // Create new contractor
  router.post('/contractors', upload, createContractor);
  // Get all contractors
  router.get('/contractors', getAllContractors);
  // Get contractor by ID
  router.get('/contractors/:id', getContractorById);
  // Update contractor by ID
  router.put('/contractors/:id', upload, updateContractorById);
  // Delete contractor by ID
  router.delete('/contractors/:id', deleteContractorById);

  export default router;