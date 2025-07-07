// import mongoose from "mongoose";

// const AttendanceSupervisorSchema = new mongoose.Schema({
//     _id: Number, // Auto-incrementing ID
//     date: {
//         type: String,
//         required: true
//     },
//     supervisorId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Supervisor",
//         required: true
//     },
//     status: {
//         type: String,
//         enum: ["Fullday", "Offday","overtime"],
//         default: null
//     }
// });

// const SupervisorAttendance = mongoose.model("AttendanceSupervisor", AttendanceSupervisorSchema);

// export default SupervisorAttendance;


import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

// Initialize auto-increment
const AutoIncrement = AutoIncrementFactory(mongoose);

const AttendanceSupervisorSchema = new mongoose.Schema({
    _id: Number,
    date: {
        type: String,
        required: true,
    },
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supervisor",
        required: true,
    },
    status: {
        type: String,
        enum: ["Fullday", "Offday", "overtime"],
        default: null,
    },
}, { _id: false }); // Needed to allow _id override

// Apply auto-increment plugin
AttendanceSupervisorSchema.plugin(AutoIncrement, {
    id: "attendance_seq",
    inc_field: "_id",
    start_seq: 1,
});

const SupervisorAttendance = mongoose.model("AttendanceSupervisor", AttendanceSupervisorSchema);
export default SupervisorAttendance;




// import mongoose from "mongoose";
// import AutoIncrementFactory from "mongoose-sequence";

// // Initialize auto-increment
// const AutoIncrement = AutoIncrementFactory(mongoose);

// const AttendanceSupervisorSchema = new mongoose.Schema({
//     _id:Number,
//     date: {
//         type: String,
//         required: true,
//     },
//     supervisorId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Supervisor",
//         required: true,
//     },
//     status: {
//         type: String,
//         enum: ["Fullday", "Offday", "overtime"],
//         default: null,
//     },
// });

// // Apply auto-increment to the `_id` field
// AttendanceSupervisorSchema.plugin(AutoIncrement, {
//     inc_field: "_id",  // The field to increment
//     start_seq: 1,      // Starts counting at 1
// });

// const SupervisorAttendance = mongoose.model("AttendanceSupervisor", AttendanceSupervisorSchema);

// export default SupervisorAttendance;