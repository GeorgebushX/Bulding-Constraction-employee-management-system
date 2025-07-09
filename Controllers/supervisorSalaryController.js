

// import SupervisorSalary from "../models/SupervisorSalary.js";
// import AttendanceSupervisor from "../models/AttendanceSupervisor.js";
// import Supervisor from "../models/Supervisor.js";
// import exceljs from 'exceljs';
// import pdfkit from 'pdfkit';

// // Helper function to format currency
// const formatCurrency = (amount) => {
//   return new Intl.NumberFormat('en-US', {
//     style: 'currency',
//     currency: 'USD'
//   }).format(amount);
// };

// // Helper function to format date as DD/MM/YYYY
// const formatDate = (dateString) => {
//   if (!dateString) return 'N/A';
  
//   if (typeof dateString === 'string' && dateString.includes('/')) {
//     // Already in DD/MM/YYYY format
//     return dateString;
//   }
  
//   const date = new Date(dateString);
//   const day = String(date.getDate()).padStart(2, '0');
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const year = date.getFullYear();
//   return `${day}/${month}/${year}`;
// };

// // Helper function to get week number from date
// const getWeekNumber = (date) => {
//   const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
//   const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
//   return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
// };

// // Helper function to get month name
// const getMonthName = (date) => {
//   return date.toLocaleString('default', { month: 'long' });
// };

// // 1. Create Salary Record
// export const createSalary = async (req, res) => {
//   try {
//     const { supervisorId, attendanceId, date, allowances, deductions } = req.body;

//     if (!supervisorId || !attendanceId || !date) {
//       return res.status(400).json({
//         success: false,
//         error: "supervisorId, attendanceId, and date are required fields"
//       });
//     }

//     // Validate date format (DD/MM/YYYY)
//     const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
//     if (!dateRegex.test(date)) {
//       return res.status(400).json({
//         success: false,
//         error: "Date must be in DD/MM/YYYY format"
//       });
//     }

//     // Parse the date
//     const [day, month, year] = date.split('/').map(Number);
//     const jsDate = new Date(year, month - 1, day);
    
//     // Get week number and month name
//     const week = getWeekNumber(jsDate);
//     const monthName = getMonthName(jsDate);

//     // Get the attendance record
//     const attendance = await AttendanceSupervisor.findById(attendanceId);
//     if (!attendance) {
//       return res.status(404).json({
//         success: false,
//         error: "Attendance record not found"
//       });
//     }

//     // Calculate basic salary based on attendance status
//     let dailySalary = 0;
//     switch (attendance.status) {
//       case "Fullday":
//         dailySalary = 1000;
//         break;
//       case "Halfday":
//         dailySalary = 500;
//         break;
//       case "Overtime":
//         dailySalary = 1500;
//         break;
//       default:
//         return res.status(400).json({
//           success: false,
//           error: "Invalid attendance status"
//         });
//     }

//     // Calculate weekly and monthly salary (initially same as daily)
//     const weeklySalary = dailySalary;
//     const monthlySalary = dailySalary;

//     // Calculate net salary
//     const allow = parseFloat(allowances) || 0;
//     const deduct = parseFloat(deductions) || 0;
//     const netSalary = dailySalary + allow - deduct;

//     // Create new salary record
//     const newSalary = await SupervisorSalary.create({
//       supervisorId,
//       attendanceId,
//       date,
//       week,
//       month: monthName,
//       year,
//       basicSalary: dailySalary,
//       allowances: allow,
//       deductions: deduct,
//       netSalary,
//       dailySalary,
//       weeklySalary,
//       monthlySalary,
//       status: "Pending"
//     });

//     // Update weekly and monthly aggregates
//     await updateWeeklySalary(supervisorId, week, monthName, year);
//     await updateMonthlySalary(supervisorId, monthName, year);

//     // Populate supervisor details
//     const populatedSalary = await SupervisorSalary.findById(newSalary._id)
//       .populate('supervisorId', 'name email photo')
//       .populate('attendanceId', 'date status');

//     res.status(201).json({
//       success: true,
//       message: "Salary record created successfully",
//       data: populatedSalary
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // Helper function to update weekly salary aggregates
// const updateWeeklySalary = async (supervisorId, week, month, year) => {
//   const weeklyRecords = await SupervisorSalary.find({
//     supervisorId,
//     week,
//     month,
//     year
//   });

//   if (weeklyRecords.length > 0) {
//     const weeklyTotal = weeklyRecords.reduce((sum, record) => sum + record.dailySalary, 0);
    
//     // Update all records for this week with the weekly total
//     await SupervisorSalary.updateMany(
//       { supervisorId, week, month, year },
//       { $set: { weeklySalary: weeklyTotal } }
//     );
//   }
// };

// // Helper function to update monthly salary aggregates
// const updateMonthlySalary = async (supervisorId, month, year) => {
//   const monthlyRecords = await SupervisorSalary.find({
//     supervisorId,
//     month,
//     year
//   });

//   if (monthlyRecords.length > 0) {
//     const monthlyTotal = monthlyRecords.reduce((sum, record) => sum + record.dailySalary, 0);
    
//     // Update all records for this month with the monthly total
//     await SupervisorSalary.updateMany(
//       { supervisorId, month, year },
//       { $set: { monthlySalary: monthlyTotal } }
//     );
//   }
// };

// // 2. Get All Salaries
// export const getAllSalaries = async (req, res) => {
//   try {
//     const salaries = await SupervisorSalary.find({})
//       .populate('supervisorId', 'name email photo')
//       .populate('attendanceId', 'email date status')
//       .sort({ year: -1, month: -1, week: -1, date: -1 })
//       .lean();

//     const formattedData = salaries.map(salary => ({
//       _id: salary._id,
//       date: salary.date,
//       period: salary.week ? `Week ${salary.week}, ${salary.month} ${salary.year}` : `${salary.month} ${salary.year}`,
//       supervisor: {
//         _id: salary.supervisorId._id,
//         name: salary.supervisorId.name,
//         email: salary.supervisorId.email,
//         photo: salary.supervisorId.photo
//       },
//       attendance: salary.attendanceId ? {
//         date: formatDate(salary.attendanceId.date),
//         status: salary.attendanceId.status
//       } : null,
//       dailySalary: formatCurrency(salary.dailySalary),
//       weeklySalary: formatCurrency(salary.weeklySalary),
//       monthlySalary: formatCurrency(salary.monthlySalary),
//       basicSalary: formatCurrency(salary.basicSalary),
//       allowances: formatCurrency(salary.allowances),
//       deductions: formatCurrency(salary.deductions),
//       netSalary: formatCurrency(salary.netSalary),
//       status: salary.status,
//       createdAt: formatDate(salary.createdAt)
//     }));

//     res.status(200).json({
//       success: true,
//       count: formattedData.length,
//       data: formattedData
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 3. Get Salary by ID
// export const getSalaryById = async (req, res) => {
//   try {
//     const salary = await SupervisorSalary.findById(req.params.id)
//       .populate('supervisorId', 'name email photo')
//       .populate('attendanceId', 'date status');

//     if (!salary) {
//       return res.status(404).json({
//         success: false,
//         error: "Salary record not found"
//       });
//     }

