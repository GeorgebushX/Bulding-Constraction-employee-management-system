import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';

const AutoIncrement = mongooseSequence(mongoose);

// Helper function to format dates as MM/DD/YYYY
function formatDate(date) {
  if (!date) return null;

  const parsedDate = new Date(date);
  if (!isNaN(parsedDate.getTime())) {
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = parsedDate.getDate().toString().padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${month}/${day}/${year}`;
  }

  return date;
}

// Sub-schema for workers count
const workersCountSchema = new mongoose.Schema({
  supervisors: { type: Number, default: 0 },
  contractors: { type: Number, default: 0 },
  workers: { type: Number, default: 0 }
}, { _id: false });

// Main Site schema
const siteSchema = new mongoose.Schema({
  _id: Number, // Auto-incrementing numeric ID
  siteid: {
    type: String,
    unique: true,
    sparse: true,
    default: function () {
      return `${this._id}`;
    }
  },
  // ✅ FIX: Use Number instead of ObjectId since Client _id is a number
  client: { type: Number, ref: 'Client'},

  siteName: { type: String },
  location: { type: String },
  areaSqFt: { type: Number },
  workersCount: workersCountSchema,
  startDate: {
    type: String,
    default: () => formatDate(new Date())
  },
  endDate: {
    type: String,
    default: () => formatDate(new Date())
  },
  status: {
    type: String,
    enum: ['Planned', 'In Progress', 'Completed', 'On Hold'],
    default: 'Planned'
  },
  budget: { type: Number },
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

// Apply auto-increment plugin
siteSchema.plugin(AutoIncrement, { id: 'site_id', inc_field: '_id' });

const Site = mongoose.model('Site', siteSchema);

export default Site;
