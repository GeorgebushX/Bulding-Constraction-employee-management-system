


import SupervisorSalary from "../models/SupervisorSalary.js";
import AttendanceSupervisor from "../models/AttendanceSupervisor.js";
import Supervisor from "../models/Supervisor.js";
import exceljs from 'exceljs';
import pdfkit from 'pdfkit';

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
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
  Overtime: 1500,
  null: 0,
};

export const createSalary = async (req, res) => {
  try {
    const { name, date, allowances = 0, deductions = 0, paidAmount = 0 } = req.body;

    // Validate required fields
    if (!name || !date) {
      return res.status(400).json({
        success: false,
        message: "Please select a supervisor and provide a date"
      });
    }

    // Extract ID from format "Name (ID)"
    const idMatch = name.match(/\((\d+)\)$/);
    if (!idMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid supervisor format. Please select from the list"
      });
    }

    const supervisorId = parseInt(idMatch[1]);

    // Find supervisor by ID
    const supervisor = await Supervisor.findById(supervisorId);
    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: "Selected supervisor not found"
      });
    }

    // Find attendance records
    const attendanceRecords = await AttendanceSupervisor.find({
      supervisorId: supervisor._id,
      date: date
    }).populate('supervisorId', 'name email photo');

    if (attendanceRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No attendance records found for ${supervisor.name} on ${date}`
      });
    }

    const attendance = attendanceRecords[0];
    const [day, month, year] = date.split('/').map(Number);
    const jsDate = new Date(year, month - 1, day);
    const week = getWeekNumber(jsDate);
    const monthName = getMonthName(month);

    const validStatuses = Object.keys(SALARY_RATES);
    if (attendance.status && !validStatuses.includes(attendance.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid attendance status. Valid statuses are: ${validStatuses.join(', ')}`
      });
    }

    const basicSalary = attendance.status ? SALARY_RATES[attendance.status] : 0;
    const netDailySalary = basicSalary + parseFloat(allowances) - parseFloat(deductions);

    // Calculate weekly salary by summing all daily salaries in the same week
    const weeklySalaries = await SupervisorSalary.find({
      supervisorId: supervisor._id,
      week,
      month,
      year
    });
    
    const netWeeklySalary = weeklySalaries.reduce(
      (sum, record) => sum + record.netDailySalary,
      netDailySalary
    );

    // Calculate monthly salary by summing all daily salaries in the same month
    const monthlySalaries = await SupervisorSalary.find({
      supervisorId: supervisor._id,
      month,
      year
    });
    
    const netMonthlySalary = monthlySalaries.reduce(
      (sum, record) => sum + record.netDailySalary,
      netDailySalary
    );

    // Calculate payment status and balance based on WEEKLY salary
    const parsedPaidAmount = parseFloat(paidAmount) || 0;
    const balanceAmount = netWeeklySalary - parsedPaidAmount;
    let status = "Pending";
    
    if (parsedPaidAmount > 0) {
      status = parsedPaidAmount >= netWeeklySalary ? "Paid" : "Partial";
    }

    const newSalary = await SupervisorSalary.create({
      supervisorId: supervisor._id,
      attendanceId: attendance._id,
      date,
      week,
      month,
      monthName,
      year,
      basicSalary,
      allowances: parseFloat(allowances) || 0,
      deductions: parseFloat(deductions) || 0,
      netDailySalary,
      netWeeklySalary,
      netMonthlySalary,
      paidAmount: parsedPaidAmount,
      balanceAmount,
      status,
      paymentDate: status !== "Pending" ? new Date() : null
    });

    // Update all existing records in the same week with new weekly total
    await SupervisorSalary.updateMany(
      {
        supervisorId: supervisor._id,
        week,
        month,
        year,
        _id: { $ne: newSalary._id }
      },
      { $set: { netWeeklySalary } }
    );

    // Update all existing records in the same month with new monthly total
    await SupervisorSalary.updateMany(
      {
        supervisorId: supervisor._id,
        month,
        year,
        _id: { $ne: newSalary._id }
      },
      { $set: { netMonthlySalary } }
    );

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
      message: error.message
    });
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
      supervisorId: salary.supervisorId,
      attendanceId: salary.attendanceId,
      date: salary.date,
      week: salary.week,
      month: salary.month,
      monthName: salary.monthName,
      year: salary.year,
      basicSalary: salary.basicSalary,
      allowances: salary.allowances,
      deductions: salary.deductions,
      netDailySalary: salary.netDailySalary,
      netWeeklySalary: salary.netWeeklySalary,
      netMonthlySalary: salary.netMonthlySalary,
      paidAmount: salary.paidAmount,
      balanceAmount: salary.balanceAmount,
      status: salary.status,
      paymentDate: salary.paymentDate ? formatDate(salary.paymentDate) : null,
      createdAt: formatDate(salary.createdAt),
      updatedAt: formatDate(salary.updatedAt)
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
      supervisorId: salary.supervisorId,
      attendanceId: salary.attendanceId,
      date: salary.date,
      week: salary.week,
      month: salary.month,
      monthName: salary.monthName,
      year: salary.year,
      basicSalary: salary.basicSalary,
      allowances: salary.allowances,
      deductions: salary.deductions,
      netDailySalary: salary.netDailySalary,
      netWeeklySalary: salary.netWeeklySalary,
      netMonthlySalary: salary.netMonthlySalary,
      paidAmount: salary.paidAmount,
      balanceAmount: salary.balanceAmount,
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
    const { allowances, deductions, paidAmount, status } = req.body;

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
    if (paidAmount !== undefined) {
      salary.paidAmount = parseFloat(paidAmount) || 0;
      salary.balanceAmount = salary.netWeeklySalary - salary.paidAmount;
    }
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

