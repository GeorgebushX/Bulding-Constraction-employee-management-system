
import mongoose from "mongoose";
import SupervisorSalary from "../models/SupervisorSalary.js";
import Supervisor from "../models/Supervisor.js";
import exceljs from "exceljs";
import PDFDocument from "pdfkit";

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

// 1. Create Weekly Salary
export const createWeeklySalary = async (req, res) => {
    try {
        const {
            name,
            startDate,
            endDate,
            OvertimeOneDaySalary = 200,
            HalfdayOneDaySalary = 400,
            allowances = 0,
            deductions = 0,
            advanceSalary = 0,
            paidAmount = 0
        } = req.body;

        // Validate inputs
        if (!name || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "Name, startDate and endDate are required"
            });
        }

        // Find supervisor
        const supervisor = await Supervisor.findOne({ name });
        if (!supervisor) {
            return res.status(404).json({
                success: false,
                message: "Supervisor not found"
            });
        }

        // Parse dates
        const [startDay, startMonth, startYear] = startDate.split('/').map(Number);
        const [endDay, endMonth, endYear] = endDate.split('/').map(Number);

        // Calculate working days from attendance
        const attendanceRecords = supervisor.attendanceRecords.filter(record => {
            const [day, month, year] = record.date.split('/').map(Number);
            const recordDate = new Date(year, month - 1, day);
            const start = new Date(startYear, startMonth - 1, startDay);
            const end = new Date(endYear, endMonth - 1, endDay);
            return recordDate >= start && recordDate <= end;
        });

        // Count attendance types
        const workingDays = attendanceRecords.filter(r => r.status === 'Fullday').length;
        const OvertimeDaysCount = attendanceRecords.filter(r => r.status === 'Overtime').length;
        const HalfDaysCount = attendanceRecords.filter(r => r.status === 'Halfday').length;

        // Get salary rates from supervisor
        const perDaySalary = supervisor.perDaySalary || 1000;

        // Calculate salaries
        const basicSalary = (workingDays * perDaySalary) + 
                          (OvertimeDaysCount * OvertimeOneDaySalary) - 
                          (HalfDaysCount * HalfdayOneDaySalary);

        const netWeeklySalary = basicSalary + Number(allowances) - Number(deductions);
        const balanceAmount = netWeeklySalary - Number(paidAmount) - Number(advanceSalary);

        // Determine status
        let status;
        if (paidAmount <= 0) {
            status = "Pending";
        } else if (balanceAmount <= 0) {
            status = "Paid";
        } else {
            status = "Partial";
        }

        // Get current date for record keeping
        const currentDate = new Date();
        const recordDate = formatDate(currentDate);
        const month = currentDate.getMonth() + 1;
        const monthName = getMonthName(month);
        const year = currentDate.getFullYear();

        // Create record
        const salaryRecord = new SupervisorSalary({
            supervisorId: supervisor._id,
            startDate,
            endDate,
            date: recordDate,
            month,
            monthName,
            year,
            perDaySalary,
            OvertimeOneDaySalary,
            HalfdayOneDaySalary,
            workingDays,
            OvertimeDaysCount,
            HalfDaysCount,
            allowances,
            deductions,
            advanceSalary,
            netWeeklySalary,
            paidAmount,
            balanceAmount,
            status
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
                    supervisorType: supervisor.supervisorType,
                    perDaySalary: supervisor.perDaySalary
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
        // Get all salaries with supervisor population
        const salaries = await SupervisorSalary.find({})
            .populate({
                path: 'supervisorId',
                select: 'name email phone supervisorType',
                model: 'Supervisor',
                options: { allowNull: true }
            })
            .sort({ date: -1, _id: 1 })
            .lean();

        // Transform data with null checks
        const responseData = salaries.map(salary => {
            // Handle case where supervisor is deleted but reference exists
            const supervisorData = salary.supervisorId ? {
                _id: salary.supervisorId._id,
                name: salary.supervisorId.name || 'Deleted Supervisor',
                email: salary.supervisorId.email || null,
                phone: salary.supervisorId.phone || null,
                supervisorType: salary.supervisorId.supervisorType || null,
                perDaySalary: salary.supervisorId.perDaySalary || null
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
        const { id } = req.params;
        const format = req.query.format || 'json'; // Default to JSON, options: json, pdf

        const salary = await SupervisorSalary.findById(id)
            .populate('supervisorId', 'name email phone supervisorType');

        if (!salary) {
            return res.status(404).json({
                success: false,
                message: "Salary record not found"
            });
        }

        if (format === 'json') {
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
        } else if (format === 'pdf') {
            // Create PDF document
            const doc = new PDFDocument();
            const filename = `salary_receipt_${salary._id}.pdf`;
            
            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            // Pipe PDF to response
            doc.pipe(res);
            
            // Add content
            doc.fontSize(18).text('Salary Receipt', { align: 'center' });
            doc.moveDown();
            
            doc.fontSize(12);
            doc.text(`Receipt ID: ${salary._id}`);
            doc.text(`Date: ${salary.date}`);
            doc.moveDown();
            
            doc.text(`Supervisor: ${salary.supervisorId.name}`);
            doc.text(`Type: ${salary.supervisorId.supervisorType}`);
            doc.text(`Period: ${salary.startDate} to ${salary.endDate}`);
            doc.moveDown();
            
            doc.text('Salary Details:');
            doc.text(`Basic Salary: ₹${salary.perDaySalary.toFixed(2)}`);
            doc.text(`Overtime: ₹${salary.OvertimeOneDaySalary.toFixed(2)} x ${salary.OvertimeDaysCount} days`);
            doc.text(`Half Days: ${salary.HalfDaysCount} days (₹${salary.HalfdayOneDaySalary.toFixed(2)} deduction)`);
            doc.text(`Allowances: ₹${salary.allowances.toFixed(2)}`);
            doc.text(`Deductions: ₹${salary.deductions.toFixed(2)}`);
            doc.text(`Advance: ₹${salary.advanceSalary.toFixed(2)}`);
            doc.moveDown();
            
            doc.fontSize(14).text(`Net Salary: ₹${salary.netWeeklySalary.toFixed(2)}`, { underline: true });
            doc.text(`Paid Amount: ₹${salary.paidAmount.toFixed(2)}`);
            doc.text(`Balance: ₹${salary.balanceAmount.toFixed(2)}`);
            doc.moveDown();
            
            doc.text(`Status: ${salary.status}`);
            doc.text(`Generated on: ${formatDate(new Date())}`);
            
            // Finalize PDF
            doc.end();
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid format parameter. Use json or pdf"
            });
        }
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
        const { 
            name, 
            startDate, 
            endDate, 
            OvertimeOneDaySalary, 
            HalfdayOneDaySalary, 
            allowances, 
            deductions, 
            advanceSalary, 
            paidAmount, 
            status 
        } = req.body;

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

        if (startDate) salary.startDate = startDate;
        if (endDate) salary.endDate = endDate;
        if (OvertimeOneDaySalary !== undefined) salary.OvertimeOneDaySalary = Number(OvertimeOneDaySalary);
        if (HalfdayOneDaySalary !== undefined) salary.HalfdayOneDaySalary = Number(HalfdayOneDaySalary);
        if (allowances !== undefined) salary.allowances = Number(allowances);
        if (deductions !== undefined) salary.deductions = Number(deductions);
        if (advanceSalary !== undefined) salary.advanceSalary = Number(advanceSalary);
        if (paidAmount !== undefined) salary.paidAmount = Number(paidAmount);
        if (status) salary.status = status;

        // Recalculate net salary and balance
        const basicSalary = (salary.workingDays * salary.perDaySalary) + 
                          (salary.OvertimeDaysCount * salary.OvertimeOneDaySalary) - 
                          (salary.HalfDaysCount * salary.HalfdayOneDaySalary);

        salary.netWeeklySalary = basicSalary + salary.allowances - salary.deductions;
        salary.balanceAmount = salary.netWeeklySalary - salary.paidAmount - salary.advanceSalary;

        // Update status if not explicitly provided
        if (!status) {
            if (salary.paidAmount <= 0) {
                salary.status = "Pending";
            } else if (salary.balanceAmount <= 0) {
                salary.status = "Paid";
            } else {
                salary.status = "Partial";
            }
        }

        salary.updatedAt = new Date();
        await salary.save();

        // Populate supervisor data for response
        const populatedSalary = await SupervisorSalary.findById(salary._id)
            .populate('supervisorId', 'name email phone supervisorType');

        res.status(200).json({
            success: true,
            data: populatedSalary
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

// 6. Assign Salary to All Supervisors for a Given Week
export const assignSalaryToAllSupervisors = async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            OvertimeOneDaySalary = 200, 
            HalfdayOneDaySalary = 400, 
            allowances = 0, 
            deductions = 0, 
            advanceSalary = 0, 
            paidAmount = 0 
        } = req.body;

        // Validate inputs
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }

        // Parse dates
        const [startDay, startMonth, startYear] = startDate.split('/').map(Number);
        const [endDay, endMonth, endYear] = endDate.split('/').map(Number);

        // Get all supervisors with attendance records
        const supervisors = await Supervisor.find({ 'attendanceRecords.0': { $exists: true } });

        if (supervisors.length === 0) {
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
                // Check if salary already exists for this week
                const existingSalary = await SupervisorSalary.findOne({
                    supervisorId: supervisor._id,
                    startDate,
                    endDate
                });

                if (existingSalary) {
                    errors.push({
                        supervisor: supervisor.name,
                        message: "Salary already exists for this week"
                    });
                    continue;
                }

                // Calculate working days from attendance
                const attendanceRecords = supervisor.attendanceRecords.filter(record => {
                    const [day, month, year] = record.date.split('/').map(Number);
                    const recordDate = new Date(year, month - 1, day);
                    const start = new Date(startYear, startMonth - 1, startDay);
                    const end = new Date(endYear, endMonth - 1, endDay);
                    return recordDate >= start && recordDate <= end;
                });

                // Count attendance types
                const workingDays = attendanceRecords.filter(r => r.status === 'Fullday').length;
                const OvertimeDaysCount = attendanceRecords.filter(r => r.status === 'Overtime').length;
                const HalfDaysCount = attendanceRecords.filter(r => r.status === 'Halfday').length;

                // Get salary rates from supervisor
                const perDaySalary = supervisor.perDaySalary || 1000;

                // Calculate salaries
                const basicSalary = (workingDays * perDaySalary) + 
                                  (OvertimeDaysCount * OvertimeOneDaySalary) - 
                                  (HalfDaysCount * HalfdayOneDaySalary);

                const netWeeklySalary = basicSalary + Number(allowances) - Number(deductions);
                const balanceAmount = netWeeklySalary - Number(paidAmount) - Number(advanceSalary);

                // Determine status
                let status;
                if (paidAmount <= 0) {
                    status = "Pending";
                } else if (balanceAmount <= 0) {
                    status = "Paid";
                } else {
                    status = "Partial";
                }

                // Get current date for record keeping
                const currentDate = new Date();
                const recordDate = formatDate(currentDate);
                const month = currentDate.getMonth() + 1;
                const monthName = getMonthName(month);
                const year = currentDate.getFullYear();

                // Create record
                const salaryRecord = new SupervisorSalary({
                    supervisorId: supervisor._id,
                    startDate,
                    endDate,
                    date: recordDate,
                    month,
                    monthName,
                    year,
                    perDaySalary,
                    OvertimeOneDaySalary,
                    HalfdayOneDaySalary,
                    workingDays,
                    OvertimeDaysCount,
                    HalfDaysCount,
                    allowances,
                    deductions,
                    advanceSalary,
                    netWeeklySalary,
                    paidAmount,
                    balanceAmount,
                    status
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

// 7. Get Salaries by Date
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
                    supervisorType: salary.supervisorId.supervisorType,
                    perDaySalary: salary.supervisorId.perDaySalary
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

// 8. Get Salaries by Month and Year
export const getSalariesByMonthYear = async (req, res) => {
    try {
        const { month, year } = req.params;
        const format = req.query.format || 'json'; // Default to JSON, options: json, excel, pdf

        // Validate month and year
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({
                success: false,
                message: "Invalid month. Month must be between 1-12"
            });
        }

        if (isNaN(yearNum)) {
            return res.status(400).json({
                success: false,
                message: "Invalid year"
            });
        }

        const monthName = getMonthName(monthNum);

        // Find all salaries for the given month and year
        const salaries = await SupervisorSalary.find({ 
            month: monthNum,
            year: yearNum
        })
        .populate('supervisorId', 'name email phone supervisorType')
        .sort({ 'supervisorId.name': 1 });

        if (format === 'json') {
            if (salaries.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `No salary records found for ${monthName} ${yearNum}`
                });
            }

            return res.status(200).json({
                success: true,
                period: `${monthName} ${yearNum}`,
                count: salaries.length,
                data: salaries.map(salary => ({
                    ...salary.toObject(),
                    supervisorId: {
                        _id: salary.supervisorId._id,
                        name: salary.supervisorId.name,
                        email: salary.supervisorId.email,
                        phone: salary.supervisorId.phone,
                        supervisorType: salary.supervisorId.supervisorType,
                        perDaySalary: salary.supervisorId.perDaySalary
                    }
                }))
            });
        } else if (format === 'excel' || format === 'pdf') {
            if (salaries.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `No records found for ${monthName} ${yearNum}`
                });
            }

            // Prepare data for report
            const reportData = salaries.map(salary => ({
                ...salary.toObject(),
                supervisorName: salary.supervisorId?.name || 'Unknown',
                supervisorType: salary.supervisorId?.supervisorType || 'Unknown'
            }));

            const title = `Monthly Salary Report - ${monthName} ${yearNum}`;

            if (format === 'excel') {
                return generateExcelSalaryReport(res, reportData, title);
            } else {
                return generatePdfSalaryReport(res, reportData, title);
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid format parameter. Use json, excel, or pdf"
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 9. Delete All Salaries
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

// 10. Get All Supervisor Salaries (with report generation)
export const getAllSupervisorSalaries = async (req, res) => {
    try {
        const { format = 'json', month, year, status } = req.query;

        // Validate format
        const validFormats = ['json', 'excel', 'pdf'];
        if (!validFormats.includes(format)) {
            return res.status(400).json({
                success: false,
                message: "Invalid format parameter. Use json, excel, or pdf"
            });
        }

        // Build query
        const query = {};
        if (month) query.month = parseInt(month);
        if (year) query.year = parseInt(year);
        if (status) query.status = status;

        // Get all salaries with supervisor population
        const salaries = await SupervisorSalary.find(query)
            .populate({
                path: 'supervisorId',
                select: 'name email phone supervisorType',
                model: 'Supervisor',
                options: { allowNull: true }
            })
            .sort({ year: -1, month: -1, 'supervisorId.name': 1 })
            .lean();

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

        // Handle different output formats
        if (format === 'json') {
            return res.status(200).json({
                success: true,
                count: responseData.length,
                data: responseData,
                filters: { month, year, status },
                reportType: 'salary'
            });
        } else if (format === 'excel') {
            let title = 'All Supervisor Salaries';
            if (month && year) {
                title = `Supervisor Salaries - ${getMonthName(parseInt(month))} ${year}`;
            } else if (year) {
                title = `Supervisor Salaries - Year ${year}`;
            }
            if (status) {
                title += ` (${status})`;
            }
            return generateExcelSalaryReport(res, responseData, title);
        } else if (format === 'pdf') {
            let title = 'All Supervisor Salaries';
            if (month && year) {
                title = `Supervisor Salaries - ${getMonthName(parseInt(month))} ${year}`;
            } else if (year) {
                title = `Supervisor Salaries - Year ${year}`;
            }
            if (status) {
                title += ` (${status})`;
            }
            return generatePdfSalaryReport(res, responseData, title);
        }

    } catch (error) {
        console.error("Error fetching all salaries:", error);
        return res.status(500).json({
            success: false,
            message: error.message.includes('Cast to ObjectId failed') 
                ? 'Invalid supervisor reference format' 
                : error.message
        });
    }
};

// 11. Get Salary Report (flexible filtering)
export const getSalaryReport = async (req, res) => {
    try {
        const { month, year, supervisorId, status, startDate, endDate } = req.query;
        const { format = 'json' } = req.query;

        // Validate format
        const validFormats = ['json', 'excel', 'pdf'];
        if (!validFormats.includes(format)) {
            return res.status(400).json({
                success: false,
                message: "Invalid format parameter. Use json, excel, or pdf"
            });
        }

        // Build query
        const query = {};
        if (month) query.month = parseInt(month);
        if (year) query.year = parseInt(year);
        if (status) query.status = status;
        if (supervisorId) {
            if (mongoose.Types.ObjectId.isValid(supervisorId)) {
                query.supervisorId = supervisorId;
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid supervisorId format"
                });
            }
        }
        if (startDate && endDate) {
            query.date = { $gte: startDate, $lte: endDate };
        } else if (startDate) {
            query.date = { $gte: startDate };
        } else if (endDate) {
            query.date = { $lte: endDate };
        }

        // Get salary data with supervisor details
        const salaries = await SupervisorSalary.find(query)
            .populate({
                path: 'supervisorId',
                select: 'name email phone supervisorType perDaySalary',
                model: 'Supervisor',
                options: { allowNull: true }
            })
            .sort({ year: -1, month: -1, 'supervisorId.name': 1 })
            .lean();

        if (format === 'json') {
            return res.status(200).json({
                success: true,
                count: salaries.length,
                data: salaries,
                filters: { month, year, supervisorId, status, startDate, endDate },
                reportType: 'salary'
            });
        } else if (format === 'excel') {
            let title = 'Supervisor Salaries Report';
            if (month && year) {
                title = `Supervisor Salaries - ${getMonthName(parseInt(month))} ${year}`;
            } else if (year) {
                title = `Supervisor Salaries - Year ${year}`;
            }
            if (status) {
                title += ` (${status})`;
            }
            return generateExcelSalaryReport(res, salaries, title);
        } else if (format === 'pdf') {
            let title = 'Supervisor Salaries Report';
            if (month && year) {
                title = `Supervisor Salaries - ${getMonthName(parseInt(month))} ${year}`;
            } else if (year) {
                title = `Supervisor Salaries - Year ${year}`;
            }
            if (status) {
                title += ` (${status})`;
            }
            return generatePdfSalaryReport(res, salaries, title);
        }

    } catch (error) {
        console.error("Error generating salary report:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// 12. Generate Daily Report
export const generateDailyReport = async (req, res) => {
    try {
        const { DD, MM, YYYY } = req.params;
        const format = req.query.format || 'json'; // Default to JSON, options: json, excel, pdf
        const date = `${DD}/${MM}/${YYYY}`;

        // Validate date format
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format. Please use DD/MM/YYYY"
            });
        }

        const salaries = await SupervisorSalary.find({ date })
            .populate('supervisorId', 'name supervisorType perDaySalary')
            .sort({ 'supervisorId.name': 1 });

        if (format === 'json') {
            return res.status(200).json({
                success: true,
                date,
                count: salaries.length,
                data: salaries
            });
        } else if (format === 'excel') {
            // Create Excel workbook
            const workbook = new exceljs.Workbook();
            const worksheet = workbook.addWorksheet('Daily Salary Report');
            
            // Add headers
            worksheet.columns = [
                { header: 'ID', key: '_id', width: 10 },
                { header: 'Supervisor', key: 'name', width: 25 },
                { header: 'Type', key: 'type', width: 20 },
                { header: 'Basic Salary', key: 'basic', width: 15 },
                { header: 'Net Salary', key: 'net', width: 15 },
                { header: 'Status', key: 'status', width: 15 }
            ];
            
            // Add data
            salaries.forEach(salary => {
                worksheet.addRow({
                    _id: salary._id,
                    name: salary.supervisorId.name,
                    type: salary.supervisorId.supervisorType,
                    basic: salary.perDaySalary,
                    net: salary.netWeeklySalary,
                    status: salary.status
                });
            });
            
            // Set response headers
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                `attachment; filename=daily_salary_report_${DD}_${MM}_${YYYY}.xlsx`
            );
            
            // Send the workbook
            return workbook.xlsx.write(res).then(() => {
                res.end();
            });
        } else if (format === 'pdf') {
            // Create PDF document
            const doc = new PDFDocument();
            const filename = `daily_salary_report_${DD}_${MM}_${YYYY}.pdf`;
            
            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            // Pipe PDF to response
            doc.pipe(res);
            
            // Add content
            doc.fontSize(18).text(`Daily Salary Report - ${date}`, { align: 'center' });
            doc.moveDown();
            
            doc.fontSize(12);
            doc.text(`Total Records: ${salaries.length}`);
            doc.moveDown();
            
            salaries.forEach((salary, index) => {
                doc.text(`${index + 1}. ${salary.supervisorId.name} (${salary.supervisorId.supervisorType})`);
                doc.text(`   Basic: ₹${salary.perDaySalary.toFixed(2)} | Net: ₹${salary.netWeeklySalary.toFixed(2)} | Status: ${salary.status}`);
                doc.moveDown(0.5);
            });
            
            // Finalize PDF
            doc.end();
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid format parameter. Use json, excel, or pdf"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 13. Generate Monthly Report
export const generateMonthlyReport = async (req, res) => {
    try {
        const { MM, YYYY } = req.params;
        const format = req.query.format || 'json';
        const monthName = getMonthName(parseInt(MM));

        const salaries = await SupervisorSalary.find({
            month: parseInt(MM),
            year: parseInt(YYYY)
        }).populate('supervisorId', 'name supervisorType');

        if (format === 'json') {
            return res.status(200).json({
                success: true,
                period: `${monthName} ${YYYY}`,
                count: salaries.length,
                data: salaries
            });
        } else if (format === 'excel') {
            // Create Excel workbook
            const workbook = new exceljs.Workbook();
            const worksheet = workbook.addWorksheet('Monthly Salary Report');
            
            // Add headers
            worksheet.columns = [
                { header: 'ID', key: '_id', width: 10 },
                { header: 'Supervisor', key: 'name', width: 25 },
                { header: 'Type', key: 'type', width: 20 },
                { header: 'Basic', key: 'basic', width: 15 },
                { header: 'Allowances', key: 'allowances', width: 15 },
                { header: 'Deductions', key: 'deductions', width: 15 },
                { header: 'Advance', key: 'advance', width: 15 },
                { header: 'Net Salary', key: 'net', width: 15 },
                { header: 'Status', key: 'status', width: 15 }
            ];
            
            // Add data
            salaries.forEach(salary => {
                worksheet.addRow({
                    _id: salary._id,
                    name: salary.supervisorId.name,
                    type: salary.supervisorId.supervisorType,
                    basic: salary.perDaySalary,
                    allowances: salary.allowances,
                    deductions: salary.deductions,
                    advance: salary.advanceSalary,
                    net: salary.netWeeklySalary,
                    status: salary.status
                });
            });
            
            // Add totals row
            const totalNet = salaries.reduce((sum, salary) => sum + salary.netWeeklySalary, 0);
            worksheet.addRow({
                _id: 'TOTAL',
                name: '',
                type: '',
                basic: '',
                allowances: '',
                deductions: '',
                advance: '',
                net: totalNet,
                status: ''
            });
            
            // Set response headers
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                `attachment; filename=monthly_salary_report_${MM}_${YYYY}.xlsx`
            );
            
            // Send the workbook
            return workbook.xlsx.write(res).then(() => {
                res.end();
            });
        } else if (format === 'pdf') {
            // Create PDF document
            const doc = new PDFDocument();
            const filename = `monthly_salary_report_${MM}_${YYYY}.pdf`;
            
            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            // Pipe PDF to response
            doc.pipe(res);
            
            // Add content
            doc.fontSize(18).text(
                `Monthly Salary Report - ${monthName} ${YYYY}`,
                { align: 'center' }
            );
            doc.moveDown();
            
            doc.fontSize(12);
            doc.text(`Total Records: ${salaries.length}`);
            doc.moveDown();
            
            let totalNet = 0;
            salaries.forEach((salary, index) => {
                doc.text(`${index + 1}. ${salary.supervisorId.name} (${salary.supervisorId.supervisorType})`);
                doc.text(`   Basic: ₹${salary.perDaySalary.toFixed(2)} | Allowances: ₹${salary.allowances.toFixed(2)}`);
                doc.text(`   Deductions: ₹${salary.deductions.toFixed(2)} | Advance: ₹${salary.advanceSalary.toFixed(2)}`);
                doc.text(`   Net Salary: ₹${salary.netWeeklySalary.toFixed(2)} | Status: ${salary.status}`);
                doc.moveDown(0.5);
                totalNet += salary.netWeeklySalary;
            });
            
            doc.moveDown();
            doc.fontSize(14).text(`Total Net Salaries: ₹${totalNet.toFixed(2)}`, { underline: true });
            
            // Finalize PDF
            doc.end();
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid format parameter. Use json, excel, or pdf"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 14. Generate Yearly Report
export const generateYearlyReport = async (req, res) => {
    try {
        const { YYYY } = req.params;
        const format = req.query.format || 'json';

        const salaries = await SupervisorSalary.find({
            year: parseInt(YYYY)
        }).populate('supervisorId', 'name supervisorType');

        if (format === 'json') {
            return res.status(200).json({
                success: true,
                year: YYYY,
                count: salaries.length,
                data: salaries
            });
        } else if (format === 'excel') {
            // Create Excel workbook
            const workbook = new exceljs.Workbook();
            const worksheet = workbook.addWorksheet('Yearly Salary Report');
            
            // Add headers
            worksheet.columns = [
                { header: 'ID', key: '_id', width: 10 },
                { header: 'Supervisor', key: 'name', width: 25 },
                { header: 'Type', key: 'type', width: 20 },
                { header: 'Month', key: 'month', width: 15 },
                { header: 'Basic', key: 'basic', width: 15 },
                { header: 'Net Salary', key: 'net', width: 15 },
                { header: 'Status', key: 'status', width: 15 }
            ];
            
            // Add data
            salaries.forEach(salary => {
                worksheet.addRow({
                    _id: salary._id,
                    name: salary.supervisorId.name,
                    type: salary.supervisorId.supervisorType,
                    month: salary.monthName,
                    basic: salary.perDaySalary,
                    net: salary.netWeeklySalary,
                    status: salary.status
                });
            });
            
            // Set response headers
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                `attachment; filename=yearly_salary_report_${YYYY}.xlsx`
            );
            
            // Send the workbook
            return workbook.xlsx.write(res).then(() => {
                res.end();
            });
        } else if (format === 'pdf') {
            // Create PDF document
            const doc = new PDFDocument();
            const filename = `yearly_salary_report_${YYYY}.pdf`;
            
            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            // Pipe PDF to response
            doc.pipe(res);
            
            // Add content
            doc.fontSize(18).text(
                `Yearly Salary Report - ${YYYY}`,
                { align: 'center' }
            );
            doc.moveDown();
            
            doc.fontSize(12);
            doc.text(`Total Records: ${salaries.length}`);
            doc.moveDown();
            
            // Group by supervisor
            const bySupervisor = {};
            salaries.forEach(salary => {
                if (!bySupervisor[salary.supervisorId.name]) {
                    bySupervisor[salary.supervisorId.name] = {
                        type: salary.supervisorId.supervisorType,
                        salaries: []
                    };
                }
                bySupervisor[salary.supervisorId.name].salaries.push(salary);
            });
            
            // Add supervisor-wise summary
            Object.keys(bySupervisor).forEach((name, idx) => {
                const supervisor = bySupervisor[name];
                const total = supervisor.salaries.reduce((sum, s) => sum + s.netWeeklySalary, 0);
                
                doc.text(`${idx + 1}. ${name} (${supervisor.type})`);
                doc.text(`   Months Worked: ${supervisor.salaries.length}`);
                doc.text(`   Total Earnings: ₹${total.toFixed(2)}`);
                doc.moveDown(0.5);
            });
            
            // Add grand total
            const grandTotal = salaries.reduce((sum, salary) => sum + salary.netWeeklySalary, 0);
            doc.moveDown();
            doc.fontSize(14).text(`Grand Total: ₹${grandTotal.toFixed(2)}`, { underline: true });
            
            // Finalize PDF
            doc.end();
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid format parameter. Use json, excel, or pdf"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Helper functions for report generation
const generateExcelSalaryReport = async (res, salaries, title = 'Salary Report') => {
    try {
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Salary Report');

        // Add title and date
        worksheet.addRow([title]);
        worksheet.addRow(['Generated on:', new Date().toLocaleString()]);
        worksheet.addRow([]);

        // Define columns
        worksheet.columns = [
            { header: 'Supervisor Name', key: 'name', width: 25 },
            { header: 'Month', key: 'month', width: 15 },
            { header: 'Year', key: 'year', width: 10 },
            { header: 'Basic Salary', key: 'basicSalary', width: 15, style: { numFmt: '"₹"#,##0.00' } },
            { header: 'Allowances', key: 'allowances', width: 15, style: { numFmt: '"₹"#,##0.00' } },
            { header: 'Deductions', key: 'deductions', width: 15, style: { numFmt: '"₹"#,##0.00' } },
            { header: 'Net Salary', key: 'netSalary', width: 15, style: { numFmt: '"₹"#,##0.00' } },
            { header: 'Paid Amount', key: 'paidAmount', width: 15, style: { numFmt: '"₹"#,##0.00' } },
            { header: 'Advance', key: 'advanceSalary', width: 15, style: { numFmt: '"₹"#,##0.00' } },
            { header: 'Balance', key: 'balanceAmount', width: 15, style: { numFmt: '"₹"#,##0.00' } },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Working Days', key: 'workingDays', width: 15 },
            { header: 'Total Days', key: 'totalDays', width: 15 }
        ];

        // Add data rows
        salaries.forEach(salary => {
            worksheet.addRow({
                name: salary.supervisorId?.name || salary.supervisorName || 'Unknown',
                month: salary.monthName,
                year: salary.year,
                basicSalary: salary.perDaySalary || salary.basicSalary,
                allowances: salary.allowances,
                deductions: salary.deductions,
                netSalary: salary.netWeeklySalary,
                paidAmount: salary.paidAmount,
                advanceSalary: salary.advanceSalary,
                balanceAmount: salary.balanceAmount,
                status: salary.status,
                workingDays: salary.workingDays,
                totalDays: salary.totalDays
            });
        });

        // Add summary row
        worksheet.addRow([]);
        const summaryRow = worksheet.addRow([
            'TOTAL', 
            '', 
            '',
            { formula: `SUM(D4:D${worksheet.rowCount - 1})` },
            { formula: `SUM(E4:E${worksheet.rowCount - 1})` },
            { formula: `SUM(F4:F${worksheet.rowCount - 1})` },
            { formula: `SUM(G4:G${worksheet.rowCount - 1})` },
            { formula: `SUM(H4:H${worksheet.rowCount - 1})` },
            { formula: `SUM(I4:I${worksheet.rowCount - 1})` },
            { formula: `SUM(J4:J${worksheet.rowCount - 1})` },
            '',
            { formula: `SUM(L4:L${worksheet.rowCount - 1})` },
            { formula: `SUM(M4:M${worksheet.rowCount - 1})` }
        ]);
        
        summaryRow.font = { bold: true };
        summaryRow.eachCell(cell => {
            if (cell.value && typeof cell.value === 'object' && cell.value.formula) {
                cell.numFmt = '"₹"#,##0.00';
            }
        });

        // Style the header row
        worksheet.getRow(4).eachCell(cell => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' }
            };
        });

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${title.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error generating Excel report:", error);
        throw error;
    }
};

const generatePdfSalaryReport = async (res, salaries, title = 'Salary Report') => {
    try {
        const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${title.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
        );

        doc.pipe(res);

        // Add title
        doc.fontSize(18).text(title, { align: 'center' });
        doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Define table parameters
        const table = {
            headers: [
                'Supervisor',
                'Month',
                'Year',
                'Basic Salary',
                'Allowances',
                'Deductions',
                'Net Salary',
                'Paid',
                'Advance',
                'Balance',
                'Status',
                'Work Days'
            ],
            rows: [],
            columnWidths: [100, 60, 50, 80, 70, 70, 80, 70, 70, 70, 60, 60],
            align: ['left', 'center', 'center', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'center', 'center']
        };

        // Add data rows
        salaries.forEach(salary => {
            table.rows.push([
                salary.supervisorId?.name || salary.supervisorName || 'Unknown',
                salary.monthName,
                salary.year.toString(),
                `₹${(salary.perDaySalary || salary.basicSalary).toFixed(2)}`,
                `₹${salary.allowances.toFixed(2)}`,
                `₹${salary.deductions.toFixed(2)}`,
                `₹${salary.netWeeklySalary.toFixed(2)}`,
                `₹${salary.paidAmount.toFixed(2)}`,
                `₹${salary.advanceSalary.toFixed(2)}`,
                `₹${salary.balanceAmount.toFixed(2)}`,
                salary.status,
                `${salary.workingDays}/${salary.totalDays || ''}`
            ]);
        });

        // Calculate totals for footer
        const totals = {
            basicSalary: salaries.reduce((sum, s) => sum + (s.perDaySalary || s.basicSalary), 0),
            allowances: salaries.reduce((sum, s) => sum + s.allowances, 0),
            deductions: salaries.reduce((sum, s) => sum + s.deductions, 0),
            netSalary: salaries.reduce((sum, s) => sum + s.netWeeklySalary, 0),
            paidAmount: salaries.reduce((sum, s) => sum + s.paidAmount, 0),
            advanceSalary: salaries.reduce((sum, s) => sum + s.advanceSalary, 0),
            balanceAmount: salaries.reduce((sum, s) => sum + s.balanceAmount, 0),
            workingDays: salaries.reduce((sum, s) => sum + s.workingDays, 0),
            totalDays: salaries.reduce((sum, s) => sum + (s.totalDays || 0), 0)
        };

        // Draw table
        let y = doc.y;
        const rowHeight = 20;
        const x = 50;

        // Draw headers
        doc.font('Helvetica-Bold');
        table.headers.forEach((header, i) => {
            doc.text(header, x + (i > 0 ? table.columnWidths.slice(0, i).reduce((a, b) => a + b, 0) : 0, y, {
                width: table.columnWidths[i],
                align: table.align[i]
            }));
        });
        doc.font('Helvetica');

        // Draw rows
        y += rowHeight;
        table.rows.forEach(row => {
            row.forEach((cell, i) => {
                doc.text(cell, x + (i > 0 ? table.columnWidths.slice(0, i).reduce((a, b) => a + b, 0) : 0, y, {
                    width: table.columnWidths[i],
                    align: table.align[i]
                }));
            });
            y += rowHeight;
        });

        // Draw footer with totals
        y += rowHeight;
        doc.font('Helvetica-Bold');
        doc.text('TOTALS:', x, y);
        doc.text(`₹${totals.basicSalary.toFixed(2)}`, x + table.columnWidths.slice(0, 3).reduce((a, b) => a + b, 0), y, {
            width: table.columnWidths[3],
            align: 'right'
        });
        doc.text(`₹${totals.allowances.toFixed(2)}`, x + table.columnWidths.slice(0, 4).reduce((a, b) => a + b, 0), y, {
            width: table.columnWidths[4],
            align: 'right'
        });
        doc.text(`₹${totals.deductions.toFixed(2)}`, x + table.columnWidths.slice(0, 5).reduce((a, b) => a + b, 0), y, {
            width: table.columnWidths[5],
            align: 'right'
        });
        doc.text(`₹${totals.netSalary.toFixed(2)}`, x + table.columnWidths.slice(0, 6).reduce((a, b) => a + b, 0), y, {
            width: table.columnWidths[6],
            align: 'right'
        });
        doc.text(`₹${totals.paidAmount.toFixed(2)}`, x + table.columnWidths.slice(0, 7).reduce((a, b) => a + b, 0), y, {
            width: table.columnWidths[7],
            align: 'right'
        });
        doc.text(`₹${totals.advanceSalary.toFixed(2)}`, x + table.columnWidths.slice(0, 8).reduce((a, b) => a + b, 0), y, {
            width: table.columnWidths[8],
            align: 'right'
        });
        doc.text(`₹${totals.balanceAmount.toFixed(2)}`, x + table.columnWidths.slice(0, 9).reduce((a, b) => a + b, 0), y, {
            width: table.columnWidths[9],
            align: 'right'
        });
        doc.text(`${totals.workingDays}/${totals.totalDays}`, x + table.columnWidths.slice(0, 11).reduce((a, b) => a + b, 0), y, {
            width: table.columnWidths[11],
            align: 'center'
        });

        doc.end();

    } catch (error) {
        console.error("Error generating PDF report:", error);
        throw error;
    }
};







// import mongoose from "mongoose";
// import SupervisorSalary from "../models/SupervisorSalary.js";
// import Supervisor from "../models/Supervisor.js";
// import exceljs from "exceljs";
// import PDFDocument from "pdfkit";

// // Helper functions
// const formatDate = (dateString) => {
//     if (!dateString) return null;
//     const date = new Date(dateString);
//     const day = String(date.getDate()).padStart(2, '0');
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const year = date.getFullYear();
//     return `${day}/${month}/${year}`;
// };

// const getMonthName = (month) => {
//     const months = [
//         'January', 'February', 'March', 'April', 'May', 'June',
//         'July', 'August', 'September', 'October', 'November', 'December'
//     ];
    
//     return months[month - 1];
// };

// // 1. Create Weekly Salary
// export const createWeeklySalary = async (req, res) => {
//     try {
//         const {
//             name,
//             startDate,
//             endDate,
//             OvertimeSalary = 200,
//             HalfSalary = 400,
//             allowances = 0,
//             deductions = 0,
//             advanceSalary = 0,
//             paidAmount = 0
//         } = req.body;

//         // Validate inputs
//         if (!name || !startDate || !endDate) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Name, startDate and endDate are required"
//             });
//         }

//         // Find supervisor
//         const supervisor = await Supervisor.findOne({ name });
//         if (!supervisor) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Supervisor not found"
//             });
//         }

//         // Parse dates
//         const [startDay, startMonth, startYear] = startDate.split('/').map(Number);
//         const [endDay, endMonth, endYear] = endDate.split('/').map(Number);

//         // Calculate working days from attendance
//         const attendanceRecords = supervisor.attendanceRecords.filter(record => {
//             const [day, month, year] = record.date.split('/').map(Number);
//             const recordDate = new Date(year, month - 1, day);
//             const start = new Date(startYear, startMonth - 1, startDay);
//             const end = new Date(endYear, endMonth - 1, endDay);
//             return recordDate >= start && recordDate <= end;
//         });

//         // Count attendance types
//         const workingDays = attendanceRecords.filter(r => r.status === 'Fullday').length;
//         const OvertimeDays = attendanceRecords.filter(r => r.status === 'Overtime').length;
//         const HalfDay = attendanceRecords.filter(r => r.status === 'Halfday').length;

//         // Get salary rates from supervisor
//         const forDaySalary = supervisor.forDaySalary || 1000;

//         // Calculate salaries
//         const basicSalary = (workingDays * forDaySalary) + 
//                           (OvertimeDays * OvertimeSalary) - 
//                           (HalfDay * HalfSalary);

//         const netWeeklySalary = basicSalary + Number(allowances) - Number(deductions);
//         const balanceAmount = netWeeklySalary - Number(paidAmount) - Number(advanceSalary);

//         // Determine status
//         let status;
//         if (paidAmount <= 0) {
//             status = "Pending";
//         } else if (balanceAmount <= 0) {
//             status = "Paid";
//         } else {
//             status = "Partial";
//         }

//         // Get current date for record keeping
//         const currentDate = new Date();
//         const recordDate = formatDate(currentDate);
//         const month = currentDate.getMonth() + 1;
//         const monthName = getMonthName(month);
//         const year = currentDate.getFullYear();

//         // Create record
//         const salaryRecord = new SupervisorSalary({
//             supervisorId: supervisor._id,
//             startDate,
//             endDate,
//             date: recordDate,
//             month,
//             monthName,
//             year,
//             forDaySalary,
//             OvertimeSalary,
//             HalfSalary,
//             workingDays,
//             OvertimeDays,
//             HalfDay,
//             allowances,
//             deductions,
//             advanceSalary,
//             netWeeklySalary,
//             paidAmount,
//             balanceAmount,
//             status
//         });

//         await salaryRecord.save();

//         res.status(201).json({
//             success: true,
//             data: {
//                 ...salaryRecord.toObject(),
//                 supervisorId: {
//                     _id: supervisor._id,
//                     name: supervisor.name,
//                     email: supervisor.email,
//                     phone: supervisor.phone,
//                     supervisorType: supervisor.supervisorType,
//                     forDaySalary: supervisor.forDaySalary
//                 }
//             }
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // 2. Get All Salary Records
// export const getAllSalaries = async (req, res) => {
//     try {
//         // Get all salaries with supervisor population
//         const salaries = await SupervisorSalary.find({})
//             .populate({
//                 path: 'supervisorId',
//                 select: 'name email phone supervisorType',
//                 model: 'Supervisor',
//                 options: { allowNull: true }
//             })
//             .sort({ date: -1, _id: 1 })
//             .lean();

//         // Transform data with null checks
//         const responseData = salaries.map(salary => {
//             // Handle case where supervisor is deleted but reference exists
//             const supervisorData = salary.supervisorId ? {
//                 _id: salary.supervisorId._id,
//                 name: salary.supervisorId.name || 'Deleted Supervisor',
//                 email: salary.supervisorId.email || null,
//                 phone: salary.supervisorId.phone || null,
//                 supervisorType: salary.supervisorId.supervisorType || null,
//                 forDaySalary: salary.supervisorId.forDaySalary || null
//             } : {
//                 _id: null,
//                 name: 'Unknown Supervisor',
//                 email: null,
//                 phone: null,
//                 supervisorType: null
//             };

//             return {
//                 ...salary,
//                 supervisorId: supervisorData
//             };
//         });

//         res.status(200).json({
//             success: true,
//             count: responseData.length,
//             data: responseData
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message.includes('Cast to ObjectId failed') 
//                 ? 'Invalid supervisor reference format' 
//                 : error.message
//         });
//     }
// };

// // 3. Get Salary by ID
// export const getSalaryById = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const format = req.query.format || 'json'; // Default to JSON, options: json, pdf

//         const salary = await SupervisorSalary.findById(id)
//             .populate('supervisorId', 'name email phone supervisorType');

//         if (!salary) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Salary record not found"
//             });
//         }

//         if (format === 'json') {
//             return res.status(200).json({
//                 success: true,
//                 data: {
//                     ...salary.toObject(),
//                     supervisorId: {
//                         _id: salary.supervisorId._id,
//                         name: salary.supervisorId.name,
//                         email: salary.supervisorId.email,
//                         phone: salary.supervisorId.phone,
//                         supervisorType: salary.supervisorId.supervisorType
//                     }
//                 }
//             });
//         } else if (format === 'pdf') {
//             // Create PDF document
//             const doc = new PDFDocument();
//             const filename = `salary_receipt_${salary._id}.pdf`;
            
//             // Set response headers
//             res.setHeader('Content-Type', 'application/pdf');
//             res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
//             // Pipe PDF to response
//             doc.pipe(res);
            
//             // Add content
//             doc.fontSize(18).text('Salary Receipt', { align: 'center' });
//             doc.moveDown();
            
//             doc.fontSize(12);
//             doc.text(`Receipt ID: ${salary._id}`);
//             doc.text(`Date: ${salary.date}`);
//             doc.moveDown();
            
//             doc.text(`Supervisor: ${salary.supervisorId.name}`);
//             doc.text(`Type: ${salary.supervisorId.supervisorType}`);
//             doc.text(`Period: ${salary.startDate} to ${salary.endDate}`);
//             doc.moveDown();
            
//             doc.text('Salary Details:');
//             doc.text(`Basic Salary: ₹${salary.forDaySalary.toFixed(2)}`);
//             doc.text(`Overtime: ₹${salary.OvertimeSalary.toFixed(2)} x ${salary.OvertimeDays} days`);
//             doc.text(`Half Days: ${salary.HalfDay} days (₹${salary.HalfSalary.toFixed(2)} deduction)`);
//             doc.text(`Allowances: ₹${salary.allowances.toFixed(2)}`);
//             doc.text(`Deductions: ₹${salary.deductions.toFixed(2)}`);
//             doc.text(`Advance: ₹${salary.advanceSalary.toFixed(2)}`);
//             doc.moveDown();
            
//             doc.fontSize(14).text(`Net Salary: ₹${salary.netWeeklySalary.toFixed(2)}`, { underline: true });
//             doc.text(`Paid Amount: ₹${salary.paidAmount.toFixed(2)}`);
//             doc.text(`Balance: ₹${salary.balanceAmount.toFixed(2)}`);
//             doc.moveDown();
            
//             doc.text(`Status: ${salary.status}`);
//             doc.text(`Generated on: ${formatDate(new Date())}`);
            
//             // Finalize PDF
//             doc.end();
//         } else {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid format parameter. Use json or pdf"
//             });
//         }
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // 4. Update Salary Record
// export const updateSalary = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { 
//             name, 
//             startDate, 
//             endDate, 
//             OvertimeSalary, 
//             HalfSalary, 
//             allowances, 
//             deductions, 
//             advanceSalary, 
//             paidAmount, 
//             status 
//         } = req.body;

//         const salary = await SupervisorSalary.findById(id);
//         if (!salary) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Salary record not found"
//             });
//         }

//         // Update all fields if provided
//         if (name) {
//             const supervisor = await Supervisor.findOne({ name });
//             if (!supervisor) {
//                 return res.status(404).json({
//                     success: false,
//                     message: "Supervisor not found"
//                 });
//             }
//             salary.supervisorId = supervisor._id;
//         }

//         if (startDate) salary.startDate = startDate;
//         if (endDate) salary.endDate = endDate;
//         if (OvertimeSalary !== undefined) salary.OvertimeSalary = Number(OvertimeSalary);
//         if (HalfSalary !== undefined) salary.HalfSalary = Number(HalfSalary);
//         if (allowances !== undefined) salary.allowances = Number(allowances);
//         if (deductions !== undefined) salary.deductions = Number(deductions);
//         if (advanceSalary !== undefined) salary.advanceSalary = Number(advanceSalary);
//         if (paidAmount !== undefined) salary.paidAmount = Number(paidAmount);
//         if (status) salary.status = status;

//         // Recalculate net salary and balance
//         const basicSalary = (salary.workingDays * salary.forDaySalary) + 
//                           (salary.OvertimeDays * salary.OvertimeSalary) - 
//                           (salary.HalfDay * salary.HalfSalary);

//         salary.netWeeklySalary = basicSalary + salary.allowances - salary.deductions;
//         salary.balanceAmount = salary.netWeeklySalary - salary.paidAmount - salary.advanceSalary;

//         // Update status if not explicitly provided
//         if (!status) {
//             if (salary.paidAmount <= 0) {
//                 salary.status = "Pending";
//             } else if (salary.balanceAmount <= 0) {
//                 salary.status = "Paid";
//             } else {
//                 salary.status = "Partial";
//             }
//         }

//         salary.updatedAt = new Date();
//         await salary.save();

//         // Populate supervisor data for response
//         const populatedSalary = await SupervisorSalary.findById(salary._id)
//             .populate('supervisorId', 'name email phone supervisorType');

//         res.status(200).json({
//             success: true,
//             data: populatedSalary
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // 5. Delete Salary by ID
// export const deleteSalaryById = async (req, res) => {
//     try {
//         const salary = await SupervisorSalary.findByIdAndDelete(req.params.id);
        
//         if (!salary) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Salary record not found"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Salary record deleted successfully"
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // 6. Assign Salary to All Supervisors for a Given Week
// export const assignSalaryToAllSupervisors = async (req, res) => {
//     try {
//         const { 
//             startDate, 
//             endDate, 
//             OvertimeSalary = 200, 
//             HalfSalary = 400, 
//             allowances = 0, 
//             deductions = 0, 
//             advanceSalary = 0, 
//             paidAmount = 0 
//         } = req.body;

//         // Validate inputs
//         if (!startDate || !endDate) {
//             return res.status(400).json({
//                 success: false,
//                 message: "startDate and endDate are required"
//             });
//         }

//         // Parse dates
//         const [startDay, startMonth, startYear] = startDate.split('/').map(Number);
//         const [endDay, endMonth, endYear] = endDate.split('/').map(Number);

//         // Get all supervisors with attendance records
//         const supervisors = await Supervisor.find({ 'attendanceRecords.0': { $exists: true } });

//         if (supervisors.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: "No supervisors with attendance records found"
//             });
//         }
        
//         const results = [];
//         const errors = [];

//         // Process each supervisor
//         for (const supervisor of supervisors) {
//             try {
//                 // Check if salary already exists for this week
//                 const existingSalary = await SupervisorSalary.findOne({
//                     supervisorId: supervisor._id,
//                     startDate,
//                     endDate
//                 });

//                 if (existingSalary) {
//                     errors.push({
//                         supervisor: supervisor.name,
//                         message: "Salary already exists for this week"
//                     });
//                     continue;
//                 }

//                 // Calculate working days from attendance
//                 const attendanceRecords = supervisor.attendanceRecords.filter(record => {
//                     const [day, month, year] = record.date.split('/').map(Number);
//                     const recordDate = new Date(year, month - 1, day);
//                     const start = new Date(startYear, startMonth - 1, startDay);
//                     const end = new Date(endYear, endMonth - 1, endDay);
//                     return recordDate >= start && recordDate <= end;
//                 });

//                 // Count attendance types
//                 const workingDays = attendanceRecords.filter(r => r.status === 'Fullday').length;
//                 const OvertimeDays = attendanceRecords.filter(r => r.status === 'Overtime').length;
//                 const HalfDay = attendanceRecords.filter(r => r.status === 'Halfday').length;

//                 // Get salary rates from supervisor
//                 const forDaySalary = supervisor.forDaySalary || 1000;

//                 // Calculate salaries
//                 const basicSalary = (workingDays * forDaySalary) + 
//                                   (OvertimeDays * OvertimeSalary) - 
//                                   (HalfDay * HalfSalary);

//                 const netWeeklySalary = basicSalary + Number(allowances) - Number(deductions);
//                 const balanceAmount = netWeeklySalary - Number(paidAmount) - Number(advanceSalary);

//                 // Determine status
//                 let status;
//                 if (paidAmount <= 0) {
//                     status = "Pending";
//                 } else if (balanceAmount <= 0) {
//                     status = "Paid";
//                 } else {
//                     status = "Partial";
//                 }

//                 // Get current date for record keeping
//                 const currentDate = new Date();
//                 const recordDate = formatDate(currentDate);
//                 const month = currentDate.getMonth() + 1;
//                 const monthName = getMonthName(month);
//                 const year = currentDate.getFullYear();

//                 // Create record
//                 const salaryRecord = new SupervisorSalary({
//                     supervisorId: supervisor._id,
//                     startDate,
//                     endDate,
//                     date: recordDate,
//                     month,
//                     monthName,
//                     year,
//                     forDaySalary,
//                     OvertimeSalary,
//                     HalfSalary,
//                     workingDays,
//                     OvertimeDays,
//                     HalfDay,
//                     allowances,
//                     deductions,
//                     advanceSalary,
//                     netWeeklySalary,
//                     paidAmount,
//                     balanceAmount,
//                     status
//                 });

//                 await salaryRecord.save();

//                 results.push({
//                     supervisorId: supervisor._id,
//                     supervisorName: supervisor.name,
//                     salaryId: salaryRecord._id,
//                     status: "Success"
//                 });

//             } catch (error) {
//                 errors.push({
//                     supervisor: supervisor.name,
//                     message: error.message
//                 });
//             }
//         }

//         res.status(201).json({
//             success: true,
//             message: "Salary assignment process completed",
//             stats: {
//                 totalSupervisors: supervisors.length,
//                 successCount: results.length,
//                 errorCount: errors.length
//             },
//             results,
//             errors
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // 7. Get Salaries by Date
// export const getSalariesByDate = async (req, res) => {
//     try {
//         const date = `${req.params.day}/${req.params.month}/${req.params.year}`;

//         // Validate date format (DD/MM/YYYY)
//         if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid date format. Please use DD/MM/YYYY"
//             });
//         }

//         // Find all salaries for the given date
//         const salaries = await SupervisorSalary.find({ date })
//             .populate('supervisorId', 'name email phone supervisorType')
//             .sort({ 'supervisorId.name': 1 });

//         if (salaries.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: "No salary records found for the specified date"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             date,
//             count: salaries.length,
//             data: salaries.map(salary => ({
//                 ...salary.toObject(),
//                 supervisorId: {
//                     _id: salary.supervisorId._id,
//                     name: salary.supervisorId.name,
//                     email: salary.supervisorId.email,
//                     phone: salary.supervisorId.phone,
//                     supervisorType: salary.supervisorId.supervisorType,
//                     forDaySalary: salary.supervisorId.forDaySalary
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

// // 8. Get Salaries by Month and Year
// export const getSalariesByMonthYear = async (req, res) => {
//     try {
//         const { month, year } = req.params;
//         const format = req.query.format || 'json'; // Default to JSON, options: json, excel, pdf

//         // Validate month and year
//         const monthNum = parseInt(month, 10);
//         const yearNum = parseInt(year, 10);

//         if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid month. Month must be between 1-12"
//             });
//         }

//         if (isNaN(yearNum)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid year"
//             });
//         }

//         const monthName = getMonthName(monthNum);

//         // Find all salaries for the given month and year
//         const salaries = await SupervisorSalary.find({ 
//             month: monthNum,
//             year: yearNum
//         })
//         .populate('supervisorId', 'name email phone supervisorType')
//         .sort({ 'supervisorId.name': 1 });

//         if (format === 'json') {
//             if (salaries.length === 0) {
//                 return res.status(404).json({
//                     success: false,
//                     message: `No salary records found for ${monthName} ${yearNum}`
//                 });
//             }

//             return res.status(200).json({
//                 success: true,
//                 period: `${monthName} ${yearNum}`,
//                 count: salaries.length,
//                 data: salaries.map(salary => ({
//                     ...salary.toObject(),
//                     supervisorId: {
//                         _id: salary.supervisorId._id,
//                         name: salary.supervisorId.name,
//                         email: salary.supervisorId.email,
//                         phone: salary.supervisorId.phone,
//                         supervisorType: salary.supervisorId.supervisorType,
//                         forDaySalary: salary.supervisorId.forDaySalary
//                     }
//                 }))
//             });
//         } else if (format === 'excel' || format === 'pdf') {
//             if (salaries.length === 0) {
//                 return res.status(404).json({
//                     success: false,
//                     message: `No records found for ${monthName} ${yearNum}`
//                 });
//             }

//             // Prepare data for report
//             const reportData = salaries.map(salary => ({
//                 ...salary.toObject(),
//                 supervisorName: salary.supervisorId?.name || 'Unknown',
//                 supervisorType: salary.supervisorId?.supervisorType || 'Unknown'
//             }));

//             const title = `Monthly Salary Report - ${monthName} ${yearNum}`;

//             if (format === 'excel') {
//                 return generateExcelSalaryReport(res, reportData, title);
//             } else {
//                 return generatePdfSalaryReport(res, reportData, title);
//             }
//         } else {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid format parameter. Use json, excel, or pdf"
//             });
//         }

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // 9. Delete All Salaries
// export const deleteAllSalaries = async (req, res) => {
//     try {
//         await SupervisorSalary.deleteMany({});
        
//         // Reset the auto-increment counter
//         await mongoose.connection.db.collection('counters').updateOne(
//             { _id: 'supervisorSalaryId' },
//             { $set: { seq: 0 } }
//         );

//         res.status(200).json({
//             success: true,
//             message: "All salary records deleted successfully"
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // 10. Get All Supervisor Salaries (with report generation)
// export const getAllSupervisorSalaries = async (req, res) => {
//     try {
//         const { format = 'json', month, year, status } = req.query;

//         // Validate format
//         const validFormats = ['json', 'excel', 'pdf'];
//         if (!validFormats.includes(format)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid format parameter. Use json, excel, or pdf"
//             });
//         }

//         // Build query
//         const query = {};
//         if (month) query.month = parseInt(month);
//         if (year) query.year = parseInt(year);
//         if (status) query.status = status;

//         // Get all salaries with supervisor population
//         const salaries = await SupervisorSalary.find(query)
//             .populate({
//                 path: 'supervisorId',
//                 select: 'name email phone supervisorType',
//                 model: 'Supervisor',
//                 options: { allowNull: true }
//             })
//             .sort({ year: -1, month: -1, 'supervisorId.name': 1 })
//             .lean();

//         // Transform data with null checks
//         const responseData = salaries.map(salary => {
//             // Handle case where supervisor is deleted but reference exists
//             const supervisorData = salary.supervisorId ? {
//                 _id: salary.supervisorId._id,
//                 name: salary.supervisorId.name || 'Deleted Supervisor',
//                 email: salary.supervisorId.email || null,
//                 phone: salary.supervisorId.phone || null,
//                 supervisorType: salary.supervisorId.supervisorType || null
//             } : {
//                 _id: null,
//                 name: 'Unknown Supervisor',
//                 email: null,
//                 phone: null,
//                 supervisorType: null
//             };

//             return {
//                 ...salary,
//                 supervisorId: supervisorData
//             };
//         });

//         // Handle different output formats
//         if (format === 'json') {
//             return res.status(200).json({
//                 success: true,
//                 count: responseData.length,
//                 data: responseData,
//                 filters: { month, year, status },
//                 reportType: 'salary'
//             });
//         } else if (format === 'excel') {
//             let title = 'All Supervisor Salaries';
//             if (month && year) {
//                 title = `Supervisor Salaries - ${getMonthName(parseInt(month))} ${year}`;
//             } else if (year) {
//                 title = `Supervisor Salaries - Year ${year}`;
//             }
//             if (status) {
//                 title += ` (${status})`;
//             }
//             return generateExcelSalaryReport(res, responseData, title);
//         } else if (format === 'pdf') {
//             let title = 'All Supervisor Salaries';
//             if (month && year) {
//                 title = `Supervisor Salaries - ${getMonthName(parseInt(month))} ${year}`;
//             } else if (year) {
//                 title = `Supervisor Salaries - Year ${year}`;
//             }
//             if (status) {
//                 title += ` (${status})`;
//             }
//             return generatePdfSalaryReport(res, responseData, title);
//         }

//     } catch (error) {
//         console.error("Error fetching all salaries:", error);
//         return res.status(500).json({
//             success: false,
//             message: error.message.includes('Cast to ObjectId failed') 
//                 ? 'Invalid supervisor reference format' 
//                 : error.message
//         });
//     }
// };

// // 11. Get Salary Report (flexible filtering)
// export const getSalaryReport = async (req, res) => {
//     try {
//         const { month, year, supervisorId, status, startDate, endDate } = req.query;
//         const { format = 'json' } = req.query;

//         // Validate format
//         const validFormats = ['json', 'excel', 'pdf'];
//         if (!validFormats.includes(format)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid format parameter. Use json, excel, or pdf"
//             });
//         }

//         // Build query
//         const query = {};
//         if (month) query.month = parseInt(month);
//         if (year) query.year = parseInt(year);
//         if (status) query.status = status;
//         if (supervisorId) {
//             if (mongoose.Types.ObjectId.isValid(supervisorId)) {
//                 query.supervisorId = supervisorId;
//             } else {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Invalid supervisorId format"
//                 });
//             }
//         }
//         if (startDate && endDate) {
//             query.date = { $gte: startDate, $lte: endDate };
//         } else if (startDate) {
//             query.date = { $gte: startDate };
//         } else if (endDate) {
//             query.date = { $lte: endDate };
//         }

//         // Get salary data with supervisor details
//         const salaries = await SupervisorSalary.find(query)
//             .populate({
//                 path: 'supervisorId',
//                 select: 'name email phone supervisorType forDaySalary',
//                 model: 'Supervisor',
//                 options: { allowNull: true }
//             })
//             .sort({ year: -1, month: -1, 'supervisorId.name': 1 })
//             .lean();

//         if (format === 'json') {
//             return res.status(200).json({
//                 success: true,
//                 count: salaries.length,
//                 data: salaries,
//                 filters: { month, year, supervisorId, status, startDate, endDate },
//                 reportType: 'salary'
//             });
//         } else if (format === 'excel') {
//             let title = 'Supervisor Salaries Report';
//             if (month && year) {
//                 title = `Supervisor Salaries - ${getMonthName(parseInt(month))} ${year}`;
//             } else if (year) {
//                 title = `Supervisor Salaries - Year ${year}`;
//             }
//             if (status) {
//                 title += ` (${status})`;
//             }
//             return generateExcelSalaryReport(res, salaries, title);
//         } else if (format === 'pdf') {
//             let title = 'Supervisor Salaries Report';
//             if (month && year) {
//                 title = `Supervisor Salaries - ${getMonthName(parseInt(month))} ${year}`;
//             } else if (year) {
//                 title = `Supervisor Salaries - Year ${year}`;
//             }
//             if (status) {
//                 title += ` (${status})`;
//             }
//             return generatePdfSalaryReport(res, salaries, title);
//         }

//     } catch (error) {
//         console.error("Error generating salary report:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message
//         });
//     }
// };

// // 12. Generate Daily Report
// export const generateDailyReport = async (req, res) => {
//     try {
//         const { DD, MM, YYYY } = req.params;
//         const format = req.query.format || 'json'; // Default to JSON, options: json, excel, pdf
//         const date = `${DD}/${MM}/${YYYY}`;

//         // Validate date format
//         if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid date format. Please use DD/MM/YYYY"
//             });
//         }

//         const salaries = await SupervisorSalary.find({ date })
//             .populate('supervisorId', 'name supervisorType forDaySalary')
//             .sort({ 'supervisorId.name': 1 });

//         if (format === 'json') {
//             return res.status(200).json({
//                 success: true,
//                 date,
//                 count: salaries.length,
//                 data: salaries
//             });
//         } else if (format === 'excel') {
//             // Create Excel workbook
//             const workbook = new exceljs.Workbook();
//             const worksheet = workbook.addWorksheet('Daily Salary Report');
            
//             // Add headers
//             worksheet.columns = [
//                 { header: 'ID', key: '_id', width: 10 },
//                 { header: 'Supervisor', key: 'name', width: 25 },
//                 { header: 'Type', key: 'type', width: 20 },
//                 { header: 'Basic Salary', key: 'basic', width: 15 },
//                 { header: 'Net Salary', key: 'net', width: 15 },
//                 { header: 'Status', key: 'status', width: 15 }
//             ];
            
//             // Add data
//             salaries.forEach(salary => {
//                 worksheet.addRow({
//                     _id: salary._id,
//                     name: salary.supervisorId.name,
//                     type: salary.supervisorId.supervisorType,
//                     basic: salary.forDaySalary,
//                     net: salary.netWeeklySalary,
//                     status: salary.status
//                 });
//             });
            
//             // Set response headers
//             res.setHeader(
//                 'Content-Type',
//                 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//             );
//             res.setHeader(
//                 'Content-Disposition',
//                 `attachment; filename=daily_salary_report_${DD}_${MM}_${YYYY}.xlsx`
//             );
            
//             // Send the workbook
//             return workbook.xlsx.write(res).then(() => {
//                 res.end();
//             });
//         } else if (format === 'pdf') {
//             // Create PDF document
//             const doc = new PDFDocument();
//             const filename = `daily_salary_report_${DD}_${MM}_${YYYY}.pdf`;
            
//             // Set response headers
//             res.setHeader('Content-Type', 'application/pdf');
//             res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
//             // Pipe PDF to response
//             doc.pipe(res);
            
//             // Add content
//             doc.fontSize(18).text(`Daily Salary Report - ${date}`, { align: 'center' });
//             doc.moveDown();
            
//             doc.fontSize(12);
//             doc.text(`Total Records: ${salaries.length}`);
//             doc.moveDown();
            
//             salaries.forEach((salary, index) => {
//                 doc.text(`${index + 1}. ${salary.supervisorId.name} (${salary.supervisorId.supervisorType})`);
//                 doc.text(`   Basic: ₹${salary.forDaySalary.toFixed(2)} | Net: ₹${salary.netWeeklySalary.toFixed(2)} | Status: ${salary.status}`);
//                 doc.moveDown(0.5);
//             });
            
//             // Finalize PDF
//             doc.end();
//         } else {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid format parameter. Use json, excel, or pdf"
//             });
//         }
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // 13. Generate Monthly Report
// export const generateMonthlyReport = async (req, res) => {
//     try {
//         const { MM, YYYY } = req.params;
//         const format = req.query.format || 'json';
//         const monthName = getMonthName(parseInt(MM));

//         const salaries = await SupervisorSalary.find({
//             month: parseInt(MM),
//             year: parseInt(YYYY)
//         }).populate('supervisorId', 'name supervisorType');

//         if (format === 'json') {
//             return res.status(200).json({
//                 success: true,
//                 period: `${monthName} ${YYYY}`,
//                 count: salaries.length,
//                 data: salaries
//             });
//         } else if (format === 'excel') {
//             // Create Excel workbook
//             const workbook = new exceljs.Workbook();
//             const worksheet = workbook.addWorksheet('Monthly Salary Report');
            
//             // Add headers
//             worksheet.columns = [
//                 { header: 'ID', key: '_id', width: 10 },
//                 { header: 'Supervisor', key: 'name', width: 25 },
//                 { header: 'Type', key: 'type', width: 20 },
//                 { header: 'Basic', key: 'basic', width: 15 },
//                 { header: 'Allowances', key: 'allowances', width: 15 },
//                 { header: 'Deductions', key: 'deductions', width: 15 },
//                 { header: 'Advance', key: 'advance', width: 15 },
//                 { header: 'Net Salary', key: 'net', width: 15 },
//                 { header: 'Status', key: 'status', width: 15 }
//             ];
            
//             // Add data
//             salaries.forEach(salary => {
//                 worksheet.addRow({
//                     _id: salary._id,
//                     name: salary.supervisorId.name,
//                     type: salary.supervisorId.supervisorType,
//                     basic: salary.forDaySalary,
//                     allowances: salary.allowances,
//                     deductions: salary.deductions,
//                     advance: salary.advanceSalary,
//                     net: salary.netWeeklySalary,
//                     status: salary.status
//                 });
//             });
            
//             // Add totals row
//             const totalNet = salaries.reduce((sum, salary) => sum + salary.netWeeklySalary, 0);
//             worksheet.addRow({
//                 _id: 'TOTAL',
//                 name: '',
//                 type: '',
//                 basic: '',
//                 allowances: '',
//                 deductions: '',
//                 advance: '',
//                 net: totalNet,
//                 status: ''
//             });
            
//             // Set response headers
//             res.setHeader(
//                 'Content-Type',
//                 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//             );
//             res.setHeader(
//                 'Content-Disposition',
//                 `attachment; filename=monthly_salary_report_${MM}_${YYYY}.xlsx`
//             );
            
//             // Send the workbook
//             return workbook.xlsx.write(res).then(() => {
//                 res.end();
//             });
//         } else if (format === 'pdf') {
//             // Create PDF document
//             const doc = new PDFDocument();
//             const filename = `monthly_salary_report_${MM}_${YYYY}.pdf`;
            
//             // Set response headers
//             res.setHeader('Content-Type', 'application/pdf');
//             res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
//             // Pipe PDF to response
//             doc.pipe(res);
            
//             // Add content
//             doc.fontSize(18).text(
//                 `Monthly Salary Report - ${monthName} ${YYYY}`,
//                 { align: 'center' }
//             );
//             doc.moveDown();
            
//             doc.fontSize(12);
//             doc.text(`Total Records: ${salaries.length}`);
//             doc.moveDown();
            
//             let totalNet = 0;
//             salaries.forEach((salary, index) => {
//                 doc.text(`${index + 1}. ${salary.supervisorId.name} (${salary.supervisorId.supervisorType})`);
//                 doc.text(`   Basic: ₹${salary.forDaySalary.toFixed(2)} | Allowances: ₹${salary.allowances.toFixed(2)}`);
//                 doc.text(`   Deductions: ₹${salary.deductions.toFixed(2)} | Advance: ₹${salary.advanceSalary.toFixed(2)}`);
//                 doc.text(`   Net Salary: ₹${salary.netWeeklySalary.toFixed(2)} | Status: ${salary.status}`);
//                 doc.moveDown(0.5);
//                 totalNet += salary.netWeeklySalary;
//             });
            
//             doc.moveDown();
//             doc.fontSize(14).text(`Total Net Salaries: ₹${totalNet.toFixed(2)}`, { underline: true });
            
//             // Finalize PDF
//             doc.end();
//         } else {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid format parameter. Use json, excel, or pdf"
//             });
//         }
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // 14. Generate Yearly Report
// export const generateYearlyReport = async (req, res) => {
//     try {
//         const { YYYY } = req.params;
//         const format = req.query.format || 'json';

//         const salaries = await SupervisorSalary.find({
//             year: parseInt(YYYY)
//         }).populate('supervisorId', 'name supervisorType');

//         if (format === 'json') {
//             return res.status(200).json({
//                 success: true,
//                 year: YYYY,
//                 count: salaries.length,
//                 data: salaries
//             });
//         } else if (format === 'excel') {
//             // Create Excel workbook
//             const workbook = new exceljs.Workbook();
//             const worksheet = workbook.addWorksheet('Yearly Salary Report');
            
//             // Add headers
//             worksheet.columns = [
//                 { header: 'ID', key: '_id', width: 10 },
//                 { header: 'Supervisor', key: 'name', width: 25 },
//                 { header: 'Type', key: 'type', width: 20 },
//                 { header: 'Month', key: 'month', width: 15 },
//                 { header: 'Basic', key: 'basic', width: 15 },
//                 { header: 'Net Salary', key: 'net', width: 15 },
//                 { header: 'Status', key: 'status', width: 15 }
//             ];
            
//             // Add data
//             salaries.forEach(salary => {
//                 worksheet.addRow({
//                     _id: salary._id,
//                     name: salary.supervisorId.name,
//                     type: salary.supervisorId.supervisorType,
//                     month: salary.monthName,
//                     basic: salary.forDaySalary,
//                     net: salary.netWeeklySalary,
//                     status: salary.status
//                 });
//             });
            
//             // Set response headers
//             res.setHeader(
//                 'Content-Type',
//                 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//             );
//             res.setHeader(
//                 'Content-Disposition',
//                 `attachment; filename=yearly_salary_report_${YYYY}.xlsx`
//             );
            
//             // Send the workbook
//             return workbook.xlsx.write(res).then(() => {
//                 res.end();
//             });
//         } else if (format === 'pdf') {
//             // Create PDF document
//             const doc = new PDFDocument();
//             const filename = `yearly_salary_report_${YYYY}.pdf`;
            
//             // Set response headers
//             res.setHeader('Content-Type', 'application/pdf');
//             res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
//             // Pipe PDF to response
//             doc.pipe(res);
            
//             // Add content
//             doc.fontSize(18).text(
//                 `Yearly Salary Report - ${YYYY}`,
//                 { align: 'center' }
//             );
//             doc.moveDown();
            
//             doc.fontSize(12);
//             doc.text(`Total Records: ${salaries.length}`);
//             doc.moveDown();
            
//             // Group by supervisor
//             const bySupervisor = {};
//             salaries.forEach(salary => {
//                 if (!bySupervisor[salary.supervisorId.name]) {
//                     bySupervisor[salary.supervisorId.name] = {
//                         type: salary.supervisorId.supervisorType,
//                         salaries: []
//                     };
//                 }
//                 bySupervisor[salary.supervisorId.name].salaries.push(salary);
//             });
            
//             // Add supervisor-wise summary
//             Object.keys(bySupervisor).forEach((name, idx) => {
//                 const supervisor = bySupervisor[name];
//                 const total = supervisor.salaries.reduce((sum, s) => sum + s.netWeeklySalary, 0);
                
//                 doc.text(`${idx + 1}. ${name} (${supervisor.type})`);
//                 doc.text(`   Months Worked: ${supervisor.salaries.length}`);
//                 doc.text(`   Total Earnings: ₹${total.toFixed(2)}`);
//                 doc.moveDown(0.5);
//             });
            
//             // Add grand total
//             const grandTotal = salaries.reduce((sum, salary) => sum + salary.netWeeklySalary, 0);
//             doc.moveDown();
//             doc.fontSize(14).text(`Grand Total: ₹${grandTotal.toFixed(2)}`, { underline: true });
            
//             // Finalize PDF
//             doc.end();
//         } else {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid format parameter. Use json, excel, or pdf"
//             });
//         }
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // Helper functions for report generation
// const generateExcelSalaryReport = async (res, salaries, title = 'Salary Report') => {
//     try {
//         const workbook = new exceljs.Workbook();
//         const worksheet = workbook.addWorksheet('Salary Report');

//         // Add title and date
//         worksheet.addRow([title]);
//         worksheet.addRow(['Generated on:', new Date().toLocaleString()]);
//         worksheet.addRow([]);

//         // Define columns
//         worksheet.columns = [
//             { header: 'Supervisor Name', key: 'name', width: 25 },
//             { header: 'Month', key: 'month', width: 15 },
//             { header: 'Year', key: 'year', width: 10 },
//             { header: 'Basic Salary', key: 'basicSalary', width: 15, style: { numFmt: '"₹"#,##0.00' } },
//             { header: 'Allowances', key: 'allowances', width: 15, style: { numFmt: '"₹"#,##0.00' } },
//             { header: 'Deductions', key: 'deductions', width: 15, style: { numFmt: '"₹"#,##0.00' } },
//             { header: 'Net Salary', key: 'netSalary', width: 15, style: { numFmt: '"₹"#,##0.00' } },
//             { header: 'Paid Amount', key: 'paidAmount', width: 15, style: { numFmt: '"₹"#,##0.00' } },
//             { header: 'Advance', key: 'advanceSalary', width: 15, style: { numFmt: '"₹"#,##0.00' } },
//             { header: 'Balance', key: 'balanceAmount', width: 15, style: { numFmt: '"₹"#,##0.00' } },
//             { header: 'Status', key: 'status', width: 15 },
//             { header: 'Working Days', key: 'workingDays', width: 15 },
//             { header: 'Total Days', key: 'totalDays', width: 15 }
//         ];

//         // Add data rows
//         salaries.forEach(salary => {
//             worksheet.addRow({
//                 name: salary.supervisorId?.name || salary.supervisorName || 'Unknown',
//                 month: salary.monthName,
//                 year: salary.year,
//                 basicSalary: salary.forDaySalary || salary.basicSalary,
//                 allowances: salary.allowances,
//                 deductions: salary.deductions,
//                 netSalary: salary.netWeeklySalary,
//                 paidAmount: salary.paidAmount,
//                 advanceSalary: salary.advanceSalary,
//                 balanceAmount: salary.balanceAmount,
//                 status: salary.status,
//                 workingDays: salary.workingDays,
//                 totalDays: salary.totalDays
//             });
//         });

//         // Add summary row
//         worksheet.addRow([]);
//         const summaryRow = worksheet.addRow([
//             'TOTAL', 
//             '', 
//             '',
//             { formula: `SUM(D4:D${worksheet.rowCount - 1})` },
//             { formula: `SUM(E4:E${worksheet.rowCount - 1})` },
//             { formula: `SUM(F4:F${worksheet.rowCount - 1})` },
//             { formula: `SUM(G4:G${worksheet.rowCount - 1})` },
//             { formula: `SUM(H4:H${worksheet.rowCount - 1})` },
//             { formula: `SUM(I4:I${worksheet.rowCount - 1})` },
//             { formula: `SUM(J4:J${worksheet.rowCount - 1})` },
//             '',
//             { formula: `SUM(L4:L${worksheet.rowCount - 1})` },
//             { formula: `SUM(M4:M${worksheet.rowCount - 1})` }
//         ]);
        
//         summaryRow.font = { bold: true };
//         summaryRow.eachCell(cell => {
//             if (cell.value && typeof cell.value === 'object' && cell.value.formula) {
//                 cell.numFmt = '"₹"#,##0.00';
//             }
//         });

//         // Style the header row
//         worksheet.getRow(4).eachCell(cell => {
//             cell.font = { bold: true };
//             cell.fill = {
//                 type: 'pattern',
//                 pattern: 'solid',
//                 fgColor: { argb: 'FFD3D3D3' }
//             };
//         });

//         // Set response headers
//         res.setHeader(
//             'Content-Type',
//             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//         );
//         res.setHeader(
//             'Content-Disposition',
//             `attachment; filename=${title.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
//         );

//         // Write to response
//         await workbook.xlsx.write(res);
//         res.end();

//     } catch (error) {
//         console.error("Error generating Excel report:", error);
//         throw error;
//     }
// };

// const generatePdfSalaryReport = async (res, salaries, title = 'Salary Report') => {
//     try {
//         const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });

//         // Set response headers
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader(
//             'Content-Disposition',
//             `attachment; filename=${title.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
//         );

//         doc.pipe(res);

//         // Add title
//         doc.fontSize(18).text(title, { align: 'center' });
//         doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
//         doc.moveDown(2);

//         // Define table parameters
//         const table = {
//             headers: [
//                 'Supervisor',
//                 'Month',
//                 'Year',
//                 'Basic Salary',
//                 'Allowances',
//                 'Deductions',
//                 'Net Salary',
//                 'Paid',
//                 'Advance',
//                 'Balance',
//                 'Status',
//                 'Work Days'
//             ],
//             rows: [],
//             columnWidths: [100, 60, 50, 80, 70, 70, 80, 70, 70, 70, 60, 60],
//             align: ['left', 'center', 'center', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'center', 'center']
//         };

//         // Add data rows
//         salaries.forEach(salary => {
//             table.rows.push([
//                 salary.supervisorId?.name || salary.supervisorName || 'Unknown',
//                 salary.monthName,
//                 salary.year.toString(),
//                 `₹${(salary.forDaySalary || salary.basicSalary).toFixed(2)}`,
//                 `₹${salary.allowances.toFixed(2)}`,
//                 `₹${salary.deductions.toFixed(2)}`,
//                 `₹${salary.netWeeklySalary.toFixed(2)}`,
//                 `₹${salary.paidAmount.toFixed(2)}`,
//                 `₹${salary.advanceSalary.toFixed(2)}`,
//                 `₹${salary.balanceAmount.toFixed(2)}`,
//                 salary.status,
//                 `${salary.workingDays}/${salary.totalDays || ''}`
//             ]);
//         });

//         // Calculate totals for footer
//         const totals = {
//             basicSalary: salaries.reduce((sum, s) => sum + (s.forDaySalary || s.basicSalary), 0),
//             allowances: salaries.reduce((sum, s) => sum + s.allowances, 0),
//             deductions: salaries.reduce((sum, s) => sum + s.deductions, 0),
//             netSalary: salaries.reduce((sum, s) => sum + s.netWeeklySalary, 0),
//             paidAmount: salaries.reduce((sum, s) => sum + s.paidAmount, 0),
//             advanceSalary: salaries.reduce((sum, s) => sum + s.advanceSalary, 0),
//             balanceAmount: salaries.reduce((sum, s) => sum + s.balanceAmount, 0),
//             workingDays: salaries.reduce((sum, s) => sum + s.workingDays, 0),
//             totalDays: salaries.reduce((sum, s) => sum + (s.totalDays || 0), 0)
//         };

//         // Draw table
//         let y = doc.y;
//         const rowHeight = 20;
//         const x = 50;

//         // Draw headers
//         doc.font('Helvetica-Bold');
//         table.headers.forEach((header, i) => {
//             doc.text(header, x + (i > 0 ? table.columnWidths.slice(0, i).reduce((a, b) => a + b, 0) : 0, y, {
//                 width: table.columnWidths[i],
//                 align: table.align[i]
//             }));
//         });
//         doc.font('Helvetica');

//         // Draw rows
//         y += rowHeight;
//         table.rows.forEach(row => {
//             row.forEach((cell, i) => {
//                 doc.text(cell, x + (i > 0 ? table.columnWidths.slice(0, i).reduce((a, b) => a + b, 0) : 0, y, {
//                     width: table.columnWidths[i],
//                     align: table.align[i]
//                 }));
//             });
//             y += rowHeight;
//         });

//         // Draw footer with totals
//         y += rowHeight;
//         doc.font('Helvetica-Bold');
//         doc.text('TOTALS:', x, y);
//         doc.text(`₹${totals.basicSalary.toFixed(2)}`, x + table.columnWidths.slice(0, 3).reduce((a, b) => a + b, 0), y, {
//             width: table.columnWidths[3],
//             align: 'right'
//         });
//         doc.text(`₹${totals.allowances.toFixed(2)}`, x + table.columnWidths.slice(0, 4).reduce((a, b) => a + b, 0), y, {
//             width: table.columnWidths[4],
//             align: 'right'
//         });
//         doc.text(`₹${totals.deductions.toFixed(2)}`, x + table.columnWidths.slice(0, 5).reduce((a, b) => a + b, 0), y, {
//             width: table.columnWidths[5],
//             align: 'right'
//         });
//         doc.text(`₹${totals.netSalary.toFixed(2)}`, x + table.columnWidths.slice(0, 6).reduce((a, b) => a + b, 0), y, {
//             width: table.columnWidths[6],
//             align: 'right'
//         });
//         doc.text(`₹${totals.paidAmount.toFixed(2)}`, x + table.columnWidths.slice(0, 7).reduce((a, b) => a + b, 0), y, {
//             width: table.columnWidths[7],
//             align: 'right'
//         });
//         doc.text(`₹${totals.advanceSalary.toFixed(2)}`, x + table.columnWidths.slice(0, 8).reduce((a, b) => a + b, 0), y, {
//             width: table.columnWidths[8],
//             align: 'right'
//         });
//         doc.text(`₹${totals.balanceAmount.toFixed(2)}`, x + table.columnWidths.slice(0, 9).reduce((a, b) => a + b, 0), y, {
//             width: table.columnWidths[9],
//             align: 'right'
//         });
//         doc.text(`${totals.workingDays}/${totals.totalDays}`, x + table.columnWidths.slice(0, 11).reduce((a, b) => a + b, 0), y, {
//             width: table.columnWidths[11],
//             align: 'center'
//         });

//         doc.end();

//     } catch (error) {
//         console.error("Error generating PDF report:", error);
//         throw error;
//     }
// };
