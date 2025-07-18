// import SupervisorSalary from "../models/SupervisorSalary.js";
// import Supervisor from "../models/CenteringSupervisor.js";
// import exceljs from 'exceljs';
// import pdfkit from 'pdfkit';


// // Helper functions
// const formatDate = (dateString) => {
//   if (!dateString) return null;
//   const date = new Date(dateString);
//   const day = String(date.getDate()).padStart(2, '0');
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const year = date.getFullYear();
//   return `${day}/${month}/${year}`;
// };

// const getWeekNumber = (date) => {
//   const firstDayOfMonth = new Date(date.getFullMonth(), 0, 1);
//   const pastDaysOfMonth = (date - firstDayOfMonth) / 86400000;
//   return Math.ceil((pastDaysOfMonth + firstDayOfMonth.getDay() + 1) / 7);
// };

// const getMonthName = (month) => {
//   const months = [
//     'January', 'February', 'March', 'April', 'May', 'June',
//     'July', 'August', 'September', 'October', 'November', 'December'
//   ];
//   return months[month - 1];
// };

// // Salary Calculation Rates
// const SALARY_RATES = {
//   Fullday: 1000,
//   Halfday: 500,
//   Overtime: 1500,
//   null: 0,
// };

// // 1. Create Salary
// export const createSalary = async (req, res) => {
//   try {
//     const { name, date, actualMonthlySalary = 0 , allowances = 0, deductions = 0, advanceSalary = 0, paidAmount = 0 } = req.body;

//     if (!name) {
//       return res.status(400).json({
//         success: false,
//         message: "Please select a supervisor and provide a date"
//       });
//     }

//     // const idMatch = name.match(/\s*\(\s*(\d+)\s*\)\s*$/);
//     // if (!idMatch) {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: "Invalid supervisor format. Expected: Name(ID) or Name (ID)"
//     //   });
//     // }
    
//     const supervisorId = idMatch[1];
//     const supervisor = await Supervisor.findByIpd(supervisorId);
//     if (!supervisor) {
//       return res.status(404).json({
//         success: false,
//         message: "Supervisor not found"
//       });
//     }

//     const attendance = await Supervisor.findOne({ userId });
//     if (!attendance) {
//       return res.status(404).json({
//         success: false,
//         message: "No attendance records found"
//       });
//     }
//     const [day, month, year] = date.split('/').map(Number);
//     const jsDate = new Date(year, month - 1, day);
//     const week = getWeekNumber(jsDate);
//     const monthName = getMonthName(month);

//     const basicSalary = SALARY_RATES[attendance.status] || 0;
//     const netDailySalary = basicSalary + Number(allowances) - Number(deductions);
//     const parsedPaidAmount = Number(paidAmount) || 0;

//     // Create new salary record
//     const newSalary = await SupervisorSalary.create({
//       supervisorId: supervisor._id,
//       attendanceId: attendance._id,
//       date,
//       week,
//       month,
//       monthName,
//       year,
//       basicSalary,
//       allowances: Number(allowances),
//       deductions: Number(deductions),
//       netDailySalary,
//       paidAmount: parsedPaidAmount,
//       status: parsedPaidAmount > 0 ? 
//         (parsedPaidAmount >= netDailySalary ? "Paid" : "Partial") : 
//         "Pending",
//       paymentDate: parsedPaidAmount > 0 ? formatDate(new Date()) : null
//     });

//     // Update weekly and monthly aggregates
//     await updateSalaryAggregates(supervisor._id, week, month, year);

//     res.status(201).json({
//       success: true,
//       data: await newSalary.populate(['supervisorId', 'attendanceId'])
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // 2. Get All Salaries
// export const getAllSalaries = async (req, res) => {
//   try {
//     const salaries = await SupervisorSalary.find({})
//       .populate('supervisorId', 'name email photo')
//       .populate('attendanceId', 'date status')
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: salaries.length,
//       data: salaries
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
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
//         message: "Salary record not found"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: salary
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // 4. Update Salary
// export const updateSalary = async (req, res) => {
//   try {
//     const { allowances, deductions, paidAmount, status } = req.body;
//     const salary = await SupervisorSalary.findById(req.params.id);

//     if (!salary) {
//       return res.status(404).json({
//         success: false,
//         message: "Salary record not found"
//       });
//     }

//     // Update fields
//     if (allowances !== undefined) salary.allowances = Number(allowances);
//     if (deductions !== undefined) salary.deductions = Number(deductions);
//     if (paidAmount !== undefined) {
//       salary.paidAmount = Number(paidAmount);
//       salary.balanceAmount = salary.netDailySalary - salary.paidAmount;
//     }
//     if (status) salary.status = status;

//     // Recalculate
//     salary.netDailySalary = salary.basicSalary + salary.allowances - salary.deductions;
    
//     if (salary.paidAmount > 0) {
//       salary.status = salary.paidAmount >= salary.netDailySalary ? "Paid" : "Partial";
//       salary.paymentDate = formatDate(new Date());
//     }

//     await salary.save();
//     await updateSalaryAggregates(salary.supervisorId, salary.week, salary.month, salary.year);

//     res.status(200).json({
//       success: true,
//       data: await salary.populate(['supervisorId', 'attendanceId'])
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
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
//         message: "Salary record not found"
//       });
//     }

//     await updateSalaryAggregates(salary.supervisorId, salary.week, salary.month, salary.year);

//     res.status(200).json({
//       success: true,
//       message: "Salary deleted successfully"
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // Helper: Update salary aggregates
// const updateSalaryAggregates = async (supervisorId, week, month, year) => {
//   // Update weekly salary
//   const weeklySalaries = await SupervisorSalary.find({ supervisorId, week, month, year });
//   const netWeeklySalary = weeklySalaries.reduce((sum, s) => sum + s.netDailySalary, 0);
  
