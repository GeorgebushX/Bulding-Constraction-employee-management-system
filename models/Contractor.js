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
  password: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  email: { type: String, unique: true, lowercase: true },
  phone: { type: String },
  alternatePhone: { type: String },
  address: addressSchema,
  role: { type: String, enum: ["Engineer", "Supervisor", "Contractor", "Worker"] },
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
    ],
    required: true
  },
  // Role-specific fields (only one will be used based on contractorRole)
  roleDetails: {
    centering: {
      workerType: { 
        type: String,
        enum: ["Fitter", "Helper", "Temporary Centering Worker"],
        default: null
      },
      workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }]
    },
    steel: {
      workerType: { 
        type: String,
        enum: ["Fitter", "Helper", "Temporary Steel Worker"],
        default: null
      },
      workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }]
    },
    mason: {
      workerType: { 
        type: String,
        enum: ["Mason", "Chital", "Material Handler", "Temporary Worker"],
        default: null
      },
      workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }]
    },
    carpenter: {
      workerType: { 
        type: String,
        enum: ["Fitter", "Helper", "Temporary Carpenter"],
        default: null
      },
      workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }]
    },
    plumber: {
      workerType: { 
        type: String,
        enum: ["Plumber", "Helper", "Temporary Plumber"],
        default: null
      },
      workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }]
    },
    electrician: {
      workerType: { 
        type: String,
        enum: ["Electrician", "Helper", "Temporary Electrician"],
        default: null
      },
      workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }]
    },
    painter: {
      workerType: { 
        type: String,
        enum: ["Painter", "Helper", "Temporary Painter"],
        default: null
      },
      workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }]
    },
    tiles: {
      workerType: { 
        type: String,
        enum: ["Fitter", "Helper", "Temporary Tiles Worker"],
        default: null
      },
      workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }]
    }
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

// Middleware to validate role-specific fields
contractorSchema.pre('save', function(next) {
  const roleMap = {
    'Centering Contractor': 'centering',
    'Steel Contractor': 'steel',
    'Mason Contractor': 'mason',
    'Carpenter Contractor': 'carpenter',
    'Plumber Contractor': 'plumber',
    'Electrician Contractor': 'electrician',
    'Painter Contractor': 'painter',
    'Tiles Contractor': 'tiles'
  };
  
  // Get the relevant role detail field based on contractorRole
  const activeRoleField = roleMap[this.contractorRole];
  
  // Set all other role detail fields to null
  Object.keys(roleMap).forEach(role => {
    const field = roleMap[role];
    if (field !== activeRoleField) {
      this.roleDetails[field] = null;
    }
  });
  
  next();
});

const Contractor = mongoose.model('Contractor', contractorSchema);

export default Contractor;