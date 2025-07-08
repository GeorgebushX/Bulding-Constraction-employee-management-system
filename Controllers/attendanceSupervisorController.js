


// import SupervisorAttendance from "../models/AttendanceSupervisor.js";
// import Supervisor from "../models/Supervisor.js";

// // Helper function to format date
// const formatDate = (dateString) => {
//   const [year, month, day] = dateString.split('-');
//   return `${day}/${month}/${year}`;
// };

// // 1. GET all attendance records
// export const getAllAttendance = async (req, res) => {
//   try {
//     // Find all attendance records and populate supervisor details
//     const attendanceRecords = await SupervisorAttendance.find({})
//       .populate({
//         path: 'supervisorId',
//         select: '_id name email photo'
//       });

//     // Format the response data
//     const formattedData = attendanceRecords.map(record => ({
//       _id: record._id,
//       date: formatDate(record.date),
//       supervisorId: {
//         _id: record.supervisorId._id,
//         photo: record.supervisorId.photo,
//         name: record.supervisorId.name,
//         email: record.supervisorId.email
//       },
//       status: record.status
//     }));

//     res.status(200).json({
//       success: true,
//       data: formattedData
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 2. UPDATE Attendance by ID
// export const updateAttendanceById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     // Validate status
//     if (!["Fullday", "Offday", "overtime"].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid status value"
//       });
//     }

//     const updatedAttendance = await SupervisorAttendance.findByIdAndUpdate(
//       id,
//       { status },
//       { new: true }
//     );

//     if (!updatedAttendance) {
//       return res.status(404).json({
//         success: false,
//         error: "Attendance record not found"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Attendance updated successfully",
//       attendance: {
//         _id: updatedAttendance._id,
//         date: formatDate(updatedAttendance.date),
//         supervisorId: updatedAttendance.supervisorId,
//         status: updatedAttendance.status
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// // 3. UPDATE Status by Supervisor ID and Date
// export const updateStatusBySupervisorAndDate = async (req, res) => {
//   try {
//     const { supervisorId } = req.params;
//     const { status, date } = req.body;

//     // Validate status
//     if (!["Fullday", "Offday", "overtime", null].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid status value"
//       });
//     }

//     // Convert date from DD/MM/YYYY to YYYY-MM-DD for database query
//     const [day, month, year] = date.split('/');
//     const dbFormattedDate = `${year}-${month}-${day}`;

//     const updatedAttendance = await SupervisorAttendance.findOneAndUpdate(
//       { 
//         supervisorId,
//         date: dbFormattedDate
//       },
//       { status },
//       { new: true }
//     );

//     if (!updatedAttendance) {
//       return res.status(404).json({
//         success: false,
//         error: "Attendance record not found for the given supervisor and date"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Status updated successfully",
//       attendance: {
//         _id: updatedAttendance._id,
//         date: formatDate(updatedAttendance.date),
//         supervisorId: updatedAttendance.supervisorId,
//         status: updatedAttendance.status
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };



import SupervisorAttendance from "../models/AttendanceSupervisor.js";
import Supervisor from "../models/Supervisor.js";

// Helper function to format date
const formatDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// 1. GET all attendance records (with proper _id handling)
export const getAllAttendance = async (req, res) => {
  try {
    const attendanceRecords = await SupervisorAttendance.find({})
      .populate({
        path: 'supervisorId',
        select: '_id name email photo'
      })
      .lean(); // Add lean() for better performance

    const formattedData = attendanceRecords.map(record => ({
      _id: record._id, // This will now properly show the auto-incremented ID
      date: formatDate(record.date),
      supervisorId: {
        _id: record.supervisorId._id,
        photo: record.supervisorId.photo,
        name: record.supervisorId.name,
        email: record.supervisorId.email
      },
      status: record.status
    }));

    res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 2. UPDATE Attendance by ID (with numeric ID handling)
export const updateAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Convert ID to number explicitly
    const numericId = Number(id);
    
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID format. Must be a number"
      });
    }

    if (!["Fullday", "Offday", "overtime"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status value"
      });
    }

    const updatedAttendance = await SupervisorAttendance.findOneAndUpdate(
      { _id: numericId },
      { status },
      { new: true }
    ).populate('supervisorId', '_id name email photo');

    if (!updatedAttendance) {
      return res.status(404).json({
        success: false,
        error: "Attendance record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      attendance: {
        _id: updatedAttendance._id, // Will show the numeric ID
        date: formatDate(updatedAttendance.date),
        supervisorId: {
          _id: updatedAttendance.supervisorId._id,
          photo: updatedAttendance.supervisorId.photo,
          name: updatedAttendance.supervisorId.name,
          email: updatedAttendance.supervisorId.email
        },
        status: updatedAttendance.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 3. UPDATE Status by Supervisor ID and Date
export const updateStatusBySupervisorAndDate = async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const { status, date } = req.body;

    if (!["Fullday", "Offday", "overtime", null].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status value"
      });
    }

    const [day, month, year] = date.split('/');
    const dbFormattedDate = `${year}-${month}-${day}`;

    const updatedAttendance = await SupervisorAttendance.findOneAndUpdate(
      { 
        supervisorId: Number(supervisorId),
        date: dbFormattedDate
      },
      { status },
      { new: true }
    ).populate('supervisorId', '_id name email photo');

    if (!updatedAttendance) {
      return res.status(404).json({
        success: false,
        error: "Attendance record not found for the given supervisor and date"
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      attendance: {
        _id: updatedAttendance._id, // Will show the numeric ID
        date: formatDate(updatedAttendance.date),
        supervisorId: {
          _id: updatedAttendance.supervisorId._id,
          photo: updatedAttendance.supervisorId.photo,
          name: updatedAttendance.supervisorId.name,
          email: updatedAttendance.supervisorId.email
        },
        status: updatedAttendance.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};