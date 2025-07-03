

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

// // ✅ Create Worker
// export const addWorker = async (req, res) => {
//   try {
//     const { name, email, phone, password, contractor, workerType, ...rest } = req.body;

//     // Validate required fields
//     if (!name || !email || !phone || !password || !contractor || !workerType) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Missing required fields: name, email, phone, password, contractor, workerType" 
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

//     // Validate contractor and workerType
//     const contractorDoc = await Contractor.findById(contractor)
//       .select('contractorRole roleDetails')
//       .lean();
    
//     if (!contractorDoc) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Contractor not found" 
//       });
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

//     const roleField = roleFieldMap[contractorDoc.contractorRole];
//     const validWorkerTypes = contractorDoc.roleDetails[roleField]?.workerType?.enum || [];
    
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
//         .populate('contractor', 'name contractorRole')
//         .populate('userId', '-password')
//     });
//   } catch (error) {
//     console.error("Error creating worker:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
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
//         select: 'name contractorRole',
//         populate: {
//           path: 'roleDetails',
//           select: 'workerType'
//         }
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
//       message: "Server error", 
//       error: error.message 
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
//           select: 'name contractorRole',
//           populate: {
//             path: 'roleDetails',
//             select: 'workerType'
//           }
//         })
//         .populate('userId', '-password');
//     } else {
//       worker = await Worker.findById(id)
//         .populate({
//           path: 'contractor',
//           select: 'name contractorRole',
//           populate: {
//             path: 'roleDetails',
//             select: 'workerType'
//           }
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
//       message: "Server error", 
//       error: error.message 
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

//       const contractor = await Contractor.findById(contractorId)
//         .select('contractorRole roleDetails')
//         .lean();

//       if (contractor) {
//         const roleFieldMap = {
//           'Centering Contractor': 'centering',
//           'Steel Contractor': 'steel',
//           'Mason Contractor': 'mason',
//           'Carpenter Contractor': 'carpenter',
//           'Plumber Contractor': 'plumber',
//           'Electrician Contractor': 'electrician',
//           'Painter Contractor': 'painter',
//           'Tiles Contractor': 'tiles'
//         };

//         const roleField = roleFieldMap[contractor.contractorRole];
//         const validWorkerTypes = contractor.roleDetails[roleField]?.workerType?.enum || [];

//         if (!validWorkerTypes.includes(workerType)) {
//           return res.status(400).json({ 
//             success: false, 
//             message: `Invalid workerType for contractor. Valid types: ${validWorkerTypes.join(', ')}` 
//           });
//         }
//       }
//     }

//     // Update fields
//     const updatableFields = ['name', 'email', 'phone', 'gender', 'alternatePhone', 'workerType', 'joiningDate', 'contractor'];
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
//       .populate('contractor', 'name contractorRole')
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
//       message: "Server error", 
//       error: error.message 
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
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };


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

export const upload = multer({ storage }).fields([
  { name: "photo", maxCount: 1 },
  { name: "workerIdProof", maxCount: 5 },
]);

// Helper function to get worker types for a contractor
export const getWorkerTypesByContractor = async (contractorId) => {
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

  return contractor.roleDetails[roleField]?.workerType?.enum || [];
};

