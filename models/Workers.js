
// import mongoose from 'mongoose';
// import mongooseSequence from 'mongoose-sequence';

// const AutoIncrement = mongooseSequence(mongoose);

// // Format date to MM/DD/YYYY
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

// // Address schema (subdocument)
// const addressSchema = new mongoose.Schema({
//   street: { type: String },
//   city: { type: String },
//   state: { type: String },
//   zipCode: { type: String },
//   country: { type: String }
// }, { _id: false });

// // Worker schema
// const workerSchema = new mongoose.Schema({
//   _id: { type: Number },
//   userId: { type: Number, ref: "User", required: true },
//   name: { type: String, required: true },
//   password: { type: String, select: false },
//   gender: { type: String, enum: ['Male', 'Female', 'Other'] },
//   email: { type: String, unique: true, lowercase: true },
//   phone: { type: String },
//   alternatePhone: { type: String },
//   address: addressSchema,
//   contractorRole: {
//     type: String,
//     enum: ['Mason', 'Centring', 'Steeler', 'Electrician', 'Plumber', 'Carpenter'],
//     required: true
//   },
//   masonRole: {
//     type: String,
//     enum: ["Mason", "cithal", "Guest worker"],
//     default: null
//   },
//   centringRole: {
//     type: String,
//     enum: ["Pitter", "Helper", "Guest worker"],
//     default: null
//   },
//   joiningDate: {
//     type: String,
//     set: formatDate
//   },
//   bankAccount: { type: String, trim: true },
//   bankCode: { type: String, trim: true },
//   workerIdProof: [{ type: String }],
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
//   _id: false,
//   timestamps: false,
//   toJSON: { virtuals: true },
//   toObject: { virtuals: true }
// });

// // Virtual for role visibility
// workerSchema.virtual('visibleRoles').get(function() {
//   const roles = {};
  
//   if (this.contractorRole === 'Mason') {
//     roles.masonRole = this.masonRole;
//   } else if (this.contractorRole === 'Centring') {
//     roles.centringRole = this.centringRole;
//   }
  
//   return roles;
// });
  
// // Middleware to validate role consistency
// workerSchema.pre('save', function(next) {
//   if (this.contractorRole === 'Mason' && this.centringRole) {
//     this.centringRole = null;
//   } else if (this.contractorRole === 'Centring' && this.masonRole) {
//     this.masonRole = null;
//   }
//   this.updatedAt = formatDate(new Date());
//   next();
// });

// // Apply auto-increment plugin
// workerSchema.plugin(AutoIncrement, {
//   id: 'worker_id_counter',
//   inc_field: '_id'
// });

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
    enum: [
      'Centering Contractor', 
      'Steel Contractor', 
      'Mason Contractor', 
      'Carpenter Contractor', 
      'Plumber Contractor', 
      'Electrician Contractor', 
      'Painter Contractor', 
      'Tiles Contractor'
    ],
    required: true
  },
  centeringRole: {
    type: String,
    enum: ["Fitter", "Helper", "Temporary Centering Worker"],
    default: null
  },
  steelWorkerRole: {
    type: String,
    enum: ["Fitter", "Helper", "Temporary Steel Worker"],
    default: null
  },
  masonRole: {
    type: String,
    enum: ["Mason", "Chital", "Material Handler", "Temporary Worker"],
    default: null
  },
  carpenterRole: {
    type: String,
    enum: ["Fitter", "Helper", "Temporary Carpenter"],
    default: null
  },
  plumberRole: {
    type: String,
    enum: ["Plumber", "Helper", "Temporary Plumber"],
    default: null
  },
  electricianRole: {
    type: String,
    enum: ["Electrician", "Helper", "Temporary Electrician"],
    default: null
  },
  painterRole: {
    type: String,
    enum: ["Painter", "Helper", "Temporary Painter"],
    default: null
  },
  tilesWorkerRole: {
    type: String,
    enum: ["Fitter", "Helper", "Temporary Tiles Worker"],
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
  
  switch(this.contractorRole) {
    case 'Centering Contractor':
      roles.centeringRole = this.centeringRole;
      break;
    case 'Steel Contractor':
      roles.steelWorkerRole = this.steelWorkerRole;
      break;
    case 'Mason Contractor':
      roles.masonRole = this.masonRole;
      break;
    case 'Carpenter Contractor':
      roles.carpenterRole = this.carpenterRole;
      break;
    case 'Plumber Contractor':
      roles.plumberRole = this.plumberRole;
      break;
    case 'Electrician Contractor':
      roles.electricianRole = this.electricianRole;
      break;
    case 'Painter Contractor':
      roles.painterRole = this.painterRole;
      break;
    case 'Tiles Contractor':
      roles.tilesWorkerRole = this.tilesWorkerRole;
      break;
  }
  
  return roles;
});
  
// Middleware to validate role consistency
workerSchema.pre('save', function(next) {
  // Reset all role fields
  this.centeringRole = null;
  this.steelWorkerRole = null;
  this.masonRole = null;
  this.carpenterRole = null;
  this.plumberRole = null;
  this.electricianRole = null;
  this.painterRole = null;
  this.tilesWorkerRole = null;
  
  // Set the appropriate role based on contractorRole
  switch(this.contractorRole) {
    case 'Centering Contractor':
      this.centeringRole = this.centeringRole || 'Fitter';
      break;
    case 'Steel Contractor':
      this.steelWorkerRole = this.steelWorkerRole || 'Fitter';
      break;
    case 'Mason Contractor':
      this.masonRole = this.masonRole || 'Mason';
      break;
    case 'Carpenter Contractor':
      this.carpenterRole = this.carpenterRole || 'Fitter';
      break;
    case 'Plumber Contractor':
      this.plumberRole = this.plumberRole || 'Plumber';
      break;
    case 'Electrician Contractor':
      this.electricianRole = this.electricianRole || 'Electrician';
      break;
    case 'Painter Contractor':
      this.painterRole = this.painterRole || 'Painter';
      break;
    case 'Tiles Contractor':
      this.tilesWorkerRole = this.tilesWorkerRole || 'Fitter';
      break;
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