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
  addSupervisor,
  getSupervisors,
  getSupervisorById,
  updateSupervisor,
  deleteSupervisor,
  removeIdProof,
  upload
} from "../Controllers/supervisorController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/supervisor", upload,authMiddleware, addSupervisor);
router.get("/supervisor",authMiddleware, getSupervisors);
router.get("/supervisor/:id",authMiddleware, getSupervisorById);
router.put("/supervisor/:id", upload,authMiddleware, updateSupervisor);
router.delete("/supervisor/:id",authMiddleware, deleteSupervisor);
router.delete("/:id/id-proof/:proofUrl", removeIdProof);

export default router;