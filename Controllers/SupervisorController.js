// controllers/supervisorController.js
import Supervisor from "../models/Supervisor.js";
import User from "../models/User.js";
import Site from "../models/SiteDetails.js";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import cron from 'node-cron';


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

// export const getSupervisorAttendance = async (req, res) => {
//   try {
//     const data = await Supervisor.find();

//     return res.status(200).json({
//       success: true,
//       data
//     });

//   } catch (error) {
//     console.error("Error fetching supervisor attendance:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message
//     });
//   }
// };


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
          { date: { $ne: currentDate } },
          { date: { $exists: false } }
        ]
      },
      {
        $set: {
          date: currentDate,
          status: null
        }
      }
    );
    
    console.log(`Attendance data initialized for date: ${currentDate}`);
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
          { date: { $ne: currentDate } },
          { date: { $exists: false } }
        ]
      },
      {
        $set: {
          date: currentDate,
          status: null
        }
      }
    );

    // Then fetch all supervisors
    const data = await Supervisor.find()
      .select('_id name photo date status')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data,
      currentDate // Optional: include current date in response
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


// update the status 

// Update attendance status for a supervisor
export const updateSupervisorAttendance = async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const { status } = req.body;
    const currentDate = formatCurrentDate();

    const updatedSupervisor = await Supervisor.findOneAndUpdate(
      { userId:supervisorId },
      { 
        $set: { 
          status,
          date: currentDate 
        } 
      },
      { 
        new: true,
        select: '_id name photo date status' 
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


// 1. Apply attendance for all supervisors based on specific date (PUT)
export const bulkUpdateAttendanceByDate = async (req, res) => {
  try {
    const { date, status } = req.body;

    // Validate input
    if (!date || !status) {
      return res.status(400).json({
        success: false,
        message: "Date and status are required"
      });
    }

    // Validate status
    const validStatuses = ["Fullday", "Halfday", "Overtime", null];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    // Update all supervisors for the specified date
    const result = await Supervisor.updateMany(
      {},
      {
        $set: {
          date,
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

// // Function to reset attendance for all supervisors
// const resetSupervisorAttendance = async () => {
//   try {
//     const today = new Date();
//     const day = today.getDate().toString().padStart(2, '0');
//     const month = (today.getMonth() + 1).toString().padStart(2, '0');
//     const year = today.getFullYear();
//     const currentDate = `${day}/${month}/${year}`;

//     await Supervisor.updateMany(
//       {}, 
//       { 
//         $set: { 
//           date: currentDate,
//           status: null 
//         } 
//       }
//     );
    
//     console.log(`Supervisor attendance reset for date: ${currentDate}`);
//   } catch (error) {
//     console.error("Error resetting supervisor attendance:", error);
//   }
// };

// // Schedule the cron job to run daily at midnight
// cron.schedule('0 0 * * *', () => {
//   console.log('Running daily attendance reset for supervisors...');
//   resetSupervisorAttendance();
// });

// // Get supervisor attendance
// export const getSupervisorAttendance = async (req, res) => {
//   try {
//     const data = await Supervisor.find().select('_id name photo date status');

//     return res.status(200).json({
//       success: true,
//       data
//     });

//   } catch (error) {
//     console.error("Error fetching supervisor attendance:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message
//     });
//   }
// };