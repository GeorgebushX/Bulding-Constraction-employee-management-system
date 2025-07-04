
// import Worker from "../models/Workers.js";
// import Contractor from "../models/Contractor.js";
// import User from "../models/User.js";
// import bcrypt from "bcrypt";
// import multer from "multer";
// import path from "path";
// import fs from "fs";

// // Configure upload directory
// const uploadDir = path.join(process.cwd(), "public", "uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Multer configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
// });

// export const upload = multer({ storage }).fields([
//   { name: "photo", maxCount: 1 },
//   { name: "workerIdProof", maxCount: 5 },
// ]);

// // Helper function to get worker types for a contractor
// export const getWorkerTypesByContractor = async (contractorId) => {
//   const contractor = await Contractor.findById(contractorId)
//     .select('contractorRole roleDetails')
//     .lean();

//   if (!contractor) {
//     throw new Error('Contractor not found');
//   }

//   const roleFieldMap = {
//     'Centering Contractor': 'centering',
//     'Steel Contractor': 'steel',
//     'Mason Contractor': 'mason',
//     'Carpenter Contractor': 'carpenter',
//     'Plumber Contractor': 'plumber',
//     'Electrician Contractor': 'electrician',
//     'Painter Contractor': 'painter',
//     'Tiles Contractor': 'tiles'
//   };

//   const roleField = roleFieldMap[contractor.contractorRole];
//   if (!roleField) {
//     throw new Error('Invalid contractor role');
//   }

//   return contractor.roleDetails[roleField]?.workerType?.enum || [];
// };

// // ✅ Create Worker
// export const addWorker = async (req, res) => {
//   try {
//     const { name, email, phone, password, contractor, workerType, ...rest } = req.body;

//     // Validate required fields
//     if (!name || !email || !phone || !password || !contractor || !workerType) {
//       return res.status(400).json({ 
//           success: false, 
//         message: "Missing required fields" 
//       });
//     }

//     // Check if email exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Email already registered" 
//       });
//     }

//     // Validate worker type
//     const validWorkerTypes = await getWorkerTypesByContractor(contractor);
//     if (!validWorkerTypes.includes(workerType)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: `Invalid workerType. Valid types: ${validWorkerTypes.join(', ')}` 
//       });
//     }

