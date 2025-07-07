// import express from "express";
// import {
//   addSupervisor,
//   getAllSupervisors,
//   getSupervisorById,
//   deleteSupervisor,
//   updateSupervisor,
//   upload
// } from "../Controllers/supervisorController.js";

// const router = express.Router();

// router.post("/supervisor", upload, addSupervisor);
// router.get("/supervisor", getAllSupervisors);
// router.get("/supervisor/:id", getSupervisorById);
// router.put("/supervisor/:id", upload, updateSupervisor);
// router.delete("/supervisor/:id", deleteSupervisor);

// export default router;


import express from "express";
import {
  createSupervisor,
  getAllSupervisors,
  getSupervisorById,
  updateSupervisorById,
  deleteSupervisorById,
  deleteAllSupervisors,  
  upload
} from "../Controllers/supervisorController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/supervisor", upload,authMiddleware, createSupervisor);
router.get("/supervisor",authMiddleware, getAllSupervisors);
router.get("/supervisor/:id",authMiddleware, getSupervisorById);
router.put("/supervisor/:id", upload,authMiddleware, updateSupervisorById);
router.delete("/supervisor/:id",authMiddleware, deleteSupervisorById);
router.delete("/supervisor",authMiddleware, deleteAllSupervisors);

export default router;