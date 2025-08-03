import express from 'express';
import {
    createWeeklySalary,
    assignSalaryToAllWorkers,
    getSalariesByDate,
    getSalariesByMonthYear,
    getAllSalaries,
    getAllWorkerSalaries,
    getSalaryById,
    updateSalary,
    deleteSalaryById,
    deleteAllSalaries,
    getWorkerSalaryReport,
    generateDailyWorkerReport,
    generateMonthlyWorkerReport,
    generateYearlyWorkerReport
} from '../Controllers/workerSalaryController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a weekly salary for a worker
router.post('/workers/salary',authMiddleware, createWeeklySalary);

// Get all salary records
router.get('/yes/workers/salary', getAllSalaries);

// Assign salary to all workers for a given week
router.post('/yes/workers/salary/bulk', authMiddleware, assignSalaryToAllWorkers);

// Get salaries by specific date
router.get('/workers/salary/:day/:month/:year', authMiddleware, getSalariesByDate);

// Get salaries by month and year
router.get('/workers/salary/:month/:year', authMiddleware, getSalariesByMonthYear);

// Get salary by ID (with optional PDF receipt)
router.get('/yes/workers/salary/:id', authMiddleware, getSalaryById);

// Update salary record
router.put('/yes/workers/salary/:id', authMiddleware, updateSalary);

// Delete salary record
router.delete('/yes/workers/salary/:id', authMiddleware, deleteSalaryById);

// Delete all salary records
router.delete('/yes/workers/salary', authMiddleware, deleteAllSalaries);

// Get all worker salaries with flexible filtering
router.get('yes/workers/salary/reports', authMiddleware, getAllWorkerSalaries);

// Generate worker salary reports with flexible filtering
router.get('/yes/workers/salaries/report', authMiddleware, getWorkerSalaryReport);

// Generate daily worker salary report
router.get('/workers/reports/daily/:DD/:MM/:YYYY', authMiddleware, generateDailyWorkerReport);

// Generate monthly worker salary report
router.get('/workers/reports/monthly/:MM/:YYYY', authMiddleware, generateMonthlyWorkerReport);

// Generate yearly worker salary report
router.get('/workers/reports/yearly/:YYYY', authMiddleware, generateYearlyWorkerReport);

export default router;