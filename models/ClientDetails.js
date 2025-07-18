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
  email: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  phone: { type: String },
  alternatePhone: { type: String },
  address: { type: String },
  permanentAddress: { type: String },
  nationality: { type: String },
  organizationName: { type: String },
  // contactPerson Information
   contactPerson: { type: String },
   contactPersonPhone: { type: String },
  photo: { type: String },
  startdate: {
    type: String,
    default: () => formatDate(new Date())
  },
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
