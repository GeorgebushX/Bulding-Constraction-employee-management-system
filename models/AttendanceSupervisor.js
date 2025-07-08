import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

const AttendanceSupervisorSchema = new mongoose.Schema({
  _id: Number, // Auto-incrementing numeric ID
  date: {
    type: String,
    required: true,
  },
  supervisorId: {
    type: Number, // ✅ Match the numeric _id of Supervisor
    ref: "Supervisor",
    required: true,
  },

  status: {
    type: String,
    enum: ["Fullday", "Halfday", "overtime"],
    default: null,
  },
}, { _id: true });

AttendanceSupervisorSchema.plugin(AutoIncrement, {
  id: "attendance_seq",
  inc_field: "_id",
  start_seq: 1,
  disable_hooks: false // Ensure hooks are enabled for proper sequencing

});

const SupervisorAttendance = mongoose.model("AttendanceSupervisor", AttendanceSupervisorSchema);
export default SupervisorAttendance;