//     const formattedData = {
//       _id: salary._id,
//       date: salary.date,
//       period: salary.week ? `Week ${salary.week}, ${salary.month} ${salary.year}` : `${salary.month} ${salary.year}`,
//       supervisor: {
//         _id: salary.supervisorId._id,
//         name: salary.supervisorId.name,
//         email: salary.supervisorId.email,
//         photo: salary.supervisorId.photo
//       },
//       attendance: salary.attendanceId ? {
//         date: formatDate(salary.attendanceId.date),
//         status: salary.attendanceId.status
//       } : null,
//       dailySalary: formatCurrency(salary.dailySalary),
//       weeklySalary: formatCurrency(salary.weeklySalary),
//       monthlySalary: formatCurrency(salary.monthlySalary),
//       basicSalary: formatCurrency(salary.basicSalary),
//       allowances: formatCurrency(salary.allowances),
//       deductions: formatCurrency(salary.deductions),
//       netSalary: formatCurrency(salary.netSalary),
//       status: salary.status,
//       createdAt: formatDate(salary.createdAt),
//       updatedAt: formatDate(salary.updatedAt)
//     };

//     res.status(200).json({
//       success: true,
//       data: formattedData
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 4. Update Salary
// export const updateSalary = async (req, res) => {
//   try {
//     const { allowances, deductions, status } = req.body;

//     const salary = await SupervisorSalary.findById(req.params.id);
//     if (!salary) {
//       return res.status(404).json({
//         success: false,
//         error: "Salary record not found"
//       });
//     }

//     // Update fields if provided
//     if (allowances !== undefined) salary.allowances = parseFloat(allowances) || 0;
//     if (deductions !== undefined) salary.deductions = parseFloat(deductions) || 0;
//     if (status) salary.status = status;

//     // Recalculate net salary
//     salary.netSalary = salary.dailySalary + salary.allowances - salary.deductions;

//     await salary.save();

//     // Update weekly and monthly aggregates if daily salary changed
//     if (req.body.dailySalary !== undefined) {
//       await updateWeeklySalary(salary.supervisorId, salary.week, salary.month, salary.year);
//       await updateMonthlySalary(salary.supervisorId, salary.month, salary.year);
//     }

//     // Get populated data for response
//     const updatedSalary = await SupervisorSalary.findById(salary._id)
//       .populate('supervisorId', 'name email photo')
//       .populate('attendanceId', 'date status');

//     res.status(200).json({
//       success: true,
//       message: "Salary updated successfully",
//       data: updatedSalary
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 5. Delete Salary
// export const deleteSalaryById = async (req, res) => {
//   try {
//     const salary = await SupervisorSalary.findById(req.params.id);
    
//     if (!salary) {
//       return res.status(404).json({
//         success: false,
//         error: "Salary record not found"
//       });
//     }

//     const { supervisorId, week, month, year } = salary;
    
//     await SupervisorSalary.findByIdAndDelete(req.params.id);

//     // Update weekly and monthly aggregates after deletion
//     await updateWeeklySalary(supervisorId, week, month, year);
//     await updateMonthlySalary(supervisorId, month, year);

//     res.status(200).json({
//       success: true,
//       message: "Salary deleted successfully"
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // Generate PDF Report
// const generateSalaryPDFReport = (data, periodType, periodValue) => {
//   return new Promise((resolve) => {
//     const doc = new pdfkit();
//     const buffers = [];
    
//     doc.on('data', buffers.push.bind(buffers));
//     doc.on('end', () => {
//       const pdfData = Buffer.concat(buffers);
//       resolve(pdfData);
//     });

//     // Report Header
//     doc.fontSize(18).text(`Supervisor Salary ${periodType} Report`, { align: 'center' });
//     doc.moveDown();
//     doc.fontSize(12).text(`Period: ${periodValue}`, { align: 'center' });
//     doc.fontSize(10).text(`Generated on: ${formatDate(new Date().toISOString())}`, { align: 'right' });
//     doc.moveDown(2);

//     // Column Headers
//     doc.font('Helvetica-Bold');
//     doc.text('Supervisor', 50, 150);
//     doc.text('Date', 150, 150);
//     doc.text('Daily Salary', 200, 150);
//     doc.text('Weekly Salary', 280, 150);
//     doc.text('Monthly Salary', 360, 150);
//     doc.text('Allowances', 440, 150);
//     doc.text('Deductions', 520, 150);
//     doc.text('Net Salary', 600, 150);
//     doc.text('Status', 680, 150);
//     doc.font('Helvetica');

//     // Data Rows
//     let y = 170;
//     data.forEach((record) => {
//       doc.text(record.supervisor.name, 50, y);
//       doc.text(record.date || formatDate(record.attendance?.date), 150, y);
//       doc.text(formatCurrency(record.dailySalary || record.basicSalary), 200, y);
//       doc.text(formatCurrency(record.weeklySalary), 280, y);
//       doc.text(formatCurrency(record.monthlySalary), 360, y);
//       doc.text(formatCurrency(record.allowances), 440, y);
//       doc.text(formatCurrency(record.deductions), 520, y);
//       doc.text(formatCurrency(record.netSalary), 600, y);
//       doc.text(record.status, 680, y);
//       y += 20;
//     });

//     // Summary
//     doc.moveDown(2);
//     doc.font('Helvetica-Bold');
//     const totalNet = data.reduce((sum, record) => sum + record.netSalary, 0);
//     doc.text(`Total Net Salaries: ${formatCurrency(totalNet)}`, 520, y + 20);

//     doc.end();
//   });
// };

// // Generate Excel Report
// const generateSalaryExcelReport = (data, periodType, periodValue) => {
//   const workbook = new exceljs.Workbook();
//   const worksheet = workbook.addWorksheet('Salary Report');

//   // Add Report Header
//   worksheet.mergeCells('A1:J1');
//   worksheet.getCell('A1').value = `Supervisor Salary ${periodType} Report`;
//   worksheet.getCell('A1').font = { size: 16, bold: true };
//   worksheet.getCell('A1').alignment = { horizontal: 'center' };

//   worksheet.mergeCells('A2:J2');
//   worksheet.getCell('A2').value = `Period: ${periodValue}`;
//   worksheet.getCell('A2').alignment = { horizontal: 'center' };

//   worksheet.mergeCells('A3:J3');
//   worksheet.getCell('A3').value = `Generated on: ${formatDate(new Date().toISOString())}`;
//   worksheet.getCell('A3').alignment = { horizontal: 'right' };

//   // Add Column Headers
//   worksheet.addRow([]); // Empty row
//   worksheet.addRow([
//     'Supervisor ID', 
//     'Supervisor Name', 
//     'Date',
//     'Daily Salary', 
//     'Weekly Salary', 
//     'Monthly Salary',
//     'Allowances', 
//     'Deductions', 
//     'Net Salary', 
//     'Status'
//   ]);
//   worksheet.lastRow.eachCell((cell) => {
//     cell.font = { bold: true };
//     cell.fill = {
//       type: 'pattern',
//       pattern: 'solid',
//       fgColor: { argb: 'FFD3D3D3' }
//     };
//   });

//   // Add Data Rows
//   data.forEach(record => {
//     worksheet.addRow([
//       record.supervisor._id,
//       record.supervisor.name,
//       record.date || formatDate(record.attendance?.date),
//       record.dailySalary || record.basicSalary,
//       record.weeklySalary,
//       record.monthlySalary,
//       record.allowances,
//       record.deductions,
//       record.netSalary,
//       record.status
//     ]);
//   });

