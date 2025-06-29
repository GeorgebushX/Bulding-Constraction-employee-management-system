// import mongoose from 'mongoose';
// import mongooseSequence from 'mongoose-sequence';

// const AutoIncrement = mongooseSequence(mongoose);

// // Address schema
// const addressSchema = new mongoose.Schema({
//   street: { type: String },
//   city: { type: String },
//   state: { type: String },
//   zipCode: { type: String },
//   country: { type: String }
// }, { _id: false }); // Disable default _id

// const workerSchema = new mongoose.Schema({
//   _id: Number, // Auto-incrementing ID
//   userId: { type: Number, ref: "User", required: true },
//   name: { type: String, required: true },
//   password: { type: String },
//   gender: { type: String, enum: ['Male', 'Female', 'Other'] },
//   email: { type: String, unique: true, lowercase: true },
//   phone: { type: String },
//   alternatePhone: { type: String },
//   address: addressSchema,
//   workerRole: { 
//     type: String, 
//     enum: ["Pitter", "Helper", "Guest worker"], 
//   },
//   contractorType: {
//     type: String,
//     enum: ['MasonHeader', 'CentringsHeader', 'SteelHeader', 'Electrician', 'Plumber', 'Carpenter'],
//   },
//   joiningDate: { 
//     type: String,
//     set: function(date) {
//       return formatDate(date);
//     }
//   },
//   bankAccount: { type: String, trim: true },
//   bankCode: { type: String, trim: true },
//   workerIdProof: [{ type: String }], // Changed from contractorIdProof to workerIdProof
//   photo: { type: String },
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
//   _id: false // Disable default _id
// });

// // Helper function to format dates as MM/DD/YYYY
// function formatDate(date) {
//   if (!date) return null;
  
//   if (date instanceof Date) {
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     const year = date.getFullYear();
//     return `${month}/${day}/${year}`;
//   }
  
//   if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
//     return date;
//   }
  
//   const parsedDate = new Date(date);
//   if (!isNaN(parsedDate.getTime())) {
//     const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
//     const day = parsedDate.getDate().toString().padStart(2, '0');
//     const year = parsedDate.getFullYear();
//     return `${month}/${day}/${year}`;
//   }
  
//   return date;
// }

// // Apply auto-increment plugin
// workerSchema.plugin(AutoIncrement, {id: 'worker_id', inc_field: '_id'}); // Changed from contractor_id to worker_id

// const Worker = mongoose.model('Worker', workerSchema);

// export default Worker;

import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';

const AutoIncrement = mongooseSequence(mongoose);

// Format date to MM/DD/YYYY
function formatDate(date) {
  if (!date) return null;

  if (date instanceof Date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    return date;
  }

  const parsedDate = new Date(date);
  if (!isNaN(parsedDate.getTime())) {
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = parsedDate.getDate().toString().padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${month}/${day}/${year}`;
  }

  return date;
}

// Address schema (subdocument)
const addressSchema = new mongoose.Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String }
}, { _id: false });

// Worker schema
const workerSchema = new mongoose.Schema({
  _id: { type: Number },
  userId: { type: Number, ref: "User", required: true },
  name: { type: String, required: true },
  password: { type: String, select: false },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  email: { type: String, unique: true, lowercase: true },
  phone: { type: String },
  alternatePhone: { type: String },
  address: addressSchema,
  contractorRole: {
    type: String,
    enum: ['Mason', 'Centring', 'Steeler', 'Electrician', 'Plumber', 'Carpenter'],
    required: true
  },
  masonRole: {
    type: String,
    enum: ["Mason", "cithal", "Guest worker"],
    default: null
  },
  centringRole: {
    type: String,
    enum: ["Pitter", "Helper", "Guest worker"],
    default: null
  },
  joiningDate: {
    type: String,
    set: formatDate
  },
  bankAccount: { type: String, trim: true },
  bankCode: { type: String, trim: true },
  workerIdProof: [{ type: String }],
  photo: { type: String },
  createdAt: {
    type: String,
    default: () => formatDate(new Date())
  },
  updatedAt: {
    type: String,
    default: () => formatDate(new Date())
  }
}, {
  _id: false,
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for role visibility
workerSchema.virtual('visibleRoles').get(function() {
  const roles = {};
  
  if (this.contractorRole === 'Mason') {
    roles.masonRole = this.masonRole;
  } else if (this.contractorRole === 'Centring') {
    roles.centringRole = this.centringRole;
  }
  
  return roles;
});

// Middleware to validate role consistency
workerSchema.pre('save', function(next) {
  if (this.contractorRole === 'Mason' && this.centringRole) {
    this.centringRole = null;
  } else if (this.contractorRole === 'Centring' && this.masonRole) {
    this.masonRole = null;
  }
  this.updatedAt = formatDate(new Date());
  next();
});

// Apply auto-increment plugin
workerSchema.plugin(AutoIncrement, {
  id: 'worker_id_counter',
  inc_field: '_id'
});

const Worker = mongoose.model('Worker', workerSchema);
export default Worker;