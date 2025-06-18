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
}, { _id: false }); // Disable default _id

const workerSchema = new mongoose.Schema({
  _id: Number, // Auto-incrementing ID
  userId: { type: Number, ref: "User", required: true },
  workerId: { 
    type: String, 
    unique: true,
    sparse: true,
    default: function() {
      return `WRK-${this._id}`; // Changed prefix from SUP to WRK for workers
    }
  },
  name: { type: String, required: true },
  dateOfBirth: { 
    type: String,
    set: function(date) {
      return formatDate(date);
    }
  },
  password: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  maritalStatus: { type: String, enum: ["Single", "Married"] },
  nationality: { type: String },
  bloodGroup: { type: String },
  email: { type: String, unique: true, lowercase: true },
  phone: { type: String },
  alternatePhone: { type: String },
  address: addressSchema,
  permanentAddress: addressSchema,
  role: { 
    type: String, 
    enum: ["Pitter", "Helper", "Guest worker"], 
    required: true 
  },
  contractorType: {
    type: String,
    enum: ['masonworker', 'centringsworker', 'steelworker'],
    required: true
  },
  joiningDate: { 
    type: String,
    set: function(date) {
      return formatDate(date);
    }
  },
  bankAccount: { type: String, trim: true },
  bankCode: { type: String, trim: true },
  workerIdProof: [{ type: String }], // Changed from contractorIdProof to workerIdProof
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
  timestamps: false,
  _id: false // Disable default _id
});

// Helper function to format dates as MM/DD/YYYY
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

// Apply auto-increment plugin
workerSchema.plugin(AutoIncrement, {id: 'worker_id', inc_field: '_id'}); // Changed from contractor_id to worker_id

const Worker = mongoose.model('Worker', workerSchema);

export default Worker;