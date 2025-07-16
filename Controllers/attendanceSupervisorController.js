import mongoose from "mongoose";
import cron from 'node-cron';
import SupervisorAttendance from "../models/AttendanceSupervisor.js";
import Supervisor from "../models/CenteringSupervisor.js";
import exceljs from 'exceljs';
import pdfkit from 'pdfkit';

// // Helper function to format date (from YYYY-MM-DD to DD/MM/YYYY)
// const formatDate = (dateString) => {
//   if (!dateString) return '';
  
//   // If already in DD/MM/YYYY format, return as-is
//   if (dateString.includes('/')) {
//     return dateString;
//   }
  
//   // Convert from YYYY-MM-DD to DD/MM/YYYY
//   const [year, month, day] = dateString.split('-');
//   return `${day}/${month}/${year}`;
// };

// // Helper function to parse date (from DD/MM/YYYY to YYYY-MM-DD)
// const parseToDbDate = (dateString) => {
//   if (!dateString) return '';
  
//   // If already in YYYY-MM-DD format, return as-is
//   if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
//     return dateString;
//   }
  
//   // Convert from DD/MM/YYYY to YYYY-MM-DD
//   const [day, month, year] = dateString.split('/');
//   return `${year}-${month}-${day}`;
// };

// // 1. GET all attendance records
// export const getAllAttendance = async (req, res) => {
//   try {
//     const attendanceRecords = await SupervisorAttendance.find({})
//       .populate({
//         path: 'supervisorId',
//         select: '_id name email photo',
//         match: { _id: { $exists: true } }
//       })
//       .lean();

//     const validRecords = attendanceRecords.filter(record => record.supervisorId);

//     const formattedData = validRecords.map(record => ({
//       _id: record._id,
//       date: formatDate(record.date),
//       supervisor: {
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



// Format date as DD/MM/YYYY
const formatDisplayDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Get date in YYYY-MM-DD format
const getISODate = (dateObj) => dateObj.toISOString().split('T')[0];

// CRON JOB - Reset attendance daily at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISODate = getISODate(tomorrow);

    // Get ALL supervisors (both active and inactive)
    const allSupervisors = await Supervisor.find({}).lean();
    
    if (!allSupervisors.length) {
      console.log('No supervisors found in database');
      return;
    }

    // Delete existing tomorrow's records if any
    await SupervisorAttendance.deleteMany({ date: tomorrowISODate });

    // Create fresh records for ALL supervisors with null status
    const bulkOps = allSupervisors.map(supervisor => ({
      insertOne: {
        document: {
          date: tomorrowISODate,
          supervisorId: supervisor._id,
          status: null
        }
      }
    }));

    await SupervisorAttendance.bulkWrite(bulkOps);
    console.log(`✅ Reset attendance for ${formatDisplayDate(tomorrowISODate)} - Created ${allSupervisors.length} records`);

  } catch (err) {
    console.error("❌ Daily reset error:", err.message);
  }
});

// GET today's attendance for ALL supervisors
export const getAttendance = async (req, res) => {
  try {
    const today = new Date();
    const todayISODate = getISODate(today);
    const displayDate = formatDisplayDate(todayISODate);

    // Get ALL supervisors (both active and inactive)
    const allSupervisors = await Supervisor.find({}).lean();
    
    if (!allSupervisors.length) {
      return res.status(200).json({
        success: true,
        currentDate: displayDate,
        data: []
      });
    }

    // Get today's attendance records
    const todayRecords = await SupervisorAttendance.find({ 
      date: todayISODate 
    }).lean();

    // Create map for quick lookup
    const attendanceMap = todayRecords.reduce((map, record) => {
      map[record.supervisorId] = record;
      return map;
    }, {});

    // Prepare response - include ALL supervisors
    const responseData = allSupervisors.map(supervisor => {
      const attendanceRecord = attendanceMap[supervisor._id];
      
      return {
        _id: attendanceRecord?._id || supervisor._id,
        date: displayDate,
        status: attendanceRecord?.status || null,
        supervisor: {
          _id: supervisor._id,
          name: supervisor.name,
          email: supervisor.email,
          photo: supervisor.photo
        }
      };
    });

    // Create attendance records for any missing supervisors
    const missingSupervisors = allSupervisors.filter(
      s => !attendanceMap[s._id]
    );

    if (missingSupervisors.length > 0) {
      const createOps = missingSupervisors.map(supervisor => ({
        insertOne: {
          document: {
            date: todayISODate,
            supervisorId: supervisor._id,
            status: null
          }
        }
      }));

      await SupervisorAttendance.bulkWrite(createOps);
      console.log(`Created ${missingSupervisors.length} missing attendance records`);
    }

    res.status(200).json({
      success: true,
      currentDate: displayDate,
      data: responseData
    });

  } catch (error) {
    console.error("Error in getAttendance:", error);
    res.status(500).json({ 
      success: false, 
      error: "Server error: " + error.message 
    });
  }
};

// latest one:

// const getFormattedDate = (dateObj) => dateObj.toISOString().split('T')[0];

// const formatDate = (dateString) => {
//   if (!dateString) return '';
//   if (dateString.includes('/')) return dateString;
//   const [year, month, day] = dateString.split('-');
//   return `${day}/${month}/${year}`;
// };

// // CRON JOB: Create attendance for tomorrow
// cron.schedule('0 0 * * *', async () => {
//   try {
//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     const dateStr = getFormattedDate(tomorrow);

//     const supervisors = await Supervisor.find({}).lean();
//     if (!supervisors.length) return;

//     const exists = await SupervisorAttendance.countDocuments({ date: dateStr });
//     if (exists > 0) return;

//     for (const supervisor of supervisors) {
//       const newEntry = new SupervisorAttendance({
//         date: dateStr,
//         supervisorId: supervisor._id,
//         status: null
//       });
//       await newEntry.save();
//     }

//     console.log(`✅ Created attendance for ${dateStr}`);
//   } catch (err) {
//     console.error("❌ Cron error:", err.message);
//   }
// });

// // GET today’s attendance (fallback creation)
// export const getAttendance = async (req, res) => {
//   try {
//     const today = new Date();
//     const todayFormatted = getFormattedDate(today);

//     const supervisors = await Supervisor.find({})
//     .populate({
//         path: 'supervisorId',
//         select: '_id name email photo',
//         match: { _id: { $exists: true } }
//       })
//       .lean();

//     if (!supervisors.length) {
//       return res.status(200).json({ success: true, message: "No supervisors found.", data: [] });
//     }

//     let records = await SupervisorAttendance.find({ date: todayFormatted });
//     if (records.length === 0) {
//       for (const supervisor of supervisors) {
//         const newEntry = new SupervisorAttendance({
//           date: todayFormatted,
//           supervisorId: supervisor._id,
//           status: null
//         });
//         await newEntry.save();
//       }
//     }

//     // Re-fetch after fallback creation
//     records = await SupervisorAttendance.find({ date: todayFormatted })
//       .populate({ path: 'supervisorId', select: '_id name email photo' })
//       .lean();

//     const validRecords = records.filter(r => r.supervisorId);

//     const data = validRecords.map(r => ({
//       _id: r._id,
//       date: formatDate(r.date),
//       supervisor: {
//         _id: r.supervisorId._id,
//         name: r.supervisorId.name,
//         email: r.supervisorId.email,
//         photo: r.supervisorId.photo
//       },
//       status: r.status
//     }));

//     res.status(200).json({
//       success: true,
//       currentDate: formatDate(todayFormatted),
//       data
//     });

//   } catch (error) {
//     console.error("Error in getAttendance:", error);
//     res.status(500).json({ success: false, error: "Server error: " + error.message });
//   }
// };



// 2. UPDATE Attendance by ID
export const updateAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const numericId = Number(id);
    
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID format"
      });
    }

    if (!["Fullday", "Halfday", "Overtime", null].includes(status)) {
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
      data: {
        _id: updatedAttendance._id,
        date: formatDate(updatedAttendance.date),
        supervisor: {
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




export const getTodaySupervisorAttendance = async (req, res) => {
  try {
    // Get today's date in proper format
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get all supervisors
    const supervisors = await Supervisor.find({})
      .select('_id name email photo')
      .lean();

    if (supervisors.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No supervisors found in the system",
        data: []
      });
    }

    // Get existing attendance records for today only
    const existingRecords = await SupervisorAttendance.find({
      date: todayFormatted
    })
    .populate('supervisorId', '_id name email photo')
    .lean();

    // Prepare response data - only for today with null status if no record exists
    const responseData = supervisors.map(supervisor => {
      // Find if this supervisor has an existing record for today
      const existingRecord = existingRecords.find(record => 
        record.supervisorId?._id.toString() === supervisor._id.toString()
      );

      // For today's date, always return status as null if no record exists
      if (existingRecord) {
        return {
          _id: existingRecord._id,
          date: formatDate(existingRecord.date),
          supervisor: {
            _id: supervisor._id,
            photo: supervisor.photo,
            name: supervisor.name,
            email: supervisor.email
          },
          status: existingRecord.status,
          recordExists: true
        };
      } else {
        return {
          _id: null,
          date: formatDate(todayFormatted),
          supervisor: {
            _id: supervisor._id,
            photo: supervisor.photo,
            name: supervisor.name,
            email: supervisor.email
          },
          status: null, // Always null for today if no record exists
          recordExists: false
        };
      }
    });

    res.status(200).json({
      success: true,
      message: "Today's attendance records fetched successfully",
      currentDate: formatDate(todayFormatted),
      data: responseData
    });

  } catch (error) {
    console.error("Error fetching today's supervisor attendance:", error);
    res.status(500).json({
      success: false,
      error: "Server error: " + error.message
    });
  }
};


export const updateStatusBySupervisorAndDate = async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const { date, status } = req.body;

    // 1. Validate status (including null/undefined)
    const allowedStatuses = ["Fullday", "Halfday", "Overtime", null, undefined];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status value. Allowed values: Fullday, Halfday, Overtime or null"
      });
    }

    // 2. Validate supervisorId (must be numeric or valid MongoDB ID)
    let supervisorIdFilter;
    if (/^\d+$/.test(supervisorId)) {
      supervisorIdFilter = Number(supervisorId);
    } else if (/^[0-9a-fA-F]{24}$/.test(supervisorId)) {
      supervisorIdFilter = supervisorId;
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid supervisor ID format. Must be a number or valid MongoDB ID."
      });
    }

    // 3. Parse and validate date (accepts multiple formats)
    let dbFormattedDate;
    try {
      // Try parsing as ISO format (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        dbFormattedDate = date;
      } 
      // Try parsing as DD/MM/YYYY
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [day, month, year] = date.split('/');
        dbFormattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      // Try parsing as MM/DD/YYYY
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [month, day, year] = date.split('/');
        dbFormattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      // Try parsing as timestamp
      else if (!isNaN(new Date(date).getTime())) {
        const jsDate = new Date(date);
        dbFormattedDate = jsDate.toISOString().split('T')[0];
      } else {
        throw new Error("Invalid date format");
      }

      // Validate the parsed date
      const dateObj = new Date(dbFormattedDate);
      if (isNaN(dateObj.getTime())) {
        throw new Error("Invalid date");
      }
    } catch (dateError) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Accepted formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, or valid timestamp"
      });
    }

    // 4. Build update query
    const updateData = {};
    if (status !== undefined) {
      updateData.status = status;
    } else {
      // If status is undefined, set to null (or remove the field if that's preferred)
      updateData.status = null;
    }

    // 5. Update or create attendance record
    const updatedAttendance = await SupervisorAttendance.findOneAndUpdate(
      { 
        supervisorId: supervisorIdFilter,
        date: dbFormattedDate
      },
      updateData,
      { 
        new: true,       // Return the updated document
        upsert: true,    // Create if doesn't exist
        runValidators: true // Run schema validators
      }
    ).populate('supervisorId', '_id name email photo');

    // 6. Format the response date (DD/MM/YYYY)
    const responseDate = formatDateForResponse(updatedAttendance.date);

    // 7. Success response
    res.status(200).json({
      success: true,
      message: updatedAttendance.createdAt === updatedAttendance.updatedAt 
        ? "New attendance record created" 
        : "Existing attendance record updated",
      data: {
        _id: updatedAttendance._id,
        date: responseDate,
        supervisor: updatedAttendance.supervisorId ? {
          _id: updatedAttendance.supervisorId._id,
          photo: updatedAttendance.supervisorId.photo,
          name: updatedAttendance.supervisorId.name,
          email: updatedAttendance.supervisorId.email
        } : null,
        status: updatedAttendance.status,
        createdAt: updatedAttendance.createdAt,
        updatedAt: updatedAttendance.updatedAt
      }
    });

  } catch (error) {
    // 8. Server error handling
    console.error("Error updating attendance:", error);
    res.status(500).json({
      success: false,
      error: "Server error: " + error.message
    });
  }
};

// Helper function to format date for response
function formatDateForResponse(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}












// export const getAttendanceByDate = async (req, res) => {
//   try {
//     const { day, month, year } = req.params;
    
//     // Validate date components
//     if (!day || !month || !year || 
//         day.length !== 2 || month.length !== 2 || year.length !== 4) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid date format. Use DD/MM/YYYY in the URL path."
//       });
//     }

//     const dbFormattedDate = `${year}-${month}-${day}`;
//     console.log(`Searching for date: ${dbFormattedDate}`); // Debug log
    
//     // First check if any supervisors exist
//     const supervisors = await Supervisor.find({});
//     if (supervisors.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No supervisors exist in the system",
//         data: []
//       });
//     }

//     // Find attendance records
//     const attendanceRecords = await SupervisorAttendance.find({ date: dbFormattedDate })
//       .populate({
//         path: 'supervisorId',
//         select: '_id name email photo',
//         options: { allowNull: true }
//       })
//       .lean();

//     console.log(`Found ${attendanceRecords.length} records`); // Debug log

//     // If no records exist, create default ones
//     if (attendanceRecords.length === 0) {
//       console.log("No records found, creating default entries");
      
//       const defaultRecords = supervisors.map(supervisor => ({
//         _id: supervisor._id, // Set _id to supervisorId
//         date: dbFormattedDate,
//         supervisorId: supervisor._id,
//         status: null
//       }));

//       await SupervisorAttendance.insertMany(defaultRecords);
      
//       // Return the newly created default records
//       const newRecords = await SupervisorAttendance.find({ date: dbFormattedDate })
//         .populate('supervisorId', '_id name email photo')
//         .lean();

//       const formattedData = newRecords.map(record => ({
//         _id: record._id,
//         date: formatDate(record.date),
//         supervisor: {
//           _id: record.supervisorId._id,
//           photo: record.supervisorId.photo || null,
//           name: record.supervisorId.name,
//           email: record.supervisorId.email
//         },
//         status: record.status || "Not Marked"
//       }));

//       return res.status(200).json({
//         success: true,
//         message: "Default attendance records created",
//         data: formattedData
//       });
//     }

//     // Filter out any records with invalid supervisor references
//     const validRecords = attendanceRecords.filter(record => 
//       record.supervisorId && record.supervisorId._id
//     );

//     const formattedData = validRecords.map(record => ({
//       _id: record._id,
//       date: formatDate(record.date),
//       supervisor: {
//         _id: record.supervisorId._id,
//         photo: record.supervisorId.photo || null,
//         name: record.supervisorId.name,
//         email: record.supervisorId.email
//       },
//       status: record.status || "Not Marked"
//     }));

//     res.status(200).json({
//       success: true,
//       data: formattedData
//     });
//   } catch (error) {
//     console.error("Error in getAttendanceByDate:", error);
//     res.status(500).json({
//       success: false,
//       error: "Server error: " + error.message
//     });
//   }
// };

// Format date as DD/MM/YYYY
// const formatDate = (inputDate) => {
//   const date = new Date(inputDate);
//   const day = String(date.getDate()).padStart(2, '0');
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const year = date.getFullYear();
//   return `${day}/${month}/${year}`;
// };

export const getAttendanceByDate = async (req, res) => {
  try {
    const { day, month, year } = req.params;

    // Validate format
    if (!day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use DD/MM/YYYY in the URL path."
      });
    }

    const dbFormattedDate = `${year}-${month}-${day}`; // YYYY-MM-DD

    // Fetch attendance for the given date
    const attendanceRecords = await AttendanceSupervisor.find({ date: dbFormattedDate })
      .populate('supervisorId', '_id name email photo')
      .lean();

    // If no records exist for that date, return empty list
    if (attendanceRecords.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No attendance records found for this date.",
        date: formatDate(dbFormattedDate),
        data: []
      });
    }

    // Format output
    const formattedData = attendanceRecords
      .filter(record => record.supervisorId)
      .map(record => ({
        _id: record._id,
        date: formatDate(record.date),
        supervisor: {
          _id: record.supervisorId._id,
          name: record.supervisorId.name,
          email: record.supervisorId.email,
          photo: record.supervisorId.photo || null
        },
        status: record.status || "Not Marked"
      }));

    res.status(200).json({
      success: true,
      message: "Attendance records fetched successfully.",
      date: formatDate(dbFormattedDate),
      data: formattedData
    });

  } catch (error) {
    console.error("Error in getAttendanceByDate:", error);
    res.status(500).json({
      success: false,
      error: "Server error: " + error.message
    });
  }
};




export const applyStatusToAll = async (req, res) => {
  try {
    const { date, status } = req.body;
    
    // Validate status
    if (!["Fullday", "Halfday", "Overtime", null].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status value. Allowed values: Fullday, Halfday, Overtime, null"
      });
    }

    // Parse and format date (DD/MM/YYYY → YYYY-MM-DD)
    const [day, month, year] = date.split('/');
    if (!day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use DD/MM/YYYY."
      });
    }

    const dbFormattedDate = `${year}-${month}-${day}`;

    // Get all supervisors
    const supervisors = await Supervisor.find({});
    if (supervisors.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No supervisors found"
      });
    }

    // Prepare bulk operations
    const bulkOps = supervisors.map(supervisor => ({
      updateOne: {
        filter: { 
          supervisorId: supervisor._id,
          date: dbFormattedDate 
        },
        update: { 
          $set: { 
            status,
            _id: supervisor._id,
            supervisorId: supervisor._id,
            date: dbFormattedDate
          } 
        },
        upsert: true
      }
    }));

    // Execute bulk operation
    const bulkResult = await SupervisorAttendance.bulkWrite(bulkOps);
    console.log('Bulk write result:', bulkResult);

    // Get updated records with relaxed population
    const updatedRecords = await SupervisorAttendance.find({ date: dbFormattedDate })
      .populate({
        path: 'supervisorId',
        select: '_id name email photo',
        options: { allowNull: true }
      })
      .lean();

    console.log('Updated records:', updatedRecords);

    // Format the data with more tolerant null checks
    const formattedData = updatedRecords.map(record => {
      const supervisorInfo = record.supervisorId ? {
        _id: record.supervisorId._id,
        photo: record.supervisorId.photo || null,
        name: record.supervisorId.name || 'Unknown',
        email: record.supervisorId.email || 'No email'
      } : {
        _id: record._id, // Fallback to the record's _id if no supervisor
        photo: null,
        name: 'Supervisor not found',
        email: 'No email'
      };

      return {
        _id: record._id,
        date: formatDate(record.date),
        supervisor: supervisorInfo,
        status: record.status || "Not Marked"
      };
    });

    res.status(200).json({
      success: true,
      message: `Status ${status} applied to all supervisors for ${date}`,
      data: formattedData,
      stats: {
        matched: bulkResult.matchedCount,
        modified: bulkResult.modifiedCount,
        upserted: bulkResult.upsertedCount
      }
    });
  } catch (error) {
    console.error("Error in applyStatusToAll:", error);
    res.status(500).json({
      success: false,
      error: "Server error: " + error.message
    });
  }
};





// Generate PDF Report
const generatePDFReport = (data, periodType) => {
  return new Promise((resolve) => {
    const doc = new pdfkit();
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    doc.fontSize(18).text(`Attendance ${periodType} Report`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    doc.font('Helvetica-Bold');
    doc.text('Date', 50, 100);
    doc.text('Supervisor Name', 150, 100);
    doc.text('Status', 300, 100);
    doc.font('Helvetica');

    let y = 120;
    data.forEach((record) => {
      doc.text(record.date, 50, y);
      doc.text(record.supervisor.name, 150, y);
      doc.text(record.status, 300, y);
      y += 20;
    });

    doc.end();
  });
};

// Generate Excel Report
const generateExcelReport = (data, periodType) => {
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Report');

  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Supervisor ID', key: 'id', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  data.forEach(record => {
    worksheet.addRow({
      date: record.date,
      id: record.supervisor._id,
      name: record.supervisor.name,
      email: record.supervisor.email,
      status: record.status
    });
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });

  return workbook;
};







// Daily Report


export const getDailyReport = async (req, res) => {
  try {
    const { date, format = 'json' } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Date parameter is required for daily report"
      });
    }

    const attendanceData = await SupervisorAttendance.find({ date })
      .populate({
        path: 'supervisorId',
        select: '_id name email photo',
        match: { _id: { $exists: true } }
      });

    const formattedData = attendanceData.map(record => ({
      date: formatDate(record.date),
      supervisor: {
        _id: record.supervisorId._id,
        name: record.supervisorId.name,
        email: record.supervisorId.email,
        photo: record.supervisorId.photo
      },
      status: record.status || "Not Marked"
    }));

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(formattedData, 'Daily');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_daily_report.pdf`);
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const workbook = generateExcelReport(formattedData, 'Daily');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_daily_report.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      return res.status(200).json({
        success: true,
        period: 'daily',
        date,
        data: formattedData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


// Weekly Report
export const getWeeklyReport = async (req, res) => {
  try {
    const { date, format = 'json' } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Date parameter is required for weekly report"
      });
    }

    const dateObj = new Date(date);
    const startDate = new Date(dateObj.setDate(dateObj.getDate() - dateObj.getDay()));
    const endDate = new Date(dateObj.setDate(dateObj.getDate() + 6));
    
    const attendanceData = await SupervisorAttendance.find({
      date: { 
        $gte: startDate.toISOString().split('T')[0], 
        $lte: endDate.toISOString().split('T')[0] 
      }
    })
    .populate({
      path: 'supervisorId',
      select: '_id name email photo',
      match: { _id: { $exists: true } }
    });

    const formattedData = attendanceData.map(record => ({
      date: formatDate(record.date),
      supervisor: {
        _id: record.supervisorId._id,
        name: record.supervisorId.name,
        email: record.supervisorId.email,
        photo: record.supervisorId.photo
      },
      status: record.status || "Not Marked"
    }));

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(formattedData, 'Weekly');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_weekly_report.pdf`);
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const workbook = generateExcelReport(formattedData, 'Weekly');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_weekly_report.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      return res.status(200).json({
        success: true,
        period: 'weekly',
        startDate: formatDate(startDate.toISOString().split('T')[0]),
        endDate: formatDate(endDate.toISOString().split('T')[0]),
        data: formattedData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Monthly Report
export const getMonthlyReport = async (req, res) => {
  try {
    const { year, month, format = 'json' } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: "Year and month parameters are required for monthly report"
      });
    }

    const attendanceData = await SupervisorAttendance.find({
      date: {
        $regex: `^${year}-${month.padStart(2, '0')}`
      }
    })
    .populate({
      path: 'supervisorId',
      select: '_id name email photo',
      match: { _id: { $exists: true } }
    });

    const formattedData = attendanceData.map(record => ({
      date: formatDate(record.date),
      supervisor: {
        _id: record.supervisorId._id,
        name: record.supervisorId.name,
        email: record.supervisorId.email,
        photo: record.supervisorId.photo
      },
      status: record.status || "Not Marked"
    }));

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(formattedData, 'Monthly');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_monthly_report.pdf`);
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const workbook = generateExcelReport(formattedData, 'Monthly');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_monthly_report.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      return res.status(200).json({
        success: true,
        period: 'monthly',
        year,
        month,
        data: formattedData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
