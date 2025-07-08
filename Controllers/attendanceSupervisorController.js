


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

























// import SupervisorAttendance from "../models/AttendanceSupervisor.js";
// import Supervisor from "../models/Supervisor.js";

// const formatDate = (dateString) => {
//   const [year, month, day] = dateString.split("-");
//   return `${day}/${month}/${year}`;
// };

// export const getAllAttendance = async (req, res) => {
//   try {
//     const records = await SupervisorAttendance.find({})
//       .populate("supervisorId", "_id name email photo")
//       .lean();

//     const data = records.map(record => ({
//       _id: record._id,
//       date: formatDate(record.date),
//       supervisorId: {
//         _id: record.supervisorId._id,
//         name: record.supervisorId.name,
//         email: record.supervisorId.email,
//         photo: record.supervisorId.photo,
//       },
//       status: record.status
//     }));

//     res.status(200).json({ success: true, data });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// export const updateAttendanceById = async (req, res) => {
//   try {
//     const numericId = Number(req.params.id);
//     const { status } = req.body;

//     if (!["Fullday", "Halfday", "overtime"].includes(status)) {
//       return res.status(400).json({ success: false, error: "Invalid status" });
//     }

//     const record = await SupervisorAttendance.findOneAndUpdate(
//       { _id: numericId },
//       { status },
//       { new: true }
//     ).populate("supervisorId", "_id name email photo");

//     if (!record) {
//       return res.status(404).json({ success: false, error: "Record not found" });
//     }

//     res.status(200).json({
//       success: true,
//       attendance: {
//         _id: record._id,
//         date: formatDate(record.date),
//         supervisorId: {
//           _id: record.supervisorId._id,
//           name: record.supervisorId.name,
//           email: record.supervisorId.email,
//           photo: record.supervisorId.photo,
//         },
//         status: record.status
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// export const updateStatusBySupervisorAndDate = async (req, res) => {
//   try {
//     const { supervisorId } = req.params;
//     const { date, status } = req.body;

//     if (!["Fullday", "Halfday", "overtime", null].includes(status)) {
//       return res.status(400).json({ success: false, error: "Invalid status" });
//     }

//     const [day, month, year] = date.split("/");
//     const formattedDate = `${year}-${month}-${day}`;

//     const record = await SupervisorAttendance.findOneAndUpdate(
//       { supervisorId: Number(supervisorId), date: formattedDate },
//       { status },
//       { new: true }
//     ).populate("supervisorId", "_id name email photo");

//     if (!record) {
//       return res.status(404).json({ success: false, error: "Record not found" });
//     }

//     res.status(200).json({
//       success: true,
//       attendance: {
//         _id: record._id,
//         date: formatDate(record.date),
//         supervisorId: {
//           _id: record.supervisorId._id,
//           name: record.supervisorId.name,
//           email: record.supervisorId.email,
//           photo: record.supervisorId.photo,
//         },
//         status: record.status
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };


import SupervisorAttendance from "../models/AttendanceSupervisor.js";
import Supervisor from "../models/Supervisor.js";

// Helper function to format date
const formatDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// 1. GET all attendance records
export const getAllAttendance = async (req, res) => {
  try {
    const attendanceRecords = await SupervisorAttendance.find({})
      .populate({
        path: 'supervisorId',
        select: '_id name email photo'
      });

    const formattedData = attendanceRecords.map(record => ({
      id: record._id,
      date: formatDate(record.date),
      supervisor: {
        id: record.supervisorId._id,
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

// 2. UPDATE Attendance by MongoDB ID
export const updateAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID format"
      });
    }

    if (!["Fullday", "Halfday", "Overtime", "Offday"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status value"
      });
    }

    const updatedAttendance = await SupervisorAttendance.findByIdAndUpdate(
      id,
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
      data: {
        id: updatedAttendance._id,
        date: formatDate(updatedAttendance.date),
        supervisor: {
          id: updatedAttendance.supervisorId._id,
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

    if (!["Fullday", "Halfday", "Overtime"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status value"
      });
    }

    // Convert date from DD/MM/YYYY to YYYY-MM-DD
    const [day, month, year] = date.split('/');
    const dbFormattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    const updatedAttendance = await SupervisorAttendance.findOneAndUpdate(
      { 
        supervisorId: Number(supervisorId),
        date: dbFormattedDate
      },
      { status },
      { new: true, upsert: true } // Create if doesn't exist
    ).populate('supervisorId', '_id name email photo');

    res.status(200).json({
      success: true,
      data: {
        id: updatedAttendance._id,
        date: formatDate(updatedAttendance.date),
        supervisor: {
          id: updatedAttendance.supervisorId._id,
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


// import SupervisorAttendance from "../models/AttendanceSupervisor.js";
// import Supervisor from "../models/Supervisor.js";

// // Helper function to format date
// const formatDate = (dateString) => {
//   const [year, month, day] = dateString.split('-');
//   return `${day}/${month}/${year}`;
// };

// // 1. GET all attendance records (with proper _id handling)
// export const getAllAttendance = async (req, res) => {
//   try {
//     const attendanceRecords = await SupervisorAttendance.find({})
//       .populate({
//         path: 'supervisorId',
//         select: '_id name email photo'
//       })
//       .lean(); // Add lean() for better performance

//     const formattedData = attendanceRecords.map(record => ({
//       _id: record._id, // This will now properly show the auto-incremented ID
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

// // 2. UPDATE Attendance by ID (with numeric ID handling)
// export const updateAttendanceById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     // Convert ID to number explicitly
//     const numericId = Number(id);
    
//     if (isNaN(numericId)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid ID format. Must be a number"
//       });
//     }

//     if (!["Fullday", "Offday", "overtime"].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid status value"
//       });
//     }

//     const updatedAttendance = await SupervisorAttendance.findOneAndUpdate(
//       { _id: numericId },
//       { status },
//       { new: true }
//     ).populate('supervisorId', '_id name email photo');

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
//         _id: updatedAttendance._id, // Will show the numeric ID
//         date: formatDate(updatedAttendance.date),
//         supervisorId: {
//           _id: updatedAttendance.supervisorId._id,
//           photo: updatedAttendance.supervisorId.photo,
//           name: updatedAttendance.supervisorId.name,
//           email: updatedAttendance.supervisorId.email
//         },
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

//     if (!["Fullday", "Halfday", "overtime"].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid status value"
//       });
//     }

//     const [day, month, year] = date.split('/');
//     const dbFormattedDate = `${year}-${month}-${day}`;

//     const updatedAttendance = await SupervisorAttendance.findOneAndUpdate(
//       { 
//         supervisorId: Number(supervisorId),
//         date: dbFormattedDate
//       },
//       { status },
//       { new: true }
//     ).populate('supervisorId', '_id name email photo');

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
//         _id: updatedAttendance._id, // Will show the numeric ID
//         date: formatDate(updatedAttendance.date),
//         supervisorId: {
//           _id: updatedAttendance.supervisorId._id,
//           photo: updatedAttendance.supervisorId.photo,
//           name: updatedAttendance.supervisorId.name,
//           email: updatedAttendance.supervisorId.email
//         },
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