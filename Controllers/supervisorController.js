
// controllers/supervisorController.js
import Supervisor from "../models/Supervisor.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

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

// Configure multer for file uploads
export const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
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

// POST - Create a new supervisor
export const createSupervisor = async (req, res) => {
  try {
    const {
      name, email, dateOfBirth, gender, phone, alternatePhone, address,
      role, supervisorType, joiningDate, bankName, bankAccount,
      bankCode, password
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Required fields: name, email, password" 
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
      role: "Supervisor" // Force role to Supervisor
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
      userId: newUser._id, // Use the same ID as the User
      name,
      dateOfBirth,
      password: hashedPassword,
      gender,
      email,
      phone,
      alternatePhone,
      address: parsedAddress,
      role: "Supervisor", // Ensure role is Supervisor
      supervisorType,
      joiningDate,
      bankName,
      bankAccount,
      bankCode,
      supervisorIdProof,
      photo
    });

    await newSupervisor.save();
    return res.status(201).json({ 
      success: true, 
      message: "Supervisor created successfully", 
      data: {
        user: newUser,
        supervisor: newSupervisor
      }
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









// import Supervisor from "../models/Supervisor.js";
// import User from "../models/User.js";
// import bcrypt from "bcrypt";
// import multer from "multer";
// import path from "path";
// import fs from "fs";

// // Ensure upload directory exists
// const uploadDir = path.join(process.cwd(), "public", "uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Multer storage configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// // Configure multer for file uploads
// export const upload = multer({ 
//   storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit per file
//   },
//   fileFilter: (req, file, cb) => {
//     const filetypes = /jpeg|jpg|png|pdf/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);
    
//     if (extname && mimetype) {
//       return cb(null, true);
//     } else {
//       cb(new Error('Only images (JPEG, JPG, PNG) and PDF files are allowed'));
//     }
//   }
// }).fields([
//   { name: "photo", maxCount: 1 },
//   { name: "supervisorIdProof", maxCount: 5 },
// ]);

// // POST - Create a new supervisor
// export const createSupervisor = async (req, res) => {
//   try {
//     const {
//       name, email, dateOfBirth, gender, phone, alternatePhone, address,
//       role, supervisorType, joiningDate, bankName, bankAccount,
//       bankCode, password
//     } = req.body;

//     // Validate required fields
//     if (!name || !email || !password) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Required fields: name, email, password" 
//       });
//     }

//     // Check if email already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "User already registered with this email" 
//       });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create and save new User
//     const newUser = new User({ 
//       name, 
//       email, 
//       password: hashedPassword, 
//       role: "Supervisor" // Force role to Supervisor
//     });
//     await newUser.save();

//     // Process uploaded files
//     const photo = req.files?.photo ? `/uploads/${req.files.photo[0].filename}` : null;
//     const supervisorIdProof = req.files?.supervisorIdProof 
//       ? req.files.supervisorIdProof.map(file => `/uploads/${file.filename}`) 
//       : [];

//     // Parse address if it's a string
//     let parsedAddress = address;
//     try {
//       if (typeof address === 'string') parsedAddress = JSON.parse(address);
//     } catch (e) {
//       console.log("Address parsing error:", e);
//       return res.status(400).json({
//         success: false,
//         message: "Invalid address format. Please provide valid JSON for address"
//       });
//     }

//     // Create and save new Supervisor record
//     const newSupervisor = new Supervisor({
//       // userId: newUser._id,
//       userId: newUser._id, 
//       name,
//       dateOfBirth,
//       password: hashedPassword,
//       gender,
//       email,
//       phone,
//       alternatePhone,
//       address: parsedAddress,
//       role,
//       supervisorType,
//       joiningDate,
//       bankName,
//       bankAccount,
//       bankCode,
//       supervisorIdProof,
//       photo
//     });

//     await newSupervisor.save();
//     return res.status(201).json({ 
//       success: true, 
//       message: "Supervisor created successfully", 
//       data: newSupervisor 
//     });
//   } catch (error) {
//     console.error("Error creating supervisor:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

// GET - Get all supervisors
// export const getAllSupervisors = async (req, res) => {
//   try {
//     const { search = '', supervisorType } = req.query;
//     // const skip = (page - 1) * limit;

//     const query = {};
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { email: { $regex: search, $options: 'i' } },
//         { phone: { $regex: search, $options: 'i' } }
//       ];
//     }
    
//     if (supervisorType) {
//       query.supervisorType = supervisorType;
//     }

//     const supervisors = await Supervisor.find(query)
//       .populate("userId", "-password")
//       // .skip(skip)
//       // .limit(parseInt(limit))
//       .lean();

//     const total = await Supervisor.countDocuments(query);

//     return res.status(200).json({ 
//       success: true, 
//       data: supervisors,
//       // pagination: {
//       //   total,
//       //   page: parseInt(page),
//       //   limit: parseInt(limit),
//       //   totalPages: Math.ceil(total / limit)
//       // }
//     });
//   } catch (error) {
//     return res.status(500).json({ 
//       success: false, 
//       message: "Internal Server Error", 
//       error: error.message 
//     });
//   }
// };


export const getAllSupervisors = async (req, res) => {
  try {
    const { search = '', supervisorType } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (supervisorType) {
      query.supervisorType = supervisorType;
    }

    // Get supervisors without populate
    const supervisors = await Supervisor.find(query).lean();
    
    // Get associated users manually
    const userIds = supervisors.map(s => s.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('-password')
      .lean();
    
    // Create a user map for easy lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = user;
    });

    // Combine data
    const supervisorsWithUsers = supervisors.map(supervisor => ({
      ...supervisor,
      user: userMap[supervisor.userId] || null
    }));

    return res.status(200).json({ 
      success: true, 
      data: supervisorsWithUsers
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
};
// GET - Get supervisor by ID
// export const getSupervisorById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     let supervisor;

//     // Try as mongoose ObjectId first
//     if (/^[0-9a-fA-F]{24}$/.test(id)) {
//       supervisor = await Supervisor.findById(id)
//         .populate("userId", "-password")
//         .lean();
//     }

//     // If not found, try as userId
//     if (!supervisor) {
//       supervisor = await Supervisor.findOne({ userId: id })
//         .populate("userId", "-password")
//         .lean();
//     }

//     if (!supervisor) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Supervisor not found" 
//       });
//     }

//     return res.status(200).json({ 
//       success: true, 
//       data: supervisor 
//     });
//   } catch (error) {
//     return res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

export const getSupervisorById = async (req, res) => {
  const { id } = req.params;
  try {
    let supervisor;

    // First try as numeric ID
    if (!isNaN(id)) {
      supervisor = await Supervisor.findOne({ _id: Number(id) }).lean();
    }
    
    // If not found, try as userId
    if (!supervisor && !isNaN(id)) {
      supervisor = await Supervisor.findOne({ userId: Number(id) }).lean();
    }

    if (!supervisor) {
      return res.status(404).json({ 
        success: false, 
        message: "Supervisor not found" 
      });
    }

    // Get user data separately
    const user = await User.findOne({ _id: supervisor.userId })
      .select('-password')
      .lean();

    return res.status(200).json({ 
      success: true, 
      data: {
        ...supervisor,
        user: user || null
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};
// PUT - Update supervisor by ID

// PUT - Update supervisor by ID
export const updateSupervisorById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    let supervisor;
    
    // First try as numeric ID (supervisor _id)
    if (!isNaN(id)) {
      supervisor = await Supervisor.findOne({ _id: Number(id) });
    }
    
    // If not found, try as userId
    if (!supervisor && !isNaN(id)) {
      supervisor = await Supervisor.findOne({ userId: Number(id) });
    }

    if (!supervisor) {
      return res.status(404).json({ 
        success: false, 
        message: "Supervisor not found" 
      });
    }

    // Update basic fields
    const fieldsToUpdate = [
      'name', 'email', 'dateOfBirth', 'gender', 'phone', 'alternatePhone', 'address',
      'role', 'supervisorType', 'joiningDate', 'bankName', 'bankAccount', 'bankCode'
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
      
      // Also update user password
      await User.findOneAndUpdate(
        { _id: supervisor.userId }, 
        { password: hashedPassword }
      );
    }

    // Update address
    if (updateData.address) {
      try {
        supervisor.address = typeof updateData.address === 'string' 
          ? JSON.parse(updateData.address) 
          : updateData.address;
      } catch (e) {
        console.log("Address parsing error:", e);
        return res.status(400).json({
          success: false,
          message: "Invalid address format. Please provide valid JSON"
        });
      }
    }

    // Update files if uploaded
    if (req.files?.photo) {
      // Delete old photo if exists
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
    
    // Also update the associated User record
    const userUpdate = {};
    if (updateData.name) userUpdate.name = updateData.name;
    if (updateData.email) userUpdate.email = updateData.email;
    
    if (Object.keys(userUpdate).length > 0) {
      await User.findOneAndUpdate(
        { _id: supervisor.userId }, 
        { $set: userUpdate }
      );
    }

    return res.status(200).json({ 
      success: true, 
      message: "Supervisor updated successfully", 
      data: supervisor 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// export const updateSupervisorById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     let supervisor;
    
//     // Try as mongoose ObjectId first
//     if (/^[0-9a-fA-F]{24}$/.test(id)) {
//       supervisor = await Supervisor.findById(id);
//     }
    
//     // If not found, try as userId
//     if (!supervisor) {
//       supervisor = await Supervisor.findOne({ userId: id });
//     }

//     if (!supervisor) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Supervisor not found" 
//       });
//     }

//     // Update basic fields
//     const fieldsToUpdate = [
//       'name', 'email', 'dateOfBirth', 'gender', 'phone', 'alternatePhone', 'address',
//       'role', 'supervisorType', 'joiningDate', 'bankName', 'bankAccount', 'bankCode'
//     ];
    
//     fieldsToUpdate.forEach(field => {
//       if (updateData[field] !== undefined) {
//         supervisor[field] = updateData[field];
//       }
//     });

//     // Update password if provided
//     if (updateData.password) {
//       const hashedPassword = await bcrypt.hash(updateData.password, 10);
//       supervisor.password = hashedPassword;
      
//       // Also update user password
//       await User.findByIdAndUpdate(supervisor.userId, {
//         password: hashedPassword
//       });
//     }

//     // Update address
//     if (updateData.address) {
//       try {
//         supervisor.address = typeof updateData.address === 'string' 
//           ? JSON.parse(updateData.address) 
//           : updateData.address;
//       } catch (e) {
//         console.log("Address parsing error:", e);
//         return res.status(400).json({
//           success: false,
//           message: "Invalid address format. Please provide valid JSON"
//         });
//       }
//     }

//     // Update files if uploaded
//     if (req.files?.photo) {
//       // Delete old photo if exists
//       if (supervisor.photo) {
//         const oldPhotoPath = path.join(process.cwd(), 'public', supervisor.photo);
//         if (fs.existsSync(oldPhotoPath)) {
//           fs.unlinkSync(oldPhotoPath);
//         }
//       }
//       supervisor.photo = `/uploads/${req.files.photo[0].filename}`;
//     }
    
//     if (req.files?.supervisorIdProof) {
//       // Delete old ID proofs if needed
//       // (Add logic here if you want to delete old proofs when adding new ones)
      
//       const newIdProofs = req.files.supervisorIdProof.map(file => `/uploads/${file.filename}`);
//       supervisor.supervisorIdProof = [...supervisor.supervisorIdProof, ...newIdProofs];
//     }

//     supervisor.updatedAt = new Date();
//     await supervisor.save();
    
//     // Also update the associated User record
//     const userUpdate = {};
//     if (updateData.name) userUpdate.name = updateData.name;
//     if (updateData.email) userUpdate.email = updateData.email;
    
//     if (Object.keys(userUpdate).length > 0) {
//       await User.findByIdAndUpdate(supervisor.userId, { $set: userUpdate });
//     }

//     return res.status(200).json({ 
//       success: true, 
//       message: "Supervisor updated successfully", 
//       data: supervisor 
//     });
//   } catch (error) {
//     return res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

// DELETE - Delete supervisor by ID
// export const deleteSupervisorById = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     let supervisor;
    
//     // Try as mongoose ObjectId first
//     if (/^[0-9a-fA-F]{24}$/.test(id)) {
//       supervisor = await Supervisor.findByIdAndDelete(id);
//     }
    
//     // If not found, try as userId
//     if (!supervisor) {
//       supervisor = await Supervisor.findOneAndDelete({ userId: id });
//     }

//     if (!supervisor) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Supervisor not found" 
//       });
//     }

//     // Delete associated user
//     await User.findByIdAndDelete(supervisor.userId);

//     // Delete associated files
//     if (supervisor.photo) {
//       const photoPath = path.join(process.cwd(), 'public', supervisor.photo);
//       if (fs.existsSync(photoPath)) {
//         fs.unlinkSync(photoPath);
//       }
//     }

//     if (supervisor.supervisorIdProof && supervisor.supervisorIdProof.length > 0) {
//       supervisor.supervisorIdProof.forEach(proof => {
//         const proofPath = path.join(process.cwd(), 'public', proof);
//         if (fs.existsSync(proofPath)) {
//           fs.unlinkSync(proofPath);
//         }
//       });
//     }

//     return res.status(200).json({ 
//       success: true, 
//       message: "Supervisor deleted successfully" 
//     });
//   } catch (error) {
//     return res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

// DELETE - Delete supervisor by ID
export const deleteSupervisorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let supervisor;
    
    // First try as numeric ID (supervisor _id)
    if (!isNaN(id)) {
      supervisor = await Supervisor.findOneAndDelete({ _id: Number(id) });
    }
    
    // If not found, try as userId
    if (!supervisor && !isNaN(id)) {
      supervisor = await Supervisor.findOneAndDelete({ userId: Number(id) });
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

    return res.status(200).json({ 
      success: true, 
      message: "Supervisor deleted successfully" 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// DELETE - Delete all supervisors (use with caution)
export const deleteAllSupervisors = async (req, res) => {
  try {
    // First get all supervisors to delete their files and associated users
    const supervisors = await Supervisor.find({});
    
    // Delete all associated users and files
    for (const supervisor of supervisors) {
      // Delete user
      await User.findByIdAndDelete(supervisor.userId);
      
      // Delete photo
      if (supervisor.photo) {
        const photoPath = path.join(process.cwd(), 'public', supervisor.photo);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }
      
      // Delete ID proofs
      if (supervisor.supervisorIdProof && supervisor.supervisorIdProof.length > 0) {
        supervisor.supervisorIdProof.forEach(proof => {
          const proofPath = path.join(process.cwd(), 'public', proof);
          if (fs.existsSync(proofPath)) {
            fs.unlinkSync(proofPath);
          }
        });
      }
    }
    
    // Now delete all supervisors
    await Supervisor.deleteMany({});
    
    return res.status(200).json({ 
      success: true, 
      message: `All ${supervisors.length} supervisors and their associated data deleted successfully` 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};


