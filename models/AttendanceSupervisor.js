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

const AttendanceSupervisorSchema = new mongoose.Schema({
  _id: { type: Number }, // This will be the same as supervisorId
  date: { type: String, required: true },
  supervisorId: { 
    type: Number,
    ref: "Supervisor",
    required: true,
  },
  status: {
    type: String,
    enum: ["Fullday", "Halfday", "overtime"],
    default: null,
  }
}, { timestamps: true, _id: false }); // _id: false to prevent automatic _id generation

// Ensure _id = supervisorId
AttendanceSupervisorSchema.pre('save', function(next) {
  this._id = this.supervisorId;
  next();
});

export default mongoose.model("AttendanceSupervisor", AttendanceSupervisorSchema);



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
