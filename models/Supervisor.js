
import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';

const AutoIncrement = mongooseSequence(mongoose);

// Address schema
const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String
}, { _id: false }); // Disable default _id

const supervisorSchema = new mongoose.Schema({
  _id: Number, // Auto-incrementing ID
  userId: {
    type: Number, // ✅ MUST be Number
    ref: "User",
    required: true,
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
  email: { type: String, unique: true, lowercase: true },
  phone: { type: String },
  alternatePhone: { type: String },
  address: addressSchema,
  role: { type: String, enum: ["Engineer", "Supervisor", "Contractor", "Worker"],default: "Supervisor" },
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
      ]},
  joiningDate: { 
    type: String,
    set: function(date) {
      return formatDate(date);
    }
  },
  bankName:{type:String},
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
  _id: false // Disable default _id
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

// Apply auto-increment plugin
supervisorSchema.plugin(AutoIncrement, {id: 'supervisor_id', inc_field: '_id'});

// Pre-save hook to handle address IDs
supervisorSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate simple incremental IDs for addresses
    const timestamp = Date.now();
    if (this.address) {
      this.address._id = timestamp;
    }
  }
  next();
});

const Supervisor = mongoose.model('Supervisor', supervisorSchema);

export default Supervisor;



// import mongoose from 'mongoose';
// import mongooseSequence from 'mongoose-sequence';


// const AutoIncrement = mongooseSequence(mongoose);

// // Address schema
// const addressSchema = new mongoose.Schema({
//   street: { type: String, trim: true },
//   city: { type: String, trim: true },
//   state: { type: String, trim: true },
//   zipCode: { type: String, trim: true },
//   country: { type: String, trim: true }
// }, { _id: false });

// const supervisorSchema = new mongoose.Schema({
//   _id: Number, // Auto-incrementing ID
//   userId: { type: Number, ref: "User", required: true },
  
//   name: { type: String, required: true, trim: true },
//   dateOfBirth: { 
//     type: String,
//     set: function(date) {
//       return formatDate(date);
//     }
//   },
//   password: { type: String, select: false },
//   gender: { type: String, enum: ['Male', 'Female', 'Other'] },
//   email: { 
//     type: String, 
//     unique: true, 
//     lowercase: true,
//     validate: {
//       validator: function(v) {
//         return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
//       },
//       message: props => `${props.value} is not a valid email!`
//     }
//   },
//   phone: { 
//     type: String,
//     validate: {
//       validator: function(v) {
//         return /^[0-9]{10,15}$/.test(v);
//       },
//       message: props => `${props.value} is not a valid phone number!`
//     }
//   },
//   alternatePhone: { 
//     type: String,
//     validate: {
//       validator: function(v) {
//         return !v || /^[0-9]{10,15}$/.test(v);
//       },
//       message: props => `${props.value} is not a valid phone number!`
//     }
//   },
//   address: addressSchema,
//   role: { 
//     type: String, 
//     enum: ["Engineer", "Supervisor", "Contractor", "Worker"],
//     default: "Supervisor" 
//   },
//   supervisorType: {
//     type: String,
//     enum: [
//       'Centering Supervisor', 
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
//   bankName: { type: String, trim: true },
//   bankAccount: { type: String, trim: true },
//   bankCode: { type: String, trim: true },
//   photo: { type: String },
//   supervisorIdProof: [{ type: String }],
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

// // Format dates as DD/MM/YYYY
// function formatDate(date) {
//   if (!date) return null;
  
//   let d = new Date(date);
//   if (isNaN(d.getTime())) return date; // return original if invalid
  
//   const day = d.getDate().toString().padStart(2, '0');
//   const month = (d.getMonth() + 1).toString().padStart(2, '0');
//   const year = d.getFullYear();
//   return `${day}/${month}/${year}`;
// }


// // Apply auto-increment plugin
// supervisorSchema.plugin(AutoIncrement, {id: 'supervisor_id', inc_field: '_id'});

// const Supervisor = mongoose.model('Supervisor', supervisorSchema);

// export default Supervisor;