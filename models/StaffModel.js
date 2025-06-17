import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
});

const staffSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  employeeId: { type: String, unique: true },
  name: { type: String, required: true },
  dateOfBirth: { type: Date },
  password: { type: String, minlength: 8 },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  maritalStatus: { 
    type: String, 
    enum: ["Single", "Married",], 
  },
  nationality: { type: String },
  bloodGroup: { type: String },
  email: { type: String, unique: true, lowercase: true },
  phone: { type: String },
  alternatePhone: { type: String },
  address: addressSchema,
  permanentAddress: addressSchema,
  role: { type: String, enum: ['Staff', 'Employee'], required: true },
  joiningDate: { type: Date },
  bankAccount: { type: String, trim: true },
  bankCode: { type: String, trim: true },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  staffIdProof: [{ type: String }],
  photo: { type: String },
}, {
  timestamps: true,
});

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;