//     // Create User
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = new User({ 
//       name, 
//       email, 
//       password: hashedPassword, 
//       role: "Worker" 
//     });
//     await newUser.save();

//     // Process files
//     const photo = req.files?.photo?.[0]?.filename ? `/uploads/${req.files.photo[0].filename}` : null;
//     const workerIdProof = req.files?.workerIdProof?.map(file => `/uploads/${file.filename}`) || [];

//     // Create Worker
//     const newWorker = new Worker({
//       userId: newUser._id,
//       name,
//       email,
//       phone,
//       contractor,
//       workerType,
//       password: hashedPassword,
//       photo,
//       workerIdProof,
//       ...rest,
//       address: typeof rest.address === 'string' ? JSON.parse(rest.address) : rest.address,
//       bankDetails: typeof rest.bankDetails === 'string' ? JSON.parse(rest.bankDetails) : rest.bankDetails
//     });

//     await newWorker.save();

//     return res.status(201).json({ 
//       success: true, 
//       message: "Worker created successfully",
//       data: await Worker.findById(newWorker._id)
//         .populate('contractor', 'name contractorRole workerTypes')
//         .populate('userId', '-password')
//     });
//   } catch (error) {
//     console.error("Error creating worker:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: error.message || "Server error"
//     });
//   }
// };

// // ✅ Get Worker Types for Contractor
// export const getWorkerTypes = async (req, res) => {
//   try {
//     const { contractorId } = req.params;
    
//     if (!contractorId) {
//       return res.status(400).json({
//         success: false,
//         message: "Contractor ID is required"
//       });
//     }

//     const workerTypes = await getWorkerTypesByContractor(contractorId);
    
//     return res.status(200).json({
//       success: true,
//       data: workerTypes
//     });
//   } catch (error) {
//     console.error("Error fetching worker types:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Server error"
//     });
//   }
// };

// // ✅ Get All Workers
// export const getWorkers = async (req, res) => {
//   try {
//     const { contractor } = req.query;
//     const filter = contractor ? { contractor } : {};

//     const workers = await Worker.find(filter)
//       .populate({
//         path: 'contractor',
//         select: 'name contractorRole workerTypes'
//       })
//       .populate('userId', '-password');

//     return res.status(200).json({ 
//       success: true, 
//       data: workers 
//     });
//   } catch (error) {
//     console.error("Error fetching workers:", error);
//     return res.status(500).json({ 
//       success: false, 
//       message: "Server error" 
//     });
//   }
// };

// // ✅ Get Worker by ID
// export const getWorkerById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     let worker;

//     if (!isNaN(id)) {
//       worker = await Worker.findOne({ $or: [{ _id: id }, { userId: id }] })
//         .populate({
//           path: 'contractor',
//           select: 'name contractorRole workerTypes'
//         })
//         .populate('userId', '-password');
//     } else {
//       worker = await Worker.findById(id)
//         .populate({
//           path: 'contractor',
//           select: 'name contractorRole workerTypes'
//         })
//         .populate('userId', '-password');
//     }

//     if (!worker) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Worker not found" 
//       });
//     }

//     return res.status(200).json({ 
//       success: true, 
//       data: worker 
//     });
//   } catch (error) {
//     console.error("Error fetching worker:", error);
//     return res.status(500).json({ 
//       success: false, 
//       message: "Server error" 
//     });
//   }
// };

// // ✅ Update Worker
// export const updateWorker = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;
//     let worker;

//     // Find worker by ID or userId
//     if (!isNaN(id)) {
//       worker = await Worker.findOne({ $or: [{ _id: id }, { userId: id }] });
//     } else {
//       worker = await Worker.findById(id);
//     }

//     if (!worker) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Worker not found" 
//       });
//     }

//     // Validate workerType if being updated
//     if (updateData.workerType || updateData.contractor) {
//       const contractorId = updateData.contractor || worker.contractor;
//       const workerType = updateData.workerType || worker.workerType;

//       const validWorkerTypes = await getWorkerTypesByContractor(contractorId);
//       if (!validWorkerTypes.includes(workerType)) {
//         return res.status(400).json({ 
//           success: false, 
//           message: `Invalid workerType. Valid types: ${validWorkerTypes.join(', ')}` 
//         });
//       }
//     }

//     // Update fields
//     const updatableFields = ['name', 'email', 'phone', 'gender', 'alternatePhone', 'workerType', 'joiningDate', 'contractor', 'status'];
//     updatableFields.forEach(field => {
//       if (updateData[field] !== undefined) {
//         worker[field] = updateData[field];
//       }
//     });

//     // Update nested objects
//     if (updateData.address) {
//       worker.address = typeof updateData.address === 'string' 
//         ? JSON.parse(updateData.address) 
//         : updateData.address;
//     }

//     if (updateData.bankDetails) {
//       worker.bankDetails = typeof updateData.bankDetails === 'string' 
//         ? JSON.parse(updateData.bankDetails) 
//         : updateData.bankDetails;
//     }

//     // Handle file updates
//     if (req.files?.photo?.[0]) {
//       if (worker.photo) {
//         const oldPhotoPath = path.join(process.cwd(), 'public', worker.photo);
//         if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
//       }
//       worker.photo = `/uploads/${req.files.photo[0].filename}`;
//     }

//     if (req.files?.workerIdProof) {
//       worker.workerIdProof = [
//         ...worker.workerIdProof,
//         ...req.files.workerIdProof.map(file => `/uploads/${file.filename}`)
//       ];
//     }

//     // Handle password update
//     if (updateData.password) {
//       const hashedPassword = await bcrypt.hash(updateData.password, 10);
//       worker.password = hashedPassword;
//       await User.findByIdAndUpdate(worker.userId, { password: hashedPassword });
//     }

//     await worker.save();

//     // Update associated User
//     if (updateData.name || updateData.email) {
//       await User.findByIdAndUpdate(worker.userId, {
//         ...(updateData.name && { name: updateData.name }),
//         ...(updateData.email && { email: updateData.email })
//       });
//     }

//     const updatedWorker = await Worker.findById(worker._id)
//       .populate('contractor', 'name contractorRole workerTypes')
//       .populate('userId', '-password');

//     return res.status(200).json({ 
//       success: true, 
//       message: "Worker updated successfully",
//       data: updatedWorker
//     });
//   } catch (error) {
//     console.error("Error updating worker:", error);
//     return res.status(500).json({ 
//       success: false, 
//       message: "Server error" 
//     });
//   }
// };

// // ✅ Delete Worker
// export const deleteWorker = async (req, res) => {
//   try {
//     const { id } = req.params;
//     let worker;

//     // Find worker by ID or userId
//     if (!isNaN(id)) {
//       worker = await Worker.findOneAndDelete({ $or: [{ _id: id }, { userId: id }] });
//     } else {
//       worker = await Worker.findByIdAndDelete(id);
//     }

//     if (!worker) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Worker not found" 
//       });
//     }

//     // Delete associated user
//     await User.findByIdAndDelete(worker.userId);

//     // Clean up files
//     const deleteFile = (filePath) => {
//       if (filePath) {
//         const fullPath = path.join(process.cwd(), 'public', filePath);
//         if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
//       }
//     };

//     deleteFile(worker.photo);
//     worker.workerIdProof?.forEach(deleteFile);

//     return res.status(200).json({ 
//       success: true, 
//       message: "Worker deleted successfully" 
//     });
//   } catch (error) {
//     console.error("Error deleting worker:", error);
//     return res.status(500).json({ 
//       success: false, 
//       message: "Server error" 
//     });
//   }
// };      


import mongoose from 'mongoose';
import Worker from "../models/Workers.js";
import Contractor from "../models/Contractor.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure upload directory
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).fields([
  { name: "photo", maxCount: 1 },
  { name: "workerIdProof", maxCount: 5 },
]);

// Helper function to get worker types for a contractor
const getWorkerTypesByContractor = async (contractorId) => {
  try {
    const contractor = await Contractor.findById(contractorId)
      .select('contractorRole roleDetails')
      .lean();

    if (!contractor) {
      throw new Error('Contractor not found');
    }

    const roleFieldMap = {
      'Centering Contractor': 'centering',
      'Steel Contractor': 'steel',
      'Mason Contractor': 'mason',
      'Carpenter Contractor': 'carpenter',
      'Plumber Contractor': 'plumber',
      'Electrician Contractor': 'electrician',
      'Painter Contractor': 'painter',
      'Tiles Contractor': 'tiles'
    };

    const roleField = roleFieldMap[contractor.contractorRole];
    if (!roleField) {
      throw new Error('Invalid contractor role');
    }

    // Get the workerType enum values from the roleDetails
    const workerTypeEnum = contractor.roleDetails[roleField]?.workerType?.enum || [];
    
    return {
      workerTypes: workerTypeEnum,
      contractorRole: contractor.contractorRole
    };
  } catch (error) {
    console.error("Error in getWorkerTypesByContractor:", error);
    throw error;
  }
};

// Get Worker Types for Contractor
export const getWorkerTypes = async (req, res) => {
  try {
    const { contractorId } = req.params;
    
    if (!contractorId) {
      return res.status(400).json({
        success: false,
        message: "Contractor ID is required",
        errorType: 'VALIDATION_ERROR'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(contractorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contractor ID format",
        errorType: 'VALIDATION_ERROR'
      });
    }

    const { workerTypes, contractorRole } = await getWorkerTypesByContractor(contractorId);
    
    return res.status(200).json({
      success: true,
      data: {
        workerTypes,
        contractorRole
      }
    });
  } catch (error) {
    console.error("Error in getWorkerTypes:", error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to fetch worker types",
      errorType: error.message.includes('not found') ? 'NOT_FOUND' : 'SERVER_ERROR'
    });
  }
};

// Create Worker
export const addWorker = async (req, res) => {
  try {
    const { name, email, phone, password, contractor, workerType, ...rest } = req.body;

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'password', 'contractor', 'workerType'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        errorType: 'VALIDATION_ERROR'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format",
        errorType: 'VALIDATION_ERROR'
      });
    }

    // Check if email exists in both User and Worker collections
    const [existingUser, existingWorker] = await Promise.all([
      User.findOne({ email }),
      Worker.findOne({ email })
    ]);

    if (existingUser || existingWorker) {
      return res.status(409).json({ 
        success: false, 
        message: "Email already registered",
        errorType: 'DUPLICATE_ENTRY'
      });
    }

    // Validate worker type
    const { workerTypes: validWorkerTypes, contractorRole } = await getWorkerTypesByContractor(contractor);
    if (!validWorkerTypes.includes(workerType)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid worker type for ${contractorRole}. Valid types: ${validWorkerTypes.join(', ')}`,
        validWorkerTypes,
        errorType: 'VALIDATION_ERROR'
      });
    }

    // Create User
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: "Worker",
      phone
    });
    await newUser.save();

    // Process files
    const photo = req.files?.photo?.[0]?.filename ? `/uploads/${req.files.photo[0].filename}` : null;
    const workerIdProof = req.files?.workerIdProof?.map(file => `/uploads/${file.filename}`) || [];

    // Parse address and bankDetails if they're strings
    let address, bankDetails;
    try {
      address = typeof rest.address === 'string' ? JSON.parse(rest.address) : rest.address;
      bankDetails = typeof rest.bankDetails === 'string' ? JSON.parse(rest.bankDetails) : rest.bankDetails;
    } catch (parseError) {
      // Clean up uploaded files if parsing fails
      if (photo) fs.unlinkSync(path.join(uploadDir, req.files.photo[0].filename));
      workerIdProof.forEach(file => fs.unlinkSync(path.join(uploadDir, file.split('/').pop())));
      
      return res.status(400).json({ 
        success: false, 
        message: "Invalid address or bank details format",
        errorType: 'VALIDATION_ERROR'
      });
    }

    // Create Worker
    const newWorker = new Worker({
      userId: newUser._id,
      name,
      email,
      phone,
      contractor,
      workerType,
      password: hashedPassword,
      photo,
      workerIdProof,
      ...rest,
      address,
      bankDetails
    });

    await newWorker.save();

    const populatedWorker = await Worker.findById(newWorker._id)
      .populate('contractor', 'name contractorRole')
      .populate('userId', '-password');

    return res.status(201).json({ 
      success: true, 
      message: "Worker created successfully",
      data: populatedWorker,
      validWorkerTypes // Return valid worker types for reference
    });

  } catch (error) {
    console.error("Error in addWorker:", error);
    
    // Clean up any uploaded files if error occurred
    if (req.files?.photo?.[0]) {
      fs.unlinkSync(path.join(uploadDir, req.files.photo[0].filename));
    }
    if (req.files?.workerIdProof) {
      req.files.workerIdProof.forEach(file => {
        fs.unlinkSync(path.join(uploadDir, file.filename));
      });
    }

    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    return res.status(statusCode).json({ 
      success: false, 
      message: error.message || "Failed to create worker",
      errorType: error.name || 'SERVER_ERROR'
    });
  }
};

// Get All Workers with filtering and pagination
export const getWorkers = async (req, res) => {
  try {
    const { contractor, workerType, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    if (contractor) {
      if (!mongoose.Types.ObjectId.isValid(contractor)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contractor ID format",
          errorType: 'VALIDATION_ERROR'
        });
      }
      filter.contractor = contractor;
    }
    
    if (workerType) filter.workerType = workerType;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'contractor', select: 'name contractorRole' },
        { path: 'userId', select: '-password' }
      ],
      sort: { createdAt: -1 }
    };

    const workers = await Worker.paginate(filter, options);

    return res.status(200).json({ 
      success: true, 
      data: workers 
    });
  } catch (error) {
    console.error("Error in getWorkers:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch workers",
      errorType: 'SERVER_ERROR'
    });
  }
};

// Get Worker by ID or userId
export const getWorkerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Worker ID is required",
        errorType: 'VALIDATION_ERROR'
      });
    }

    let worker;
    if (mongoose.Types.ObjectId.isValid(id)) {
      worker = await Worker.findById(id)
        .populate({
          path: 'contractor',
          select: 'name contractorRole'
        })
        .populate('userId', '-password');
    } else {
      // Search by userId if not a valid ObjectId
      worker = await Worker.findOne({ userId: id })
        .populate({
          path: 'contractor',
          select: 'name contractorRole'
        })
        .populate('userId', '-password');
    }

    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Worker not found",
        errorType: 'NOT_FOUND'
      });
    }

    // Get valid worker types for this worker's contractor
    const { workerTypes } = await getWorkerTypesByContractor(worker.contractor);

    return res.status(200).json({ 
      success: true, 
      data: {
        ...worker.toObject(),
        validWorkerTypes: workerTypes
      }
    });
  } catch (error) {
    console.error("Error in getWorkerById:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch worker",
      errorType: 'SERVER_ERROR'
    });
  }
};

// Update Worker
export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Worker ID is required",
        errorType: 'VALIDATION_ERROR'
      });
    }

    // Find worker by ID or userId
    let worker;
    if (mongoose.Types.ObjectId.isValid(id)) {
      worker = await Worker.findById(id);
    } else {
      worker = await Worker.findOne({ userId: id });
    }

    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Worker not found",
        errorType: 'NOT_FOUND'
      });
    }

    // Validate email if being updated
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid email format",
          errorType: 'VALIDATION_ERROR'
        });
      }

      const emailExists = await Worker.findOne({ 
        email: updateData.email,
        _id: { $ne: worker._id }
      });

      if (emailExists) {
        return res.status(409).json({ 
          success: false, 
          message: "Email already in use by another worker",
          errorType: 'DUPLICATE_ENTRY'
        });
      }
    }

    // Validate workerType if being updated
    if (updateData.workerType || updateData.contractor) {
      const contractorId = updateData.contractor || worker.contractor;
      const workerType = updateData.workerType || worker.workerType;

      const { workerTypes: validWorkerTypes, contractorRole } = await getWorkerTypesByContractor(contractorId);
      if (!validWorkerTypes.includes(workerType)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid worker type for ${contractorRole}. Valid types: ${validWorkerTypes.join(', ')}`,
          validWorkerTypes,
          errorType: 'VALIDATION_ERROR'
        });
      }
    }

    // Update fields
    const updatableFields = ['name', 'email', 'phone', 'gender', 'alternatePhone', 'workerType', 'joiningDate', 'contractor', 'status'];
    updatableFields.forEach(field => {
      if (updateData[field] !== undefined) {
        worker[field] = updateData[field];
      }
    });

    // Update nested objects
    if (updateData.address) {
      try {
        worker.address = typeof updateData.address === 'string' 
          ? JSON.parse(updateData.address) 
          : updateData.address;
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid address format",
          errorType: 'VALIDATION_ERROR'
        });
      }
    }

    if (updateData.bankDetails) {
      try {
        worker.bankDetails = typeof updateData.bankDetails === 'string' 
          ? JSON.parse(updateData.bankDetails) 
          : updateData.bankDetails;
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid bank details format",
          errorType: 'VALIDATION_ERROR'
        });
      }
    }

    // Handle file updates
    if (req.files?.photo?.[0]) {
      // Delete old photo if exists
      if (worker.photo) {
        const oldPhotoPath = path.join(process.cwd(), 'public', worker.photo);
        if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
      }
      worker.photo = `/uploads/${req.files.photo[0].filename}`;
    }

    if (req.files?.workerIdProof) {
      worker.workerIdProof = [
        ...(worker.workerIdProof || []),
        ...req.files.workerIdProof.map(file => `/uploads/${file.filename}`)
      ];
    }

    // Handle password update
    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      worker.password = hashedPassword;
      await User.findByIdAndUpdate(worker.userId, { password: hashedPassword });
    }

    await worker.save();

    // Update associated User
    const userUpdate = {};
    if (updateData.name) userUpdate.name = updateData.name;
    if (updateData.email) userUpdate.email = updateData.email;
    if (updateData.phone) userUpdate.phone = updateData.phone;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(worker.userId, userUpdate);
    }

    const updatedWorker = await Worker.findById(worker._id)
      .populate('contractor', 'name contractorRole')
      .populate('userId', '-password');

    return res.status(200).json({ 
      success: true, 
      message: "Worker updated successfully",
      data: updatedWorker
    });
  } catch (error) {
    console.error("Error in updateWorker:", error);
    
    // Clean up any newly uploaded files if error occurred
    if (req.files?.photo?.[0]) {
      fs.unlinkSync(path.join(uploadDir, req.files.photo[0].filename));
    }
    if (req.files?.workerIdProof) {
      req.files.workerIdProof.forEach(file => {
        fs.unlinkSync(path.join(uploadDir, file.filename));
      });
    }

    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    return res.status(statusCode).json({ 
      success: false, 
      message: error.message || "Failed to update worker",
      errorType: error.name || 'SERVER_ERROR'
    });
  }
};

