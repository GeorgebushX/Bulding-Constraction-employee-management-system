
import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';

const AutoIncrement = mongooseSequence(mongoose);

// Helper function to format dates as DD/MM/YYYY
function formatDate(date) {
  if (!date) return null;

  const parsedDate = new Date(date);
  if (!isNaN(parsedDate.getTime())) {
    const day = parsedDate.getDate().toString().padStart(2, '0');
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return date;
}

// Validate date is in DD/MM/YYYY format and is valid
function isValidDate(dateStr) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false;
  
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  return (
    date.getDate() === day &&
    date.getMonth() === month - 1 &&
    date.getFullYear() === year
  );
}

// Convert DD/MM/YYYY to Date object
function parseDate(dateStr) {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

// Validate start date is today or future
function validateStartDate(dateStr) {
  if (!isValidDate(dateStr)) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inputDate = parseDate(dateStr);
  
  return inputDate >= today;
}

// Validate end date is after start date
function validateEndDate(startDateStr, endDateStr) {
  if (!isValidDate(startDateStr) || !isValidDate(endDateStr)) return false;
  
  const startDate = parseDate(startDateStr);
  const endDate = parseDate(endDateStr);
  
  return endDate > startDate;
}
// Main Site schema
const siteSchema = new mongoose.Schema({
  _id: Number,  
  siteid: {
    type: String,
    unique: true,
    sparse: true,
    default: function () {
      return `${this._id}`;
    }
  },
  client: { type: Number, ref: 'Client' },
  siteName: { type: String, required: true },
  location: { type: String, required: true },
  totalAreaSqFt: { 
    type: Number, 
    required: true,
    min: 1 
  },
  oneAreaSqFtAmount: { 
    type: Number, 
    required: true,
    min: 1 
  },
  totalBudget: { 
    type: Number,
    default: function() {
      return this.totalAreaSqFt * this.oneAreaSqFtAmount;
    }
  },
totalSupervisors:{type:Number},
totalContractors:{type:Number},
  startDate: {
    type: String,
    default: () => formatDate(new Date()),
    validate: {
      validator: validateStartDate,
      message: 'Start date must be today or a future date in DD/MM/YYYY format'
    }
  },
  endDate: {
    type: String,
    validate: {
      validator: function(value) {
        return validateEndDate(this.startDate, value);
      },
      message: 'End date must be after start date in DD/MM/YYYY format'
    }
  },
  status: {
    type: String,
    enum: ['Planned', 'In Progress', 'Completed', 'On Hold'],
    default: 'Planned'
  },
  notes: { type: String },
  siteMap: { type: String },
  createdAt: {
    type: String,
    default: () => formatDate(new Date())
  }
}, {
  timestamps: false,
  _id: false
});

// Middleware to calculate budget before saving
siteSchema.pre('save', function(next) {
  if (this.isModified('totalAreaSqFt') || this.isModified('oneAreaSqFtAmount')) {
    this.totalBudget = this.totalAreaSqFt * this.oneAreaSqFtAmount;
  }
  next();
});

// Apply auto-increment plugin
siteSchema.plugin(AutoIncrement, { id: 'site_id', inc_field: '_id' });

const Site = mongoose.model('Site', siteSchema);

export default Site;


  //   workersCount: {
  //   supervisors: [{ 
  //     type: Number, 
  //     ref: "Supervisor" 
  //   }],
  //   contractors: [{ 
  //     type: Number, 
  //     ref: "Contractor" 
  //   }]
  // },
  // supervisors: { 
  //   type: Number,
  //   ref: "Supervisor",
  // },
  // contractors: { type: Number, ref: "Contractor" },