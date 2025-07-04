// import AttendanceSupervisor from "../models/AttendanceSupervisors.js";

// export const getAttendance = async (req, res) => {
//     try {
//         const date = new Date().toISOString().split("T")[0];

//         const supervisorAttendance = await AttendanceSupervisor.find({ date })
//             .populate({
//                 path: "supervisorId",
//                 populate: {
//                     path: "userId"
//                 }
//             });
        
//         res.status(200).json({ success: true, supervisorAttendance });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };


import AttendanceSupervisor from "../models/AttendanceSupervisors.js";
import Supervisor from "../models/Supervisor.js";
import User from "../models/User.js";

export const getAttendance = async (req, res) => {
    try {
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({ 
                success: false, 
                message: "Date parameter is required" 
            });
        }

        const supervisorAttendance = await AttendanceSupervisor.find({ date })
            .populate({
                path: "supervisorId",
                select:"_id name photo role "
                
            });

        if (!supervisorAttendance || supervisorAttendance.length === 0) {
            // Create default attendance records if none exist for this date
            const supervisors = await Supervisor.find({});
            const attendanceRecords = supervisors.map(supervisor => ({
                date,
                supervisorId: supervisor._id,
                status: null
            }));
            
            await AttendanceSupervisor.insertMany(attendanceRecords);
            
            // Fetch again after creating records
            const newAttendance = await AttendanceSupervisor.find({ date })
                .populate({
                    path: "supervisorId",
                select:"_id name photo role "
                    
                });
                
            return res.status(200).json({ 
                success: true, 
                supervisorAttendance: newAttendance 
            });
        }
        
        res.status(200).json({ 
            success: true, 
            supervisorAttendance 
        });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error while fetching attendance",
            error: error.message 
        });
    }
};