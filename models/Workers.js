

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
//    type: mongoose.Schema.Types.ObjectId, 
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

// // Helper method to get role field based on contractor role
// workerSchema.methods.getRoleField = function(contractorRole) {
//   const roleFieldMap = {
//     'Centering Contractor': 'centering',
//     'Steel Contractor': 'steel',
//     'Mason Contractor': 'mason',
//     'Carpenter Contractor': 'carpenter',
//     'Plumber Contractor': 'plumber',
//     'Electrician Contractor': 'electrician',
//     'Painter Contractor': 'painter',
//     'Tiles Contractor': 'tiles'
//   };
//   return roleFieldMap[contractorRole];
// };

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

//     const roleField = this.getRoleField(contractor.contractorRole);
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

// Pre-save validation for workerType
workerSchema.pre('save', async function(next) {
  if (this.isModified('workerType') || this.isNew) {
    const contractor = await mongoose.model('Contractor').findById(this.contractor);
    if (!contractor) {
      throw new Error('Associated contractor not found');
    }
    
    const validWorkerTypes = contractor.getWorkerTypes();
    if (!validWorkerTypes.includes(this.workerType)) {
      throw new Error(`Invalid workerType for ${contractor.contractorRole}. Valid types: ${validWorkerTypes.join(', ')}`);
    }
  }

  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  next();
});

const Worker = mongoose.model('Worker', workerSchema);
export default Worker;