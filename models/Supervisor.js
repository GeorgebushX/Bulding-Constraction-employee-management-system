
// // models/Supervisor.js
// import mongoose from 'mongoose';
// import User from './User.js';

// // Address schema
// const addressSchema = new mongoose.Schema({
//   street: String,
//   city: String,
//   state: String,
//   zipCode: String,
//   country: String
// }, { _id: false });

// const supervisorSchema = new mongoose.Schema({
//   _id: Number, // Will be the same as userId
//   userId: {
//     type: Number,
//     ref: "User",
//     required: true,
//     unique: true
//   },


//   site: { type: Number, ref: 'Site' },
//   name: { type: String, required: true },
//   dateOfBirth: { 
//     type: String,
//     set: function(date) {
//       return formatDate(date);
//     }
//   },
//   password: { type: String },
//   gender: { type: String, enum: ['Male', 'Female', 'Other'] },
//   email: { type: String, unique: true, lowercase: true },
//   phone: { type: String },
//   alternatePhone: { type: String },
//   address: addressSchema,
//   role: { type: String, enum: ["Engineer", "Supervisor", "Contractor", "Worker"], default: "Supervisor" },
//   supervisorType: {
//     type: String,
//     enum: ['Centering Supervisor', 
//       'Steel Supervisor', 
//       'Mason Supervisor', 
//       'Carpenter Supervisor', 
//       'Plumber Supervisor', 
//       'Electrician Supervisor', 
//       'Painter Supervisor', 
//       'Tiles Supervisor'
//     ]
//   },
//   joiningDate: { 
//     type: String,
//     set: function(date) {
//       return formatDate(date);
//     }
//   },
//   bankName: { type: String },
//   bankAccount: { type: String, trim: true },
//   bankCode: { type: String, trim: true },
//   photo: { type: String },



//   supervisorIdProof: [{ type: String }],

// // supervisor attendance
// date: { type: String},
// status: {
//     type: String,
//     enum: ["Fullday", "Halfday", "Overtime", null],
//     default: null,
//   },


//   createdAt: {
//     type: String,
//     default: () => formatDate(new Date())
//   },
//   updatedAt: {
//     type: String,
//     default: () => formatDate(new Date())
//   }
// }, {
//   timestamps: false,
//   _id: false
// });

// // Helper function to format dates as DD/MM/YYYY
// function formatDate(date) {
//   if (date instanceof Date) {
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     const year = date.getFullYear();
//     return `${day}/${month}/${year}`;
//   }
//   if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
//     return date;
//   }
//   const parsedDate = new Date(date);
//   if (!isNaN(parsedDate.getTime())) {
//     const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
//     const day = parsedDate.getDate().toString().padStart(2, '0');
//     const year = parsedDate.getFullYear();
//     return `${day}/${month}/${year}`;
//   }
//   return date;
// }

// // Set _id to be the same as userId
// supervisorSchema.pre('save', function(next) {
//   if (this.isNew) {
//     this._id = this.userId;
//   }
//   next();
// });

// const Supervisor = mongoose.model('Supervisor', supervisorSchema);
// export default Supervisor;



// models/Supervisor.js
import mongoose from 'mongoose';
import User from './User.js';
import cron from 'node-cron';

// Address schema
const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String
}, { _id: false });

// Attendance record schema
const attendanceRecordSchema = new mongoose.Schema({
  date: { type: String, required: true },
  status: {
    type: String,
    enum: ["Fullday", "Halfday", "Overtime", null],
    required: true
  },
  recordedAt: { type: Date, 
    default: Date.now,
    get: formatDateToDDMMYYYY
  }
}, { _id: false });


// Helper function to format dates as DD/MM/YYYY
function formatDateToDDMMYYYY(date) {
  if (!date) return null;
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}


const supervisorSchema = new mongoose.Schema({
  _id: Number, // Will be the same as userId
  userId: {
    type: Number,
    ref: "User",
    required: true,
    unique: true
  },
  site: { type: Number, ref: 'Site' },
  name: { type: String, required: true },
  dateOfBirth: { 
    type: String,
    set: function(date) {
      return formatDate(date);
    }
  },
  password: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  email: { type: String, unique: true, lowercase: true },
  phone: { type: String },
  alternatePhone: { type: String },
  address: addressSchema,
  role: { type: String, enum: ["Engineer", "Supervisor", "Contractor", "Worker"], default: "Supervisor" },
  supervisorType: {
    type: String,
    enum: ['Centering Supervisor', 
      'Steel Supervisor', 
      'Mason Supervisor', 
      'Carpenter Supervisor', 
      'Plumber Supervisor', 
      'Electrician Supervisor', 
      'Painter Supervisor', 
      'Tiles Supervisor'
    ]
  },
  joiningDate: { 
    type: String,
    set: function(date) {
      return formatDate(date);
    }
  },
  bankName: { type: String },
  bankAccount: { type: String, trim: true },
  bankCode: { type: String, trim: true },
  photo: { type: String },
  supervisorIdProof: [{ type: String }],
  
  // Current day's attendance (for quick access)
  currentAttendance: {
    date: { type: String },
    status: {
      type: String,
      enum: ["Fullday", "Halfday", "Overtime", null],
      default: null
    }
  },
  
  // Historical attendance records
  attendanceRecords: [attendanceRecordSchema],

  createdAt: {
    type: String,
    default: () => formatDate(new Date())
  },
  updatedAt: {
    type: String,
    default: () => formatDate(new Date())
  }
}, {
  timestamps: false,
  _id: false
});

// Helper function to format dates as DD/MM/YYYY
function formatDate(date) {
  if (date instanceof Date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    return date;
  }
  const parsedDate = new Date(date);
  if (!isNaN(parsedDate.getTime())) {
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = parsedDate.getDate().toString().padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return date;
}

// Set _id to be the same as userId
supervisorSchema.pre('save', function(next) {
  if (this.isNew) {
    this._id = this.userId;
  }
  next();
});

// Middleware to handle attendance records
supervisorSchema.pre('save', function(next) {
  if (this.isModified('currentAttendance.status') && this.currentAttendance.date) {
    // Check if record for this date already exists
    const existingRecordIndex = this.attendanceRecords.findIndex(
      record => record.date === this.currentAttendance.date
    );
    
    if (existingRecordIndex >= 0) {
      // Update existing record
      this.attendanceRecords[existingRecordIndex].status = this.currentAttendance.status;
    } else {
      // Add new record
      this.attendanceRecords.push({
        date: this.currentAttendance.date,
        status: this.currentAttendance.status
      });
    }
  }
  next();
});

const Supervisor = mongoose.model('Supervisor', supervisorSchema);
export default Supervisor;