//   // Add Summary
//   const lastRow = worksheet.lastRow.number;
//   worksheet.addRow([]);
//   worksheet.addRow([
//     '', '', '', '', '', '', '', 
//     'Total:', 
//     { formula: `SUM(I6:I${lastRow})`, result: data.reduce((sum, r) => sum + r.netSalary, 0) }
//   ]);
//   worksheet.lastRow.getCell(9).font = { bold: true };

//   // Format columns
//   worksheet.columns = [
//     { key: 'id', width: 15 },
//     { key: 'name', width: 25 },
//     { key: 'date', width: 15 },
//     { key: 'daily', width: 15, style: { numFmt: '"$"#,##0.00' } },
//     { key: 'weekly', width: 15, style: { numFmt: '"$"#,##0.00' } },
//     { key: 'monthly', width: 15, style: { numFmt: '"$"#,##0.00' } },
//     { key: 'allowances', width: 15, style: { numFmt: '"$"#,##0.00' } },
//     { key: 'deductions', width: 15, style: { numFmt: '"$"#,##0.00' } },
//     { key: 'net', width: 15, style: { numFmt: '"$"#,##0.00' } },
//     { key: 'status', width: 15 }
//   ];

//   return workbook;
// };

// // 6. Daily Salary Report
// export const getDailySalaryReport = async (req, res) => {
//   try {
//     const { date, format = 'json' } = req.query;
    
//     if (!date) {
//       return res.status(400).json({
//         success: false,
//         error: "Date parameter is required for daily report (DD/MM/YYYY format)"
//       });
//     }

//     // Validate date format
//     const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
//     if (!dateRegex.test(date)) {
//       return res.status(400).json({
//         success: false,
//         error: "Date must be in DD/MM/YYYY format"
//       });
//     }

//     const salaries = await SupervisorSalary.find({ date })
//       .populate('supervisorId', 'name email photo _id')
//       .populate('attendanceId', 'date status')
//       .sort({ 'supervisorId.name': 1 });

//     if (salaries.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "No salary records found for the specified date"
//       });
//     }