// Delete Worker
export const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Worker ID is required",
        errorType: 'VALIDATION_ERROR'
      });
    }

    // Find worker by ID or userId
    let worker;
    if (mongoose.Types.ObjectId.isValid(id)) {
      worker = await Worker.findByIdAndDelete(id);
    } else {
      worker = await Worker.findOneAndDelete({ userId: id });
    }

    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Worker not found",
        errorType: 'NOT_FOUND'
      });
    }

    // Delete associated user
    await User.findByIdAndDelete(worker.userId);

    // Clean up files
    const deleteFile = (filePath) => {
      if (filePath) {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
    };

    // Delete photo
    if (worker.photo) {
      deleteFile(worker.photo);
    }

    // Delete worker ID proofs
    if (worker.workerIdProof && worker.workerIdProof.length > 0) {
      worker.workerIdProof.forEach(deleteFile);
    }

    return res.status(200).json({ 
      success: true, 
      message: "Worker deleted successfully",
      deletedId: worker._id
    });
  } catch (error) {
    console.error("Error in deleteWorker:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to delete worker",
      errorType: 'SERVER_ERROR'
    });
  }
};



// import Worker from "../models/Workers.js";
// import Contractor from "../models/Contractor.js";
// import User from "../models/User.js";
// import bcrypt from "bcrypt";
// import multer from "multer";
// import path from "path";
// import fs from "fs";

