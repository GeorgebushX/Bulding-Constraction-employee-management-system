import express from "express";
import {
    createSalary,
    getAllSalaries,
    getSalaryById,
    updateSalary,
    deleteSalaryById,
    deleteAllSalaries
} from "../Controllers/supervisorSalaryController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

// Create a new salary record
router.post("/supervisor/salary",authMiddleware, createSalary);

// Get all salary records
router.get("/supervisor/salary",authMiddleware, getAllSalaries);

// Get a single salary record by ID
router.get("/supervisor/salary/:id",authMiddleware, getSalaryById);

// Update a salary record
router.put("/supervisor/salary/:id",authMiddleware, updateSalary);

// Delete a salary record by ID
router.delete("/supervisor/salary/:id",authMiddleware, deleteSalaryById);

// Delete all salary records
router.delete("/supervisor/salary",authMiddleware, deleteAllSalaries);

export default router;