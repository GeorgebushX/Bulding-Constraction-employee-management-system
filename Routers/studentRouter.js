import express from "express";
import {
  addStudent,
  getAllStudents,
  getStudentById,
  deleteStudentById,
  upload
} from "../Controllers/studentController.js"

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/student", authMiddleware, upload, addStudent);9
router.get("/student", authMiddleware, getAllStudents);
router.get("/student/:id", authMiddleware, getStudentById);
router.delete("/student/:id", authMiddleware, deleteStudentById);

export default router;
