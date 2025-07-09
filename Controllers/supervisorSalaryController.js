// import SupervisorSalary from "../models/SupervisorSalary.js";
// import AttendanceSupervisor from "../models/AttendanceSupervisor.js";
// import Supervisor from "../models/Supervisor.js";

// // Create Salary
// export const createSalary = async (req, res) => {
//     try {
//         const { supervisorId, attendanceId, week, month, year, allowances, deductions } = req.body;

//         if (!month || !year) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Missing required fields",
//             });
//         }

//         // Get the attendance record to check status
//         const attendance = await AttendanceSupervisor.findById(attendanceId);
//         if (!attendance) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Attendance record not found",
//             });
//         }

//         // Calculate basic salary based on attendance status
//         let basicSalary = 0;
//         switch (attendance.status) {
//             case "Fullday":
//                 basicSalary = 1000;
//                 break;
//             case "Halfday":
//                 basicSalary = 500;
//                 break;
//             case "overtime":
//                 basicSalary = 1500;
//                 break;
//             default:
//                 return res.status(400).json({
//                     success: false,
//                     message: "Invalid attendance status",
//                 });
//         }

//         // Convert values to numbers
//         const allow = parseFloat(allowances) || 0;
//         const deduct = parseFloat(deductions) || 0;
//         const netSalary = basicSalary + allow - deduct;

//         // Create Salary Record
//         const newSalary = new SupervisorSalary({
//             supervisorId,
//             attendanceId,
//             week,
//             month,
//             year,
//             basicSalary,
//             allowances: allow,
//             deductions: deduct,
//             netSalary,
//         });

//         await newSalary.save();
//         res.status(201).json({
//             success: true,
//             message: "Salary created successfully",
//             data: newSalary,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Failed to create salary",
//             error: error.message,
//         });
//     }
// };

// // Get All Salaries
// export const getAllSalaries = async (req, res) => {
//     try {
//         const salaries = await SupervisorSalary.find()
//             .populate('supervisorId')
//             .populate('attendanceId');

//         res.status(200).json({
//             success: true,
//             message: "All salaries retrieved successfully",
//             data: salaries,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Failed to retrieve salaries",
//             error: error.message,
//         });
//     }
// };

// // Get Salary by ID
// export const getSalaryById = async (req, res) => {
//     try {
//         const salary = await SupervisorSalary.findById(req.params.id)
//             .populate('supervisorId')
//             .populate('attendanceId');

//         if (!salary) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Salary not found",
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Salary retrieved successfully",
//             data: salary,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Failed to retrieve salary",
//             error: error.message,
//         });
//     }
// };

// // Update Salary
// export const updateSalary = async (req, res) => {
//     try {
//         const { allowances, deductions, status } = req.body;
        
//         // Find the salary record
//         const salary = await SupervisorSalary.findById(req.params.id);
//         if (!salary) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Salary not found",
//             });
//         }

//         // Update fields
//         if (allowances !== undefined) salary.allowances = parseFloat(allowances) || 0;
//         if (deductions !== undefined) salary.deductions = parseFloat(deductions) || 0;
//         if (status) salary.status = status;

//         // Recalculate net salary
//         salary.netSalary = salary.basicSalary + salary.allowances - salary.deductions;

//         await salary.save();

//         res.status(200).json({
//             success: true,
//             message: "Salary updated successfully",
//             data: salary,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Failed to update salary",
//             error: error.message,
//         });
//     }
// };

// // Delete Salary by ID
// export const deleteSalaryById = async (req, res) => {
//     try {
//         const salary = await SupervisorSalary.findByIdAndDelete(req.params.id);
        
//         if (!salary) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Salary not found",
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Salary deleted successfully",
//             data: salary,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Failed to delete salary",
//             error: error.message,
//         });
//     }
// };

// // Delete All Salaries
// export const deleteAllSalaries = async (req, res) => {
//     try {
//         await SupervisorSalary.deleteMany({});
        
