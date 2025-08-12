//   import mongoose from 'mongoose';
//   import mongooseSequence from 'mongoose-sequence';

//   const AutoIncrement = mongooseSequence(mongoose);

//   // Address schema
//   const addressSchema = new mongoose.Schema({
//     street: { type: String },
//     city: { type: String },
//     state: { type: String },
//     zipCode: { type: String },
//     country: { type: String }
//   }, { _id: false });

//   // Helper to format date as DD/MM/YYYY
//   function formatDateToDDMMYYYY(date) {
//     if (!date) return null;
//     const d = new Date(date);
//     const day = d.getDate().toString().padStart(2, '0');
//     const month = (d.getMonth() + 1).toString().padStart(2, '0');
//     const year = d.getFullYear();
//     return `${day}/${month}/${year}`;
//   }

//   // Attendance record (historical)
//   const attendanceRecordSchema = new mongoose.Schema({
//     currentAttendance: {
//       date: { type: String },
//       status: {
//         type: String,
//         enum: ["Fullday", "Halfday", "Overtime", null],
//         default: null
//       }
//     },
//     recordedAt: {
//       type: Date,
//       default: Date.now,
//       get: formatDateToDDMMYYYY
//     }
//   }, { _id: false });

//   // Contractor schema
//   const contractorSchema = new mongoose.Schema({
//     _id: Number,
//     userId: { type: Number, ref: "User", required: true },
//     supervisorId: { type: Number, ref: "Supervisor", required: true },
//     site: { type: Number, ref: 'Site' },
//     name: { type: String, required: true },
//     password: { type: String },
//     gender: { type: String, enum: ['Male', 'Female', 'Other'] },
//     email: { type: String, unique: true, lowercase: true },
//     phone: { type: String },
//     alternatePhone: { type: String },
//     address: addressSchema,
//     role: {
//       type: String,
//       enum: ["Engineer", "Supervisor", "Contractor", "Worker"],
//       default: "Contractor"
//     },
//     joiningDate: {
//       type: String,
//       set: function (date) {
//         return this.formatDate(date);
//       }
//     },
//     contractorRole: {
//       type: String,
//       enum: [
//         'Centering Contractor',
//         'Steel Contractor',
//         'Mason Contractor',
//         'Carpenter Contractor',
//         'Plumber Contractor',
//         'Electrician Contractor',
//         'Painter Contractor',
//         'Tiles Contractor'
//       ]
//     },
//     bankName: { type: String },
//     bankAccount: { type: String, trim: true },
//     bankCode: { type: String, trim: true },
//     contractorIdProof: [{ type: String }],
//     photo: { type: String },
//     perDaySalary: { type: Number },

//     // ✅ Add top-level currentAttendance for daily tracking
//     currentAttendance: {
//       date: { type: String },
//       status: {
//         type: String,
//         enum: ["Fullday", "Halfday", "Overtime", null],
//         default: null
//       }
//     },

//     // 🕒 Historical records
//     attendanceRecords: [attendanceRecordSchema],

//     createdAt: {
//       type: String,
//       default: function () { return this.formatDate(new Date()); }
//     },
//     updatedAt: {
//       type: String,
//       default: function () { return this.formatDate(new Date()); }
//     }
//   }, {
//     timestamps: false,
//     _id: false,
//     strictPopulate: false // <-- ✅ Add this line
//   });

//   // 🔧 Date formatter for custom fields
//   contractorSchema.methods.formatDate = function (date) {
//     if (!date) return null;

//     if (date instanceof Date) {
//       const month = (date.getMonth() + 1).toString().padStart(2, '0');
//       const day = date.getDate().toString().padStart(2, '0');
//       const year = date.getFullYear();
//       return `${day}/${month}/${year}`;
//     }

//     if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
//       return date;
//     }

//     const parsedDate = new Date(date);
//     if (!isNaN(parsedDate.getTime())) {
//       const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
//       const day = parsedDate.getDate().toString().padStart(2, '0');
//       const year = parsedDate.getFullYear();
//       return `${day}/${month}/${year}`;
//     }

//     return date;
//   };

