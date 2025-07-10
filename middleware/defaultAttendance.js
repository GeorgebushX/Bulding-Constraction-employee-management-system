// import Supervisor from "../models/Supervisor.js";
// import SupervisorAttendance from "../models/AttendanceSupervisor.js";

// const defaultAttendance = async (req, res, next) => {
//   try {
//     const date = new Date().toISOString().split('T')[0];
//     const existingAttendance = await SupervisorAttendance.findOne({ date });

//     if (!existingAttendance) {
//       const supervisors = await Supervisor.find({});
      
//       if (supervisors.length === 0) {
//         return next();
//       }

//       const attendanceRecords = supervisors.map(supervisor => ({
//         date,
//         supervisorId: supervisor._id, // ✅ Will be a number
//         status: null
//       }));

//       await SupervisorAttendance.insertMany(attendanceRecords);
//     }

//     next();
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// export default defaultAttendance;


import Supervisor from "../models/Supervisor.js";
import SupervisorAttendance from "../models/AttendanceSupervisor.js";

const defaultAttendance = async (req, res, next) => {
  try {
    // Get current date in DD/MM/YYYY format
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const displayDate = `${day}/${month}/${year}`;
    
    // Convert to database format (YYYY-MM-DD)
    const dbDate = `${year}-${month}-${day}`;

    // Check if attendance already exists for today
    const existingAttendance = await SupervisorAttendance.findOne({ date: dbDate });

    if (!existingAttendance) {
      const supervisors = await Supervisor.find({});
      
      if (supervisors.length === 0) {
        return next();
      }

      const attendanceRecords = supervisors.map(supervisor => ({
        date: dbDate,
        supervisorId: supervisor._id,
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