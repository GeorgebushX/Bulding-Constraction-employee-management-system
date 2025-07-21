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

const contractorSchema = new mongoose.Schema({
  _id: Number,
  userId: { type: Number, ref: "User", required: true },
  site: { type: Number, ref: 'Site' },
  centeringSupervisor: { type: Number, ref: "CenteringSupervisor" },
  name: { type: String, required: true },
  password: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  email: { type: String, unique: true, lowercase: true },
  phone: { type: String },
  alternatePhone: { type: String },
  address: addressSchema,
  role: { type: String, enum: ["Engineer", "Supervisor", "Contractor", "Worker"], default: "Contractor" },
  joiningDate: { 
    type: String,
    set: function(date) {
      return this.formatDate(date);
    }
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
  _id: false
});

// Add formatDate method
contractorSchema.methods.formatDate = function(date) {
  if (!date) return null;
  
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
};

// Apply auto-increment plugin
contractorSchema.plugin(AutoIncrement, {id: 'contractor_id', inc_field: '_id'});

const Contractor = mongoose.model('CenteringContractor', contractorSchema);

export default Contractor;
