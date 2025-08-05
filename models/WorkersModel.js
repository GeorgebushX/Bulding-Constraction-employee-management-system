
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

  // Helper to format date as DD/MM/YYYY
  function formatDateToDDMMYYYY(date) {
    if (!date) return null;
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Attendance record (historical)
  const attendanceRecordSchema = new mongoose.Schema({
    currentAttendance: {
      date: { type: String },
      status: {
        type: String,
        enum: ["Fullday", "Halfday", "Overtime", null],
        default: null
      }
    },
    // recordedAt: {
    //   type: Date,
    //   default: Date.now,
    //   get: formatDateToDDMMYYYY
    // }
  }, { _id: false });

  // Worker schema
  const workerSchema = new mongoose.Schema({
    _id: Number,
    userId: { type: Number, ref: "User", required: true },
    supervisorId: { type: Number, ref: "Supervisor"},
  // In your Worker model
  contractorId: { 
    type: Number, 
    ref: "Contractor",  // Must exactly match the model name
    required: true 
  },
    site: { type: Number, ref: 'Site' },
    name: { type: String, required: true },
    password: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    email: { type: String, unique: true, lowercase: true },
    phone: { type: String },
    alternatePhone: { type: String },
    address: addressSchema,
    role: {
      type: String,
      enum: ["Engineer", "Supervisor", "Contractor", "Worker"],
      default: "Worker"
    },
    joiningDate: {
      type: String,
      set: function(date) {
        return this.formatDate(date);
      }
    },
    workerRole: {
      type: String,
      enum: [
        'Centering Worker',
        'Steel Worker',
        'Mason Worker',
        'Carpenter Worker',
        'Plumber Worker',
        'Electrician Worker',
        'Painter Worker',
        'Tiles Worker'
      ]
    },
    workerSubRole: {
      type: String,
      validate: {
        validator: function() {
          // Dynamic validation based on workerRole
          const validSubRoles = {
            'Centering Worker': ['Fitter', 'Helper', 'Temporary Centering Worker'],
            'Steel Worker': ['Fitter', 'Helper', 'Temporary Steel Worker'],
            'Mason Worker': ['Mason', 'Chiseler', 'Material Handler', 'Temporary Worker'],
            'Carpenter Worker': ['Fitter', 'Helper', 'Temporary Carpenter'],
            'Plumber Worker': ['Plumber', 'Helper', 'Temporary Plumber'],
            'Electrician Worker': ['Electrician', 'Helper', 'Temporary Electrician'],
            'Painter Worker': ['Painter', 'Helper', 'Temporary Painter'],
            'Tiles Worker': ['Fitter', 'Helper', 'Temporary Tiles Worker']
          };
          
          if (!this.workerRole) return true; // No role selected yet
          return validSubRoles[this.workerRole].includes(this.workerSubRole);
        },
        message: props => `Invalid sub-role for ${props.value}`
      },
      required: function() {
        return [
          'Centering Worker',
          'Steel Worker',
          'Mason Worker',
          'Carpenter Worker',
          'Plumber Worker',
          'Electrician Worker',
          'Painter Worker',
          'Tiles Worker'
        ].includes(this.workerRole);
      }
    },
    bankName: { type: String },
    bankAccount: { type: String, trim: true },
    bankCode: { type: String, trim: true },
    workerIdProof: [{ type: String }],
    photo: { type: String },
    perDaySalary: { type: Number },
    currentAttendance: {
      date: { type: String },
      status: {
        type: String,
        enum: ["Fullday", "Halfday", "Overtime", null],
        default: null
      }
    },
    attendanceRecords: [attendanceRecordSchema],
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
    _id: false,
    strictPopulate: false // Add this line
  });

  // Date formatter for custom fields
  workerSchema.methods.formatDate = function(date) {
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

  // Auto-increment _id
  workerSchema.plugin(AutoIncrement, { id: 'worker_id', inc_field: '_id' });

  // // Check if the model already exists before defining it
  // const Worker = mongoose.models.Worker || mongoose.model('Worker', workerSchema);

  const Worker = mongoose.model('Worker', workerSchema);
  export default Worker;