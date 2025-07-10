// import mongoose from "mongoose";

// const supervisorSalarySchema = new mongoose.Schema({
//     _id: { type: Number }, // This will be manually set to supervisorId
//     supervisorId: { 
//         type: Number,
//         ref: "Supervisor",
//         required: true,
//     },
//     attendanceId: { 
//         type: Number,
//         ref: "AttendanceSupervisor",
//         required: true,
//     },
//     week: {
//         type: String,
//         required: true
//     },
//     month: {
//         type: String,
//         required: true,
//     },
//     year: {
//         type: Number,
//         required: true,
//     },
//     basicSalary: {
//         type: Number,
//         required: true,
//     },
//     allowances: {
//         type: Number,
//         default: 0,
//     },
//     deductions: {
//         type: Number,
//         default: 0,
//     },
//     netSalary: {
//         type: Number,
//         required: true,
//     },
//     weeklySalary: {
//         type: Number,
//         required: true,
//     },
//     monthlySalary: {
//         type: Number,
//         required: true,
//     },
//     status: {
//         type: String,
//         enum: ["Pending", "Paid"],
//         default: "Pending",
//     },
//     date: {
//         type: Date,
//         default: Date.now,
//     },
// }, { timestamps: true });

// // Set _id to be equal to supervisorId before validation
// supervisorSalarySchema.pre('validate', function(next) {
//     if (!this._id) {
//         this._id = this.supervisorId;
//     }
//     next();
// });

// export default mongoose.model("SupervisorSalary", supervisorSalarySchema);








import mongoose from "mongoose";

const supervisorSalarySchema = new mongoose.Schema({
    _id: { type: Number }, // This will be manually set to supervisorId
    supervisorId: { 
        type: Number,
        ref: "Supervisor",
        required: true,
    },
    attendanceId: { 
        type: Number,
        ref: "AttendanceSupervisor",
        required: true,
    },
    date: {
        type: String, // Stored as DD/MM/YYYY
        required: true
    },
    week: {
        type: Number,
        required: true
    },
    month: {
        type: Number,
        required: true,
    },
    monthName: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true,
    },
    basicSalary: {
        type: Number,
        required: true,
    },
    allowances: {
        type: Number,
        default: 0,
    },
    deductions: {
        type: Number,
        default: 0,
    },
    netDailySalary: {
        type: Number,
        required: true,
    },
    netWeeklySalary: {
        type: Number,
        required: true,
    },
    netMonthlySalary: {
        type: Number,
        required: true,
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    balanceAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Paid"],
        default: "Pending",
    },
    paymentDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Set _id to be equal to supervisorId before validation
supervisorSalarySchema.pre('validate', function(next) {
    if (!this._id) {
        this._id = this.supervisorId;
    }
    next();
});

export default mongoose.model("SupervisorSalary", supervisorSalarySchema);













// import mongoose from "mongoose";

// const supervisorSalarySchema = new mongoose.Schema({
//     _id: { type: Number }, // This will be manually set to supervisorId
//     supervisorId: { 
//         type: Number,
//         ref: "Supervisor",
//         required: true,
//     },
//     attendanceId: { 
//         type: Number,
//         ref: "AttendanceSupervisor",
//         required: true,
//     },
//     date: {
//         type: String, // Stored as DD/MM/YYYY
//         required: true
//     },
//     week: {
//         type: String,
//         required: true
//     },
//     month: {
//         type: String,
//         required: true,
//     },
//     year: {
//         type: Number,
//         required: true,
//     },
//     basicSalary: {
//         type: Number,
//         required: true,
//     },
//     allowances: {
//         type: Number,
//         default: 0,
//     },
//     deductions: {
//         type: Number,
//         default: 0,
//     },
//     netSalary: {
//         type: Number,
//         required: true,
//     },
//     dailyNetSalary: {
//         type: Number,
//         required: true,
//     },
//     weeklyNetSalary: {
//         type: Number,
//         required: true,
//     },
//     monthlyNetSalary: {
//         type: Number,
//         required: true,
//     },
//     status: {
//         type: String,
//         enum: ["Pending", "Paid"],
//         default: "Pending",
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now,
//     },
// }, { timestamps: true });

// // Set _id to be equal to supervisorId before validation
// supervisorSalarySchema.pre('validate', function(next) {
//     if (!this._id) {
//         this._id = this.supervisorId;
//     }
//     next();
// });

// export default mongoose.model("SupervisorSalary", supervisorSalarySchema);