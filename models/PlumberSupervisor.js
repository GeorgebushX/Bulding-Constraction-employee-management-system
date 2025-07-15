
// models/Supervisor.js
import mongoose from 'mongoose';
import User from './User.js';

// Address schema
const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String
}, { _id: false });

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
    ],default: "Plumber Supervisor"
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

const Supervisor = mongoose.model('PlumberSupervisor', supervisorSchema);
export default Supervisor;