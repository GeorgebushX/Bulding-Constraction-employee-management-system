


// import express from 'express';
// import {
//   createSalary,
//   getAllSalaries,
//   getSalaryById,
//   updateSalary,
//   deleteSalaryById,
//   getDailySalaryReport,
//   getWeeklySalaryReport,
//   getMonthlySalaryReport,
//   getSupervisorSalaryReport
// } from '../Controllers/supervisorSalaryController.js';
// import authMiddleware from '../middleware/authMiddleware.js';
// const router = express.Router();

// // Create a new salary record
// router.post('/supervisor/salary', authMiddleware, createSalary);

// // Get all salary records
// router.get('/supervisor/salary', authMiddleware, getAllSalaries);

// // Get a specific salary record by ID
// router.get('/supervisor/salary/:id', authMiddleware, getSalaryById);

// // Update a salary record
// router.put('/supervisor/salary/:id', authMiddleware, updateSalary);

// // Delete a salary record
// router.delete('/supervisor/salary/:id',authMiddleware, deleteSalaryById);

// // Reports
// router.get('/reports/daily',authMiddleware, getDailySalaryReport);
// router.get('/reports/weekly',authMiddleware, getWeeklySalaryReport);
// router.get('/reports/monthly',authMiddleware, getMonthlySalaryReport);
// router.get('/reports/supervisor',authMiddleware, getSupervisorSalaryReport);

// export default router;

import express from 'express';
import {
  createSalary,
  getAllSalaries,
  getSalaryById,
  updateSalary,
  deleteSalaryById,
  getDailySalaryReport,
  getWeeklySalaryReport,
  getMonthlySalaryReport,
  getYearlySalaryReport,
generateSalaryReceipt

} from '../Controllers/supervisorSalaryController.js';
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();

// Salary record routes
router.post('/supervisors/salary',authMiddleware, createSalary);
router.get('/supervisors/salary',authMiddleware, getAllSalaries);
router.get('/supervisors/salary/:id',authMiddleware, getSalaryById);
router.put('/supervisors/salary/:id',authMiddleware, updateSalary);
router.delete('/supervisors/salary/:id',authMiddleware, deleteSalaryById);

// Report routes
router.get('/supervisors/reports/daily',authMiddleware, getDailySalaryReport);
router.get('/supervisors/reports/weekly',authMiddleware, getWeeklySalaryReport);
router.get('/supervisors/reports/monthly',authMiddleware, getMonthlySalaryReport);
router.get('/supervisors/reports/yearly',authMiddleware, getYearlySalaryReport);
// 
router.get('supervisors/report/:id',authMiddleware, generateSalaryReceipt)
export default router;



// import express from 'express';
// import {
//   createSalary,
//   getAllSalaries,
//   getSalaryById,
//   updateSalary,
//   deleteSalaryById,
//   getWeeklySalaryReport,
//   getMonthlySalaryReporpt,
//   getSupervisorSalaryReport
// } from '../Controllers/supervisorSalaryController.js';
// import authMiddleware from '../middleware/authMiddleware.js';

// const router = express.Router();

// // Basic CRUD routes
// router.post('/supervisor/salary', authMiddleware, createSalary);
// router.get('/supervisor/salary', authMiddleware, getAllSalaries);
// router.get('/supervisor/salary/:id', authMiddleware, getSalaryById);
// router.put('/supervisor/salary/:id', authMiddleware, updateSalary);
// router.delete('/supervisor/salary/:id', authMiddleware, deleteSalaryById);

// // Report routes
// router.get('/salary/reports/weekly', authMiddleware, getWeeklySalaryReport);
// // API METHOD: GET /api/salaries/reports/weekly?week=2&month=July&year=2023&format=pdf
// router.get('/salary/reports/monthly', authMiddleware, getMonthlySalaryReporpt);
// // API METHOD: GET /api/salaries/reports/monthly?month=July&year=2023&format=excel
// router.get('/salary/reports/supervisor', authMiddleware, getSupervisorSalaryReport);
// // API METHOD: GET /api/salaries/reports/supervisor?supervisorId=123&format=json

// export default router;