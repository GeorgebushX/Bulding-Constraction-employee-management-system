

import express from 'express';
import {
    createWeeklySalary,
    assignSalaryToAllContractors,
    getSalariesByDate,
    getSalariesByMonthYear,
    getAllSalaries,
    getAllContractorSalaries,
    getSalaryById,
    updateSalary,
    deleteSalaryById,
    deleteAllSalaries,
    getContractorSalaryReport,
    generateDailyContractorReport,
    generateMonthlyContractorReport,
    generateYearlyContractorReport
} from '../Controllers/ContractorSalaryController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a weekly salary for a contractor
router.post('/contractors/salary', authMiddleware, createWeeklySalary);

// Get all salary records
router.get('/contractors/salary', authMiddleware, getAllSalaries);

// Assign salary to all contractors for a given week
router.post('/contractors/salary/bulk', authMiddleware, assignSalaryToAllContractors);

// Get salaries by specific date
router.get('/contractors/salary/:day/:month/:year', authMiddleware, getSalariesByDate);

// Get salaries by month and year
router.get('/contractors/salary/:month/:year', authMiddleware, getSalariesByMonthYear);

// Get salary by ID (with optional PDF receipt)
router.get('/contractors/salary/:id', authMiddleware, getSalaryById);

// Update salary record
router.put('/contractors/salary/:id', authMiddleware, updateSalary);

// Delete salary record
router.delete('/contractors/salary/:id', authMiddleware, deleteSalaryById);

// Delete all salary records
router.delete('/contractors/salary', authMiddleware, deleteAllSalaries);

// Get all contractor salaries with flexible filtering
router.get('/contractors/salaries', authMiddleware, getAllContractorSalaries);

// Generate contractor salary reports with flexible filtering
router.get('/contractors/salaries/reports', authMiddleware, getContractorSalaryReport);

// Generate daily contractor salary report
router.get('/contractors/reports/daily/:DD/:MM/:YYYY', authMiddleware, generateDailyContractorReport);

// Generate monthly contractor salary report
router.get('/contractors/reports/monthly/:MM/:YYYY', authMiddleware, generateMonthlyContractorReport);

// Generate yearly contractor salary report
router.get('/contractors/reports/yearly/:YYYY', authMiddleware, generateYearlyContractorReport);

export default router;