// Helper function to update weekly salary aggregates
const updateWeeklySalary = async (supervisorId, week, month, year) => {
  const weeklySalaries = await SupervisorSalary.find({
    supervisorId,
    week,
    month,
    year
  });
  
  const netWeeklySalary = weeklySalaries.reduce(
    (sum, record) => sum + record.netDailySalary,
    0
  );

  await SupervisorSalary.updateMany(
    {
      supervisorId,
      week,
      month,
      year
    },
    { $set: { netWeeklySalary } }
  );
};

// Helper function to update monthly salary aggregates
const updateMonthlySalary = async (supervisorId, month, year) => {
  const monthlySalaries = await SupervisorSalary.find({
    supervisorId,
    month,
    year
  });
  
  const netMonthlySalary = monthlySalaries.reduce(
    (sum, record) => sum + record.netDailySalary,
    0
  );

  await SupervisorSalary.updateMany(
    {
      supervisorId,
      month,
      year
    },
    { $set: { netMonthlySalary } }
  );
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

// Report Generation Functions (updated to include paidAmount and balanceAmount)
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
      { text: 'Paid', x: 590, width: 60 },
      { text: 'Balance', x: 680, width: 80 },
      { text: 'Status', x: 770, width: 80 }
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
      doc.text(formatCurrency(record.paidAmount), 590, y, { width: 60 });
      doc.text(formatCurrency(record.balanceAmount), 680, y, { width: 80 });
      doc.text(record.status, 770, y, { width: 80 });
      y += 20;
    });

    // Summary
    doc.moveDown(2);
    doc.font('Helvetica-Bold');
    const totalDaily = data.reduce((sum, record) => sum + record.netDailySalary, 0);
    const totalPaid = data.reduce((sum, record) => sum + record.paidAmount, 0);
    const totalBalance = data.reduce((sum, record) => sum + record.balanceAmount, 0);
    
    doc.text(`Total Daily: ${formatCurrency(totalDaily)}`, 500, y + 20);
    doc.text(`Total Paid: ${formatCurrency(totalPaid)}`, 590, y + 20);
    doc.text(`Total Balance: ${formatCurrency(totalBalance)}`, 680, y + 20);

    doc.end();
  });
};

const generateExcelReport = (data, title, period) => {
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('Salary Report');

  // Add Report Header
  worksheet.mergeCells('A1:I1');
  worksheet.getCell('A1').value = `Supervisor Salary Report - ${title}`;
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:I2');
  worksheet.getCell('A2').value = `Period: ${period}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A3:I3');
  worksheet.getCell('A3').value = `Generated on: ${formatDate(new Date().toISOString())}`;
  worksheet.getCell('A3').alignment = { horizontal: 'right' };

  // Add Column Headers
  worksheet.addRow([]);
  const headerRow = worksheet.addRow([
    'Supervisor', 'Date', 'Basic Salary', 'Allowances', 'Deductions', 
    'Daily Net', 'Paid Amount', 'Balance Amount', 'Status'
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
      record.paidAmount,
      record.balanceAmount,
      record.status
    ]);
  });

  // Add Summary
  const lastRow = worksheet.lastRow.number;
  worksheet.addRow([]);
  const totalRow = worksheet.addRow([
    '', '', '', '', 'Total:',
    { formula: `SUM(F5:F${lastRow})` },
    { formula: `SUM(G5:G${lastRow})` },
    { formula: `SUM(H5:H${lastRow})` },
    ''
  ]);
  totalRow.eachCell(cell => {
    if (cell.value) cell.font = { bold: true };
  });

  // Format columns
  worksheet.columns = [
    { key: 'name', width: 25 },
    { key: 'date', width: 15 },
    { key: 'basic', width: 15, style: { numFmt: '"₹"#,##0.00' } },
    { key: 'allowances', width: 15, style: { numFmt: '"₹"#,##0.00' } },
    { key: 'deductions', width: 15, style: { numFmt: '"₹"#,##0.00' } },
    { key: 'daily', width: 15, style: { numFmt: '"₹"#,##0.00' } },
    { key: 'paid', width: 15, style: { numFmt: '"₹"#,##0.00' } },
    { key: 'balance', width: 15, style: { numFmt: '"₹"#,##0.00' } },
    { key: 'status', width: 15 }
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
      paidAmount: salary.paidAmount,
      balanceAmount: salary.balanceAmount,
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
      paidAmount: salary.paidAmount,
      balanceAmount: salary.balanceAmount,
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
      netMonthlySalary: salary.netMonthlySalary,
      paidAmount: salary.paidAmount,
      balanceAmount: salary.balanceAmount,
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
      netMonthlySalary: salary.netMonthlySalary,
      paidAmount: salary.paidAmount,
      balanceAmount: salary.balanceAmount,
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

// 10. Generate Salary Receipt
export const generateSalaryReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    
    const salary = await SupervisorSalary.findById(id)
      .populate('supervisorId', 'name email phone address')
      .populate('attendanceId', 'date status');

    if (!salary) {
      return res.status(404).json({
        success: false,
        error: "Salary record not found"
      });
    }

    // Generate PDF receipt
    const pdfBuffer = await generateReceiptPDF(salary);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=salary_receipt_${id}.pdf`);
    return res.send(pdfBuffer);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Helper function to generate receipt PDF