//   await SupervisorSalary.updateMany(
//     { supervisorId, week, month, year },
//     { $set: { netWeeklySalary } }
//   );

//   // Update monthly salary
//   const monthlySalaries = await SupervisorSalary.find({ supervisorId, month, year });
//   const netMonthlySalary = monthlySalaries.reduce((sum, s) => sum + s.netDailySalary, 0);
  
//   await SupervisorSalary.updateMany(
//     { supervisorId, month, year },
//     { $set: { netMonthlySalary } }
//   );
// };


// // Report Generation Functions (updated to include paidAmount and balanceAmount)
// const generatePDFReport = (data, title, period) => {
//   return new Promise((resolve) => {
//     const doc = new pdfkit();
//     const buffers = [];
    
//     doc.on('data', buffers.push.bind(buffers));
//     doc.on('end', () => {
//       const pdfData = Buffer.concat(buffers);
//       resolve(pdfData);
//     });

//     // Report Header
//     doc.fontSize(18).text(`Supervisor Salary Report - ${title}`, { align: 'center' });
//     doc.moveDown();
//     doc.fontSize(12).text(`Period: ${period}`, { align: 'center' });
//     doc.fontSize(10).text(`Generated on: ${formatDate(new Date().toISOString())}`, { align: 'right' });
//     doc.moveDown(2);

//     // Column Headers
//     const headers = [
//       { text: 'Supervisor', x: 50, width: 100 },
//       { text: 'Date', x: 160, width: 80 },
//       { text: 'Basic', x: 250, width: 60 },
//       { text: 'Allowances', x: 320, width: 80 },
//       { text: 'Deductions', x: 410, width: 80 },
//       { text: 'Daily Net', x: 500, width: 80 },
//       { text: 'Paid', x: 590, width: 60 },
//       { text: 'Balance', x: 680, width: 80 },
//       { text: 'Status', x: 770, width: 80 }
//     ];

//     doc.font('Helvetica-Bold');
//     headers.forEach(header => {
//       doc.text(header.text, header.x, 150, { width: header.width });
//     });
//     doc.font('Helvetica');

//     // Data Rows
//     let y = 170;
//     data.forEach(record => {
//       doc.text(record.supervisor.name, 50, y, { width: 100 });
//       doc.text(record.date, 160, y, { width: 80 });
//       doc.text(formatCurrency(record.basicSalary), 250, y, { width: 60 });
//       doc.text(formatCurrency(record.allowances), 320, y, { width: 80 });
//       doc.text(formatCurrency(record.deductions), 410, y, { width: 80 });
//       doc.text(formatCurrency(record.netDailySalary), 500, y, { width: 80 });
//       doc.text(formatCurrency(record.paidAmount), 590, y, { width: 60 });
//       doc.text(formatCurrency(record.balanceAmount), 680, y, { width: 80 });
//       doc.text(record.status, 770, y, { width: 80 });
//       y += 20;
//     });

//     // Summary
//     doc.moveDown(2);
//     doc.font('Helvetica-Bold');
//     const totalDaily = data.reduce((sum, record) => sum + record.netDailySalary, 0);
//     const totalPaid = data.reduce((sum, record) => sum + record.paidAmount, 0);
//     const totalBalance = data.reduce((sum, record) => sum + record.balanceAmount, 0);
    
//     doc.text(`Total Daily: ${formatCurrency(totalDaily)}`, 500, y + 20);
//     doc.text(`Total Paid: ${formatCurrency(totalPaid)}`, 590, y + 20);
//     doc.text(`Total Balance: ${formatCurrency(totalBalance)}`, 680, y + 20);

//     doc.end();
//   });
// };

// const generateExcelReport = (data, title, period) => {
//   const workbook = new exceljs.Workbook();
//   const worksheet = workbook.addWorksheet('Salary Report');

//   // Add Report Header
//   worksheet.mergeCells('A1:I1');
//   worksheet.getCell('A1').value = `Supervisor Salary Report - ${title}`;
//   worksheet.getCell('A1').font = { size: 16, bold: true };
//   worksheet.getCell('A1').alignment = { horizontal: 'center' };

//   worksheet.mergeCells('A2:I2');
//   worksheet.getCell('A2').value = `Period: ${period}`;
//   worksheet.getCell('A2').alignment = { horizontal: 'center' };

//   worksheet.mergeCells('A3:I3');
//   worksheet.getCell('A3').value = `Generated on: ${formatDate(new Date().toISOString())}`;
//   worksheet.getCell('A3').alignment = { horizontal: 'right' };

//   // Add Column Headers
//   worksheet.addRow([]);
//   const headerRow = worksheet.addRow([
//     'Supervisor', 'Date', 'Basic Salary', 'Allowances', 'Deductions', 
//     'Daily Net', 'Paid Amount', 'Balance Amount', 'Status'
//   ]);
//   headerRow.eachCell(cell => {
//     cell.font = { bold: true };
//     cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
//   });

//   // Add Data Rows
//   data.forEach(record => {
//     worksheet.addRow([
//       record.supervisor.name,
//       record.date,
//       record.basicSalary,
//       record.allowances,
//       record.deductions,
//       record.netDailySalary,
//       record.paidAmount,
//       record.balanceAmount,
//       record.status
//     ]);
//   });

//   // Add Summary
//   const lastRow = worksheet.lastRow.number;
//   worksheet.addRow([]);
//   const totalRow = worksheet.addRow([
//     '', '', '', '', 'Total:',
//     { formula: `SUM(F5:F${lastRow})` },
//     { formula: `SUM(G5:G${lastRow})` },
//     { formula: `SUM(H5:H${lastRow})` },
//     ''
//   ]);
//   totalRow.eachCell(cell => {
//     if (cell.value) cell.font = { bold: true };
//   });

