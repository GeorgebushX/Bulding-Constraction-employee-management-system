import mongoose from "mongoose";

const AttendanceSupervisorSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true
    },
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supervisor",
        required: true
    },
    status: {
        type: String,
        enum: ["Present", "Absent", "Leave","overtime"],
        default: null
    }
});

const SupervisorAttendance = mongoose.model("AttendanceSupervisor", AttendanceSupervisorSchema);

export default SupervisorAttendance;