// // Configure upload directory
// const uploadDir = path.join(process.cwd(), "public", "uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Multer configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
// });

// export const upload = multer({ 
//   storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   }
// }).fields([
//   { name: "photo", maxCount: 1 },
//   { name: "workerIdProof", maxCount: 5 },
// ]);

// // Helper function to get worker types for a contractor
// const getWorkerTypesByContractor = async (contractorId) => {
//   try {
//     const contractor = await Contractor.findById(contractorId)
//       .select('contractorRole roleDetails')
//       .lean();

//     if (!contractor) {
//       throw new Error('Contractor not found');
//     }

//     const roleFieldMap = {
//       'Centering Contractor': 'centering',
//       'Steel Contractor': 'steel',
//       'Mason Contractor': 'mason',
//       'Carpenter Contractor': 'carpenter',
//       'Plumber Contractor': 'plumber',
//       'Electrician Contractor': 'electrician',
//       'Painter Contractor': 'painter',
//       'Tiles Contractor': 'tiles'
//     };

//     const roleField = roleFieldMap[contractor.contractorRole];
//     if (!roleField) {
//       throw new Error('Invalid contractor role');
//     }

//     return {
//       workerTypes: contractor.roleDetails[roleField]?.workerType?.enum || [],
//       contractorRole: contractor.contractorRole
//     };
//   } catch (error) {
//     throw error;
//   }
// };

