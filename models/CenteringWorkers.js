import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';
import bcrypt from 'bcrypt';

const AutoIncrement = mongooseSequence(mongoose);

// Address schema
const addressSchema = new mongoose.Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String }
}, { _id: false });

// Bank details schema
const bankDetailsSchema = new mongoose.Schema({
  bankName: { type: String },
  accountNumber: { type: String, trim: true },
  bankCode: { type: String, trim: true }
}, { _id: false });

const workerSchema = new mongoose.Schema({
  _id: { type: Number },
  userId: { type: Number, ref: "User", required: true },
  site: { type: Number, ref: 'Site' },
  centeringContractor: { type: Number, ref: "CenteringContractor" },
  name: { type: String, required: true },
  password: { type: String, select: false },
  email: { type: String, unique: true, lowercase: true },
  phone: { type: String, trim: true },
  alternatePhone: { type: String, trim: true },
  address: addressSchema,
  centeringWorkerType: { 
    type: String,
    enum: ["Fitter", "Helper", "Temporary Centering Worker"],
    default: null 
  },
  joiningDate: { type: String },
  bankDetails: bankDetailsSchema,
  centeringWorkerIdProof: [{ type: String }],
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

// Apply auto-increment plugin
workerSchema.plugin(AutoIncrement, { 
  id: 'worker_id_counter',
  inc_field: '_id',
  start_seq: 1000
});

// Pre-save hook for password hashing
workerSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
const Worker = mongoose.model('Worker', workerSchema);
export default Worker;