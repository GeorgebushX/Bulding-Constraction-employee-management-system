
// import mongoose from 'mongoose';
// import mongooseSequence from 'mongoose-sequence';
// import autopopulate from 'mongoose-autopopulate';
// import bcrypt from 'bcrypt';

// const AutoIncrement = mongooseSequence(mongoose);

// // Address sub-schema
// const addressSchema = new mongoose.Schema({
//   street: { type: String, trim: true },
//   city: { type: String, trim: true },
//   state: { type: String, trim: true },
//   postalCode: { type: String, trim: true },
//   country: { type: String, trim: true }
// }, { _id: false });

// // Bank Details sub-schema
// const bankDetailsSchema = new mongoose.Schema({
//   accountNumber: { type: String, trim: true },
//   bankCode: { type: String, trim: true },
//   bankName: { type: String, trim: true }
// }, { _id: false });

// // Worker schema
// const workerSchema = new mongoose.Schema({
//   _id: { type: Number },
//   userId: { 
//     type: Number, 
//     ref: "User", 
//     required: true 
//   },
//   contractor: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: "Contractor", 
//     required: true,
//     autopopulate: {
//       select: 'name contractorRole roleDetails workerType',
//       transform: function(doc) {
//         // Extract worker types based on contractor role
//         const roleFieldMap = {
//           'Centering Contractor': 'centering',
//           'Steel Contractor': 'steel',
//           'Mason Contractor': 'mason',
//           'Carpenter Contractor': 'carpenter',
//           'Plumber Contractor': 'plumber',
//           'Electrician Contractor': 'electrician',
//           'Painter Contractor': 'painter',
//           'Tiles Contractor': 'tiles'
//         };
        
//         const roleField = roleFieldMap[doc.contractorRole];
//         const workerTypes = doc.roleDetails[roleField]?.workerType?.enum || [];
        
//         return {
//           _id: doc._id,
//           name: doc.name,
//           contractorRole: doc.contractorRole,
//           workerTypes // Add workerTypes to the populated contractor
//         };
//       }
//     }
//   },
//   name: { type: String, required: true, trim: true },
//   password: { type: String, select: false },
//   gender: { type: String, enum: ['Male', 'Female', 'Other'], trim: true },
//   email: { 
//     type: String, 
//     unique: true, 
//     lowercase: true,
//   },
//   phone: { 
//     type: String, 
//     trim: true,
//   },
//   alternatePhone: { 
//     type: String, 
//     trim: true,
//   },
//   address: addressSchema,
//   workerType: { type: String, required: true },
//   joiningDate: { type: String },
//   bankDetails: bankDetailsSchema,
//   workerIdProof: [{ type: String }],
//   photo: { type: String },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// }, {
//   timestamps: true,
//   toJSON: { 
//     virtuals: true,
//     transform: function(doc, ret) {
//       delete ret.password;
//       return ret;
//     }
//   },
//   toObject: { virtuals: true }
// });

// // Auto-increment plugin
// workerSchema.plugin(AutoIncrement, { 
//   id: 'worker_id_counter',
//   inc_field: '_id',
//   start_seq: 1000
// });

// workerSchema.plugin(autopopulate);

// // Pre-save hook to validate workerType
// workerSchema.pre('save', async function(next) {
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }

//   // Only validate workerType if it's being modified or this is a new document
//   if (this.isModified('workerType') || this.isNew) {
//     const contractor = await mongoose.model('Contractor')
//       .findById(this.contractor)
//       .select('contractorRole roleDetails')
//       .lean();

//     if (!contractor) {
//       throw new Error('Associated contractor not found');
//     }

//     const roleFieldMap = {
//       'Centering Contractor': 'centering',
//       'Steel Contractor': 'steel',
//       'Mason Contractor': 'mason',
//       'Carpenter Contractor': 'carpenter',
//       'Plumber Contractor': 'plumber',
//       'Electrician Contractor': 'electrician',
//       'Painter Contractor': 'painter',
//       'Tiles Contractor': 'tiles'
//     };

//     const roleField = roleFieldMap[contractor.contractorRole];
//     if (!roleField) {
//       throw new Error('Invalid contractor role');
//     }

//     const validWorkerTypes = contractor.roleDetails[roleField]?.workerType?.enum || [];
//     if (!validWorkerTypes.includes(this.workerType)) {
//       throw new Error(`Invalid workerType for ${contractor.contractorRole}. Valid types: ${validWorkerTypes.join(', ')}`);
//     }
//   }

//   next();
// });

// const Worker = mongoose.model('Worker', workerSchema);
// export default Worker;

import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';
import bcrypt from 'bcrypt';

const AutoIncrement = mongooseSequence(mongoose);

const addressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, trim: true }
}, { _id: false });

const bankDetailsSchema = new mongoose.Schema({
  accountNumber: { type: String, trim: true },
  bankCode: { type: String, trim: true },
  bankName: { type: String, trim: true }
}, { _id: false });