//   // Format columns
//   worksheet.columns = [
//     { key: 'name', width: 25 },
//     { key: 'date', width: 15 },
//     { key: 'basic', width: 15, style: { numFmt: '"₹"#,##0.00' } },
//     { key: 'allowances', width: 15, style: { numFmt: '"₹"#,##0.00' } },
//     { key: 'deductions', width: 15, style: { numFmt: '"₹"#,##0.00' } },
//     { key: 'daily', width: 15, style: { numFmt: '"₹"#,##0.00' } },
//     { key: 'paid', width: 15, style: { numFmt: '"₹"#,##0.00' } },
//     { key: 'balance', width: 15, style: { numFmt: '"₹"#,##0.00' } },
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
//         error: "Date parameter is required (DD/MM/YYYY format)"
//       });
//     }

//     const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
//     if (!dateRegex.test(date)) {
//       return res.status(400).json({
//         success: false,
//         error: "Date must be in DD/MM/YYYY format"
//       });
//     }

//     const salaries = await SupervisorSalary.find({ date })
//       .populate('supervisorId', 'name email photo')
//       .populate('attendanceId', 'date status')
//       .sort({ 'supervisorId.name': 1 });

//     if (salaries.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "No salary records found for the specified date"
//       });
//     }

//     const reportData = salaries.map(salary => ({
//       supervisor: salary.supervisorId,
//       date: salary.date,
//       basicSalary: salary.basicSalary,
//       allowances: salary.allowances,
//       deductions: salary.deductions,
//       netDailySalary: salary.netDailySalary,
//       paidAmount: salary.paidAmount,
//       balanceAmount: salary.balanceAmount,
//       status: salary.status
//     }));

//     if (format === 'pdf') {
//       const pdfBuffer = await generatePDFReport(reportData, 'Daily', date);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=daily_salary_report_${date.replace(/\//g, '-')}.pdf`);
//       return res.send(pdfBuffer);
//     } else if (format === 'excel') {
//       const workbook = generateExcelReport(reportData, 'Daily', date);
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//       res.setHeader('Content-Disposition', `attachment; filename=daily_salary_report_${date.replace(/\//g, '-')}.xlsx`);
//       await workbook.xlsx.write(res);
//       return res.end();
//     } else {
//       res.status(200).json({
//         success: true,
//         period: 'daily',
//         date,
//         count: reportData.length,
//         data: reportData
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
//         error: "Week, month, and year parameters are required"
//       });
//     }

//     const salaries = await SupervisorSalary.find({ 
//       week: parseInt(week), 
//       month: parseInt(month), 
//       year: parseInt(year) 
//     })
//       .populate('supervisorId', 'name email photo')
//       .sort({ 'supervisorId.name': 1 });

//     if (salaries.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "No salary records found for the specified week"
//       });
//     }

//     const monthName = getMonthName(parseInt(month));
//     const period = `Week ${week}, ${monthName} ${year}`;
    
//     const reportData = salaries.map(salary => ({
//       supervisor: salary.supervisorId,
//       date: salary.date,
//       basicSalary: salary.basicSalary,
//       allowances: salary.allowances,
//       deductions: salary.deductions,
//       netDailySalary: salary.netDailySalary,
//       netWeeklySalary: salary.netWeeklySalary,
//       paidAmount: salary.paidAmount,
//       balanceAmount: salary.balanceAmount,
//       status: salary.status
//     }));

//     if (format === 'pdf') {
//       const pdfBuffer = await generatePDFReport(reportData, 'Weekly', period);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=weekly_salary_report_week${week}_${month}_${year}.pdf`);
//       return res.send(pdfBuffer);
//     } else if (format === 'excel') {
//       const workbook = generateExcelReport(reportData, 'Weekly', period);
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//       res.setHeader('Content-Disposition', `attachment; filename=weekly_salary_report_week${week}_${month}_${year}.xlsx`);
//       await workbook.xlsx.write(res);
//       return res.end();
//     } else {
//       res.status(200).json({
//         success: true,
//         period: 'weekly',
//         week,
//         month,
//         year,
//         count: reportData.length,
//         data: reportData
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
//         error: "Month and year parameters are required"
//       });
//     }

//     const salaries = await SupervisorSalary.find({ 
//       month: parseInt(month), 
//       year: parseInt(year) 
//     })
//       .populate('supervisorId', 'name email photo')
//       .sort({ 'supervisorId.name': 1 });

//     if (salaries.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "No salary records found for the specified month"
//       });
//     }

//     const monthName = getMonthName(parseInt(month));
//     const period = `${monthName} ${year}`;
    
//     const reportData = salaries.map(salary => ({
//       supervisor: salary.supervisorId,
//       date: salary.date,
//       basicSalary: salary.basicSalary,
//       allowances: salary.allowances,
//       deductions: salary.deductions,
//       netDailySalary: salary.netDailySalary,
//       netMonthlySalary: salary.netMonthlySalary,
//       paidAmount: salary.paidAmount,
//       balanceAmount: salary.balanceAmount,
//       status: salary.status
//     }));

