import mongoose from "mongoose";

const workerSalarySchema = new mongoose.Schema({
    _id: { type: Number }, // Will be auto-incremented
    workerId: { 
        type: Number,
        ref: "Worker",
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
    workerRole: {
        type: String,
        enum: [
            'Centering Worker',
            'Steel Worker',
            'Mason Worker',
            'Carpenter Worker',
            'Plumber Worker',
            'Electrician Worker',
            'Painter Worker',
            'Tiles Worker'
        ]
    },
    workerSubRole: {
        type: String
    },
    site: {
        type: Number,
        ref: 'Site'
    },
    supervisorId: {
        type: Number,
        ref: 'Supervisor'
    },
    contractorId: {
        type: Number,
        ref: 'Contractor'
    }
}, { timestamps: true });

// Pre-save hook to auto-increment the _id
workerSalarySchema.pre('save', async function(next) {
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

export default mongoose.model("WorkerSalary", workerSalarySchema);