import SupervisorSalary from "../models/SupervisorSalary.js";
import AttendanceSupervisor from "../models/AttendanceSupervisor.js";
import Supervisor from "../models/Supervisor.js";

// Create Salary
export const createSalary = async (req, res) => {
    try {
        const { supervisorId, attendanceId, week, month, year, allowances, deductions } = req.body;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Get the attendance record to check status
        const attendance = await AttendanceSupervisor.findById(attendanceId);
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found",
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
            case "overtime":
                basicSalary = 1500;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid attendance status",
                });
        }

        // Convert values to numbers
        const allow = parseFloat(allowances) || 0;
        const deduct = parseFloat(deductions) || 0;
        const netSalary = basicSalary + allow - deduct;

        // Create Salary Record
        const newSalary = new SupervisorSalary({
            supervisorId,
            attendanceId,
            week,
            month,
            year,
            basicSalary,
            allowances: allow,
            deductions: deduct,
            netSalary,
        });

        await newSalary.save();
        res.status(201).json({
            success: true,
            message: "Salary created successfully",
            data: newSalary,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create salary",
            error: error.message,
        });
    }
};

// Get All Salaries
export const getAllSalaries = async (req, res) => {
    try {
        const salaries = await SupervisorSalary.find()
            .populate('supervisorId')
            .populate('attendanceId');

        res.status(200).json({
            success: true,
            message: "All salaries retrieved successfully",
            data: salaries,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve salaries",
            error: error.message,
        });
    }
};

// Get Salary by ID
export const getSalaryById = async (req, res) => {
    try {
        const salary = await SupervisorSalary.findById(req.params.id)
            .populate('supervisorId')
            .populate('attendanceId');

        if (!salary) {
            return res.status(404).json({
                success: false,
                message: "Salary not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Salary retrieved successfully",
            data: salary,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve salary",
            error: error.message,
        });
    }
};

// Update Salary
export const updateSalary = async (req, res) => {
    try {
        const { allowances, deductions, status } = req.body;
        
        // Find the salary record
        const salary = await SupervisorSalary.findById(req.params.id);
        if (!salary) {
            return res.status(404).json({
                success: false,
                message: "Salary not found",
            });
        }

        // Update fields
        if (allowances !== undefined) salary.allowances = parseFloat(allowances) || 0;
        if (deductions !== undefined) salary.deductions = parseFloat(deductions) || 0;
        if (status) salary.status = status;

        // Recalculate net salary
        salary.netSalary = salary.basicSalary + salary.allowances - salary.deductions;

        await salary.save();

        res.status(200).json({
            success: true,
            message: "Salary updated successfully",
            data: salary,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update salary",
            error: error.message,
        });
    }
};

// Delete Salary by ID
export const deleteSalaryById = async (req, res) => {
    try {
        const salary = await SupervisorSalary.findByIdAndDelete(req.params.id);
        
        if (!salary) {
            return res.status(404).json({
                success: false,
                message: "Salary not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Salary deleted successfully",
            data: salary,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete salary",
            error: error.message,
        });
    }
};

// Delete All Salaries
export const deleteAllSalaries = async (req, res) => {
    try {
        await SupervisorSalary.deleteMany({});
        
        res.status(200).json({
            success: true,
            message: "All salaries deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete all salaries",
            error: error.message,
        });
    }
};