// // Create Worker
// export const addWorker = async (req, res) => {
//   try {
//     const { name, email, phone, password, contractor, workerType, ...rest } = req.body;

//     // Validate required fields
//     const requiredFields = ['name', 'email', 'phone', 'password', 'contractor', 'workerType'];
//     const missingFields = requiredFields.filter(field => !req.body[field]);
    
//     if (missingFields.length > 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: `Missing required fields: ${missingFields.join(', ')}`,
//         errorType: 'VALIDATION_ERROR'
//       });
//     }

//     // Validate email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Invalid email format",
//         errorType: 'VALIDATION_ERROR'
//       });
//     }

//     // Check if email exists in both User and Worker collections
//     const [existingUser, existingWorker] = await Promise.all([
//       User.findOne({ email }),
//       Worker.findOne({ email })
//     ]);

//     if (existingUser || existingWorker) {
//       return res.status(409).json({ 
//         success: false, 
//         message: "Email already registered",
//         errorType: 'DUPLICATE_ENTRY'
//       });
//     }

//     // Validate worker type
//     const { workerTypes: validWorkerTypes, contractorRole } = await getWorkerTypesByContractor(contractor);
//     if (!validWorkerTypes.includes(workerType)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: `Invalid worker type for ${contractorRole}`,
//         validWorkerTypes,
//         errorType: 'VALIDATION_ERROR'
//       });
//     }

