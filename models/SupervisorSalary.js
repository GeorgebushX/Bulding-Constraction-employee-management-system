
import mongoose from "mongoose";

const supervisorSalarySchema = new mongoose.Schema({
    _id: { type: Number }, // Will be auto-incremented
    supervisorId: { 
        type: Number,
        ref: "Supervisor",
        required: true,
    },
    startDate: {
        type: String,
    },
    endDate: {
        type: String},
         weekNumber: {
        type: Number,
        min: 1,
        max: 52
    },
    forDaySalary: {
        type: Number,
        required: true
    },
    HalfSalary: {
        type: Number,
        default: 400 // Default half day deduction amount
    },
    HalfDay: { // Changed from singular to plural if needed
        type: Number,
        default: 0
    },
    week: {
        type: Number,
    },
    month: {
        type: Number,
    },
    monthName: {
        type: String,
    },
    year: {
        type: Number,  
    },
    basicSalary: {
        type: Number,  
    },
    OvertimeSalary:{type:Number},
    allowances: {
        type: Number,
        default: 0,
    },
    deductions: {
        type: Number,
        default: 0,
    },
    advanceSalary: {
        type: Number,
        default: 0,
    },
    netDailySalary: {
        type: Number,
    },
    netWeeklySalary: {
        type: Number,
    },
    netMonthlySalary: {
        type: Number,
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    balanceAmount: {
        type: Number,
    },
    status: {
        type: String,
        enum: ["Pending", "Paid", "Partial"],
        default: "Pending",
    },
    date: {
        type: String,
    },
    workingDays: {
        type: Number,
        min: 0
    },
    OvertimeDays:{
        type:Number},
    totalDays: {
        type: Number,
        min: 1,
        max: 31
    }
}, { timestamps: true });

// Pre-save hook to auto-increment the _id
supervisorSalarySchema.pre('save', async function(next) {
    if (!this.isNew) {
        return next();
    }
    try {
        const lastRecord = await this.constructor.findOne({}, {}, { sort: { '_id': -1 } });
        this._id = lastRecord ? lastRecord._id + 1 : 1;
        next();
    } catch (err) {
        next(err);
    }
});

export default mongoose.model("SupervisorSalary", supervisorSalarySchema);