//     if (format === 'pdf') {
//       const pdfBuffer = await generateSalaryPDFReport(salaries, 'Daily', date);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_daily_report_${date.replace(/\//g, '-')}.pdf`);
//       return res.send(pdfBuffer);
//     } else if (format === 'excel') {
//       const workbook = generateSalaryExcelReport(salaries, 'Daily', date);
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_daily_report_${date.replace(/\//g, '-')}.xlsx`);
//       await workbook.xlsx.write(res);
//       return res.end();
//     } else {
//       const formattedData = salaries.map(salary => ({
//         _id: salary._id,
//         date: salary.date,
//         supervisor: {
//           _id: salary.supervisorId._id,
//           name: salary.supervisorId.name,
//           email: salary.supervisorId.email,
//           photo: salary.supervisorId.photo
//         },
//         attendance: salary.attendanceId ? {
//           date: formatDate(salary.attendanceId.date),
//           status: salary.attendanceId.status
//         } : null,
//         dailySalary: salary.dailySalary,
//         weeklySalary: salary.weeklySalary,
//         monthlySalary: salary.monthlySalary,
//         basicSalary: salary.basicSalary,
//         allowances: salary.allowances,
//         deductions: salary.deductions,
//         netSalary: salary.netSalary,
//         status: salary.status
//       }));

//       return res.status(200).json({
//         success: true,
//         period: 'daily',
//         date,
//         count: formattedData.length,
//         data: formattedData
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 7. Weekly Salary Report
// export const getWeeklySalaryReport = async (req, res) => {
//   try {
//     const { week, month, year, format = 'json' } = req.query;
    
//     if (!week || !month || !year) {
//       return res.status(400).json({
//         success: false,
//         error: "Week, month, and year parameters are required for weekly report"
//       });
//     }

//     const salaries = await SupervisorSalary.find({ week, month, year })
//       .populate('supervisorId', 'name email photo _id')
//       .populate('attendanceId', 'date status')
//       .sort({ 'supervisorId.name': 1 });

//     if (salaries.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "No salary records found for the specified week"
//       });
//     }

//     const periodValue = `Week ${week}, ${month} ${year}`;

//     if (format === 'pdf') {
//       const pdfBuffer = await generateSalaryPDFReport(salaries, 'Weekly', periodValue);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_weekly_report_${week}_${month}_${year}.pdf`);
//       return res.send(pdfBuffer);
//     } else if (format === 'excel') {
//       const workbook = generateSalaryExcelReport(salaries, 'Weekly', periodValue);
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_weekly_report_${week}_${month}_${year}.xlsx`);
//       await workbook.xlsx.write(res);
//       return res.end();
//     } else {
//       const formattedData = salaries.map(salary => ({
//         _id: salary._id,
//         date: salary.date,
//         period: periodValue,
//         supervisor: {
//           _id: salary.supervisorId._id,
//           name: salary.supervisorId.name,
//           email: salary.supervisorId.email,
//           photo: salary.supervisorId.photo
//         },
//         attendance: salary.attendanceId ? {
//           date: formatDate(salary.attendanceId.date),
//           status: salary.attendanceId.status
//         } : null,
//         dailySalary: salary.dailySalary,
//         weeklySalary: salary.weeklySalary,
//         monthlySalary: salary.monthlySalary,
//         basicSalary: salary.basicSalary,
//         allowances: salary.allowances,
//         deductions: salary.deductions,
//         netSalary: salary.netSalary,
//         status: salary.status
//       }));

//       return res.status(200).json({
//         success: true,
//         period: 'weekly',
//         week,
//         month,
//         year,
//         count: formattedData.length,
//         data: formattedData
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 8. Monthly Salary Report
// export const getMonthlySalaryReport = async (req, res) => {
//   try {
//     const { month, year, format = 'json' } = req.query;
    
//     if (!month || !year) {
//       return res.status(400).json({
//         success: false,
//         error: "Month and year parameters are required for monthly report"
//       });
//     }

//     const salaries = await SupervisorSalary.find({ month, year })
//       .populate('supervisorId', 'name email photo _id')
//       .populate('attendanceId', 'date status')
//       .sort({ 'supervisorId.name': 1 });

//     if (salaries.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "No salary records found for the specified month"
//       });
//     }

//     const periodValue = `${month} ${year}`;

//     if (format === 'pdf') {
//       const pdfBuffer = await generateSalaryPDFReport(salaries, 'Monthly', periodValue);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_monthly_report_${month}_${year}.pdf`);
//       return res.send(pdfBuffer);
//     } else if (format === 'excel') {
//       const workbook = generateSalaryExcelReport(salaries, 'Monthly', periodValue);
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_monthly_report_${month}_${year}.xlsx`);
//       await workbook.xlsx.write(res);
//       return res.end();
//     } else {
//       const formattedData = salaries.map(salary => ({
//         _id: salary._id,
//         date: salary.date,
//         period: periodValue,
//         supervisor: {
//           _id: salary.supervisorId._id,
//           name: salary.supervisorId.name,
//           email: salary.supervisorId.email,
//           photo: salary.supervisorId.photo
//         },
//         attendance: salary.attendanceId ? {
//           date: formatDate(salary.attendanceId.date),
//           status: salary.attendanceId.status
//         } : null,
//         dailySalary: salary.dailySalary,
//         weeklySalary: salary.weeklySalary,
//         monthlySalary: salary.monthlySalary,
//         basicSalary: salary.basicSalary,
//         allowances: salary.allowances,
//         deductions: salary.deductions,
//         netSalary: salary.netSalary,
//         status: salary.status
//       }));

//       return res.status(200).json({
//         success: true,
//         period: 'monthly',
//         month,
//         year,
//         count: formattedData.length,
//         data: formattedData
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 9. Supervisor-specific Salary Report
// export const getSupervisorSalaryReport = async (req, res) => {
//   try {
//     const { supervisorId, format = 'json' } = req.query;
    
//     if (!supervisorId) {
//       return res.status(400).json({
//         success: false,
//         error: "Supervisor ID parameter is required"
//       });
//     }

//     const salaries = await SupervisorSalary.find({ supervisorId })
//       .populate('supervisorId', 'name email photo _id')
//       .populate('attendanceId', 'date status')
//       .sort({ year: -1, month: -1, week: -1, date: -1 });

//     if (salaries.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "No salary records found for the specified supervisor"
//       });
//     }

//     const supervisorName = salaries[0].supervisorId.name;

//     if (format === 'pdf') {
//       const pdfBuffer = await generateSalaryPDFReport(salaries, 'Supervisor', supervisorName);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_report_${supervisorName.replace(/\s+/g, '_')}.pdf`);
//       return res.send(pdfBuffer);
//     } else if (format === 'excel') {
//       const workbook = generateSalaryExcelReport(salaries, 'Supervisor', supervisorName);
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_report_${supervisorName.replace(/\s+/g, '_')}.xlsx`);
//       await workbook.xlsx.write(res);
//       return res.end();
//     } else {
//       const formattedData = salaries.map(salary => ({
//         _id: salary._id,
//         date: salary.date,
//         period: salary.week ? `Week ${salary.week}, ${salary.month} ${salary.year}` : `${salary.month} ${salary.year}`,
//         supervisor: {
//           _id: salary.supervisorId._id,
//           name: salary.supervisorId.name,
//           email: salary.supervisorId.email,
//           photo: salary.supervisorId.photo
//         },
//         attendance: salary.attendanceId ? {
//           date: formatDate(salary.attendanceId.date),
//           status: salary.attendanceId.status
//         } : null,
//         dailySalary: salary.dailySalary,
//         weeklySalary: salary.weeklySalary,
//         monthlySalary: salary.monthlySalary,
//         basicSalary: salary.basicSalary,
//         allowances: salary.allowances,
//         deductions: salary.deductions,
//         netSalary: salary.netSalary,
//         status: salary.status,
//         createdAt: formatDate(salary.createdAt)
//       }));

//       return res.status(200).json({
//         success: true,
//         period: 'supervisor',
//         supervisorId,
//         count: formattedData.length,
//         data: formattedData
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };


import SupervisorSalary from "../models/SupervisorSalary.js";
import AttendanceSupervisor from "../models/AttendanceSupervisor.js";
import Supervisor from "../models/Supervisor.js";
import exceljs from 'exceljs';
import pdfkit from 'pdfkit';

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  if (typeof dateString === 'string' && dateString.includes('/')) {
    return dateString;
  }
  
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getWeekNumber = (date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
};

// Salary Calculation Rates (can be configured)
const SALARY_RATES = {
  Fullday: 1000,
  Halfday: 500,
  Overtime: 1500
};

// 1. Create Salary Record
export const createSalary = async (req, res) => {
  try {
    const { supervisorId, attendanceId, date, allowances = 0, deductions = 0 } = req.body;

    // Validate required fields
    if (!supervisorId || !attendanceId || !date) {
      return res.status(400).json({
        success: false,
        error: "supervisorId, attendanceId, and date are required fields"
      });
    }

    // Validate date format (DD/MM/YYYY)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: "Date must be in DD/MM/YYYY format"
      });
    }

    // Parse the date
    const [day, month, year] = date.split('/').map(Number);
    const jsDate = new Date(year, month - 1, day);
    
    // Get week number and month name
    const week = getWeekNumber(jsDate);
    const monthName = getMonthName(month);

    // Get the attendance record
    const attendance = await AttendanceSupervisor.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: "Attendance record not found"
      });
    }

    // Calculate basic salary based on attendance status
    const basicSalary = SALARY_RATES[attendance.status];
    if (!basicSalary) {
      return res.status(400).json({
        success: false,
        error: "Invalid attendance status"
      });
    }

    // Calculate net daily salary
    const netDailySalary = basicSalary + parseFloat(allowances) - parseFloat(deductions);

    // Create new salary record (weekly and monthly will be updated later)
    const newSalary = await SupervisorSalary.create({
      supervisorId,
      attendanceId,
      date,
      week,
      month,
      monthName,
      year,
      basicSalary,
      allowances: parseFloat(allowances) || 0,
      deductions: parseFloat(deductions) || 0,
      netDailySalary,
      netWeeklySalary: netDailySalary, // Initial value, will be updated
      netMonthlySalary: netDailySalary, // Initial value, will be updated
      status: "Pending"
    });

    // Update weekly and monthly aggregates
    await updateWeeklySalary(supervisorId, week, month, year);
    await updateMonthlySalary(supervisorId, month, year);

    // Populate supervisor details for response
    const populatedSalary = await SupervisorSalary.findById(newSalary._id)
      .populate('supervisorId', 'name email photo')
      .populate('attendanceId', 'date status');

    res.status(201).json({
      success: true,
      message: "Salary record created successfully",
      data: populatedSalary
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Helper function to update weekly salary aggregates
const updateWeeklySalary = async (supervisorId, week, month, year) => {
  const weeklyRecords = await SupervisorSalary.find({
    supervisorId,
    week,
    month,
    year
  });

  if (weeklyRecords.length > 0) {
    const weeklyTotal = weeklyRecords.reduce((sum, record) => sum + record.netDailySalary, 0);
    
    // Update all records for this week with the weekly total
    await SupervisorSalary.updateMany(
      { supervisorId, week, month, year },
      { $set: { netWeeklySalary: weeklyTotal } }
    );
  }
};

// Helper function to update monthly salary aggregates
const updateMonthlySalary = async (supervisorId, month, year) => {
  const monthlyRecords = await SupervisorSalary.find({
    supervisorId,
    month,
    year
  });

  if (monthlyRecords.length > 0) {
    const monthlyTotal = monthlyRecords.reduce((sum, record) => sum + record.netDailySalary, 0);
    
    // Update all records for this month with the monthly total
    await SupervisorSalary.updateMany(
      { supervisorId, month, year },
      { $set: { netMonthlySalary: monthlyTotal } }
    );
  }
};

// 2. Get All Salaries
export const getAllSalaries = async (req, res) => {
  try {
    const salaries = await SupervisorSalary.find({})
      .populate('supervisorId', 'name email photo')
      .populate('attendanceId', 'date status')
      .sort({ year: -1, month: -1, week: -1, date: -1 });

    const formattedData = salaries.map(salary => ({
      id: salary._id,
      date: salary.date,
      period: `Week ${salary.week}, ${salary.monthName} ${salary.year}`,
      supervisor: salary.supervisorId,
      attendance: salary.attendanceId,
      basicSalary: salary.basicSalary,
      allowances: salary.allowances,
      deductions: salary.deductions,
      netDailySalary: salary.netDailySalary,
      netWeeklySalary: salary.netWeeklySalary,
      netMonthlySalary: salary.netMonthlySalary,
      status: salary.status,
      paymentDate: salary.paymentDate ? formatDate(salary.paymentDate) : null,
      createdAt: formatDate(salary.createdAt)
    }));

    res.status(200).json({
      success: true,
      count: formattedData.length,
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 3. Get Salary by ID
export const getSalaryById = async (req, res) => {
  try {
    const salary = await SupervisorSalary.findById(req.params.id)
      .populate('supervisorId', 'name email photo')
      .populate('attendanceId', 'date status');

    if (!salary) {
      return res.status(404).json({
        success: false,
        error: "Salary record not found"
      });
    }

    const formattedData = {
      id: salary._id,
      date: salary.date,
      period: `Week ${salary.week}, ${salary.monthName} ${salary.year}`,
      supervisor: salary.supervisorId,
      attendance: salary.attendanceId,
      basicSalary: salary.basicSalary,
      allowances: salary.allowances,
      deductions: salary.deductions,
      netDailySalary: salary.netDailySalary,
      netWeeklySalary: salary.netWeeklySalary,
      netMonthlySalary: salary.netMonthlySalary,
      status: salary.status,
      paymentDate: salary.paymentDate ? formatDate(salary.paymentDate) : null,
      createdAt: formatDate(salary.createdAt),
      updatedAt: formatDate(salary.updatedAt)
    };

    res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 4. Update Salary
export const updateSalary = async (req, res) => {
  try {
    const { allowances, deductions, status } = req.body;

    const salary = await SupervisorSalary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({
        success: false,
        error: "Salary record not found"
      });
    }

    // Update fields if provided
    if (allowances !== undefined) salary.allowances = parseFloat(allowances) || 0;
    if (deductions !== undefined) salary.deductions = parseFloat(deductions) || 0;
    if (status) {
      salary.status = status;
      if (status === "Paid") {
        salary.paymentDate = new Date();
      }
    }

    // Recalculate net daily salary
    salary.netDailySalary = salary.basicSalary + salary.allowances - salary.deductions;

    await salary.save();

    // Update weekly and monthly aggregates
    await updateWeeklySalary(salary.supervisorId, salary.week, salary.month, salary.year);
    await updateMonthlySalary(salary.supervisorId, salary.month, salary.year);

    // Get populated data for response
    const updatedSalary = await SupervisorSalary.findById(salary._id)
      .populate('supervisorId', 'name email photo')
      .populate('attendanceId', 'date status');

    res.status(200).json({
      success: true,
      message: "Salary updated successfully",
      data: updatedSalary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 5. Delete Salary
export const deleteSalaryById = async (req, res) => {
  try {
    const salary = await SupervisorSalary.findById(req.params.id);
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        error: "Salary record not found"
      });
    }

    const { supervisorId, week, month, year } = salary;
    
    await SupervisorSalary.findByIdAndDelete(req.params.id);

    // Update weekly and monthly aggregates after deletion
    await updateWeeklySalary(supervisorId, week, month, year);
    await updateMonthlySalary(supervisorId, month, year);

    res.status(200).json({
      success: true,
      message: "Salary deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Report Generation Functions
const generatePDFReport = (data, title, period) => {
  return new Promise((resolve) => {
    const doc = new pdfkit();
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Report Header
    doc.fontSize(18).text(`Supervisor Salary Report - ${title}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${period}`, { align: 'center' });
    doc.fontSize(10).text(`Generated on: ${formatDate(new Date().toISOString())}`, { align: 'right' });
    doc.moveDown(2);

    // Column Headers
    const headers = [
      { text: 'Supervisor', x: 50, width: 100 },
      { text: 'Date', x: 160, width: 80 },
      { text: 'Basic', x: 250, width: 60 },
      { text: 'Allowances', x: 320, width: 80 },
      { text: 'Deductions', x: 410, width: 80 },
      { text: 'Daily Net', x: 500, width: 80 },
      { text: 'Weekly Net', x: 590, width: 80 },
      { text: 'Monthly Net', x: 680, width: 80 }
    ];

    doc.font('Helvetica-Bold');
    headers.forEach(header => {
      doc.text(header.text, header.x, 150, { width: header.width });
    });
    doc.font('Helvetica');

    // Data Rows
    let y = 170;
    data.forEach(record => {
      doc.text(record.supervisor.name, 50, y, { width: 100 });
      doc.text(record.date, 160, y, { width: 80 });
      doc.text(formatCurrency(record.basicSalary), 250, y, { width: 60 });
      doc.text(formatCurrency(record.allowances), 320, y, { width: 80 });
      doc.text(formatCurrency(record.deductions), 410, y, { width: 80 });
      doc.text(formatCurrency(record.netDailySalary), 500, y, { width: 80 });
      doc.text(formatCurrency(record.netWeeklySalary), 590, y, { width: 80 });
      doc.text(formatCurrency(record.netMonthlySalary), 680, y, { width: 80 });
      y += 20;
    });

    // Summary
    doc.moveDown(2);
    doc.font('Helvetica-Bold');
    const totalDaily = data.reduce((sum, record) => sum + record.netDailySalary, 0);
    const totalWeekly = data.reduce((sum, record) => sum + record.netWeeklySalary, 0);
    const totalMonthly = data.reduce((sum, record) => sum + record.netMonthlySalary, 0);
    
    doc.text(`Total Daily: ${formatCurrency(totalDaily)}`, 500, y + 20);
    doc.text(`Total Weekly: ${formatCurrency(totalWeekly)}`, 590, y + 20);
    doc.text(`Total Monthly: ${formatCurrency(totalMonthly)}`, 680, y + 20);

    doc.end();
  });
};

const generateExcelReport = (data, title, period) => {
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('Salary Report');

  // Add Report Header
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = `Supervisor Salary Report - ${title}`;
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:H2');
  worksheet.getCell('A2').value = `Period: ${period}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A3:H3');
  worksheet.getCell('A3').value = `Generated on: ${formatDate(new Date().toISOString())}`;
  worksheet.getCell('A3').alignment = { horizontal: 'right' };

  // Add Column Headers
  worksheet.addRow([]);
  const headerRow = worksheet.addRow([
    'Supervisor', 'Date', 'Basic Salary', 'Allowances', 'Deductions', 
    'Daily Net', 'Weekly Net', 'Monthly Net'
  ]);
  headerRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
  });

  // Add Data Rows
  data.forEach(record => {
    worksheet.addRow([
      record.supervisor.name,
      record.date,
      record.basicSalary,
      record.allowances,
      record.deductions,
      record.netDailySalary,
      record.netWeeklySalary,
      record.netMonthlySalary
    ]);
  });

  // Add Summary
  const lastRow = worksheet.lastRow.number;
  worksheet.addRow([]);
  const totalRow = worksheet.addRow([
    '', '', '', '', 'Total:',
    { formula: `SUM(F5:F${lastRow})` },
    { formula: `SUM(G5:G${lastRow})` },
    { formula: `SUM(H5:H${lastRow})` }
  ]);
  totalRow.eachCell(cell => {
    if (cell.value) cell.font = { bold: true };
  });

  // Format columns
  worksheet.columns = [
    { key: 'name', width: 25 },
    { key: 'date', width: 15 },
    { key: 'basic', width: 15, style: { numFmt: '"$"#,##0.00' } },
    { key: 'allowances', width: 15, style: { numFmt: '"$"#,##0.00' } },
    { key: 'deductions', width: 15, style: { numFmt: '"$"#,##0.00' } },
    { key: 'daily', width: 15, style: { numFmt: '"$"#,##0.00' } },
    { key: 'weekly', width: 15, style: { numFmt: '"$"#,##0.00' } },
    { key: 'monthly', width: 15, style: { numFmt: '"$"#,##0.00' } }
  ];

  return workbook;
};

