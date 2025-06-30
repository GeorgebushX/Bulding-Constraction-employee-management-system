
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

const contractorSchema = new mongoose.Schema({
  _id: Number, // Auto-incrementing ID
  userId: { type: Number, ref: "User", required: true },
  name: { type: String, required: true },
  dateOfBirth: { 
    type: String,
    set: function(date) {
      return this.formatDate(date);
    }
  },
  password: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  email: { type: String, unique: true, lowercase: true },
  phone: { type: String },
  alternatePhone: { type: String },
  address: addressSchema,
  permanentAddress: addressSchema,
  role: { type: String, enum: ["Engineer", "Supervisor", "Contractor", "Worker"] }, // Fixed "Supervisor." typo
  joiningDate: { 
    type: String,
    set: function(date) {
      return this.formatDate(date);
    }
  },
  contractorType: {
    type: String,
    enum: ['MasonHeader', 'CentringsHeader', 'SteelHeader', 'Electrician', 'Plumber', 'Carpenter'],
    required: true
  },
  bankAccount: { type: String, trim: true },
  bankCode: { type: String, trim: true },
  contractorIdProof: [{ type: String }],
  photo: { type: String },
  createdAt: {
    type: String,
    default: function() { return this.formatDate(new Date()); }
  },
  updatedAt: {
    type: String,
    default: function() { return this.formatDate(new Date()); }
  }
}, {
  timestamps: false,
  _id: false // Disable default _id
});

// Add formatDate method to the schema
contractorSchema.methods.formatDate = function(date) {
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
};

// Apply auto-increment plugin
contractorSchema.plugin(AutoIncrement, {id: 'contractor_id', inc_field: '_id'});

const Contractor = mongoose.model('Contractor', contractorSchema);

export default Contractor;