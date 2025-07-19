
import mongoose from 'mongoose';
import SupervisorSalary from '../models/SupervisorSalary.js';
import Supervisor from '../models/Supervisor.js';
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

// 1. Create Monthly Salary
export const createMonthlySalary = async (req, res) => {
    try {
        const { name, date, actualMonthlySalary, allowances = 0, deductions = 0, advanceSalary = 0, paidAmount = 0 } = req.body;

        // Validate inputs
        if (!name || !date) {
            return res.status(400).json({
                success: false,
                message: "Name and date are required"
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

        // Create new salary record
        const salaryRecord = new SupervisorSalary({
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
            totalDays
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
// export const getAllSalaries = async (req, res) => {
//     try {
//         const salaries = await SupervisorSalary.find({})
//             .populate('supervisorId', 'name email phone supervisorType')
//             .sort({ _id: 1 });

//         res.status(200).json({
//             success: true,
//             count: salaries.length,
//             data: salaries.map(salary => ({
//                 ...salary.toObject(),
//                 supervisorId: {
//                     _id: salary.supervisorId._id,
//                     name: salary.supervisorId.name,
//                     email: salary.supervisorId.email,
//                     phone: salary.supervisorId.phone,
//                     supervisorType: salary.supervisorId.supervisorType
//                 }
//             }))
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };


// 2. Get All Salary Records (with robust supervisor handling)
export const getAllSalaries = async (req, res) => {
    try {
        // Get all salaries with supervisor population
        const salaries = await SupervisorSalary.find({})
            .populate({
                path: 'supervisorId',
                select: 'name email phone supervisorType',
                model: 'Supervisor', // Explicitly specify the model
                options: { allowNull: true }
            })
            .sort({ date: -1, _id: 1 }) // Sort by date descending, then ID
            .lean(); // Convert to plain JS objects

        // Transform data with null checks
        const responseData = salaries.map(salary => {
            // Handle case where supervisor is deleted but reference exists
            const supervisorData = salary.supervisorId ? {
                _id: salary.supervisorId._id,
                name: salary.supervisorId.name || 'Deleted Supervisor',
                email: salary.supervisorId.email || null,
                phone: salary.supervisorId.phone || null,
                supervisorType: salary.supervisorId.supervisorType || null
            } : {
                _id: null,
                name: 'Unknown Supervisor',
                email: null,
                phone: null,
                supervisorType: null
            };

            return {
                ...salary,
                supervisorId: supervisorData
            };
        });

        res.status(200).json({
            success: true,
            count: responseData.length,
            data: responseData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message.includes('Cast to ObjectId failed') 
                ? 'Invalid supervisor reference format' 
                : error.message
        });
    }
};

// 3. Get Salary by ID
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

        res.status(200).json({
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

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 4. Update Salary Record
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

// 6. Assign Salary to All Supervisors for a Given Month
export const assignSalaryToAllSupervisors = async (req, res) => {
    try {
        const { date, actualMonthlySalary, allowances = 0, deductions = 0, advanceSalary = 0, paidAmount = 0 } = req.body;

        // Validate inputs
        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Date is required"
            });
        }

        // Parse the date to get month and year
        const [day, month, year] = date.split('/').map(Number);
        const monthName = getMonthName(month);

        // Get all supervisors and filter out those with no attendance records
const supervisors = await Supervisor.find({});

const activeSupervisors = supervisors.filter(supervisor => 
    supervisor.attendanceRecords && supervisor.attendanceRecords.length > 0
);

if (activeSupervisors.length === 0) {
    return res.status(404).json({
        success: false,
        message: "No supervisors with attendance records found"
    });
}
        
        const results = [];
        const errors = [];

        // Process each supervisor
        for (const supervisor of supervisors) {
            try {
                // Check if salary already exists for this month
                const existingSalary = await SupervisorSalary.findOne({
                    supervisorId: supervisor._id,
                    month,
                    year
                });

                if (existingSalary) {
                    errors.push({
                        supervisor: supervisor.name,
                        message: "Salary already exists for this month"
                    });
                    continue;
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

                // Create new salary record
                const salaryRecord = new SupervisorSalary({
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
                    totalDays
                });

                await salaryRecord.save();

                results.push({
                    supervisorId: supervisor._id,
                    supervisorName: supervisor.name,
                    salaryId: salaryRecord._id,
                    status: "Success"
                });

            } catch (error) {
                errors.push({
                    supervisor: supervisor.name,
                    message: error.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: "Salary assignment process completed",
            stats: {
                totalSupervisors: supervisors.length,
                successCount: results.length,
                errorCount: errors.length
            },
            results,
            errors
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};




// Get Salaries by Date
export const getSalariesByDate = async (req, res) => {
  
    try {
    
    const date = `${req.params.day}/${req.params.month}/${req.params.year}`;

    // Validate date format (DD/MM/YYYY)
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use DD/MM/YYYY"
      });
    }

        // Find all salaries for the given date
        const salaries = await SupervisorSalary.find({ date })
            .populate('supervisorId', 'name email phone supervisorType')
            .sort({ 'supervisorId.name': 1 });

        if (salaries.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No salary records found for the specified date"
            });
        }

        res.status(200).json({
            success: true,
            date,
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




// // 9. Get Salaries by Month
// export const getSalariesByMonth = async (req, res) => {
//     try {
//         const { month, year } = req.params;

//         // Validate month (1-12) and year
//         if (isNaN(month) || month < 1 || month > 12 || isNaN(year)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid month or year. Month must be between 1-12"
//             });
//         }

//         const monthName = getMonthName(parseInt(month));

//         // Find all salaries for the given month and year
//         const salaries = await SupervisorSalary.find({ 
//             month: parseInt(month),
//             year: parseInt(year)
//         })
//         .populate('supervisorId', 'name email phone supervisorType')
//         .sort({ 'supervisorId.name': 1 });

//         if (salaries.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: `No salary records found for ${monthName} ${year}`
//             });
//         }

//         res.status(200).json({
//             success: true,
//             period: `${monthName} ${year}`,
//             count: salaries.length,
//             data: salaries.map(salary => ({
//                 ...salary.toObject(),
//                 supervisorId: {
//                     _id: salary.supervisorId._id,
//                     name: salary.supervisorId.name,
//                     email: salary.supervisorId.email,
//                     phone: salary.supervisorId.phone,
//                     supervisorType: salary.supervisorId.supervisorType
//                 }
//             }))
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

export const getSalariesByMonthYear = async (req, res) => {
    // try {
    //     const { month, year } = req.params;

    //     // Combine month and year with slash (MM/YYYY)
    //     const monthYearString = `${month.padStart(2, '0')}/${year}`;

    //     // Validate MM/YYYY format
    //     if (!/^\d{2}\/\d{4}$/.test(monthYearString)) {
    //         return res.status(400).json({
    //             success: false,
    //             message: "Invalid date format. Please use MM/YYYY format in the URL (e.g., 07/2025)"
    //         });
    //     }



    try {
    const { MM, YYYY } = req.params;
    const format = req.query.format || 'json'; // Default to JSON, options: json, excel, pdf
    const monthYear = `${MM}/${YYYY}`;

    // Validate month/year format
    if (!/^\d{2}\/\d{4}$/.test(monthYear)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month/year format. Please use MM/YYYY"
      });
    }




        // Convert to numbers
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        // Additional validation
        if (monthNum < 1 || monthNum > 12) {
            return res.status(400).json({
                success: false,
                message: "Month must be between 01-12"
            });
        }

        if (yearNum < 2000 || yearNum > 2100) {
            return res.status(400).json({
                success: false,
                message: "Year must be between 2000-2100"
            });
        }

        const monthName = getMonthName(monthNum);

        // Query database
        const salaries = await SupervisorSalary.find({ 
            month: monthNum,
            year: yearNum
        }).populate('supervisorId');

        if (!salaries.length) {
            return res.status(404).json({
                success: false,
                message: `No records found for ${monthName} ${yearNum}`
            });
        }

        return res.status(200).json({
            success: true,
            period: `${monthName} ${yearNum}`,
            count: salaries.length,
            data: salaries
        });

    } catch (error) {
        return res.status(500).json({
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
























// import mongoose from 'mongoose';
// import SupervisorSalary from '../models/SupervisorSalary.js';
// import Supervisor from '../models/Supervisor.js';
// import getNextSalaryId from '../utils/sequenceGenerator.js'; // Correct import path
// import exceljs from 'exceljs';
// import PDFDocument from 'pdfkit';

// // Helper functions
// const formatDate = (dateString) => {
//   if (!dateString) return null;
//   const date = new Date(dateString);
//   const day = String(date.getDate()).padStart(2, '0');
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const year = date.getFullYear();
//   return `${day}/${month}/${year}`;
// };

// const getMonthName = (month) => {
//   const months = [
//     'January', 'February', 'March', 'April', 'May', 'June',
//     'July', 'August', 'September', 'October', 'November', 'December'
//   ];
//   return months[month - 1];
// };

// const getWeekNumber = (date) => {
//   const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
//   const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
//   return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
// };

// // // Auto-increment ID generator
// const getNextSequence = async (name) => {
//   const result = await mongoose.connection.db.collection('counters').findOneAndUpdate(
//     { _id: name },
//     { $inc: { seq: 1 } },
//     { returnOriginal: false, upsert: true }
//   );
//   return result.value.seq;
// };

// // 1. Create Monthly Salary
// export const createMonthlySalary = async (req, res) => {
//   try {
//     const { name, date, actualMonthlySalary, allowances = 0, deductions = 0, advanceSalary = 0, paidAmount = 0 } = req.body;

//     // Validate inputs
//     if (!name) {
//       return res.status(400).json({
//         success: false,
//         message: "Name is required"
//       });
//     }

//     // Parse the date to get month and year
//     const [day, month, year] = date.split('/').map(Number);
//     const monthName = getMonthName(month);

//     // Find supervisor by name
//     const supervisor = await Supervisor.findOne({ name });
//     if (!supervisor) {
//       return res.status(404).json({
//         success: false,
//         message: "Supervisor not found"
//       });
//     }

//     // Calculate working days and basic salary from attendance
//     const attendanceDays = supervisor.attendanceRecords.filter(record => {
//       const [recordDay, recordMonth, recordYear] = record.date.split('/').map(Number);
//       return recordMonth === month && recordYear === year;
//     });

//     const workingDays = attendanceDays.length;
//     const totalDays = new Date(year, month, 0).getDate();

//     // Calculate basic salary based on attendance
//     const basicSalary = attendanceDays.reduce((total, day) => {
//       const rates = {
//         Fullday: 1000,
//         Halfday: 500,
//         Overtime: 1500,
//         null: 0
//       };
//       return total + (rates[day.status] || 0);
//     }, 0);

//     // Calculate net monthly salary (use max of actual or attendance-based)
//     const netMonthlySalary = Math.max(
//       Number(actualMonthlySalary), 
//       basicSalary
//     ) + Number(allowances) - Number(deductions);

//     // Calculate balance
//     const balanceAmount = netMonthlySalary - Number(paidAmount) - Number(advanceSalary);

//     // Determine status
//     let status;
//     if (paidAmount <= 0) {
//       status = "Pending";
//     } else if (balanceAmount <= 0) {
//       status = "Paid";
//     } else {
//       status = "Partial";
//     }

//     // Generate auto-incremented ID
//     const _id = await getNextSequence('supervisorSalaryId');

//     // Create new salary record
//     const salaryRecord = new SupervisorSalary({
//       _id,
//       supervisorId: supervisor._id,
//       month,
//       monthName,
//       year,
//       date: formatDate(new Date(year, month - 1, day)),
//       actualMonthlySalary: Number(actualMonthlySalary),
//       basicSalary,
//       allowances: Number(allowances),
//       deductions: Number(deductions),
//       advanceSalary: Number(advanceSalary),
//       netMonthlySalary,
//       paidAmount: Number(paidAmount),
//       balanceAmount,
//       status,
//       workingDays,
//       totalDays,
//       attendanceRecords: attendanceDays
//     });

//     await salaryRecord.save();

//     res.status(201).json({
//       success: true,
//       data: {
//         ...salaryRecord.toObject(),
//         supervisorId: {
//           _id: supervisor._id,
//           name: supervisor.name,
//           email: supervisor.email,
//           phone: supervisor.phone,
//           supervisorType: supervisor.supervisorType
//         }
//       }
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // 2. Get All Salary Records
// export const getAllSalaries = async (req, res) => {
//   try {
//     const salaries = await SupervisorSalary.find({})
//       .populate('supervisorId', 'name email phone supervisorType')
//       .sort({ _id: 1 });

//     res.status(200).json({
//       success: true,
//       count: salaries.length,
//       data: salaries.map(salary => ({
//         ...salary.toObject(),
//         supervisorId: {
//           _id: salary.supervisorId._id,
//           name: salary.supervisorId.name,
//           email: salary.supervisorId.email,
//           phone: salary.supervisorId.phone,
//           supervisorType: salary.supervisorId.supervisorType
//         }
//       }))
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // 3. Get Salary by ID with PDF Receipt
// export const getSalaryById = async (req, res) => {
//   try {
//     const salary = await SupervisorSalary.findById(req.params.id)
//       .populate('supervisorId', 'name email phone supervisorType');

//     if (!salary) {
//       return res.status(404).json({
//         success: false,
//         message: "Salary record not found"
//       });
//     }

//     // Return JSON response if not requesting PDF
//     if (req.query.format !== 'pdf') {
//       return res.status(200).json({
//         success: true,
//         data: {
//           ...salary.toObject(),
//           supervisorId: {
//             _id: salary.supervisorId._id,
//             name: salary.supervisorId.name,
//             email: salary.supervisorId.email,
//             phone: salary.supervisorId.phone,
//             supervisorType: salary.supervisorId.supervisorType
//           }
//         }
//       });
//     }

//     // Generate PDF receipt
//     const doc = new PDFDocument();
//     const buffers = [];
    
//     doc.on('data', buffers.push.bind(buffers));
//     doc.on('end', () => {
//       const pdfData = Buffer.concat(buffers);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=salary_receipt_${salary._id}.pdf`);
//       res.send(pdfData);
//     });

//     // PDF Content
//     doc.fontSize(18).text('Salary Receipt', { align: 'center' });
//     doc.moveDown();
//     doc.fontSize(12).text(`Receipt ID: ${salary._id}`, { align: 'left' });
//     doc.text(`Date: ${salary.date}`, { align: 'left' });
//     doc.moveDown();

//     // Supervisor Info
//     doc.fontSize(14).text('Supervisor Information', { underline: true });
//     doc.fontSize(12).text(`Name: ${salary.supervisorId.name}`);
//     doc.text(`ID: ${salary.supervisorId._id}`);
//     doc.text(`Type: ${salary.supervisorId.supervisorType}`);
//     doc.moveDown();

//     // Salary Details
//     doc.fontSize(14).text('Salary Details', { underline: true });
//     doc.fontSize(12).text(`Month: ${salary.monthName} ${salary.year}`);
//     doc.text(`Working Days: ${salary.workingDays}/${salary.totalDays}`);
//     doc.text(`Basic Salary: ₹${salary.basicSalary.toFixed(2)}`);
//     doc.text(`Allowances: ₹${salary.allowances.toFixed(2)}`);
//     doc.text(`Deductions: ₹${salary.deductions.toFixed(2)}`);
//     doc.text(`Advance: ₹${salary.advanceSalary.toFixed(2)}`);
//     doc.moveDown();

//     // Payment Info
//     doc.fontSize(14).text('Payment Information', { underline: true });
//     doc.fontSize(12).text(`Net Salary: ₹${salary.netMonthlySalary.toFixed(2)}`);
//     doc.text(`Paid Amount: ₹${salary.paidAmount.toFixed(2)}`);
//     doc.text(`Balance: ₹${salary.balanceAmount.toFixed(2)}`);
//     doc.text(`Status: ${salary.status}`);
//     doc.moveDown();

//     doc.fontSize(10).text('This is a computer generated receipt.', { align: 'center' });
//     doc.end();

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // 4. Update Salary Record (PUT)
// export const updateSalary = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, date, actualMonthlySalary, allowances, deductions, advanceSalary, paidAmount, status } = req.body;

//     const salary = await SupervisorSalary.findById(id);
//     if (!salary) {
//       return res.status(404).json({
//         success: false,
//         message: "Salary record not found"
//       });
//     }

//     // Update all fields if provided
//     if (name) {
//       const supervisor = await Supervisor.findOne({ name });
//       if (!supervisor) {
//         return res.status(404).json({
//           success: false,
//           message: "Supervisor not found"
//         });
//       }
//       salary.supervisorId = supervisor._id;
//     }

//     if (date) {
//       const [day, month, year] = date.split('/').map(Number);
//       salary.date = formatDate(new Date(year, month - 1, day));
//       salary.month = month;
//       salary.monthName = getMonthName(month);
//       salary.year = year;
//     }

//     if (actualMonthlySalary !== undefined) salary.actualMonthlySalary = Number(actualMonthlySalary);
//     if (allowances !== undefined) salary.allowances = Number(allowances);
//     if (deductions !== undefined) salary.deductions = Number(deductions);
//     if (advanceSalary !== undefined) salary.advanceSalary = Number(advanceSalary);
//     if (paidAmount !== undefined) salary.paidAmount = Number(paidAmount);
//     if (status) salary.status = status;

//     // Recalculate values
//     if (actualMonthlySalary !== undefined || allowances !== undefined || deductions !== undefined) {
//       salary.netMonthlySalary = Math.max(
//         salary.actualMonthlySalary,
//         salary.basicSalary
//       ) + salary.allowances - salary.deductions;
//     }

//     if (paidAmount !== undefined || advanceSalary !== undefined || salary.netMonthlySalary !== undefined) {
//       salary.balanceAmount = salary.netMonthlySalary - salary.paidAmount - salary.advanceSalary;
//     }

//     salary.updatedAt = new Date();
//     await salary.save();

//     res.status(200).json({
//       success: true,
//       data: await salary.populate('supervisorId', 'name email phone supervisorType')
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // 5. Delete Salary by ID
// export const deleteSalaryById = async (req, res) => {
//   try {
//     const salary = await SupervisorSalary.findByIdAndDelete(req.params.id);
    
//     if (!salary) {
//       return res.status(404).json({
//         success: false,
//         message: "Salary record not found"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Salary record deleted successfully"
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };












































