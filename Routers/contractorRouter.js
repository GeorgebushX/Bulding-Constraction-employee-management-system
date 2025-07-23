
// routes/contractorRoutes.js
import express from 'express';
import {
  createContractor,
  getAllContractors,
  getContractorById,
  updateContractorById,
  deleteContractorById,
  deleteAllContractors,
  getSupervisorsByContractorRole,
  upload
} from '../Controllers/contractorController.js';

const router = express.Router();

// Get supervisors by contractor role
router.get('/supervisors/:contractorRole', getSupervisorsByContractorRole);

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

// Delete all contractors (development only)
router.delete('/contractors', deleteAllContractors);

export default router;




// import express from "express";
// import {
//   createContractor,
//   getAllContractors,
//   getContractorById,
//   updateContractorById,
//   deleteContractorById,
//   deleteAllContractors,
//   upload
// } from "../Controllers/contractorController.js";

// import authMiddleware from "../middleware/authMiddleware.js";

// const router = express.Router();

// router.post("/centering/contractors",upload,authMiddleware, createContractor);
// router.get("/centering/contractors",authMiddleware, getAllContractors);
// router.get("/centering/contractors/:id",authMiddleware, getContractorById);
// router.get("/centering/contractors/:id",authMiddleware, getContractorById);
// router.put("/centering/contractors/:id", upload,authMiddleware, updateContractorById);
// router.delete("/centering/contractors/:id",authMiddleware, deleteContractorById);
// router.delete("/centering/contractors",authMiddleware, deleteAllContractors);


// export default router;