//         res.status(200).json({
//             success: true,
//             message: "All salaries deleted successfully",
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Failed to delete all salaries",
//             error: error.message,
//         });
//     }
// };






import SupervisorSalary from "../models/SupervisorSalary.js";
import AttendanceSupervisor from "../models/AttendanceSupervisor.js";
import Supervisor from "../models/Supervisor.js";
import exceljs from 'exceljs';
import pdfkit from 'pdfkit';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// 1. Create Salary Record
export const createSalary = async (req, res) => {
  try {
    const { supervisorId, attendanceId, week, month, year, allowances, deductions } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: "month, and year are required fields"
      });
    }

    // Get the attendance record
    const attendance = await AttendanceSupervisor.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: "Attendance record not found"
      });
    }

    // Calculate basic salary based on attendance status
    let basicSalary = 0;
    switch (attendance.status) {
      case "Fullday":
        basicSalary = 1000;
        break;
      case "Halfday":
        basicSalary = 500;
        break;
      case "Overtime":
        basicSalary = 1500;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid attendance status"
        });
    }

    // Calculate net salary
    const allow = parseFloat(allowances) || 0;
    const deduct = parseFloat(deductions) || 0;
    const netSalary = basicSalary + allow - deduct;

    // Create new salary record
    const newSalary = await SupervisorSalary.create({
      supervisorId,
      attendanceId,
      week,
      month,
      year,
      basicSalary,
      allowances: allow,
      deductions: deduct,
      netSalary,
      status: "Pending"
    });

    // Populate supervisor details
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

