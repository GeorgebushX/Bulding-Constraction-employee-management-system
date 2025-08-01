
import mongoose from "mongoose";

const contractorSalarySchema = new mongoose.Schema({
    _id: { type: Number }, // Will be auto-incremented
    contractorId: { 
        type: Number,
        ref: "Contractor",
        required: true,
    },
    perDaySalary: {
        type: Number,
        required: true
    },
    startDate: {
        type: String,
    },
    endDate: {
        type: String
    },
    weekNumber: {
        type: Number,
        min: 1,
        max: 52
    },
    workingDays: {
        type: Number,
        min: 0
    },
    OvertimeDaysCount: {
        type: Number
    },
    HalfDaysCount: {
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
    OvertimeOneDaySalary: {
        type: Number
    },
    HalfdayOneDaySalary: {
        type: Number,
        default: 400 // Default half day deduction amount
    },
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
    totalDays: {
        type: Number,
        min: 1,
        max: 31
    },
    contractorRole: {
        type: String,
        enum: [
            'Centering Contractor',
            'Steel Contractor',
            'Mason Contractor',
            'Carpenter Contractor',
            'Plumber Contractor',
            'Electrician Contractor',
            'Painter Contractor',
            'Tiles Contractor'
        ]
    },
    site: {
        type: Number,
        ref: 'Site'
    },
    supervisorId: {
        type: Number,
        ref: 'Supervisor'
    }
}, { timestamps: true });

// Pre-save hook to auto-increment the _id
contractorSalarySchema.pre('save', async function(next) {
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

export default mongoose.model("ContractorSalary", contractorSalarySchema);




