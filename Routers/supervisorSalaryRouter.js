import express from 'express';
import {
  createMonthlySalary,
  assignSalaryToAllSupervisors,
  getSalariesByDate,
  getSalariesByMonthYear,
  getAllSalaries,
  getSalaryById,
  updateSalary,
  deleteSalaryById,
  deleteAllSalaries,
  generateDailyReport,
  generateWeeklyReport,
  generateMonthlyReport,
  generateYearlyReport
} from '../Controllers/supervisorSalaryController.js';
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();

router.post('/supervisors/salary',authMiddleware, createMonthlySalary);
router.get('/supervisors/salaries',authMiddleware, getAllSalaries);
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

// Reports
router.get('/supervisors/salary/reports/daily',authMiddleware, generateDailyReport);
router.get('/supervisors/salary/reports/weekly',authMiddleware, generateWeeklyReport);
router.get('/supervisors/salary/reports/monthly',authMiddleware, generateMonthlyReport);
router.get('/supervisors/salary/reports/yearly',authMiddleware, generateYearlyReport);

export default router;





// import express from 'express';
// import {
//   createMonthlySalary,
//   getAllSalaries,
//   getSalaryById,
//   updateSalary,
//   deleteSalaryById,
//   getDailySalaryReport,
//   getWeeklySalaryReport,
//   getMonthlySalaryReport,
//   getYearlySalaryReport,
// generateSalaryReceipt

// } from '../Controllers/supervisorSalaryController.js';
// import authMiddleware from '../middleware/authMiddleware.js';
// const router = express.Router();

// // Salary record routes
// router.post('/supervisors/salary',authMiddleware, createMonthlySalary);
// router.get('/supervisors/salary',authMiddleware, getAllSalaries);
// router.get('/supervisors/salary/:id',authMiddleware, getSalaryById);
// router.put('/supervisors/salary/:id',authMiddleware, updateSalary);
// router.delete('/supervisors/salary/:id',authMiddleware, deleteSalaryById);

// // Report routes
// router.get('/supervisors/reports/daily',authMiddleware, getDailySalaryReport);
// router.get('/supervisors/reports/weekly',authMiddleware, getWeeklySalaryReport);
// router.get('/supervisors/reports/monthly',authMiddleware, getMonthlySalaryReport);
// router.get('/supervisors/reports/yearly',authMiddleware, getYearlySalaryReport);
// // 
// router.get('supervisors/report/:id',authMiddleware, generateSalaryReceipt)
// export default router;







// 3. Sample JSON Data for Postman Testing
// POST Request (Create Salary):

// json
// {
//   "name": "George",
//   "date": "17/07/2025",
//   "actualMonthlySalary": 30000,
//   "allowances": 2000,
//   "deductions": 1000,
//   "advanceSalary": 5000,
//   "paidAmount": 20000
// }
// PUT Request (Update Salary):

// json
// {
//   "name": "George",
//   "date": "17/07/2025",
//   "actualMonthlySalary": 32000,
//   "allowances": 2500,
//   "deductions": 1200,
//   "advanceSalary": 6000,
//   "paidAmount": 22000,
//   "status": "Partial"
// }
// GET Response (Sample Output):

// json
// {
//   "success": true,
//   "data": {
//     "_id": 1,
//     "supervisorId": {
//       "_id": 123,
//       "name": "George",
//       "email": "george@example.com",
//       "phone": "9876543210",
//       "supervisorType": "Centering Supervisor"
//     },
//     "month": 7,
//     "monthName": "July",
//     "year": 2025,
//     "date": "17/07/2025",
//     "actualMonthlySalary": 30000,
//     "basicSalary": 28000,
//     "allowances": 2000,
//     "deductions": 1000,
//     "advanceSalary": 5000,
//     "netMonthlySalary": 31000,
//     "paidAmount": 20000,
//     "balanceAmount": 6000,
//     "status": "Partial",
//     "workingDays": 28,
//     "totalDays": 31,
//     "attendanceRecords": [
//       {
//         "date": "01/07/2025",
//         "status": "Fullday",
//         "recordedAt": "2025-07-01T08:00:00.000Z"
//       },
//       {
//         "date": "02/07/2025",
//         "status": "Fullday",
//         "recordedAt": "2025-07-02T08:00:00.000Z"
//       }
//     ],
//     "createdAt": "2025-07-17T10:00:00.000Z",
//     "updatedAt": "2025-07-17T10:00:00.000Z"
//   }
// }
// 4. Report Endpoints
// Daily Report: /api/salaries/reports/daily?date=17/07/2025&format=pdf (or excel or json)

// Weekly Report: /api/salaries/reports/weekly?week=3&month=7&year=2025&format=pdf

// Monthly Report: /api/salaries/reports/monthly?month=7&year=2025&format=excel

// Yearly Report: /api/salaries/reports/yearly?year=2025&format=json