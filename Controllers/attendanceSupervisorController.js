
// import SupervisorAttendance from "../models/AttendanceSupervisor.js";

// export const getAttendance = async (req, res) => {
//     try {
//         const date = new Date().toISOString().split("T")[0];

//         const data = await SupervisorAttendance.find({ date })
//             .populate({
//                 path: "supervisorId",
//                 populate: {
//                     path: "userId"
//                 }
//             });
        
//         res.status(200).json({ success: true, data });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// // update attendance
// export const updateAttendance = async (req,res)=>{
//     try {
//         const {supervisorId}=req.params;
//         const {status} = req.body
//         const date = new Date().toISOString.split('T')[0]
//         const supervisor = await Supervisor.findOne({supervisorId})
//         const attendance = await Attendance.findOneAndUpdate({supervisorId:supervisor._id,date},{status},{new:true})
//         res.status(200).json({success:true, attendance})
//     } catch (error) {
//         res.status(500).json({success:false, message: error.message})
//     }
// }


import SupervisorAttendance from "../models/AttendanceSupervisor.js";
import Supervisor from "../models/Supervisor.js";

// ✅ GET today's attendance
export const getAttendance = async (req, res) => {
    try {
        const date = new Date().toISOString().split("T")[0];

        const data = await SupervisorAttendance.find({ date })
            .populate({
                path: "supervisorId",
                populate: {
                    path: "userId" // assuming Supervisor has userId ref
                }
            });

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ UPDATE attendance status
// ✔️ If you want to allow editing multiple times, set allowEdit = true
// ❌ If you want to lock it after first status update, set allowEdit = false
const allowEdit = true;

export const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const date = new Date().toISOString().split("T")[0];

        // First, find the document by ID and date
        const attendance = await SupervisorAttendance.findOne({ _id: id, date });

        if (!attendance) {
            return res.status(404).json({ success: false, message: "Attendance not found for today" });
        }

        if (!allowEdit && attendance.status !== null) {
            return res.status(400).json({ success: false, message: "Attendance already marked. Edit not allowed." });
        }

        attendance.status = status;
        await attendance.save();

        res.status(200).json({ success: true, message: "Attendance updated successfully", attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};









// import AttendanceSupervisor from "../models/AttendanceSupervisors.js";
// import Supervisor from "../models/Supervisor.js";
// import User from "../models/User.js";

// export const getAttendance = async (req, res) => {
//    try {
//         const { date } = req.query;
        
//         if (!date) {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: "Date parameter is required" 
//             });
//         }

//         const supervisorAttendance = await AttendanceSupervisor.find({ date })
//             .populate({
//                 path: "supervisorId",
//                 select:"_id name photo role "
                
//             });

//         if (!supervisorAttendance || supervisorAttendance.length === 0) {
//             // Create default attendance records if none exist for this date
//             const supervisors = await Supervisor.find({});
//             const attendanceRecords = supervisors.map(supervisor => ({
//                 date,
//                 supervisorId: supervisor._id,
//                 status: null
//             }));
            
//             await AttendanceSupervisor.insertMany(attendanceRecords);
            
//             // Fetch again after creating records
//             const newAttendance = await AttendanceSupervisor.find({ date })
//                 .populate({
//                     path: "supervisorId",
//                 select:"_id name photo role "
                    
//                 });
                
//             return res.status(200).json({ 
//                 success: true, 
//                 supervisorAttendance: newAttendance 
//             });
//         }
        
//         res.status(200).json({ 
//             success: true, 
//             supervisorAttendance 
//         });
//     } catch (error) {
//         console.error("Error fetching attendance:", error);
//         res.status(500).json({ 
//             success: false, 
//             message: "Server error while fetching attendance",
//             error: error.message 
//         });
//     }
// };