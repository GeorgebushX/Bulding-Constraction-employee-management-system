import express from "express";
import {
  addDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} from "../Controllers/departmentController.js";

const router = express.Router();

// Route Definitions
router.post("/details", addDepartment);
router.get("/details", getDepartments);
router.get("/details/:id", getDepartmentById);
router.put("/details/:id", updateDepartment);
router.delete("/details/:id", deleteDepartment);

export default router;