//   // Auto-increment _id
//   contractorSchema.plugin(AutoIncrement, { id: 'contractor_id', inc_field: '_id' });

// //  const Contractor = mongoose.models.Contractor || mongoose.model('Contractor', contractorSchema);

// const Contractor = mongoose.model('Contractor', contractorSchema);

//   export default Contractor;





import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';

const AutoIncrement = mongooseSequence(mongoose);

// Address schema
const addressSchema = new mongoose.Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String }
}, { _id: false });

// Helper to format date as DD/MM/YYYY
function formatDateToDDMMYYYY(date) {
  if (!date) return null;
  
  // If already in DD/MM/YYYY format, return as-is
  if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    return date;
  }
  
  // Handle Date objects and ISO strings
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Attendance record (historical)
const attendanceRecordSchema = new mongoose.Schema({
  currentAttendance: {
    date: { 
      type: String,
      set: formatDateToDDMMYYYY 
    },
    status: {
      type: String,
      enum: ["Fullday", "Halfday", "Overtime", null],
      default: null
    }
  },
  recordedAt: {
    type: String,
    default: () => formatDateToDDMMYYYY(new Date()),
    set: formatDateToDDMMYYYY
  }
}, { 
  _id: false,
  toJSON: { getters: true, setters: true },
  toObject: { getters: true, setters: true }
});

// Contractor schema
const contractorSchema = new mongoose.Schema({
  _id: Number,
  userId: { type: Number, ref: "User", required: true },
  supervisorId: { type: Number, ref: "Supervisor", required: true },
  site: { type: Number, ref: 'Site' },
  name: { type: String, required: true },
  password: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  email: { type: String, unique: true, lowercase: true },
  phone: { type: String },
  alternatePhone: { type: String },
  address: addressSchema,
  role: {
    type: String,
    enum: ["Engineer", "Supervisor", "Contractor", "Worker"],
    default: "Contractor"
  },
  joiningDate: {
    type: String,
    set: formatDateToDDMMYYYY
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
  bankName: { type: String },
  bankAccount: { type: String, trim: true },
  bankCode: { type: String, trim: true },
  contractorIdProof: [{ type: String }],
  photo: { type: String },
  perDaySalary: { type: Number },

  currentAttendance: {
    date: { 
      type: String,
      set: formatDateToDDMMYYYY 
    },
    status: {
      type: String,
      enum: ["Fullday", "Halfday", "Overtime", null],
      default: null
    }
  },

  attendanceRecords: [attendanceRecordSchema],

  createdAt: {
    type: String,
    default: () => formatDateToDDMMYYYY(new Date()),
    set: formatDateToDDMMYYYY
  },
  updatedAt: {
    type: String,
    default: () => formatDateToDDMMYYYY(new Date()),
    set: formatDateToDDMMYYYY
  }
}, {
  timestamps: false,
  _id: false,
  strictPopulate: false,
  toJSON: { 
    getters: true, 
    setters: true,
    transform: function(doc, ret) {
      // Ensure all date fields are formatted when converting to JSON
      if (ret.joiningDate) ret.joiningDate = formatDateToDDMMYYYY(ret.joiningDate);
      if (ret.createdAt) ret.createdAt = formatDateToDDMMYYYY(ret.createdAt);
      if (ret.updatedAt) ret.updatedAt = formatDateToDDMMYYYY(ret.updatedAt);
      
      if (ret.attendanceRecords) {
        ret.attendanceRecords = ret.attendanceRecords.map(record => ({
          ...record,
          recordedAt: formatDateToDDMMYYYY(record.recordedAt),
          currentAttendance: {
            ...record.currentAttendance,
            date: formatDateToDDMMYYYY(record.currentAttendance?.date)
          }
        }));
      }
      
      if (ret.currentAttendance?.date) {
        ret.currentAttendance.date = formatDateToDDMMYYYY(ret.currentAttendance.date);
      }
      
      return ret;
    }
  },
  toObject: { 
    getters: true, 
    setters: true 
  }
});

// Auto-increment _id
contractorSchema.plugin(AutoIncrement, { id: 'contractor_id', inc_field: '_id' });

const Contractor = mongoose.model('Contractor', contractorSchema);
export default Contractor;