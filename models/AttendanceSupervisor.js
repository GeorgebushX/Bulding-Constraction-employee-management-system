// import mongoose from "mongoose";
// import AutoIncrementFactory from "mongoose-sequence";

// const AutoIncrement = AutoIncrementFactory(mongoose);

// const AttendanceSupervisorSchema = new mongoose.Schema({
//   _id: Number, // Auto-incrementing numeric ID
//   date: {
//     type: String,
//     required: true,
//   },
//   supervisorId: {
//     type: Number, // ✅ Match the numeric _id of Supervisor
//     ref: "Supervisor",
//     required: true,
//   },

//   status: {
//     type: String,
//     enum: ["Fullday", "Halfday", "overtime"],
//     default: null,
//   },
// }, { _id: true });

// AttendanceSupervisorSchema.plugin(AutoIncrement, {
//   id: "attendance_seq",
//   inc_field: "_id",
//   start_seq: 1,
//   disable_hooks: false // Ensure hooks are enabled for proper sequencing

// });

// const SupervisorAttendance = mongoose.model("AttendanceSupervisor", AttendanceSupervisorSchema);
// export default SupervisorAttendance;



import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

// Plugin setup
const AutoIncrement = AutoIncrementFactory(mongoose);

// Define schema
const AttendanceSupervisorSchema = new mongoose.Schema({
  _id: Number, // Auto-increment ID

  date: {
    type: String,
    required: true,
  },

  supervisorId: {
    type: Number, // Must match Supervisor _id
    ref: "Supervisor",
    required: true,
  },

  status: {
    type: String,
    enum: ["Fullday", "Halfday", "overtime"],
    default: null,
  }
}, {
  _id: false, // Allow custom _id field
  timestamps: true // Optional: createdAt, updatedAt
});

// Auto-increment plugin
AttendanceSupervisorSchema.plugin(AutoIncrement, {
  id: "attendance_seq",
  inc_field: "_id",
  start_seq: 1
});

const SupervisorAttendance = mongoose.model("AttendanceSupervisor", AttendanceSupervisorSchema);
export default SupervisorAttendance;





// import mongoose from "mongoose";
// import AutoIncrementFactory from "mongoose-sequence";

// // Initialize auto-increment plugin
// const AutoIncrement = AutoIncrementFactory(mongoose);

// // Schema definition
// const AttendanceSupervisorSchema = new mongoose.Schema({
//   _id: Number, // Auto-incrementing numeric ID

//   date: {
//     type: String,
//     required: true,
//   },

//   supervisorId: {
//     type: Number, // Refers to numeric ID of Supervisor
//     ref: "Supervisor",
//     required: true,
//   },

//   status: {
//     type: String,
//     enum: ["Fullday", "Halfday", "overtime"],
//     default: null,
//   }
// }, {
//   _id: false, // Necessary for custom numeric _id
// });

// // Apply auto-increment plugin to _id
// AttendanceSupervisorSchema.plugin(AutoIncrement, {
//   id: "attendance_seq",      // Sequence name
//   inc_field: "_id",          // Field to auto-increment
//   start_seq: 1               // Starting value
// });

// // Create model
// const SupervisorAttendance = mongoose.model("AttendanceSupervisor", AttendanceSupervisorSchema);

// export default SupervisorAttendance;
