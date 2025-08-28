import mongoose from 'mongoose';

const engineerDashboardSchema = new mongoose.Schema({
  totalClients: { type: Number, default: 0 },
  totalSites: { type: Number, default: 0 },
  totalSupervisors: { type: Number, default: 0 },
  totalBudget: { type: Number, default: 0 }
}, {
  timestamps: true
});

const EngineerDashboard = mongoose.model('EngineerDashboard', engineerDashboardSchema);

export default EngineerDashboard;