const workerSchema = new mongoose.Schema({
  _id: { type: Number },
  userId: { type: Number, ref: "User", required: true },
  contractor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Contractor", 
    required: true
  },
  name: { type: String, required: true, trim: true },
  password: { type: String, select: false },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], trim: true },
  email: { type: String, unique: true, lowercase: true },
  phone: { type: String, trim: true },
  alternatePhone: { type: String, trim: true },
  address: addressSchema,
  workerType: { type: String, required: true },
  joiningDate: { type: String },
  bankDetails: bankDetailsSchema,
  workerIdProof: [{ type: String }],
  photo: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

workerSchema.plugin(AutoIncrement, { 
  id: 'worker_id_counter',
  inc_field: '_id',
  start_seq: 1000
});

// Helper method to get role field based on contractor role
workerSchema.methods.getRoleField = function(contractorRole) {
  const roleFieldMap = {
    'Centering Contractor': 'centering',
    'Steel Contractor': 'steel',
    'Mason Contractor': 'mason',
    'Carpenter Contractor': 'carpenter',
    'Plumber Contractor': 'plumber',
    'Electrician Contractor': 'electrician',
    'Painter Contractor': 'painter',
    'Tiles Contractor': 'tiles'
  };
  return roleFieldMap[contractorRole];
};

workerSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  if (this.isModified('workerType') || this.isNew) {
    const contractor = await mongoose.model('Contractor')
      .findById(this.contractor)
      .select('contractorRole roleDetails')
      .lean();

    if (!contractor) throw new Error('Associated contractor not found');

    const roleField = this.getRoleField(contractor.contractorRole);
    if (!roleField) throw new Error('Invalid contractor role');

    const validWorkerTypes = contractor.roleDetails[roleField]?.workerType?.enum || [];
    if (!validWorkerTypes.includes(this.workerType)) {
      throw new Error(`Invalid workerType for ${contractor.contractorRole}. Valid types: ${validWorkerTypes.join(', ')}`);
    }
  }

  next();
});

const Worker = mongoose.model('Worker', workerSchema);
export default Worker;



// import mongoose from 'mongoose';
// import mongooseSequence from 'mongoose-sequence';
// import bcrypt from 'bcrypt';

// const AutoIncrement = mongooseSequence(mongoose);

// const addressSchema = new mongoose.Schema({
//   street: { type: String, trim: true },
//   city: { type: String, trim: true },
//   state: { type: String, trim: true },
//   postalCode: { type: String, trim: true },
//   country: { type: String, trim: true }
// }, { _id: false });

// const bankDetailsSchema = new mongoose.Schema({
//   accountNumber: { type: String, trim: true },
//   bankCode: { type: String, trim: true },
//   bankName: { type: String, trim: true }
// }, { _id: false });

// const workerSchema = new mongoose.Schema({
//   _id: { type: Number },
//   userId: { type: Number, ref: "User", required: true },
//   contractor: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: "Contractor", 
//     required: true
//   },
//   name: { type: String, required: true, trim: true },
//   password: { type: String, select: false },
//   gender: { type: String, enum: ['Male', 'Female', 'Other'], trim: true },
//   email: { type: String, unique: true, lowercase: true },
//   phone: { type: String, trim: true },
//   alternatePhone: { type: String, trim: true },
//   address: addressSchema,
//   workerType: { type: String, required: true },
//   joiningDate: { type: String },
//   bankDetails: bankDetailsSchema,
//   workerIdProof: [{ type: String }],
//   photo: { type: String },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// }, {
//   timestamps: true,
//   toJSON: { 
//     transform: function(doc, ret) {
//       delete ret.password;
//       return ret;
//     }
//   }
// });

// workerSchema.plugin(AutoIncrement, { 
//   id: 'worker_id_counter',
//   inc_field: '_id',
//   start_seq: 1000
// });

// workerSchema.pre('save', async function(next) {
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }

//   if (this.isModified('workerType') || this.isNew) {
//     const contractor = await mongoose.model('Contractor')
//       .findById(this.contractor)
//       .select('contractorRole roleDetails')
//       .lean();

//     if (!contractor) throw new Error('Associated contractor not found');

//     const roleFieldMap = {
//       'Centering Contractor': 'centering',
//       'Steel Contractor': 'steel',
//       'Mason Contractor': 'mason',
//       'Carpenter Contractor': 'carpenter',
//       'Plumber Contractor': 'plumber',
//       'Electrician Contractor': 'electrician',
//       'Painter Contractor': 'painter',
//       'Tiles Contractor': 'tiles'
//     };

//     const roleField = roleFieldMap[contractor.contractorRole];
//     if (!roleField) throw new Error('Invalid contractor role');

//     const validWorkerTypes = contractor.roleDetails[roleField]?.workerType?.enum || [];
//     if (!validWorkerTypes.includes(this.workerType)) {
//       throw new Error(`Invalid workerType for ${contractor.contractorRole}. Valid types: ${validWorkerTypes.join(', ')}`);
//     }
//   }

//   next();
// });

// const Worker = mongoose.model('Worker', workerSchema);
// export default Worker;