const generateReceiptPDF = (salary) => {
  return new Promise((resolve) => {
    const doc = new pdfkit();
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Company Header
    doc.image('path/to/company/logo.png', 50, 50, { width: 100 });
    doc.fontSize(20).text('ABC Company', 170, 60);
    doc.fontSize(12).text('123 Business Street, City, Country', 170, 85);
    doc.fontSize(10).text('Phone: +123456789 | Email: info@abccompany.com', 170, 100);
    
    // Receipt Title
    doc.moveDown(3);
    doc.fontSize(18).text('SALARY PAYMENT RECEIPT', { align: 'center', underline: true });
    doc.moveDown();

    // Receipt Details
    const receiptDetails = [
      { label: 'Receipt No.', value: `SR-${salary._id}` },
      { label: 'Payment Date', value: salary.paymentDate ? formatDate(salary.paymentDate) : 'N/A' },
      { label: 'Issued Date', value: formatDate(new Date().toISOString()) },
    ];

    let y = 200;
    receiptDetails.forEach(detail => {
      doc.fontSize(12).text(`${detail.label}:`, 50, y);
      doc.fontSize(12).text(detail.value, 200, y);
      y += 20;
    });

    // Supervisor Information
    doc.moveDown(2);
    doc.fontSize(14).text('Supervisor Information', { underline: true });
    doc.moveDown(0.5);
    
    const supervisorInfo = [
      { label: 'Name', value: salary.supervisorId.name },
      { label: 'ID', value: salary.supervisorId._id },
      { label: 'Email', value: salary.supervisorId.email || 'N/A' },
      { label: 'Phone', value: salary.supervisorId.phone || 'N/A' },
    ];

    supervisorInfo.forEach(info => {
      doc.fontSize(12).text(`${info.label}:`, 50, y);
      doc.fontSize(12).text(info.value, 200, y);
      y += 20;
    });

    // Salary Details
    doc.moveDown(2);
    doc.fontSize(14).text('Payment Details', { underline: true });
    doc.moveDown(0.5);

    const salaryDetails = [
      { label: 'Payment Period', value: `${salary.monthName} ${salary.year}, Week ${salary.week}` },
      { label: 'Attendance Date', value: salary.date },
      { label: 'Attendance Status', value: salary.attendanceId.status },
      { label: 'Basic Salary', value: formatCurrency(salary.basicSalary) },
      { label: 'Allowances', value: formatCurrency(salary.allowances) },
      { label: 'Deductions', value: formatCurrency(salary.deductions) },
      { label: 'Net Salary (Daily)', value: formatCurrency(salary.netDailySalary) },
      { label: 'Paid Amount', value: formatCurrency(salary.paidAmount) },
      { label: 'Balance Amount', value: formatCurrency(salary.balanceAmount) },
      { label: 'Payment Status', value: salary.status },
    ];

    salaryDetails.forEach(detail => {
      doc.fontSize(12).text(`${detail.label}:`, 50, y);
      doc.fontSize(12).text(detail.value, 200, y);
      y += 20;
    });

    // Total and Signature
    doc.moveDown(2);
    doc.fontSize(14).text(`Total Paid: ${formatCurrency(salary.paidAmount)}`, 400, y, { bold: true });
    y += 40;
    
    doc.moveTo(400, y).lineTo(550, y).stroke();
    doc.fontSize(12).text('Authorized Signature', 450, y + 5, { align: 'center' });

    // Footer
    doc.moveDown(4);
    doc.fontSize(10).text('This is a computer generated receipt. No signature required.', { align: 'center' });
    doc.fontSize(8).text('Thank you for your service!', { align: 'center' });

    doc.end();
  });
};