// import SupervisorAttendance from "../models/AttendanceSupervisor.js";
// import Supervisor from "../models/Supervisor.js";

// const defaultAttendance = async (req, res, next) => {
//     try {
//         const date = new Date().toISOString().split('T')[0];
//         const existingAttendance = await SupervisorAttendance.findOne({ date });

//         if (!existingAttendance) {
//             const supervisors = await Supervisor.find({});
//             const attendance = supervisors.map(supervisor => ({
//                 date,
//                 supervisorId: supervisor._id,
//                 status: null
//             }));
            
//             await SupervisorAttendance.insertMany(attendance);
//         }
//         next();
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// };

// export default defaultAttendance;


const defaultAttendance = async (req, res, next) => {
    try {
      const date = new Date().toISOString().split('T')[0];
      const existingAttendance = await SupervisorAttendance.findOne({ date });
  
      if (!existingAttendance) {
        // ✅ Only fetch supervisors with valid numeric userId
        const supervisors = await Supervisor.find({ userId: { $type: "number" } });
  
        if (supervisors.length === 0) {
          return next(); // No supervisors found
        }
  
        const attendance = supervisors.map(supervisor => ({
          date,
          supervisorId: supervisor._id,
          status: null
        }));
  
        await SupervisorAttendance.insertMany(attendance);
      }
  
      next();
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  export default defaultAttendance;

// import SupervisorAttendance from "../models/AttendanceSupervisor.js";
// import Supervisor from "../models/Supervisor.js";

// const defaultAttendance = async (req, res, next) => {
//     try {
//         const date = new Date().toISOString().split('T')[0];
//         const existingAttendance = await SupervisorAttendance.findOne({ date });

//         if (!existingAttendance) {
//             const supervisors = await Supervisor.find({});
//             const attendance = supervisors.map(supervisor => ({
//                 date,
//                 supervisorId: supervisor._id,
//                 status: null
//             }));

//             await SupervisorAttendance.insertMany(attendance);
//         }

//         next();
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// };

// export default defaultAttendance;