// 2. Get All Salaries
export const getAllSalaries = async (req, res) => {
  try {
    const salaries = await SupervisorSalary.find({})
      .populate('supervisorId', 'name email photo')
      .populate('attendanceId', 'date status')
      .sort({ year: -1, month: -1, week: -1 })
      .lean();

    const formattedData = salaries.map(salary => ({
      _id: salary._id,
      period: salary.week ? `Week ${salary.week}, ${salary.month} ${salary.year}` : `${salary.month} ${salary.year}`,
      supervisor: {
        _id: salary.supervisorId._id,
        name: salary.supervisorId.name,
        email: salary.supervisorId.email,
        photo: salary.supervisorId.photo
      },
      attendance: salary.attendanceId ? {
        date: formatDate(salary.attendanceId.date),
        status: salary.attendanceId.status
      } : null,
      basicSalary: formatCurrency(salary.basicSalary),
      allowances: formatCurrency(salary.allowances),
      deductions: formatCurrency(salary.deductions),
      netSalary: formatCurrency(salary.netSalary),
      status: salary.status,
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
      _id: salary._id,
      period: salary.week ? `Week ${salary.week}, ${salary.month} ${salary.year}` : `${salary.month} ${salary.year}`,
      supervisor: {
        _id: salary.supervisorId._id,
        name: salary.supervisorId.name,
        email: salary.supervisorId.email,
        photo: salary.supervisorId.photo
      },
      attendance: salary.attendanceId ? {
        date: formatDate(salary.attendanceId.date),
        status: salary.attendanceId.status
      } : null,
      basicSalary: formatCurrency(salary.basicSalary),
      allowances: formatCurrency(salary.allowances),
      deductions: formatCurrency(salary.deductions),
      netSalary: formatCurrency(salary.netSalary),
      status: salary.status,
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
    if (status) salary.status = status;

    // Recalculate net salary
    salary.netSalary = salary.basicSalary + salary.allowances - salary.deductions;

    await salary.save();

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
    const salary = await SupervisorSalary.findByIdAndDelete(req.params.id);
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        error: "Salary record not found"
      });
    }

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

// Generate PDF Report
const generateSalaryPDFReport = (data, periodType, periodValue) => {
  return new Promise((resolve) => {
    const doc = new pdfkit();
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Report Header
    doc.fontSize(18).text(`Supervisor Salary ${periodType} Report`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${periodValue}`, { align: 'center' });
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown(2);

    // Column Headers
    doc.font('Helvetica-Bold');
    doc.text('Supervisor', 50, 150);
    doc.text('Basic Salary', 200, 150);
    doc.text('Allowances', 280, 150);
    doc.text('Deductions', 360, 150);
    doc.text('Net Salary', 440, 150);
    doc.text('Status', 520, 150);
    doc.font('Helvetica');

    // Data Rows
    let y = 170;
    data.forEach((record) => {
      doc.text(record.supervisor.name, 50, y);
      doc.text(formatCurrency(record.basicSalary), 200, y);
      doc.text(formatCurrency(record.allowances), 280, y);
      doc.text(formatCurrency(record.deductions), 360, y);
      doc.text(formatCurrency(record.netSalary), 440, y);
      doc.text(record.status, 520, y);
      y += 20;
    });

    // Summary
    doc.moveDown(2);
    doc.font('Helvetica-Bold');
    const totalNet = data.reduce((sum, record) => sum + record.netSalary, 0);
    doc.text(`Total Net Salaries: ${formatCurrency(totalNet)}`, 400, y + 20);

    doc.end();
  });
};

// Generate Excel Report
const generateSalaryExcelReport = (data, periodType, periodValue) => {
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('Salary Report');

  // Add Report Header
  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').value = `Supervisor Salary ${periodType} Report`;
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:F2');
  worksheet.getCell('A2').value = `Period: ${periodValue}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A3:F3');
  worksheet.getCell('A3').value = `Generated on: ${new Date().toLocaleDateString()}`;
  worksheet.getCell('A3').alignment = { horizontal: 'right' };

  // Add Column Headers
  worksheet.addRow([]); // Empty row
  worksheet.addRow(['Supervisor ID', 'Supervisor Name', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary', 'Status']);
  worksheet.lastRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  });

  // Add Data Rows
  data.forEach(record => {
    worksheet.addRow([
      record.supervisor._id,
      record.supervisor.name,
      record.basicSalary,
      record.allowances,
      record.deductions,
      record.netSalary,
      record.status
    ]);
  });

  // Add Summary
  const lastRow = worksheet.lastRow.number;
  worksheet.addRow([]);
  worksheet.addRow(['', '', '', '', 'Total:', { formula: `SUM(F5:F${lastRow})`, result: data.reduce((sum, r) => sum + r.netSalary, 0) }]);
  worksheet.lastRow.getCell(6).font = { bold: true };

  // Format columns
  worksheet.columns = [
    { key: 'id', width: 15 },
    { key: 'name', width: 25 },
    { key: 'basic', width: 15, style: { numFmt: '"$"#,##0.00' } },
    { key: 'allowances', width: 15, style: { numFmt: '"$"#,##0.00' } },
    { key: 'deductions', width: 15, style: { numFmt: '"$"#,##0.00' } },
    { key: 'net', width: 15, style: { numFmt: '"$"#,##0.00' } },
    { key: 'status', width: 15 }
  ];

  return workbook;
};

// 6. Weekly Salary Report
export const getWeeklySalaryReport = async (req, res) => {
  try {
    const { week, month, year, format = 'json' } = req.query;
    
    if (!week || !month || !year) {
      return res.status(400).json({
        success: false,
        error: "Week, month, and year parameters are required for weekly report"
      });
    }

    const salaries = await SupervisorSalary.find({ week, month, year })
      .populate('supervisorId', 'name email photo _id')
      .populate('attendanceId', 'date status')
      .sort({ 'supervisorId.name': 1 });

    if (salaries.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No salary records found for the specified week"
      });
    }

    const periodValue = `Week ${week}, ${month} ${year}`;

    if (format === 'pdf') {
      const pdfBuffer = await generateSalaryPDFReport(salaries, 'Weekly', periodValue);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=salary_weekly_report_${week}_${month}_${year}.pdf`);
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const workbook = generateSalaryExcelReport(salaries, 'Weekly', periodValue);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=salary_weekly_report_${week}_${month}_${year}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      const formattedData = salaries.map(salary => ({
        _id: salary._id,
        period: periodValue,
        supervisor: {
          _id: salary.supervisorId._id,
          name: salary.supervisorId.name,
          email: salary.supervisorId.email,
          photo: salary.supervisorId.photo
        },
        attendance: salary.attendanceId ? {
          date: formatDate(salary.attendanceId.date),
          status: salary.attendanceId.status
        } : null,
        basicSalary: salary.basicSalary,
        allowances: salary.allowances,
        deductions: salary.deductions,
        netSalary: salary.netSalary,
        status: salary.status
      }));

      return res.status(200).json({
        success: true,
        period: 'weekly',
        week,
        month,
        year,
        count: formattedData.length,
        data: formattedData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 7. Monthly Salary Report
export const getMonthlySalaryReporpt = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: "Month and year parameters are required for monthly report"
      });
    }

    const salaries = await SupervisorSalary.find({ month, year })
      .populate('supervisorId', 'name email photo _id')
      .populate('attendanceId', 'date status')
      .sort({ 'supervisorId.name': 1 });

    if (salaries.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No salary records found for the specified month"
      });
    }

    const periodValue = `${month} ${year}`;

    if (format === 'pdf') {
      const pdfBuffer = await generateSalaryPDFReport(salaries, 'Monthly', periodValue);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=salary_monthly_report_${month}_${year}.pdf`);
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const workbook = generateSalaryExcelReport(salaries, 'Monthly', periodValue);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=salary_monthly_report_${month}_${year}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      const formattedData = salaries.map(salary => ({
        _id: salary._id,
        period: periodValue,
        supervisor: {
          _id: salary.supervisorId._id,
          name: salary.supervisorId.name,
          email: salary.supervisorId.email,
          photo: salary.supervisorId.photo
        },
        attendance: salary.attendanceId ? {
          date: formatDate(salary.attendanceId.date),
          status: salary.attendanceId.status
        } : null,
        basicSalary: salary.basicSalary,
        allowances: salary.allowances,
        deductions: salary.deductions,
        netSalary: salary.netSalary,
        status: salary.status
      }));

      return res.status(200).json({
        success: true,
        period: 'monthly',
        month,
        year,
        count: formattedData.length,
        data: formattedData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 8. Supervisor-specific Salary Report
export const getSupervisorSalaryReport = async (req, res) => {
  try {
    const { supervisorId, format = 'json' } = req.query;
    
    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        error: "Supervisor ID parameter is required"
      });
    }

    const salaries = await SupervisorSalary.find({ supervisorId })
      .populate('supervisorId', 'name email photo _id')
      .populate('attendanceId', 'date status')
      .sort({ year: -1, month: -1, week: -1 });

    if (salaries.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No salary records found for the specified supervisor"
      });
    }

    const supervisorName = salaries[0].supervisorId.name;

    if (format === 'pdf') {
      const pdfBuffer = await generateSalaryPDFReport(salaries, 'Supervisor', supervisorName);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=salary_report_${supervisorName.replace(/\s+/g, '_')}.pdf`);
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const workbook = generateSalaryExcelReport(salaries, 'Supervisor', supervisorName);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=salary_report_${supervisorName.replace(/\s+/g, '_')}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      const formattedData = salaries.map(salary => ({
        _id: salary._id,
        period: salary.week ? `Week ${salary.week}, ${salary.month} ${salary.year}` : `${salary.month} ${salary.year}`,
        supervisor: {
          _id: salary.supervisorId._id,
          name: salary.supervisorId.name,
          email: salary.supervisorId.email,
          photo: salary.supervisorId.photo
        },
        attendance: salary.attendanceId ? {
          date: formatDate(salary.attendanceId.date),
          status: salary.attendanceId.status
        } : null,
        basicSalary: salary.basicSalary,
        allowances: salary.allowances,
        deductions: salary.deductions,
        netSalary: salary.netSalary,
        status: salary.status,
        createdAt: formatDate(salary.createdAt)
      }));

      return res.status(200).json({
        success: true,
        period: 'supervisor',
        supervisorId,
        count: formattedData.length,
        data: formattedData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};