//     if (format === 'pdf') {
//       const pdfBuffer = await generatePDFReport(reportData, 'Monthly', period);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=monthly_salary_report_${month}_${year}.pdf`);
//       return res.send(pdfBuffer);
//     } else if (format === 'excel') {
//       const workbook = generateExcelReport(reportData, 'Monthly', period);
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//       res.setHeader('Content-Disposition', `attachment; filename=monthly_salary_report_${month}_${year}.xlsx`);
//       await workbook.xlsx.write(res);
//       return res.end();
//     } else {
//       res.status(200).json({
//         success: true,
//         period: 'monthly',
//         month,
//         year,
//         count: reportData.length,
//         data: reportData
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 9. Yearly Salary Report
// export const getYearlySalaryReport = async (req, res) => {
//   try {
//     const { year, format = 'json' } = req.query;
    
//     if (!year) {
//       return res.status(400).json({
//         success: false,
//         error: "Year parameter is required"
//       });
//     }

//     const salaries = await SupervisorSalary.find({ year: parseInt(year) })
//       .populate('supervisorId', 'name email photo')
//       .sort({ month: 1, week: 1, 'supervisorId.name': 1 });

//     if (salaries.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "No salary records found for the specified year"
//       });
//     }

//     const period = `Year ${year}`;
    
//     const reportData = salaries.map(salary => ({
//       supervisor: salary.supervisorId,
//       date: salary.date,
//       basicSalary: salary.basicSalary,
//       allowances: salary.allowances,
//       deductions: salary.deductions,
//       netDailySalary: salary.netDailySalary,
//       netMonthlySalary: salary.netMonthlySalary,
//       paidAmount: salary.paidAmount,
//       balanceAmount: salary.balanceAmount,
//       status: salary.status
//     }));

//     if (format === 'pdf') {
//       const pdfBuffer = await generatePDFReport(reportData, 'Yearly', period);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=yearly_salary_report_${year}.pdf`);
//       return res.send(pdfBuffer);
//     } else if (format === 'excel') {
//       const workbook = generateExcelReport(reportData, 'Yearly', period);
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//       res.setHeader('Content-Disposition', `attachment; filename=yearly_salary_report_${year}.xlsx`);
//       await workbook.xlsx.write(res);
//       return res.end();
//     } else {
//       res.status(200).json({
//         success: true,
//         period: 'yearly',
//         year,
//         count: reportData.length,
//         data: reportData
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 10. Generate Salary Receipt
// export const generateSalaryReceipt = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const salary = await SupervisorSalary.findById(id)
//       .populate('supervisorId', 'name email phone address')
//       .populate('attendanceId', 'date status');

//     if (!salary) {
//       return res.status(404).json({
//         success: false,
//         error: "Salary record not found"
//       });
//     }

