

import mongoose from "mongoose";

const AttendanceSupervisorSchema = new mongoose.Schema({
  _id: { type: Number }, // This will be manually set to supervisorId
  date: { type: String, required: true },
  supervisorId: { 
    type: Number,
    ref: "Supervisor",
    required: true,
  },
  status: {
    type: String,
    enum: ["Fullday", "Halfday", "Overtime"],
    default: null,
  }
}, { 
  timestamps: true,
  // No need for _id: false since we've explicitly defined _id
});

  // Set _id to be equal to supervisorId before validation
  AttendanceSupervisorSchema.pre('validate', function(next) {
    if (!this._id) {
      this._id = this.supervisorId;
    }
    next();
});

export default mongoose.model("AttendanceSupervisor", AttendanceSupervisorSchema);