//     // Create User
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = new User({ 
//       name, 
//       email, 
//       password: hashedPassword, 
//       role: "Worker",
//       phone
//     });
//     await newUser.save();

//     // Process files
//     const photo = req.files?.photo?.[0]?.filename ? `/uploads/${req.files.photo[0].filename}` : null;
//     const workerIdProof = req.files?.workerIdProof?.map(file => `/uploads/${file.filename}`) || [];

//     // Parse address and bankDetails if they're strings
//     let address, bankDetails;
//     try {
//       address = typeof rest.address === 'string' ? JSON.parse(rest.address) : rest.address;
//       bankDetails = typeof rest.bankDetails === 'string' ? JSON.parse(rest.bankDetails) : rest.bankDetails;
//     } catch (parseError) {
//       // Clean up uploaded files if parsing fails
//       if (photo) fs.unlinkSync(path.join(uploadDir, req.files.photo[0].filename));
//       workerIdProof.forEach(file => fs.unlinkSync(path.join(uploadDir, file.split('/').pop())));
      
//       return res.status(400).json({ 
//         success: false, 
//         message: "Invalid address or bank details format",
//         errorType: 'VALIDATION_ERROR'
//       });
//     }

//     // Create Worker
//     const newWorker = new Worker({
//       userId: newUser._id,
//       name,
//       email,
//       phone,
//       contractor,
//       workerType,
//       password: hashedPassword,
//       photo,
//       workerIdProof,
//       ...rest,
//       address,
//       bankDetails
//     });

//     await newWorker.save();

//     const populatedWorker = await Worker.findById(newWorker._id)
//       .populate('contractor', 'name contractorRole')
//       .populate('userId', '-password');

//     return res.status(201).json({ 
//       success: true, 
//       message: "Worker created successfully",
//       data: populatedWorker,
//       validWorkerTypes // Return valid worker types for reference
//     });

//   } catch (error) {
//     console.error("Error creating worker:", error);
    
//     // Clean up any uploaded files if error occurred
//     if (req.files?.photo?.[0]) {
//       fs.unlinkSync(path.join(uploadDir, req.files.photo[0].filename));
//     }
//     if (req.files?.workerIdProof) {
//       req.files.workerIdProof.forEach(file => {
//         fs.unlinkSync(path.join(uploadDir, file.filename));
//       });
//     }

//     const statusCode = error.name === 'ValidationError' ? 400 : 500;
//     return res.status(statusCode).json({ 
//       success: false, 
//       message: error.message || "Failed to create worker",
//       errorType: error.name || 'SERVER_ERROR'
//     });
//   }
// };

// // Get Worker Types for Contractor
// export const getWorkerTypes = async (req, res) => {
//   try {
//     const { contractorId } = req.params;
    
//     if (!contractorId) {
//       return res.status(400).json({
//         success: false,
//         message: "Contractor ID is required",
//         errorType: 'VALIDATION_ERROR'
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(contractorId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid contractor ID format",
//         errorType: 'VALIDATION_ERROR'
//       });
//     }

//     const { workerTypes, contractorRole } = await getWorkerTypesByContractor(contractorId);
    
//     return res.status(200).json({
//       success: true,
//       data: workerTypes,
//       contractorRole
//     });
//   } catch (error) {
//     console.error("Error fetching worker types:", error);
//     const statusCode = error.message.includes('not found') ? 404 : 500;
//     return res.status(statusCode).json({
//       success: false,
//       message: error.message || "Failed to fetch worker types",
//       errorType: error.message.includes('not found') ? 'NOT_FOUND' : 'SERVER_ERROR'
//     });
//   }
// };
// // Get All Workers with filtering and pagination
// export const getWorkers = async (req, res) => {
//   try {
//     const { contractor, workerType, page = 1, limit = 10 } = req.query;
//     const filter = {};
    
//     if (contractor) {
//       if (!mongoose.Types.ObjectId.isValid(contractor)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid contractor ID format",
//           errorType: 'VALIDATION_ERROR'
//         });
//       }
//       filter.contractor = contractor;
//     }
    
//     if (workerType) filter.workerType = workerType;

//     const options = {
//       page: parseInt(page),
//       limit: parseInt(limit),
//       populate: [
//         { path: 'contractor', select: 'name contractorRole' },
//         { path: 'userId', select: '-password' }
//       ],
//       sort: { createdAt: -1 }
//     };

//     const workers = await Worker.paginate(filter, options);

//     return res.status(200).json({ 
//       success: true, 
//       data: workers 
//     });
//   } catch (error) {
//     console.error("Error fetching workers:", error);
//     return res.status(500).json({ 
//       success: false, 
//       message: "Failed to fetch workers",
//       errorType: 'SERVER_ERROR'
//     });
//   }
// };

// // Get Worker by ID or userId
// export const getWorkerById = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Worker ID is required",
//         errorType: 'VALIDATION_ERROR'
//       });
//     }

//     let worker;
//     if (mongoose.Types.ObjectId.isValid(id)) {
//       worker = await Worker.findById(id)
//         .populate({
//           path: 'contractor',
//           select: 'name contractorRole'
//         })
//         .populate('userId', '-password');
//     } else {
//       // Search by userId if not a valid ObjectId
//       worker = await Worker.findOne({ userId: id })
//         .populate({
//           path: 'contractor',
//           select: 'name contractorRole'
//         })
//         .populate('userId', '-password');
//     }

//     if (!worker) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Worker not found",
//         errorType: 'NOT_FOUND'
//       });
//     }

//     // Get valid worker types for this worker's contractor
//     const { workerTypes } = await getWorkerTypesByContractor(worker.contractor);

//     return res.status(200).json({ 
//       success: true, 
//       data: {
//         ...worker.toObject(),
//         validWorkerTypes: workerTypes
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching worker:", error);
//     return res.status(500).json({ 
//       success: false, 
//       message: "Failed to fetch worker",
//       errorType: 'SERVER_ERROR'
//     });
//   }
// };

// // Update Worker
// export const updateWorker = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;
    
//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Worker ID is required",
//         errorType: 'VALIDATION_ERROR'
//       });
//     }

//     // Find worker by ID or userId
//     let worker;
//     if (mongoose.Types.ObjectId.isValid(id)) {
//       worker = await Worker.findById(id);
//     } else {
//       worker = await Worker.findOne({ userId: id });
//     }

//     if (!worker) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Worker not found",
//         errorType: 'NOT_FOUND'
//       });
//     }

//     // Validate email if being updated
//     if (updateData.email) {
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(updateData.email)) {
//         return res.status(400).json({ 
//           success: false, 
//           message: "Invalid email format",
//           errorType: 'VALIDATION_ERROR'
//         });
//       }

//       const emailExists = await Worker.findOne({ 
//         email: updateData.email,
//         _id: { $ne: worker._id }
//       });

//       if (emailExists) {
//         return res.status(409).json({ 
//           success: false, 
//           message: "Email already in use by another worker",
//           errorType: 'DUPLICATE_ENTRY'
//         });
//       }
//     }

//     // Validate workerType if being updated
//     if (updateData.workerType || updateData.contractor) {
//       const contractorId = updateData.contractor || worker.contractor;
//       const workerType = updateData.workerType || worker.workerType;

//       const { workerTypes: validWorkerTypes, contractorRole } = await getWorkerTypesByContractor(contractorId);
//       if (!validWorkerTypes.includes(workerType)) {
//         return res.status(400).json({ 
//           success: false, 
//           message: `Invalid worker type for ${contractorRole}`,
//           validWorkerTypes,
//           errorType: 'VALIDATION_ERROR'
//         });
//       }
//     }

//     // Update fields
//     const updatableFields = ['name', 'email', 'phone', 'gender', 'alternatePhone', 'workerType', 'joiningDate', 'contractor', 'status'];
//     updatableFields.forEach(field => {
//       if (updateData[field] !== undefined) {
//         worker[field] = updateData[field];
//       }
//     });

//     // Update nested objects
//     if (updateData.address) {
//       try {
//         worker.address = typeof updateData.address === 'string' 
//           ? JSON.parse(updateData.address) 
//           : updateData.address;
//       } catch (error) {
//         return res.status(400).json({ 
//           success: false, 
//           message: "Invalid address format",
//           errorType: 'VALIDATION_ERROR'
//         });
//       }
//     }

//     if (updateData.bankDetails) {
//       try {
//         worker.bankDetails = typeof updateData.bankDetails === 'string' 
//           ? JSON.parse(updateData.bankDetails) 
//           : updateData.bankDetails;
//       } catch (error) {
//         return res.status(400).json({ 
//           success: false, 
//           message: "Invalid bank details format",
//           errorType: 'VALIDATION_ERROR'
//         });
//       }
//     }

//     // Handle file updates
//     if (req.files?.photo?.[0]) {
//       // Delete old photo if exists
//       if (worker.photo) {
//         const oldPhotoPath = path.join(process.cwd(), 'public', worker.photo);
//         if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
//       }
//       worker.photo = `/uploads/${req.files.photo[0].filename}`;
//     }

//     if (req.files?.workerIdProof) {
//       worker.workerIdProof = [
//         ...(worker.workerIdProof || []),
//         ...req.files.workerIdProof.map(file => `/uploads/${file.filename}`)
//       ];
//     }

//     // Handle password update
//     if (updateData.password) {
//       const hashedPassword = await bcrypt.hash(updateData.password, 10);
//       worker.password = hashedPassword;
//       await User.findByIdAndUpdate(worker.userId, { password: hashedPassword });
//     }

//     await worker.save();

//     // Update associated User
//     const userUpdate = {};
//     if (updateData.name) userUpdate.name = updateData.name;
//     if (updateData.email) userUpdate.email = updateData.email;
//     if (updateData.phone) userUpdate.phone = updateData.phone;

//     if (Object.keys(userUpdate).length > 0) {
//       await User.findByIdAndUpdate(worker.userId, userUpdate);
//     }

//     const updatedWorker = await Worker.findById(worker._id)
//       .populate('contractor', 'name contractorRole')
//       .populate('userId', '-password');

//     return res.status(200).json({ 
//       success: true, 
//       message: "Worker updated successfully",
//       data: updatedWorker
//     });
//   } catch (error) {
//     console.error("Error updating worker:", error);
    
//     // Clean up any newly uploaded files if error occurred
//     if (req.files?.photo?.[0]) {
//       fs.unlinkSync(path.join(uploadDir, req.files.photo[0].filename));
//     }
//     if (req.files?.workerIdProof) {
//       req.files.workerIdProof.forEach(file => {
//         fs.unlinkSync(path.join(uploadDir, file.filename));
//       });
//     }

//     const statusCode = error.name === 'ValidationError' ? 400 : 500;
//     return res.status(statusCode).json({ 
//       success: false, 
//       message: error.message || "Failed to update worker",
//       errorType: error.name || 'SERVER_ERROR'
//     });
//   }
// };

// // Delete Worker
// export const deleteWorker = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Worker ID is required",
//         errorType: 'VALIDATION_ERROR'
//       });
//     }

//     // Find worker by ID or userId
//     let worker;
//     if (mongoose.Types.ObjectId.isValid(id)) {
//       worker = await Worker.findByIdAndDelete(id);
//     } else {
//       worker = await Worker.findOneAndDelete({ userId: id });
//     }

//     if (!worker) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Worker not found",
//         errorType: 'NOT_FOUND'
//       });
//     }

//     // Delete associated user
//     await User.findByIdAndDelete(worker.userId);

//     // Clean up files
//     const deleteFile = (filePath) => {
//       if (filePath) {
//         const fullPath = path.join(process.cwd(), 'public', filePath);
//         if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
//       }
//     };

//     // Delete photo
//     if (worker.photo) {
//       deleteFile(worker.photo);
//     }

//     // Delete worker ID proofs
//     if (worker.workerIdProof && worker.workerIdProof.length > 0) {
//       worker.workerIdProof.forEach(deleteFile);
//     }

//     return res.status(200).json({ 
//       success: true, 
//       message: "Worker deleted successfully",
//       deletedId: worker._id
//     });
//   } catch (error) {
//     console.error("Error deleting worker:", error);
//     return res.status(500).json({ 
//       success: false, 
//       message: "Failed to delete worker",
//       errorType: 'SERVER_ERROR'
//     });
//   }
// };