//     // Generate PDF receipt
//     const pdfBuffer = await generateReceiptPDF(salary);

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=salary_receipt_${id}.pdf`);
//     return res.send(pdfBuffer);

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // Helper function to generate receipt PDF
// const generateReceiptPDF = (salary) => {
//   return new Promise((resolve) => {
//     const doc = new pdfkit();
//     const buffers = [];
    
//     doc.on('data', buffers.push.bind(buffers));
//     doc.on('end', () => {
//       const pdfData = Buffer.concat(buffers);
//       resolve(pdfData);
//     });

//     // Company Header
//     doc.image('path/to/company/logo.png', 50, 50, { width: 100 });
//     doc.fontSize(20).text('ABC Company', 170, 60);
//     doc.fontSize(12).text('123 Business Street, City, Country', 170, 85);
//     doc.fontSize(10).text('Phone: +123456789 | Email: info@abccompany.com', 170, 100);
    
//     // Receipt Title
//     doc.moveDown(3);
//     doc.fontSize(18).text('SALARY PAYMENT RECEIPT', { align: 'center', underline: true });
//     doc.moveDown();

//     // Receipt Details
//     const receiptDetails = [
//       { label: 'Receipt No.', value: `SR-${salary._id}` },
//       { label: 'Payment Date', value: salary.paymentDate ? formatDate(salary.paymentDate) : 'N/A' },
//       { label: 'Issued Date', value: formatDate(new Date().toISOString()) },
//     ];

//     let y = 200;
//     receiptDetails.forEach(detail => {
//       doc.fontSize(12).text(`${detail.label}:`, 50, y);
//       doc.fontSize(12).text(detail.value, 200, y);
//       y += 20;
//     });

//     // Supervisor Information
//     doc.moveDown(2);
//     doc.fontSize(14).text('Supervisor Information', { underline: true });
//     doc.moveDown(0.5);
    
//     const supervisorInfo = [
//       { label: 'Name', value: salary.supervisorId.name },
//       { label: 'ID', value: salary.supervisorId._id },
//       { label: 'Email', value: salary.supervisorId.email || 'N/A' },
//       { label: 'Phone', value: salary.supervisorId.phone || 'N/A' },
//     ];

//     supervisorInfo.forEach(info => {
//       doc.fontSize(12).text(`${info.label}:`, 50, y);
//       doc.fontSize(12).text(info.value, 200, y);
//       y += 20;
//     });

//     // Salary Details
//     doc.moveDown(2);
//     doc.fontSize(14).text('Payment Details', { underline: true });
//     doc.moveDown(0.5);

//     const salaryDetails = [
//       { label: 'Payment Period', value: `${salary.monthName} ${salary.year}, Week ${salary.week}` },
//       { label: 'Attendance Date', value: salary.date },
//       { label: 'Attendance Status', value: salary.attendanceId.status },
//       { label: 'Basic Salary', value: formatCurrency(salary.basicSalary) },
//       { label: 'Allowances', value: formatCurrency(salary.allowances) },
//       { label: 'Deductions', value: formatCurrency(salary.deductions) },
//       { label: 'Net Salary (Daily)', value: formatCurrency(salary.netDailySalary) },
//       { label: 'Paid Amount', value: formatCurrency(salary.paidAmount) },
//       { label: 'Balance Amount', value: formatCurrency(salary.balanceAmount) },
//       { label: 'Payment Status', value: salary.status },
//     ];

//     salaryDetails.forEach(detail => {
//       doc.fontSize(12).text(`${detail.label}:`, 50, y);
//       doc.fontSize(12).text(detail.value, 200, y);
//       y += 20;
//     });

//     // Total and Signature
//     doc.moveDown(2);
//     doc.fontSize(14).text(`Total Paid: ${formatCurrency(salary.paidAmount)}`, 400, y, { bold: true });
//     y += 40;
    
//     doc.moveTo(400, y).lineTo(550, y).stroke();
//     doc.fontSize(12).text('Authorized Signature', 450, y + 5, { align: 'center' });

//     // Footer
//     doc.moveDown(4);
//     doc.fontSize(10).text('This is a computer generated receipt. No signature required.', { align: 'center' });
//     doc.fontSize(8).text('Thank you for your service!', { align: 'center' });

//     doc.end();
//   });
// }; 







import mongoose from 'mongoose';
import SupervisorSalary from '../models/SupervisorSalary.js';
import Supervisor from '../models/Supervisor.js';
import getNextSalaryId from '../utils/sequenceGenerator.js'; // Correct import path
import exceljs from 'exceljs';
import PDFDocument from 'pdfkit';

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
};

const getWeekNumber = (date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// // Auto-increment ID generator
const getNextSequence = async (name) => {
  const result = await mongoose.connection.db.collection('counters').findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { returnOriginal: false, upsert: true }
  );
  return result.value.seq;
};

// 1. Create Monthly Salary
export const createMonthlySalary = async (req, res) => {
  try {
    const { name, date, actualMonthlySalary, allowances = 0, deductions = 0, advanceSalary = 0, paidAmount = 0 } = req.body;

    // Validate inputs
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }

    // Parse the date to get month and year
    const [day, month, year] = date.split('/').map(Number);
    const monthName = getMonthName(month);

    // Find supervisor by name
    const supervisor = await Supervisor.findOne({ name });
    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found"
      });
    }

    // Calculate working days and basic salary from attendance
    const attendanceDays = supervisor.attendanceRecords.filter(record => {
      const [recordDay, recordMonth, recordYear] = record.date.split('/').map(Number);
      return recordMonth === month && recordYear === year;
    });

    const workingDays = attendanceDays.length;
    const totalDays = new Date(year, month, 0).getDate();

    // Calculate basic salary based on attendance
    const basicSalary = attendanceDays.reduce((total, day) => {
      const rates = {
        Fullday: 1000,
        Halfday: 500,
        Overtime: 1500,
        null: 0
      };
      return total + (rates[day.status] || 0);
    }, 0);

    // Calculate net monthly salary (use max of actual or attendance-based)
    const netMonthlySalary = Math.max(
      Number(actualMonthlySalary), 
      basicSalary
    ) + Number(allowances) - Number(deductions);

    // Calculate balance
    const balanceAmount = netMonthlySalary - Number(paidAmount) - Number(advanceSalary);

    // Determine status
    let status;
    if (paidAmount <= 0) {
      status = "Pending";
    } else if (balanceAmount <= 0) {
      status = "Paid";
    } else {
      status = "Partial";
    }

    // Generate auto-incremented ID
    const _id = await getNextSequence('supervisorSalaryId');

    // Create new salary record
    const salaryRecord = new SupervisorSalary({
      _id,
      supervisorId: supervisor._id,
      month,
      monthName,
      year,
      date: formatDate(new Date(year, month - 1, day)),
      actualMonthlySalary: Number(actualMonthlySalary),
      basicSalary,
      allowances: Number(allowances),
      deductions: Number(deductions),
      advanceSalary: Number(advanceSalary),
      netMonthlySalary,
      paidAmount: Number(paidAmount),
      balanceAmount,
      status,
      workingDays,
      totalDays,
      attendanceRecords: attendanceDays
    });

    await salaryRecord.save();

    res.status(201).json({
      success: true,
      data: {
        ...salaryRecord.toObject(),
        supervisorId: {
          _id: supervisor._id,
          name: supervisor.name,
          email: supervisor.email,
          phone: supervisor.phone,
          supervisorType: supervisor.supervisorType
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 2. Get All Salary Records
export const getAllSalaries = async (req, res) => {
  try {
    const salaries = await SupervisorSalary.find({})
      .populate('supervisorId', 'name email phone supervisorType')
      .sort({ _id: 1 });

    res.status(200).json({
      success: true,
      count: salaries.length,
      data: salaries.map(salary => ({
        ...salary.toObject(),
        supervisorId: {
          _id: salary.supervisorId._id,
          name: salary.supervisorId.name,
          email: salary.supervisorId.email,
          phone: salary.supervisorId.phone,
          supervisorType: salary.supervisorId.supervisorType
        }
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 3. Get Salary by ID with PDF Receipt
export const getSalaryById = async (req, res) => {
  try {
    const salary = await SupervisorSalary.findById(req.params.id)
      .populate('supervisorId', 'name email phone supervisorType');

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found"
      });
    }

    // Return JSON response if not requesting PDF
    if (req.query.format !== 'pdf') {
      return res.status(200).json({
        success: true,
        data: {
          ...salary.toObject(),
          supervisorId: {
            _id: salary.supervisorId._id,
            name: salary.supervisorId.name,
            email: salary.supervisorId.email,
            phone: salary.supervisorId.phone,
            supervisorType: salary.supervisorId.supervisorType
          }
        }
      });
    }

    // Generate PDF receipt
    const doc = new PDFDocument();
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=salary_receipt_${salary._id}.pdf`);
      res.send(pdfData);
    });

    // PDF Content
    doc.fontSize(18).text('Salary Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt ID: ${salary._id}`, { align: 'left' });
    doc.text(`Date: ${salary.date}`, { align: 'left' });
    doc.moveDown();

    // Supervisor Info
    doc.fontSize(14).text('Supervisor Information', { underline: true });
    doc.fontSize(12).text(`Name: ${salary.supervisorId.name}`);
    doc.text(`ID: ${salary.supervisorId._id}`);
    doc.text(`Type: ${salary.supervisorId.supervisorType}`);
    doc.moveDown();

    // Salary Details
    doc.fontSize(14).text('Salary Details', { underline: true });
    doc.fontSize(12).text(`Month: ${salary.monthName} ${salary.year}`);
    doc.text(`Working Days: ${salary.workingDays}/${salary.totalDays}`);
    doc.text(`Basic Salary: ₹${salary.basicSalary.toFixed(2)}`);
    doc.text(`Allowances: ₹${salary.allowances.toFixed(2)}`);
    doc.text(`Deductions: ₹${salary.deductions.toFixed(2)}`);
    doc.text(`Advance: ₹${salary.advanceSalary.toFixed(2)}`);
    doc.moveDown();

    // Payment Info
    doc.fontSize(14).text('Payment Information', { underline: true });
    doc.fontSize(12).text(`Net Salary: ₹${salary.netMonthlySalary.toFixed(2)}`);
    doc.text(`Paid Amount: ₹${salary.paidAmount.toFixed(2)}`);
    doc.text(`Balance: ₹${salary.balanceAmount.toFixed(2)}`);
    doc.text(`Status: ${salary.status}`);
    doc.moveDown();

    doc.fontSize(10).text('This is a computer generated receipt.', { align: 'center' });
    doc.end();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 4. Update Salary Record (PUT)
export const updateSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, actualMonthlySalary, allowances, deductions, advanceSalary, paidAmount, status } = req.body;

    const salary = await SupervisorSalary.findById(id);
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found"
      });
    }

    // Update all fields if provided
    if (name) {
      const supervisor = await Supervisor.findOne({ name });
      if (!supervisor) {
        return res.status(404).json({
          success: false,
          message: "Supervisor not found"
        });
      }
      salary.supervisorId = supervisor._id;
    }

    if (date) {
      const [day, month, year] = date.split('/').map(Number);
      salary.date = formatDate(new Date(year, month - 1, day));
      salary.month = month;
      salary.monthName = getMonthName(month);
      salary.year = year;
    }

    if (actualMonthlySalary !== undefined) salary.actualMonthlySalary = Number(actualMonthlySalary);
    if (allowances !== undefined) salary.allowances = Number(allowances);
    if (deductions !== undefined) salary.deductions = Number(deductions);
    if (advanceSalary !== undefined) salary.advanceSalary = Number(advanceSalary);
    if (paidAmount !== undefined) salary.paidAmount = Number(paidAmount);
    if (status) salary.status = status;

    // Recalculate values
    if (actualMonthlySalary !== undefined || allowances !== undefined || deductions !== undefined) {
      salary.netMonthlySalary = Math.max(
        salary.actualMonthlySalary,
        salary.basicSalary
      ) + salary.allowances - salary.deductions;
    }

    if (paidAmount !== undefined || advanceSalary !== undefined || salary.netMonthlySalary !== undefined) {
      salary.balanceAmount = salary.netMonthlySalary - salary.paidAmount - salary.advanceSalary;
    }

    salary.updatedAt = new Date();
    await salary.save();

    res.status(200).json({
      success: true,
      data: await salary.populate('supervisorId', 'name email phone supervisorType')
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 5. Delete Salary by ID
export const deleteSalaryById = async (req, res) => {
  try {
    const salary = await SupervisorSalary.findByIdAndDelete(req.params.id);
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Salary record deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 6. Delete All Salaries
export const deleteAllSalaries = async (req, res) => {
  try {
    await SupervisorSalary.deleteMany({});
    
    // Reset the auto-increment counter
    await mongoose.connection.db.collection('counters').updateOne(
      { _id: 'supervisorSalaryId' },
      { $set: { seq: 0 } }
    );

    res.status(200).json({
      success: true,
      message: "All salary records deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 7. Generate Daily Report
export const generateDailyReport = async (req, res) => {
  try {
    const { date, format = 'json' } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required (DD/MM/YYYY format)"
      });
    }

    const salaries = await SupervisorSalary.find({ date })
      .populate('supervisorId', 'name email phone supervisorType')
      .sort({ 'supervisorId.name': 1 });

    if (salaries.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No salary records found for the specified date"
      });
    }

    const reportData = salaries.map(salary => ({
      supervisor: salary.supervisorId,
      date: salary.date,
      basicSalary: salary.basicSalary,
      allowances: salary.allowances,
      deductions: salary.deductions,
      netSalary: salary.netMonthlySalary,
      paidAmount: salary.paidAmount,
      balanceAmount: salary.balanceAmount,
      status: salary.status
    }));

    if (format === 'pdf') {
      const doc = new PDFDocument();
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=daily_report_${date.replace(/\//g, '-')}.pdf`);
        res.send(pdfData);
      });

      doc.fontSize(18).text('Daily Salary Report', { align: 'center' });
      doc.fontSize(12).text(`Date: ${date}`, { align: 'center' });
      doc.moveDown();

      // Table headers
      doc.font('Helvetica-Bold');
      doc.text('Name', 50, 150);
      doc.text('Basic', 200, 150);
      doc.text('Allowances', 250, 150);
      doc.text('Deductions', 320, 150);
      doc.text('Net Salary', 400, 150);
      doc.text('Status', 500, 150);
      doc.font('Helvetica');

      // Table rows
      let y = 170;
      reportData.forEach(record => {
        doc.text(record.supervisor.name, 50, y);
        doc.text(`₹${record.basicSalary.toFixed(2)}`, 200, y);
        doc.text(`₹${record.allowances.toFixed(2)}`, 250, y);
        doc.text(`₹${record.deductions.toFixed(2)}`, 320, y);
        doc.text(`₹${record.netSalary.toFixed(2)}`, 400, y);
        doc.text(record.status, 500, y);
        y += 20;
      });

      doc.end();
    } else if (format === 'excel') {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Daily Report');

      worksheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Basic Salary', key: 'basic', width: 15 },
        { header: 'Allowances', key: 'allowances', width: 15 },
        { header: 'Deductions', key: 'deductions', width: 15 },
        { header: 'Net Salary', key: 'net', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];

      reportData.forEach(record => {
        worksheet.addRow({
          name: record.supervisor.name,
          basic: record.basicSalary,
          allowances: record.allowances,
          deductions: record.deductions,
          net: record.netSalary,
          status: record.status
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=daily_report_${date.replace(/\//g, '-')}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      res.status(200).json({
        success: true,
        date,
        count: reportData.length,
        data: reportData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 8. Generate Weekly Report
export const generateWeeklyReport = async (req, res) => {
  try {
    const { week, month, year, format = 'json' } = req.query;
    
    if (!week || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Week, month, and year parameters are required"
      });
    }

    const salaries = await SupervisorSalary.find({ 
      week: parseInt(week), 
      month: parseInt(month), 
      year: parseInt(year) 
    })
      .populate('supervisorId', 'name email phone supervisorType')
      .sort({ 'supervisorId.name': 1 });

    if (salaries.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No salary records found for the specified week"
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
      netSalary: salary.netMonthlySalary,
      paidAmount: salary.paidAmount,
      balanceAmount: salary.balanceAmount,
      status: salary.status
    }));

    if (format === 'pdf') {
      const doc = new PDFDocument();
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=weekly_report_week${week}_${month}_${year}.pdf`);
        res.send(pdfData);
      });

      doc.fontSize(18).text('Weekly Salary Report', { align: 'center' });
      doc.fontSize(12).text(`Period: ${period}`, { align: 'center' });
      doc.moveDown();

      // Table headers
      doc.font('Helvetica-Bold');
      doc.text('Name', 50, 150);
      doc.text('Date', 150, 150);
      doc.text('Basic', 250, 150);
      doc.text('Net Salary', 350, 150);
      doc.text('Paid', 450, 150);
      doc.text('Status', 550, 150);
      doc.font('Helvetica');

      // Table rows
      let y = 170;
      reportData.forEach(record => {
        doc.text(record.supervisor.name, 50, y);
        doc.text(record.date, 150, y);
        doc.text(`₹${record.basicSalary.toFixed(2)}`, 250, y);
        doc.text(`₹${record.netSalary.toFixed(2)}`, 350, y);
        doc.text(`₹${record.paidAmount.toFixed(2)}`, 450, y);
        doc.text(record.status, 550, y);
        y += 20;
      });

      doc.end();
    } else if (format === 'excel') {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Weekly Report');

      worksheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Basic Salary', key: 'basic', width: 15 },
        { header: 'Net Salary', key: 'net', width: 15 },
        { header: 'Paid Amount', key: 'paid', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];

      reportData.forEach(record => {
        worksheet.addRow({
          name: record.supervisor.name,
          date: record.date,
          basic: record.basicSalary,
          net: record.netSalary,
          paid: record.paidAmount,
          status: record.status
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=weekly_report_week${week}_${month}_${year}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      res.status(200).json({
        success: true,
        period,
        count: reportData.length,
        data: reportData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 9. Generate Monthly Report
export const generateMonthlyReport = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year parameters are required"
      });
    }

    const salaries = await SupervisorSalary.find({ 
      month: parseInt(month), 
      year: parseInt(year) 
    })
      .populate('supervisorId', 'name email phone supervisorType')
      .sort({ 'supervisorId.name': 1 });

    if (salaries.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No salary records found for the specified month"
      });
    }

    const monthName = getMonthName(parseInt(month));
    const period = `${monthName} ${year}`;
    
    const reportData = salaries.map(salary => ({
      supervisor: salary.supervisorId,
      basicSalary: salary.basicSalary,
      allowances: salary.allowances,
      deductions: salary.deductions,
      netSalary: salary.netMonthlySalary,
      paidAmount: salary.paidAmount,
      balanceAmount: salary.balanceAmount,
      status: salary.status,
      workingDays: salary.workingDays,
      totalDays: salary.totalDays
    }));

    if (format === 'pdf') {
      const doc = new PDFDocument();
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=monthly_report_${month}_${year}.pdf`);
        res.send(pdfData);
      });

      doc.fontSize(18).text('Monthly Salary Report', { align: 'center' });
      doc.fontSize(12).text(`Period: ${period}`, { align: 'center' });
      doc.moveDown();

      // Table headers
      doc.font('Helvetica-Bold');
      doc.text('Name', 50, 150);
      doc.text('Working Days', 150, 150);
      doc.text('Basic', 250, 150);
      doc.text('Allowances', 350, 150);
      doc.text('Net Salary', 450, 150);
      doc.text('Status', 550, 150);
      doc.font('Helvetica');

      // Table rows
      let y = 170;
      reportData.forEach(record => {
        doc.text(record.supervisor.name, 50, y);
        doc.text(`${record.workingDays}/${record.totalDays}`, 150, y);
        doc.text(`₹${record.basicSalary.toFixed(2)}`, 250, y);
        doc.text(`₹${record.allowances.toFixed(2)}`, 350, y);
        doc.text(`₹${record.netSalary.toFixed(2)}`, 450, y);
        doc.text(record.status, 550, y);
        y += 20;
      });

      doc.end();
    } else if (format === 'excel') {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Monthly Report');

      worksheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Working Days', key: 'days', width: 15 },
        { header: 'Basic Salary', key: 'basic', width: 15 },
        { header: 'Allowances', key: 'allowances', width: 15 },
        { header: 'Net Salary', key: 'net', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];

      reportData.forEach(record => {
        worksheet.addRow({
          name: record.supervisor.name,
          days: `${record.workingDays}/${record.totalDays}`,
          basic: record.basicSalary,
          allowances: record.allowances,
          net: record.netSalary,
          status: record.status
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=monthly_report_${month}_${year}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      res.status(200).json({
        success: true,
        period,
        count: reportData.length,
        data: reportData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 10. Generate Yearly Report
export const generateYearlyReport = async (req, res) => {
  try {
    const { year, format = 'json' } = req.query;
    
    if (!year) {
      return res.status(400).json({
        success: false,
        message: "Year parameter is required"
      });
    }

    const salaries = await SupervisorSalary.find({ year: parseInt(year) })
      .populate('supervisorId', 'name email phone supervisorType')
      .sort({ month: 1, 'supervisorId.name': 1 });

    if (salaries.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No salary records found for the specified year"
      });
    }

    const period = `Year ${year}`;
    
    // Group by supervisor
    const supervisors = {};
    salaries.forEach(salary => {
      if (!supervisors[salary.supervisorId._id]) {
        supervisors[salary.supervisorId._id] = {
          supervisor: salary.supervisorId,
          months: {},
          totalBasic: 0,
          totalNet: 0,
          totalPaid: 0
        };
      }
      
      const supervisor = supervisors[salary.supervisorId._id];
      supervisor.months[salary.month] = {
        monthName: salary.monthName,
        basicSalary: salary.basicSalary,
        netSalary: salary.netMonthlySalary,
        paidAmount: salary.paidAmount,
        status: salary.status
      };
      
      supervisor.totalBasic += salary.basicSalary;
      supervisor.totalNet += salary.netMonthlySalary;
      supervisor.totalPaid += salary.paidAmount;
    });

    if (format === 'pdf') {
      const doc = new PDFDocument();
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=yearly_report_${year}.pdf`);
        res.send(pdfData);
      });

      doc.fontSize(18).text('Yearly Salary Report', { align: 'center' });
      doc.fontSize(12).text(`Year: ${year}`, { align: 'center' });
      doc.moveDown();

      // For each supervisor
      Object.values(supervisors).forEach(supervisor => {
        doc.fontSize(14).text(supervisor.supervisor.name, { underline: true });
        doc.moveDown(0.5);
        
        // Table headers
        doc.font('Helvetica-Bold');
        doc.text('Month', 50);
        doc.text('Basic', 150);
        doc.text('Net Salary', 250);
        doc.text('Paid', 350);
        doc.text('Status', 450);
        doc.font('Helvetica');

        let y = doc.y + 20;
        
        // Monthly data
        Object.entries(supervisor.months).forEach(([month, data]) => {
          doc.text(data.monthName, 50, y);
          doc.text(`₹${data.basicSalary.toFixed(2)}`, 150, y);
          doc.text(`₹${data.netSalary.toFixed(2)}`, 250, y);
          doc.text(`₹${data.paidAmount.toFixed(2)}`, 350, y);
          doc.text(data.status, 450, y);
          y += 20;
        });

        // Totals
        doc.font('Helvetica-Bold');
        doc.text('TOTAL:', 50, y);
        doc.text(`₹${supervisor.totalBasic.toFixed(2)}`, 150, y);
        doc.text(`₹${supervisor.totalNet.toFixed(2)}`, 250, y);
        doc.text(`₹${supervisor.totalPaid.toFixed(2)}`, 350, y);
        doc.font('Helvetica');
        
        doc.moveDown(2);
      });

      doc.end();
    } else if (format === 'excel') {
      const workbook = new exceljs.Workbook();
      
      // Create a worksheet for each supervisor
      Object.values(supervisors).forEach(supervisor => {
        const worksheet = workbook.addWorksheet(supervisor.supervisor.name.substring(0, 31)); // Sheet name limit
        
        worksheet.columns = [
          { header: 'Month', key: 'month', width: 15 },
          { header: 'Basic Salary', key: 'basic', width: 15 },
          { header: 'Net Salary', key: 'net', width: 15 },
          { header: 'Paid Amount', key: 'paid', width: 15 },
          { header: 'Status', key: 'status', width: 15 }
        ];

        Object.entries(supervisor.months).forEach(([month, data]) => {
          worksheet.addRow({
            month: data.monthName,
            basic: data.basicSalary,
            net: data.netSalary,
            paid: data.paidAmount,
            status: data.status
          });
        });

        // Add totals row
        worksheet.addRow([]);
        worksheet.addRow({
          month: 'TOTAL',
          basic: supervisor.totalBasic,
          net: supervisor.totalNet,
          paid: supervisor.totalPaid
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=yearly_report_${year}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      res.status(200).json({
        success: true,
        period,
        count: Object.keys(supervisors).length,
        data: Object.values(supervisors).map(supervisor => ({
          supervisor: supervisor.supervisor,
          months: supervisor.months,
          totals: {
            basicSalary: supervisor.totalBasic,
            netSalary: supervisor.totalNet,
            paidAmount: supervisor.totalPaid
          }
        }))
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};