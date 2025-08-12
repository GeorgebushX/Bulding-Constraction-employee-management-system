import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';

const AutoIncrement = mongooseSequence(mongoose);

// Helper function to format dates as DD/MM/YYYY
function formatDate(date) {
  if (!date) return null;

  const parsedDate = new Date(date);
  if (!isNaN(parsedDate.getTime())) {
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = parsedDate.getDate().toString().padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return date;
}

// Define schema
const clientSchema = new mongoose.Schema({
  _id: Number, // Auto-incrementing numeric ID
  clientid: {
    type: String,
    unique: true,
    sparse: true,
    default: function () {
      return `${this._id}`;
    }
  },
  name: { type: String },
    email: { 
    type: String, 
    unique: true, 
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[a-z0-9]+(?:[._%+-][a-z0-9]+)*@[a-z0-9-]+(?:\.[a-z]{2,})+$/i.test(v);
      },
      message: props => `${props.value} is not a valid email address! Please use format like ales122@gmail.com`
    },
    required: [true, 'Email address is required']
  },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  phone: { 
    type: String,
    match: [
      /^[0-9]{10}$/,
      'Please enter a valid 10-digit phone number'
    ]
  },
  alternatePhone: { 
    type: String,
    match: [
      /^[0-9]{10}$/,
      'Please enter a valid 10-digit phone number'
    ]
  },
  address: { type: String },
  permanentAddress: { type: String },
  nationality: { type: String },
  organizationName: { type: String },
  photo: { type: String },
  startdate: {
    type: String,
    default: () => formatDate(new Date())
  },
  // contactPerson Information
   contactPerson: { type: String },
   contactPersonPhone: { 
    type: String,
    match: [
      /^[0-9]{10}$/,
      'Please enter a valid 10-digit phone number'
    ]
  },
  contactPersonAddress: { type: String },
  createdAt: {
    type: String,
    default: () => formatDate(new Date())
  }
}, {
  timestamps: false,
  _id: false
});

// Apply auto-increment plugin
clientSchema.plugin(AutoIncrement, { id: 'client_id', inc_field: '_id' });

const Client = mongoose.model('Client', clientSchema);

export default Client;
