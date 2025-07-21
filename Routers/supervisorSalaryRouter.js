import express from 'express';
import {
  createMonthlySalary,
  assignSalaryToAllSupervisors,
  getSalariesByDate,
  getSalariesByMonthYear,
  getAllSalaries,
  getAllSupervisorSalaries,
  getSalaryById,
  updateSalary,
  deleteSalaryById,
  deleteAllSalaries,
  getSalaryReport,
  generateDailyReport,
  generateMonthlyReport,
  generateYearlyReport
} from '../Controllers/supervisorSalaryController.js';
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();

router.post('/supervisors/salary',authMiddleware, createMonthlySalary);
router.get('/supervisors/salary',authMiddleware, getAllSalaries);
router.post('/supervisors/salary/bulk',authMiddleware, assignSalaryToAllSupervisors);
router.get('/supervisors/salary/:day/:month/:year',authMiddleware, getSalariesByDate);
router.get('/supervisors/salary/:month/:year',authMiddleware, getSalariesByMonthYear);
// Get salary by ID (with optional PDF receipt)
router.get('/supervisors/salary/:id',authMiddleware, getSalaryById);
// Update salary record
router.put('/supervisors/salary/:id',authMiddleware, updateSalary);
// Delete salary record
router.delete('/supervisors/salary/:id',authMiddleware, deleteSalaryById);
// Delete all salary records
router.delete('/supervisors/salary',authMiddleware, deleteAllSalaries);
router.get('/supervisors/salaries',  getAllSupervisorSalaries);
// Reports
router.get('/supervisors/salaries/reports', getSalaryReport);
//optional
router.get('/supervisors/salary/reports/daily/:DD/:MM/:YYYY',authMiddleware, generateDailyReport);
// router.get('/supervisors/salary/reports/weekly/:MM/:YYYY/:week',authMiddleware, generateWeeklyReport);
router.get('/supervisors/salary/reports/monthly/:MM/:YYYY',authMiddleware, generateMonthlyReport);
router.get('/supervisors/salary/reports/yearly/:YYYY',authMiddleware, generateYearlyReport);

export default router;
