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
      '', 
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
  _id: false
});

// Add formatDate method
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

// Middleware to handle roleDetails
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

  const activeRole = roleMap[this.contractorRole];
  
  // Initialize all roles as null
  const initializedRoleDetails = {};
  Object.values(roleMap).forEach(role => {
    initializedRoleDetails[role] = null;
  });

  // Set the active role
  if (activeRole) {
    initializedRoleDetails[activeRole] = {
      workerType: this.roleDetails?.[activeRole]?.workerType || null,
      workers: this.roleDetails?.[activeRole]?.workers || []
    };
  }

  this.roleDetails = initializedRoleDetails;
  next();
});

// Apply auto-increment plugin
contractorSchema.plugin(AutoIncrement, {id: 'contractor_id', inc_field: '_id'});

const Contractor = mongoose.model('Contractor', contractorSchema);

export default Contractor;
