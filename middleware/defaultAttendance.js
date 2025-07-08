import Supervisor from "../models/Supervisor.js";
import SupervisorAttendance from "../models/AttendanceSupervisor.js";

const defaultAttendance = async (req, res, next) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const existingAttendance = await SupervisorAttendance.findOne({ date });

    if (!existingAttendance) {
      const supervisors = await Supervisor.find({});
      
      if (supervisors.length === 0) {
        return next();
      }

      const attendanceRecords = supervisors.map(supervisor => ({
        date,
        supervisorId: supervisor._id, // ✅ Will be a number
        status: null
      }));

      await SupervisorAttendance.insertMany(attendanceRecords);
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export default defaultAttendance;
