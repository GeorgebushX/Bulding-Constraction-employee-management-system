import mongoose from 'mongoose';


const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
});

const studentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  roleNumber: { type: String }, // Auto-generated
  id: { type: String },
  name: { type: String, required: true },
  dateOfBirth: { type: Date },
  // password: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  nationality: { type: String },
  bloodGroup: { type: String },
  email: { type: String },
  phone: { type: String },
  alternatePhone: { type: String },
  address: addressSchema,
  permanentAddress: addressSchema,
  role: { type: String, enum: ['Staff', 'Student'], required: true },
  shift: { type: String, enum: ['Shift-1', 'Shift-2'], required: true },
  admissionDate: { type: Date },

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },

  specialization: { type: String },
  tenthMarks: { type: Number },
  twelfthMarks: { type: Number },
  studentCertificates: [{ type: String }],
  photo: { type: String },
}, {
  timestamps: true,
});

// ✅ Add this right here, before exporting
studentSchema.pre('save', async function (next) {
  if (this.roleNumber) return next();

  const prefix = this.role === 'Staff' ? 'S' : '';
  const shiftCode = this.shift === 'Shift-1' ? 'AU' : 'BU';
  const year = new Date().getFullYear().toString();

  // Populate department to get its code
  await this.populate('department');
  const deptCode = this.department.code || '00';

  // Find existing users in same criteria
  const filter = {
    role: this.role,
    shift: this.shift,
    department: this.department._id,
    createdAt: {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`)
    }
  };

  const existingUsers = await mongoose.model('User').find(filter).sort({ name: 1 });

  let position = 1;
  for (let i = 0; i < existingUsers.length; i++) {
    if (this.name.localeCompare(existingUsers[i].name) > 0) {
      position++;
    }
  }

  const positionStr = position.toString().padStart(2, '0');
  this.roleNumber = `${prefix}${shiftCode}${year}${deptCode}${positionStr}`;

  next();
});



const Studentmodule = mongoose.model('student', studentSchema);

export default Studentmodule;