// 6. Daily Salary Report
export const getDailySalaryReport = async (req, res) => {
  try {
    const { date, format = 'json' } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Date parameter is required (DD/MM/YYYY format)"
      });
    }

    // Validate date format
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: "Date must be in DD/MM/YYYY format"
      });
    }

    const salaries = await SupervisorSalary.find({ date })
      .populate('supervisorId', 'name email photo')
      .populate('attendanceId', 'date status')
      .sort({ 'supervisorId.name': 1 });

    if (salaries.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No salary records found for the specified date"
      });
    }

    const reportData = salaries.map(salary => ({
      supervisor: salary.supervisorId,
      date: salary.date,
      basicSalary: salary.basicSalary,
      allowances: salary.allowances,
      deductions: salary.deductions,
      netDailySalary: salary.netDailySalary,
      netWeeklySalary: salary.netWeeklySalary,
      netMonthlySalary: salary.netMonthlySalary,
      status: salary.status
    }));

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(reportData, 'Daily', date);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=daily_salary_report_${date.replace(/\//g, '-')}.pdf`);
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const workbook = generateExcelReport(reportData, 'Daily', date);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=daily_salary_report_${date.replace(/\//g, '-')}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      res.status(200).json({
        success: true,
        period: 'daily',
        date,
        count: reportData.length,
        data: reportData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 7. Weekly Salary Report
export const getWeeklySalaryReport = async (req, res) => {
  try {
    const { week, month, year, format = 'json' } = req.query;
    
    if (!week || !month || !year) {
      return res.status(400).json({
        success: false,
        error: "Week, month, and year parameters are required"
      });
    }

    const salaries = await SupervisorSalary.find({ 
      week: parseInt(week), 
      month: parseInt(month), 
      year: parseInt(year) 
    })
      .populate('supervisorId', 'name email photo')
      .sort({ 'supervisorId.name': 1 });

    if (salaries.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No salary records found for the specified week"
      });
    }

    const monthName = getMonthName(parseInt(month));
    const period = `Week ${week}, ${monthName} ${year}`;
    
    const reportData = salaries.map(salary => ({
      supervisor: salary.supervisorId,
      date: salary.date,
      basicSalary: salary.basicSalary,
      allowances: salary.allowances,
      deductions: salary.deductions,
      netDailySalary: salary.netDailySalary,
      netWeeklySalary: salary.netWeeklySalary,
      netMonthlySalary: salary.netMonthlySalary,
      status: salary.status
    }));

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(reportData, 'Weekly', period);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=weekly_salary_report_week${week}_${month}_${year}.pdf`);
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const workbook = generateExcelReport(reportData, 'Weekly', period);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=weekly_salary_report_week${week}_${month}_${year}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      res.status(200).json({
        success: true,
        period: 'weekly',
        week,
        month,
        year,
        count: reportData.length,
        data: reportData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 8. Monthly Salary Report
export const getMonthlySalaryReport = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: "Month and year parameters are required"
      });
    }

    const salaries = await SupervisorSalary.find({ 
      month: parseInt(month), 
      year: parseInt(year) 
    })
      .populate('supervisorId', 'name email photo')
      .sort({ 'supervisorId.name': 1 });

    if (salaries.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No salary records found for the specified month"
      });
    }

    const monthName = getMonthName(parseInt(month));
    const period = `${monthName} ${year}`;
    
    const reportData = salaries.map(salary => ({
      supervisor: salary.supervisorId,
      date: salary.date,
      basicSalary: salary.basicSalary,
      allowances: salary.allowances,
      deductions: salary.deductions,
      netDailySalary: salary.netDailySalary,
      netWeeklySalary: salary.netWeeklySalary,
      netMonthlySalary: salary.netMonthlySalary,
      status: salary.status
    }));

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(reportData, 'Monthly', period);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=monthly_salary_report_${month}_${year}.pdf`);
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const workbook = generateExcelReport(reportData, 'Monthly', period);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=monthly_salary_report_${month}_${year}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      res.status(200).json({
        success: true,
        period: 'monthly',
        month,
        year,
        count: reportData.length,
        data: reportData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 9. Yearly Salary Report
export const getYearlySalaryReport = async (req, res) => {
  try {
    const { year, format = 'json' } = req.query;
    
    if (!year) {
      return res.status(400).json({
        success: false,
        error: "Year parameter is required"
      });
    }

    const salaries = await SupervisorSalary.find({ year: parseInt(year) })
      .populate('supervisorId', 'name email photo')
      .sort({ month: 1, week: 1, 'supervisorId.name': 1 });

    if (salaries.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No salary records found for the specified year"
      });
    }

    const period = `Year ${year}`;
    
    const reportData = salaries.map(salary => ({
      supervisor: salary.supervisorId,
      date: salary.date,
      basicSalary: salary.basicSalary,
      allowances: salary.allowances,
      deductions: salary.deductions,
      netDailySalary: salary.netDailySalary,
      netWeeklySalary: salary.netWeeklySalary,
      netMonthlySalary: salary.netMonthlySalary,
      status: salary.status
    }));

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(reportData, 'Yearly', period);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=yearly_salary_report_${year}.pdf`);
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const workbook = generateExcelReport(reportData, 'Yearly', period);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=yearly_salary_report_${year}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      res.status(200).json({
        success: true,
        period: 'yearly',
        year,
        count: reportData.length,
        data: reportData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};




// import SupervisorSalary from "../models/SupervisorSalary.js";
// import AttendanceSupervisor from "../models/AttendanceSupervisor.js";
// import Supervisor from "../models/Supervisor.js";
// import exceljs from 'exceljs';
// import pdfkit from 'pdfkit';

// // Helper function to format currency
// const formatCurrency = (amount) => {
//   return new Intl.NumberFormat('en-US', {
//     style: 'currency',
//     currency: 'USD'
//   }).format(amount);
// };

// // Helper function to format date
// const formatDate = (dateString) => {
//   if (!dateString) return 'N/A';
//   const date = new Date(dateString);
//   return date.toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric'
//   });
// };

// // 1. Create Salary Record
// export const createSalary = async (req, res) => {
//   try {
//     const { supervisorId, attendanceId, week, month, year, allowances, deductions } = req.body;

//     if (!attendanceId ||!month || !year) {
//       return res.status(400).json({
//         success: false,
//         error: "month, and year are required fields"
//       });
//     }

//     // Get the attendance record
//     const attendance = await AttendanceSupervisor.findById(attendanceId);
//     if (!attendance) {
//       return res.status(404).json({
//         success: false,
//         error: "Attendance record not found"
//       });
//     }

//     // Calculate basic salary based on attendance status
//     let basicSalary = 0;
//     switch (attendance.status) {
//       case "Fullday":
//         basicSalary = 1000;
//         break;
//       case "Halfday":
//         basicSalary = 500;
//         break;
//       case "Overtime":
//         basicSalary = 1500;
//         break;
//       default:
//         return res.status(400).json({
//           success: false,
//           error: "Invalid attendance status"
//         });
//     }

//     // Calculate net salary
//     const allow = parseFloat(allowances) || 0;
//     const deduct = parseFloat(deductions) || 0;
//     const netSalary = basicSalary + allow - deduct;

//     // Create new salary record
//     const newSalary = await SupervisorSalary.create({
//       supervisorId,
//       attendanceId,
//       week,
//       month,
//       year,
//       basicSalary,
//       allowances: allow,
//       deductions: deduct,
//       netSalary,
//       status: "Pending"
//     });

//     // Populate supervisor details
//     const populatedSalary = await SupervisorSalary.findById(newSalary._id)
//       .populate('supervisorId', 'name email photo')
//       .populate('attendanceId', 'date status');

//     res.status(201).json({
//       success: true,
//       message: "Salary record created successfully",
//       data: populatedSalary
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 2. Get All Salaries
// export const getAllSalaries = async (req, res) => {
//   try {
//     const salaries = await SupervisorSalary.find({})
//       .populate('supervisorId', 'name email photo')
//       .populate('attendanceId', 'email date status')
//       .sort({ year: -1, month: -1, week: -1 })
//       .lean();

//     const formattedData = salaries.map(salary => ({
//       _id: salary._id,
//       period: salary.week ? `Week ${salary.week}, ${salary.month} ${salary.year}` : `${salary.month} ${salary.year}`,
//       supervisor: {
//         _id: salary.supervisorId._id,
//         name: salary.supervisorId.name,
//         email: salary.supervisorId.email,
//         photo: salary.supervisorId.photo
//       },
//       attendance: salary.attendanceId ? {
//         date: formatDate(salary.attendanceId.date),
//         status: salary.attendanceId.status
//       } : null,
//       basicSalary: formatCurrency(salary.basicSalary),
//       allowances: formatCurrency(salary.allowances),
//       deductions: formatCurrency(salary.deductions),
//       netSalary: formatCurrency(salary.netSalary),
//       status: salary.status,
//       createdAt: formatDate(salary.createdAt)
//     }));

//     res.status(200).json({
//       success: true,
//       count: formattedData.length,
//       data: formattedData
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 3. Get Salary by ID
// export const getSalaryById = async (req, res) => {
//   try {
//     const salary = await SupervisorSalary.findById(req.params.id)
//       .populate('supervisorId', 'name email photo')
//       .populate('attendanceId', 'date status');

//     if (!salary) {
//       return res.status(404).json({
//         success: false,
//         error: "Salary record not found"
//       });
//     }

//     const formattedData = {
//       _id: salary._id,
//       period: salary.week ? `Week ${salary.week}, ${salary.month} ${salary.year}` : `${salary.month} ${salary.year}`,
//       supervisor: {
//         _id: salary.supervisorId._id,
//         name: salary.supervisorId.name,
//         email: salary.supervisorId.email,
//         photo: salary.supervisorId.photo
//       },
//       attendance: salary.attendanceId ? {
//         date: formatDate(salary.attendanceId.date),
//         status: salary.attendanceId.status
//       } : null,
//       basicSalary: formatCurrency(salary.basicSalary),
//       allowances: formatCurrency(salary.allowances),
//       deductions: formatCurrency(salary.deductions),
//       netSalary: formatCurrency(salary.netSalary),
//       status: salary.status,
//       createdAt: formatDate(salary.createdAt),
//       updatedAt: formatDate(salary.updatedAt)
//     };

//     res.status(200).json({
//       success: true,
//       data: formattedData
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 4. Update Salary
// export const updateSalary = async (req, res) => {
//   try {
//     const { allowances, deductions, status } = req.body;

//     const salary = await SupervisorSalary.findById(req.params.id);
//     if (!salary) {
//       return res.status(404).json({
//         success: false,
//         error: "Salary record not found"
//       });
//     }

//     // Update fields if provided
//     if (allowances !== undefined) salary.allowances = parseFloat(allowances) || 0;
//     if (deductions !== undefined) salary.deductions = parseFloat(deductions) || 0;
//     if (status) salary.status = status;

//     // Recalculate net salary
//     salary.netSalary = salary.basicSalary + salary.allowances - salary.deductions;

//     await salary.save();

//     // Get populated data for response
//     const updatedSalary = await SupervisorSalary.findById(salary._id)
//       .populate('supervisorId', 'name email photo')
//       .populate('attendanceId', 'date status');

//     res.status(200).json({
//       success: true,
//       message: "Salary updated successfully",
//       data: updatedSalary
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 5. Delete Salary
// export const deleteSalaryById = async (req, res) => {
//   try {
//     const salary = await SupervisorSalary.findByIdAndDelete(req.params.id);
    
//     if (!salary) {
//       return res.status(404).json({
//         success: false,
//         error: "Salary record not found"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Salary deleted successfully"
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // Generate PDF Report
// const generateSalaryPDFReport = (data, periodType, periodValue) => {
//   return new Promise((resolve) => {
//     const doc = new pdfkit();
//     const buffers = [];
    
//     doc.on('data', buffers.push.bind(buffers));
//     doc.on('end', () => {
//       const pdfData = Buffer.concat(buffers);
//       resolve(pdfData);
//     });

//     // Report Header
//     doc.fontSize(18).text(`Supervisor Salary ${periodType} Report`, { align: 'center' });
//     doc.moveDown();
//     doc.fontSize(12).text(`Period: ${periodValue}`, { align: 'center' });
//     doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
//     doc.moveDown(2);

//     // Column Headers
//     doc.font('Helvetica-Bold');
//     doc.text('Supervisor', 50, 150);
//     doc.text('Basic Salary', 200, 150);
//     doc.text('Allowances', 280, 150);
//     doc.text('Deductions', 360, 150);
//     doc.text('Net Salary', 440, 150);
//     doc.text('Status', 520, 150);
//     doc.font('Helvetica');

//     // Data Rows
//     let y = 170;
//     data.forEach((record) => {
//       doc.text(record.supervisor.name, 50, y);
//       doc.text(formatCurrency(record.basicSalary), 200, y);
//       doc.text(formatCurrency(record.allowances), 280, y);
//       doc.text(formatCurrency(record.deductions), 360, y);
//       doc.text(formatCurrency(record.netSalary), 440, y);
//       doc.text(record.status, 520, y);
//       y += 20;
//     });

//     // Summary
//     doc.moveDown(2);
//     doc.font('Helvetica-Bold');
//     const totalNet = data.reduce((sum, record) => sum + record.netSalary, 0);
//     doc.text(`Total Net Salaries: ${formatCurrency(totalNet)}`, 400, y + 20);

//     doc.end();
//   });
// };

// // Generate Excel Report
// const generateSalaryExcelReport = (data, periodType, periodValue) => {
//   const workbook = new exceljs.Workbook();
//   const worksheet = workbook.addWorksheet('Salary Report');

//   // Add Report Header
//   worksheet.mergeCells('A1:F1');
//   worksheet.getCell('A1').value = `Supervisor Salary ${periodType} Report`;
//   worksheet.getCell('A1').font = { size: 16, bold: true };
//   worksheet.getCell('A1').alignment = { horizontal: 'center' };

//   worksheet.mergeCells('A2:F2');
//   worksheet.getCell('A2').value = `Period: ${periodValue}`;
//   worksheet.getCell('A2').alignment = { horizontal: 'center' };

//   worksheet.mergeCells('A3:F3');
//   worksheet.getCell('A3').value = `Generated on: ${new Date().toLocaleDateString()}`;
//   worksheet.getCell('A3').alignment = { horizontal: 'right' };

//   // Add Column Headers
//   worksheet.addRow([]); // Empty row
//   worksheet.addRow(['Supervisor ID', 'Supervisor Name', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary', 'Status']);
//   worksheet.lastRow.eachCell((cell) => {
//     cell.font = { bold: true };
//     cell.fill = {
//       type: 'pattern',
//       pattern: 'solid',
//       fgColor: { argb: 'FFD3D3D3' }
//     };
//   });

//   // Add Data Rows
//   data.forEach(record => {
//     worksheet.addRow([
//       record.supervisor._id,
//       record.supervisor.name,
//       record.basicSalary,
//       record.allowances,
//       record.deductions,
//       record.netSalary,
//       record.status
//     ]);
//   });

//   // Add Summary
//   const lastRow = worksheet.lastRow.number;
//   worksheet.addRow([]);
//   worksheet.addRow(['', '', '', '', 'Total:', { formula: `SUM(F5:F${lastRow})`, result: data.reduce((sum, r) => sum + r.netSalary, 0) }]);
//   worksheet.lastRow.getCell(6).font = { bold: true };

//   // Format columns
//   worksheet.columns = [
//     { key: 'id', width: 15 },
//     { key: 'name', width: 25 },
//     { key: 'basic', width: 15, style: { numFmt: '"$"#,##0.00' } },
//     { key: 'allowances', width: 15, style: { numFmt: '"$"#,##0.00' } },
//     { key: 'deductions', width: 15, style: { numFmt: '"$"#,##0.00' } },
//     { key: 'net', width: 15, style: { numFmt: '"$"#,##0.00' } },
//     { key: 'status', width: 15 }
//   ];

//   return workbook;
// };

// // 6. Weekly Salary Report
// export const getWeeklySalaryReport = async (req, res) => {
//   try {
//     const { week, month, year, format = 'json' } = req.query;
    
//     if (!week || !month || !year) {
//       return res.status(400).json({
//         success: false,
//         error: "Week, month, and year parameters are required for weekly report"
//       });
//     }

//     const salaries = await SupervisorSalary.find({ week, month, year })
//       .populate('supervisorId', 'name email photo _id')
//       .populate('attendanceId', 'date status')
//       .sort({ 'supervisorId.name': 1 });

//     if (salaries.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "No salary records found for the specified week"
//       });
//     }

//     const periodValue = `Week ${week}, ${month} ${year}`;

//     if (format === 'pdf') {
//       const pdfBuffer = await generateSalaryPDFReport(salaries, 'Weekly', periodValue);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_weekly_report_${week}_${month}_${year}.pdf`);
//       return res.send(pdfBuffer);
//     } else if (format === 'excel') {
//       const workbook = generateSalaryExcelReport(salaries, 'Weekly', periodValue);
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_weekly_report_${week}_${month}_${year}.xlsx`);
//       await workbook.xlsx.write(res);
//       return res.end();
//     } else {
//       const formattedData = salaries.map(salary => ({
//         _id: salary._id,
//         period: periodValue,
//         supervisor: {
//           _id: salary.supervisorId._id,
//           name: salary.supervisorId.name,
//           email: salary.supervisorId.email,
//           photo: salary.supervisorId.photo
//         },
//         attendance: salary.attendanceId ? {
//           date: formatDate(salary.attendanceId.date),
//           status: salary.attendanceId.status
//         } : null,
//         basicSalary: salary.basicSalary,
//         allowances: salary.allowances,
//         deductions: salary.deductions,
//         netSalary: salary.netSalary,
//         status: salary.status
//       }));

//       return res.status(200).json({
//         success: true,
//         period: 'weekly',
//         week,
//         month,
//         year,
//         count: formattedData.length,
//         data: formattedData
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 7. Monthly Salary Report
// export const getMonthlySalaryReporpt = async (req, res) => {
//   try {
//     const { month, year, format = 'json' } = req.query;
    
//     if (!month || !year) {
//       return res.status(400).json({
//         success: false,
//         error: "Month and year parameters are required for monthly report"
//       });
//     }

//     const salaries = await SupervisorSalary.find({ month, year })
//       .populate('supervisorId', 'name email photo _id')
//       .populate('attendanceId', 'date status')
//       .sort({ 'supervisorId.name': 1 });

//     if (salaries.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "No salary records found for the specified month"
//       });
//     }

//     const periodValue = `${month} ${year}`;

//     if (format === 'pdf') {
//       const pdfBuffer = await generateSalaryPDFReport(salaries, 'Monthly', periodValue);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_monthly_report_${month}_${year}.pdf`);
//       return res.send(pdfBuffer);
//     } else if (format === 'excel') {
//       const workbook = generateSalaryExcelReport(salaries, 'Monthly', periodValue);
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_monthly_report_${month}_${year}.xlsx`);
//       await workbook.xlsx.write(res);
//       return res.end();
//     } else {
//       const formattedData = salaries.map(salary => ({
//         _id: salary._id,
//         period: periodValue,
//         supervisor: {
//           _id: salary.supervisorId._id,
//           name: salary.supervisorId.name,
//           email: salary.supervisorId.email,
//           photo: salary.supervisorId.photo
//         },
//         attendance: salary.attendanceId ? {
//           date: formatDate(salary.attendanceId.date),
//           status: salary.attendanceId.status
//         } : null,
//         basicSalary: salary.basicSalary,
//         allowances: salary.allowances,
//         deductions: salary.deductions,
//         netSalary: salary.netSalary,
//         status: salary.status
//       }));

//       return res.status(200).json({
//         success: true,
//         period: 'monthly',
//         month,
//         year,
//         count: formattedData.length,
//         data: formattedData
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 8. Supervisor-specific Salary Report
// export const getSupervisorSalaryReport = async (req, res) => {
//   try {
//     const { supervisorId, format = 'json' } = req.query;
    
//     if (!supervisorId) {
//       return res.status(400).json({
//         success: false,
//         error: "Supervisor ID parameter is required"
//       });
//     }

//     const salaries = await SupervisorSalary.find({ supervisorId })
//       .populate('supervisorId', 'name email photo _id')
//       .populate('attendanceId', 'date status')
//       .sort({ year: -1, month: -1, week: -1 });

//     if (salaries.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "No salary records found for the specified supervisor"
//       });
//     }

//     const supervisorName = salaries[0].supervisorId.name;

//     if (format === 'pdf') {
//       const pdfBuffer = await generateSalaryPDFReport(salaries, 'Supervisor', supervisorName);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_report_${supervisorName.replace(/\s+/g, '_')}.pdf`);
//       return res.send(pdfBuffer);
//     } else if (format === 'excel') {
//       const workbook = generateSalaryExcelReport(salaries, 'Supervisor', supervisorName);
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_report_${supervisorName.replace(/\s+/g, '_')}.xlsx`);
//       await workbook.xlsx.write(res);
//       return res.end();
//     } else {
//       const formattedData = salaries.map(salary => ({
//         _id: salary._id,
//         period: salary.week ? `Week ${salary.week}, ${salary.month} ${salary.year}` : `${salary.month} ${salary.year}`,
//         supervisor: {
//           _id: salary.supervisorId._id,
//           name: salary.supervisorId.name,
//           email: salary.supervisorId.email,
//           photo: salary.supervisorId.photo
//         },
//         attendance: salary.attendanceId ? {
//           date: formatDate(salary.attendanceId.date),
//           status: salary.attendanceId.status
//         } : null,
//         basicSalary: salary.basicSalary,
//         allowances: salary.allowances,
//         deductions: salary.deductions,
//         netSalary: salary.netSalary,
//         status: salary.status,
//         createdAt: formatDate(salary.createdAt)
//       }));

//       return res.status(200).json({
//         success: true,
//         period: 'supervisor',
//         supervisorId,
//         count: formattedData.length,
//         data: formattedData
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };