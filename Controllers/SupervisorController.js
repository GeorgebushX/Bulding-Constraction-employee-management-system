
import Supervisor from "../models/Supervisor.js";
import User from "../models/User.js";
import Site from "../models/SiteDetails.js";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import cron from 'node-cron';
import exceljs from 'exceljs';
import pdfkit from 'pdfkit';


// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG) and PDF files are allowed'));
    }
  }
}).fields([
  { name: "photo", maxCount: 1 },
  { name: "supervisorIdProof", maxCount: 5 },
]);

// POST - Create a new supervisor with site
export const createSupervisor = async (req, res) => {
  try {
    const {
      name, email, dateOfBirth, gender, phone, alternatePhone, address,
      joiningDate, bankName, bankAccount, bankCode, password, site,supervisorType, date, status 
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !site) {
      return res.status(400).json({ 
        success: false, 
        message: "Required fields: name, email, password, site" 
      });
    }

    // Validate site exists
    const siteExists = await Site.findById(site);
    if (!siteExists) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "User already registered with this email" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new User
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: "Supervisor"
    });
    await newUser.save();

    // Process uploaded files
    const photo = req.files?.photo ? `/uploads/${req.files.photo[0].filename}` : null;
    const supervisorIdProof = req.files?.supervisorIdProof 
      ? req.files.supervisorIdProof.map(file => `/uploads/${file.filename}`) 
      : [];

    // Parse address if it's a string
    let parsedAddress = address;
    try {
      if (typeof address === 'string') parsedAddress = JSON.parse(address);
    } catch (e) {
      console.log("Address parsing error:", e);
      return res.status(400).json({
        success: false,
        message: "Invalid address format. Please provide valid JSON for address"
      });
    }

    // Create and save new Supervisor record
    const newSupervisor = new Supervisor({
      userId: newUser._id,
      name,
      dateOfBirth,
      password: hashedPassword,
      gender,
      email,
      phone,
      alternatePhone,
      address: parsedAddress,
      role: "Supervisor",
      supervisorType,
      joiningDate,
      bankName,
      bankAccount,
      bankCode,
      supervisorIdProof,
      photo,
      site,
      date,     // ✅ Now included
  status    // ✅ Now included

    });

    await newSupervisor.save();

    // Populate site details in the response
    const populatedSupervisor = await Supervisor.findById(newSupervisor._id)
      .populate('site')
      .lean();

    res.status(201).json({
      success: true,
      message: "Supervisor created successfully",
      data: populatedSupervisor
    });

  } catch (error) {
    console.error("Error creating supervisor:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// GET - Get all supervisors with site details
export const getAllSupervisors = async (req, res) => {
  try {
    const { search = '', site } = req.query;

    const query = { role: "Supervisor" };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (site) {
      query.site = site;
    }

    const supervisors = await Supervisor.find(query)
      .populate({
        path: 'site',
      
      })
      .lean();

    res.status(200).json({ 
      success: true, 
      data: supervisors
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: error.message 
    });
  }
};

// GET - Get supervisor by ID with site details
export const getSupervisorById = async (req, res) => {
  const { id } = req.params;
  try {
    let supervisor;

    // First try as numeric ID
    if (!isNaN(id)) {
      supervisor = await Supervisor.findOne({ _id: Number(id), role: "Supervisor" })
        .populate({
          path: 'site'
        })
        .lean();
    }
    
    // If not found, try as userId
    if (!supervisor && !isNaN(id)) {
      supervisor = await Supervisor.findOne({ userId: Number(id), role: "Supervisor" })
        .populate({
          path: 'site',
        })
        .lean();
    }

    if (!supervisor) {
      return res.status(404).json({ 
        success: false, 
        message: "Supervisor not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: supervisor
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// PUT - Update supervisor by ID including site
export const updateSupervisorById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    let supervisor;
    
    // First try as numeric ID (supervisor _id)
    if (!isNaN(id)) {
      supervisor = await Supervisor.findOne({ _id: Number(id), role: "Supervisor" });
    }
    
    // If not found, try as userId
    if (!supervisor && !isNaN(id)) {
      supervisor = await Supervisor.findOne({ userId: Number(id), role: "Supervisor" });
    }

    if (!supervisor) {
      return res.status(404).json({ 
        success: false, 
        message: "Supervisor not found" 
      });
    }

    // Validate site if being updated
    if (updateData.site) {
      const siteExists = await Site.findById(updateData.site);
      if (!siteExists) {
        return res.status(404).json({
          success: false,
          message: "Site not found"
        });
      }
      supervisor.site = updateData.site;
    }

    // Update other fields
    const fieldsToUpdate = [
      'name', 'email', 'dateOfBirth', 'gender', 'phone', 'alternatePhone', 'address',
      'joiningDate', 'bankName', 'bankAccount', 'bankCode'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        supervisor[field] = updateData[field];
      }
    });

    // Update password if provided
    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      supervisor.password = hashedPassword;
      await User.findOneAndUpdate(
        { _id: supervisor.userId }, 
        { password: hashedPassword }
      );
    }

    // Update files if uploaded
    if (req.files?.photo) {
      if (supervisor.photo) {
        const oldPhotoPath = path.join(process.cwd(), 'public', supervisor.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      supervisor.photo = `/uploads/${req.files.photo[0].filename}`;
    }
    
    if (req.files?.supervisorIdProof) {
      const newIdProofs = req.files.supervisorIdProof.map(file => `/uploads/${file.filename}`);
      supervisor.supervisorIdProof = [...supervisor.supervisorIdProof, ...newIdProofs];
    }

    supervisor.updatedAt = new Date().toISOString();
    await supervisor.save();
    
    // Update the associated User record
    const userUpdate = {};
    if (updateData.name) userUpdate.name = updateData.name;
    if (updateData.email) userUpdate.email = updateData.email;
    
    if (Object.keys(userUpdate).length > 0) {
      await User.findOneAndUpdate(
        { _id: supervisor.userId }, 
        { $set: userUpdate }
      );
    }

    // Get updated supervisor with populated site
    const updatedSupervisor = await Supervisor.findById(supervisor._id)
      .populate({
        path: 'site',
      })
      .lean();

    res.status(200).json({ 
      success: true, 
      message: "Supervisor updated successfully", 
      data: updatedSupervisor 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// DELETE - Delete supervisor by ID
export const deleteSupervisorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let supervisor;
    
    // First try as numeric ID (supervisor _id)
    if (!isNaN(id)) {
      supervisor = await Supervisor.findOneAndDelete({ _id: Number(id), role: "Supervisor" });
    }
    
    // If not found, try as userId
    if (!supervisor && !isNaN(id)) {
      supervisor = await Supervisor.findOneAndDelete({ userId: Number(id), role: "Supervisor" });
    }

    if (!supervisor) {
      return res.status(404).json({ 
        success: false, 
        message: "Supervisor not found" 
      });
    }

    // Delete associated user
    await User.findOneAndDelete({ _id: supervisor.userId });

    // Delete associated files
    if (supervisor.photo) {
      const photoPath = path.join(process.cwd(), 'public', supervisor.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    if (supervisor.supervisorIdProof?.length > 0) {
      supervisor.supervisorIdProof.forEach(proof => {
        const proofPath = path.join(process.cwd(), 'public', proof);
        if (fs.existsSync(proofPath)) {
          fs.unlinkSync(proofPath);
        }
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Supervisor deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};



// for attendace



// Helper function to format date as DD/MM/YYYY
const formatCurrentDate = () => {
  const date = new Date();
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Initialize or reset attendance data
const initializeAttendanceData = async () => {
  try {
    const currentDate = formatCurrentDate();
    
    // Update all supervisors with missing date or outdated date
    await Supervisor.updateMany(
      {
        $or: [
          { 'currentAttendance.date': { $ne: currentDate } },
          { 'currentAttendance.date': { $exists: false } }
        ]
      },
      {
        $set: {
          'currentAttendance.date': currentDate,
          'currentAttendance.status': null
        }
      }
    );
    
    // console.log(`Attendance data initialized for date: ${currentDate}`);
  } catch (error) {
    console.error("Error initializing attendance data:", error);
  }
};

// Run initialization on server start
initializeAttendanceData();

// Schedule daily reset at midnight
cron.schedule('0 0 * * *', initializeAttendanceData);

// Get all supervisors with attendance data
export const getSupervisorAttendance = async (req, res) => {
  try {
    const currentDate = formatCurrentDate();
    
    // First ensure all records have today's date
    await Supervisor.updateMany(
      {
        $or: [
          { 'currentAttendance.date': { $ne: currentDate } },
          { 'currentAttendance.date': { $exists: false } }
        ]
      },
      {
        $set: {
          'currentAttendance.date': currentDate,
          'currentAttendance.status': null
        }
      }
    );

    // Then fetch all supervisors
    const data = await Supervisor.find()
      .select('_id name photo currentAttendance')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data,
      currentDate
    });

  } catch (error) {
    console.error("Error fetching supervisor attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Update attendance status for a supervisor
export const updateSupervisorAttendance = async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const { status } = req.body;
    const currentDate = formatCurrentDate();

    const updatedSupervisor = await Supervisor.findOneAndUpdate(
      { userId: supervisorId },
      { 
        $set: { 
          'currentAttendance.status': status,
          'currentAttendance.date': currentDate
        } 
      },
      { 
        new: true,
        select: '_id name photo currentAttendance' 
      }
    );

    if (!updatedSupervisor) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedSupervisor
    });

  } catch (error) {
    console.error("Error updating supervisor attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Bulk update attendance for all supervisors based on specific date
export const bulkUpdateAttendanceByDate = async (req, res) => {
  try {
    const { date, status } = req.body;

    // Validate status
    const validStatuses = ["Fullday", "Halfday", "Overtime", null];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    // Update all supervisors for the specified date
    const updateQuery = {
      $set: {
        'currentAttendance.date': date,
        'currentAttendance.status': status
      }
    };

    // Add to attendance records if status is provided
    if (status) {
      updateQuery.$push = {
        attendanceRecords: {
          date,
          status
        }
      };
    }

    const result = await Supervisor.updateMany({}, updateQuery);

    // Get updated records
    const updatedSupervisors = await Supervisor.find()
      .select('_id userId name currentAttendance')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: `Bulk attendance updated for date: ${date}`,
      updatedCount: result.modifiedCount,
      data: updatedSupervisors
    });

  } catch (error) {
    console.error("Error in bulk attendance update by date:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Get attendance details for a specific date
export const getAttendanceByDate = async (req, res) => {
  try {
    
    const date = `${req.params.day}/${req.params.month}/${req.params.year}`;

    // Validate date format (DD/MM/YYYY)
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use DD/MM/YYYY"
      });
    }

    // Find all supervisors who have attendance records for the specified date
    const supervisors = await Supervisor.aggregate([
      {
        $match: {
          $or: [
            { 'currentAttendance.date': date },
            { 'attendanceRecords.date': date }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          currentStatus: {
            $cond: {
              if: { $eq: ['$currentAttendance.date', date] },
              then: '$currentAttendance.status',
              else: null
            }
          },
          historicalStatus: {
            $let: {
              vars: {
                filteredRecords: {
                  $filter: {
                    input: '$attendanceRecords',
                    as: 'record',
                    cond: { $eq: ['$$record.date', date] }
                  }
                }
              },
              in: { $arrayElemAt: ['$$filteredRecords.status', 0] }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          status: {
            $cond: {
              if: { $ne: ['$currentStatus', null] },
              then: '$currentStatus',
              else: '$historicalStatus'
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: supervisors,
      date
    });

  } catch (error) {
    console.error("Error fetching attendance by date:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};



// 2. Apply attendance for all supervisors with specified status (PUT)
export const bulkUpdateAttendanceByStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const currentDate = formatCurrentDate();

    // Validate status
    const validStatuses = ["Fullday", "Halfday", "Overtime", null];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    // Update all supervisors with current date
    const result = await Supervisor.updateMany(
      {},
      {
        $set: {
          date: currentDate,
          status
        }
      }
    );

    // Get updated records
    const updatedSupervisors = await Supervisor.find()
      .select('_id userId name date status')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: `Bulk attendance updated with status: ${status}`,
      updatedCount: result.modifiedCount,
      currentDate,
      data: updatedSupervisors
    });

  } catch (error) {
    console.error("Error in bulk attendance update by status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};


// pdf and Excel sheet to download:


// Helper function to format date as DD/MM/YYYY
// const formatCurrentDate = () => {
//   const date = new Date();
//   const day = date.getDate().toString().padStart(2, '0');
//   const month = (date.getMonth() + 1).toString().padStart(2, '0');
//   const year = date.getFullYear();
//   return `${day}/${month}/${year}`;
// };

// Helper function to get week range
const getWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // Adjust so Monday is 1, Sunday is 7
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + (7 - dayOfWeek));
  
  const format = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  return {
    start: format(monday),
    end: format(sunday),
    current: format(now)
  };
};

// Generate Daily Report
export const getDailyReport = async (req, res) => {
  try {
    const { DD, MM, YYYY } = req.params;
    const date = `${DD}/${MM}/${YYYY}`;
    const format = req.query.format || 'json'; // Default to JSON, options: json, excel, pdf

    // Validate date format
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use DD/MM/YYYY"
      });
    }

    // Get attendance data for the specified date
    const supervisors = await Supervisor.aggregate([
      {
        $match: {
          $or: [
            { 'currentAttendance.date': date },
            { 'attendanceRecords.date': date }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          currentStatus: {
            $cond: {
              if: { $eq: ['$currentAttendance.date', date] },
              then: '$currentAttendance.status',
              else: null
            }
          },
          historicalStatus: {
            $let: {
              vars: {
                filteredRecords: {
                  $filter: {
                    input: '$attendanceRecords',
                    as: 'record',
                    cond: { $eq: ['$$record.date', date] }
                  }
                }
              },
              in: { $arrayElemAt: ['$$filteredRecords.status', 0] }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          status: {
            $cond: {
              if: { $ne: ['$currentStatus', null] },
              then: '$currentStatus',
              else: '$historicalStatus'
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: supervisors,
        date,
        reportType: 'daily'
      });
    } else if (format === 'excel') {
      // Create Excel workbook
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Daily Attendance Report');
      
      // Add headers
      worksheet.columns = [
        { header: 'ID', key: 'userId', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      
      // Add data
      supervisors.forEach(supervisor => {
        worksheet.addRow({
          userId: supervisor.userId,
          name: supervisor.name,
          status: supervisor.status || 'Not Recorded'
        });
      });
      
      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=daily_report_${DD}_${MM}_${YYYY}.xlsx`
      );
      
      // Send the workbook
      return workbook.xlsx.write(res).then(() => {
        res.end();
      });
    } else if (format === 'pdf') {
      // Create PDF document
      const doc = new pdfkit();
      const filename = `daily_report_${DD}_${MM}_${YYYY}.pdf`;
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Pipe PDF to response
      doc.pipe(res);
      
      // Add content
      doc.fontSize(18).text(`Daily Attendance Report - ${date}`, { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12);
      supervisors.forEach((supervisor, index) => {
        doc.text(`${index + 1}. ${supervisor.name} - ${supervisor.status || 'Not Recorded'}`);
        doc.moveDown(0.5);
      });
      
      // Finalize PDF
      doc.end();
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid format parameter. Use json, excel, or pdf"
      });
    }
  } catch (error) {
    console.error("Error generating daily report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// // Generate Weekly Report


// Helper function to get week range within a month
const getWeekRangeInMonth = (year, month, weekNumber) => {
  // Create date for the first day of the month
  const firstDay = new Date(year, month - 1, 1);
  
  // Calculate the first Monday of the month
  let firstMonday = new Date(firstDay);
  firstMonday.setDate(1 + ((8 - firstDay.getDay()) % 7));
  
  // Adjust for weeks starting on Sunday (if needed)
  // For Monday-starting weeks (ISO standard), use the above
  // For Sunday-starting weeks, use:
  // let firstSunday = new Date(firstDay);
  // firstSunday.setDate(1 - firstDay.getDay());
  
  // Calculate start and end dates for the requested week
  const startDate = new Date(firstMonday);
  startDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  // Format dates as DD/MM/YYYY
  const format = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  return {
    start: format(startDate),
    end: format(endDate),
    month: month.toString().padStart(2, '0'),
    year: year.toString(),
    weekNumber
  };
};

// Generate Weekly Report within a specific month
export const getWeeklyReport = async (req, res) => {
  try {
    const { MM, YYYY, week } = req.params;
    const format = req.query.format || 'json'; // Default to JSON, options: json, excel, pdf
    
    // Validate week number (01-04)
    const weekNumber = parseInt(week);
    if (weekNumber < 1 || weekNumber > 4) {
      return res.status(400).json({
        success: false,
        message: "Invalid week number. Please use 01-04 for weeks in the month"
      });
    }
    
    // Validate month/year format
    const monthYear = `${MM}/${YYYY}`;
    if (!/^\d{2}\/\d{4}$/.test(monthYear)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month/year format. Please use MM/YYYY"
      });
    }
    
    // Get week range for the specified week in the month
    const weekRange = getWeekRangeInMonth(parseInt(YYYY), parseInt(MM), weekNumber);
    
    // Get attendance data for the week
    const supervisors = await Supervisor.aggregate([
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          currentAttendance: 1,
          weeklyRecords: {
            $filter: {
              input: '$attendanceRecords',
              as: 'record',
              cond: {
                $and: [
                  { $gte: ['$$record.date', weekRange.start] },
                  { $lte: ['$$record.date', weekRange.end] }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          daysPresent: {
            $size: {
              $filter: {
                input: '$weeklyRecords',
                as: 'record',
                cond: { $ne: ['$$record.status', null] }
              }
            }
          },
          totalDays: {
            $size: '$weeklyRecords'
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: supervisors,
        weekRange,
        reportType: 'weekly',
        weekInfo: {
          month: weekRange.month,
          year: weekRange.year,
          weekNumber: weekRange.weekNumber
        }
      });
    } else if (format === 'excel') {
      // Create Excel workbook
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Weekly Attendance Report');
      
      // Add headers
      worksheet.columns = [
        { header: 'ID', key: 'userId', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Days Present', key: 'daysPresent', width: 15 },
        { header: 'Total Days', key: 'totalDays', width: 15 },
        { header: 'Attendance Rate', key: 'attendanceRate', width: 20 }
      ];
      
      // Add data
      supervisors.forEach(supervisor => {
        const attendanceRate = supervisor.totalDays > 0 
          ? (supervisor.daysPresent / supervisor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        worksheet.addRow({
          userId: supervisor.userId,
          name: supervisor.name,
          daysPresent: supervisor.daysPresent,
          totalDays: supervisor.totalDays,
          attendanceRate
        });
      });
      
      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=weekly_report_${weekRange.month}_${weekRange.year}_week${weekRange.weekNumber}.xlsx`
      );
      
      // Send the workbook
      return workbook.xlsx.write(res).then(() => {
        res.end();
      });
    } else if (format === 'pdf') {
      // Create PDF document
      const doc = new pdfkit();
      const filename = `weekly_report_${weekRange.month}_${weekRange.year}_week${weekRange.weekNumber}.pdf`;
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Pipe PDF to response
      doc.pipe(res);
      
      // Add content
      doc.fontSize(18).text(
        `Weekly Attendance Report - ${weekRange.month}/${weekRange.year} (Week ${weekRange.weekNumber})`, 
        { align: 'center' }
      );
      doc.fontSize(14).text(
        `Date Range: ${weekRange.start} to ${weekRange.end}`,
        { align: 'center' }
      );
      doc.moveDown();
      
      doc.fontSize(12);
      supervisors.forEach((supervisor, index) => {
        const attendanceRate = supervisor.totalDays > 0 
          ? (supervisor.daysPresent / supervisor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        doc.text(`${index + 1}. ${supervisor.name}`);
        doc.text(`   Days Present: ${supervisor.daysPresent} of ${supervisor.totalDays} (${attendanceRate})`);
        doc.moveDown(0.5);
      });
      
      // Finalize PDF
      doc.end();
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid format parameter. Use json, excel, or pdf"
      });
    }
  } catch (error) {
    console.error("Error generating weekly report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Generate Monthly Report
export const getMonthlyReport = async (req, res) => {
  try {
    const { MM, YYYY } = req.params;
    const format = req.query.format || 'json'; // Default to JSON, options: json, excel, pdf
    const monthYear = `${MM}/${YYYY}`;

    // Validate month/year format
    if (!/^\d{2}\/\d{4}$/.test(monthYear)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month/year format. Please use MM/YYYY"
      });
    }

    // Get attendance data for the month
    const supervisors = await Supervisor.aggregate([
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          currentAttendance: 1,
          monthlyRecords: {
            $filter: {
              input: '$attendanceRecords',
              as: 'record',
              cond: {
                $eq: [
                  { $substr: ['$$record.date', 3, 7] }, // Extract MM/YYYY from DD/MM/YYYY
                  monthYear
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          daysPresent: {
            $size: {
              $filter: {
                input: '$monthlyRecords',
                as: 'record',
                cond: { $ne: ['$$record.status', null] }
              }
            }
          },
          totalDays: {
            $size: '$monthlyRecords'
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: supervisors,
        monthYear,
        reportType: 'monthly'
      });
    } else if (format === 'excel') {
      // Create Excel workbook
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Monthly Attendance Report');
      
      // Add headers
      worksheet.columns = [
        { header: 'ID', key: 'userId', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Days Present', key: 'daysPresent', width: 15 },
        { header: 'Total Days', key: 'totalDays', width: 15 },
        { header: 'Attendance Rate', key: 'attendanceRate', width: 20 }
      ];
      
      // Add data
      supervisors.forEach(supervisor => {
        const attendanceRate = supervisor.totalDays > 0 
          ? (supervisor.daysPresent / supervisor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        worksheet.addRow({
          userId: supervisor.userId,
          name: supervisor.name,
          daysPresent: supervisor.daysPresent,
          totalDays: supervisor.totalDays,
          attendanceRate
        });
      });
      
      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=monthly_report_${MM}_${YYYY}.xlsx`
      );
      
      // Send the workbook
      return workbook.xlsx.write(res).then(() => {
        res.end();
      });
    } else if (format === 'pdf') {
      // Create PDF document
      const doc = new pdfkit();
      const filename = `monthly_report_${MM}_${YYYY}.pdf`;
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Pipe PDF to response
      doc.pipe(res);
      
      // Add content
      doc.fontSize(18).text(`Monthly Attendance Report - ${MM}/${YYYY}`, { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12);
      supervisors.forEach((supervisor, index) => {
        const attendanceRate = supervisor.totalDays > 0 
          ? (supervisor.daysPresent / supervisor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        doc.text(`${index + 1}. ${supervisor.name}`);
        doc.text(`   Days Present: ${supervisor.daysPresent} of ${supervisor.totalDays} (${attendanceRate})`);
        doc.moveDown(0.5);
      });
      
      // Finalize PDF
      doc.end();
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid format parameter. Use json, excel, or pdf"
      });
    }
  } catch (error) {
    console.error("Error generating monthly report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