// ✅ Create Worker
export const addWorker = async (req, res) => {
  try {
    const { name, email, phone, password, contractor, workerType, ...rest } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !contractor || !workerType) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already registered" 
      });
    }

    // Validate worker type
    const validWorkerTypes = await getWorkerTypesByContractor(contractor);
    if (!validWorkerTypes.includes(workerType)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid workerType. Valid types: ${validWorkerTypes.join(', ')}` 
      });
    }

    // Create User
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: "Worker" 
    });
    await newUser.save();

    // Process files
    const photo = req.files?.photo?.[0]?.filename ? `/uploads/${req.files.photo[0].filename}` : null;
    const workerIdProof = req.files?.workerIdProof?.map(file => `/uploads/${file.filename}`) || [];

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
      address: typeof rest.address === 'string' ? JSON.parse(rest.address) : rest.address,
      bankDetails: typeof rest.bankDetails === 'string' ? JSON.parse(rest.bankDetails) : rest.bankDetails
    });

    await newWorker.save();

    return res.status(201).json({ 
      success: true, 
      message: "Worker created successfully",
      data: await Worker.findById(newWorker._id)
        .populate('contractor', 'name contractorRole workerTypes')
        .populate('userId', '-password')
    });
  } catch (error) {
    console.error("Error creating worker:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Server error"
    });
  }
};

// ✅ Get Worker Types for Contractor
export const getWorkerTypes = async (req, res) => {
  try {
    const { contractorId } = req.params;
    
    if (!contractorId) {
      return res.status(400).json({
        success: false,
        message: "Contractor ID is required"
      });
    }

    const workerTypes = await getWorkerTypesByContractor(contractorId);
    
    return res.status(200).json({
      success: true,
      data: workerTypes
    });
  } catch (error) {
    console.error("Error fetching worker types:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};

// ✅ Get All Workers
export const getWorkers = async (req, res) => {
  try {
    const { contractor } = req.query;
    const filter = contractor ? { contractor } : {};

    const workers = await Worker.find(filter)
      .populate({
        path: 'contractor',
        select: 'name contractorRole workerTypes'
      })
      .populate('userId', '-password');

    return res.status(200).json({ 
      success: true, 
      data: workers 
    });
  } catch (error) {
    console.error("Error fetching workers:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ✅ Get Worker by ID
export const getWorkerById = async (req, res) => {
  try {
    const { id } = req.params;
    let worker;

    if (!isNaN(id)) {
      worker = await Worker.findOne({ $or: [{ _id: id }, { userId: id }] })
        .populate({
          path: 'contractor',
          select: 'name contractorRole workerTypes'
        })
        .populate('userId', '-password');
    } else {
      worker = await Worker.findById(id)
        .populate({
          path: 'contractor',
          select: 'name contractorRole workerTypes'
        })
        .populate('userId', '-password');
    }

    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Worker not found" 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: worker 
    });
  } catch (error) {
    console.error("Error fetching worker:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ✅ Update Worker
export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    let worker;

    // Find worker by ID or userId
    if (!isNaN(id)) {
      worker = await Worker.findOne({ $or: [{ _id: id }, { userId: id }] });
    } else {
      worker = await Worker.findById(id);
    }

    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Worker not found" 
      });
    }

    // Validate workerType if being updated
    if (updateData.workerType || updateData.contractor) {
      const contractorId = updateData.contractor || worker.contractor;
      const workerType = updateData.workerType || worker.workerType;

      const validWorkerTypes = await getWorkerTypesByContractor(contractorId);
      if (!validWorkerTypes.includes(workerType)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid workerType. Valid types: ${validWorkerTypes.join(', ')}` 
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
      worker.address = typeof updateData.address === 'string' 
        ? JSON.parse(updateData.address) 
        : updateData.address;
    }

    if (updateData.bankDetails) {
      worker.bankDetails = typeof updateData.bankDetails === 'string' 
        ? JSON.parse(updateData.bankDetails) 
        : updateData.bankDetails;
    }

    // Handle file updates
    if (req.files?.photo?.[0]) {
      if (worker.photo) {
        const oldPhotoPath = path.join(process.cwd(), 'public', worker.photo);
        if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
      }
      worker.photo = `/uploads/${req.files.photo[0].filename}`;
    }

    if (req.files?.workerIdProof) {
      worker.workerIdProof = [
        ...worker.workerIdProof,
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
    if (updateData.name || updateData.email) {
      await User.findByIdAndUpdate(worker.userId, {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.email && { email: updateData.email })
      });
    }

    const updatedWorker = await Worker.findById(worker._id)
      .populate('contractor', 'name contractorRole workerTypes')
      .populate('userId', '-password');

    return res.status(200).json({ 
      success: true, 
      message: "Worker updated successfully",
      data: updatedWorker
    });
  } catch (error) {
    console.error("Error updating worker:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ✅ Delete Worker
export const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    let worker;

    // Find worker by ID or userId
    if (!isNaN(id)) {
      worker = await Worker.findOneAndDelete({ $or: [{ _id: id }, { userId: id }] });
    } else {
      worker = await Worker.findByIdAndDelete(id);
    }

    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Worker not found" 
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

    deleteFile(worker.photo);
    worker.workerIdProof?.forEach(deleteFile);

    return res.status(200).json({ 
      success: true, 
      message: "Worker deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting worker:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};    