
// import mongoose from "mongoose";

// // Helper function to format dates as DD/MM/YYYY
// function formatDate(date) {
//     if (!date) return null;
    
//     const parsedDate = new Date(date);
//     if (!isNaN(parsedDate.getTime())) {
//       const day = parsedDate.getDate().toString().padStart(2, '0');
//       const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
//       const year = parsedDate.getFullYear();
//       return `${day}/${month}/${year}`;
//     }
//     return date;
//   }

// const supervisorSalarySchema = new mongoose.Schema({
//     _id: { type: Number }, // This will be manually set to supervisorId
//     supervisorId: { 
//         type: Number,
//         ref: "Supervisor",
//         required: true,
//     },
//     week: {
//         type: Number,
//     },
//     month: {
//         type: Number,
//     },
//     monthName: {
//         type: String,
//     },
//     year: {
//         type: Number,  
//     },
//     actualMonthlySalary:{
//         type:Number,
//         default: 0,
//     },
//     basicSalary: {
//         type: Number,  
//     },
//     allowances: {
//         type: Number,
//         default: 0,
//     },
//     deductions: {
//         type: Number,
//         default: 0,
//     },
//     advanceSalary:{
//         type:Number,
//         default: 0,
//     },
//     netDailySalary: {
//         type: Number,
//     },
//     netWeeklySalary: {
//         type: Number,
//     },
//     netMonthlySalary: {
//         type: Number,
//     },
//     paidAmount: {
//         type: Number,
//         default: 0
//     },
//     balanceAmount: {
//         type: Number,
//     },
//     status: {
//         type: String,
//         enum: ["Pending", "Paid", "Partial"],
//         default: "Pending",
//     },
//     Date: {
//         type: String,
//     },
//      workingDays: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   totalDays: {
//     type: Number,
//     required: true,
//     min: 1,
//     max: 31
//   },
 
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
    _id: { type: Number }, // Will be auto-incremented
    supervisorId: { 
        type: Number,
        ref: "Supervisor",
        required: true,
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
    actualMonthlySalary: {
        type: Number,
        default: 0,
    },
    basicSalary: {
        type: Number,  
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
    workingDays: {
        type: Number,
        min: 0
    },
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