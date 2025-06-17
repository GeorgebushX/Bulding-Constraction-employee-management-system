import express from "express";
import {
  addStaffOrStudent,
  getAll,
  getById,
  deleteById,
  upload
} from "../Controllers/staffController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/details", authMiddleware, upload, addStaffOrStudent);
router.get("/details", authMiddleware, getAll);
router.get("/details/:id", authMiddleware, getById);
router.delete("/details/:id", authMiddleware, deleteById);

export default router;
