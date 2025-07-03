// import Contractor from "../models/Contractor.js";
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
// export const upload = multer({ storage }).fields([
//   { name: "photo", maxCount: 1 },
//   { name: "contractorIdProof", maxCount: 5 }, // Allow multiple ID proofs
// ]);

// // ✅ Add Contractor Function
// export const addContractor = async (req, res) => {
//   try {
//     const {
//       name, email, dateOfBirth, gender, phone, alternatePhone, address,
//       permanentAddress, contractorRole, joiningDate, bankAccount,
//       bankCode, password
//     } = req.body;

//     // Validate required fields
//     if (!name || !email || !phone || !password || !contractorRole) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Required fields: name, email, phone, password, contractorRole" 
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

//     // Create and save new User first to get the userId
//     const newUser = new User({ 
//       name, 
//       email, 
//       password: hashedPassword, 
//       role: "Contractor" 
//     });
//     await newUser.save();

//     // Process uploaded files
//     const photo = req.files?.photo ? `/uploads/${req.files.photo[0].filename}` : null;
//     const contractorIdProof = req.files?.contractorIdProof 
//       ? req.files.contractorIdProof.map(file => `/uploads/${file.filename}`) 
//       : [];

//     // Parse address objects if they're strings
//     let parsedAddress = address;
//     let parsedPermanentAddress = permanentAddress;
    
//     try {
//       if (typeof address === 'string') parsedAddress = JSON.parse(address);
//       if (typeof permanentAddress === 'string') parsedPermanentAddress = JSON.parse(permanentAddress);
//     } catch (e) {
//       console.log("Address parsing error:", e);
//     }

//     // Create and save new Contractor record
//     const newContractor = new Contractor({
//       userId: newUser._id,
//       name,
//       email,
//       dateOfBirth,
//       gender,
//       phone,
//       alternatePhone,
//       address: parsedAddress,
//       permanentAddress: parsedPermanentAddress,
//       contractorRole,
//       joiningDate,
//       bankAccount,
//       bankCode,
//       contractorIdProof,
//       photo,
//       password: hashedPassword
//     });

//     await newContractor.save();
    
//     return res.status(201).json({ 
//       success: true, 
//       message: "Contractor added successfully", 
//       data: newContractor 
//     });
//   } catch (error) {
//     console.error("Error adding contractor:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

// // ✅ Get All Contractors
// export const getContractors = async (req, res) => {
//   try {
//     const { contractorRole } = req.query;
//     const filter = {};
    
//     if (contractorRole) {
//       filter.contractorRole = contractorRole;
//     }

//     const contractors = await Contractor.find(filter)
//       .populate("userId", "-password")
//       .lean();

//     return res.status(200).json({ 
//       success: true, 
//       data: contractors 
//     });
//   } catch (error) {
//     return res.status(500).json({ 
//       success: false, 
//       message: "Internal Server Error", 
//       error: error.message 
//     });
//   }
// };

// // ✅ Get One Contractor (by ID)
// export const getContractorById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     // First try to find by _id (number)
//     let contractor;
//     if (!isNaN(id)) {
//       contractor = await Contractor.findOne({ _id: parseInt(id) })
//         .populate("userId", "-password")
//         .lean();
//     }

//     // If not found by _id, try by userId (number)
//     if (!contractor) {
//       contractor = await Contractor.findOne({ userId: parseInt(id) })
//         .populate("userId", "-password")
//         .lean();
//     }

//     if (!contractor) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Contractor not found" 
//       });
//     }

//     return res.status(200).json({ 
//       success: true, 
//       data: contractor 
//     });
//   } catch (error) {
//     return res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

// // ✅ Update Contractor
// export const updateContractor = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     // Find contractor by _id or userId
//     let contractor;
//     if (!isNaN(id)) {
//       contractor = await Contractor.findOne({ _id: parseInt(id) });
//       if (!contractor) {
//         contractor = await Contractor.findOne({ userId: parseInt(id) });
//       }
//     }

//     if (!contractor) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Contractor not found" 
//       });
//     }

//     // Update basic fields
//     const fieldsToUpdate = [
//       'name', 'email', 'dateOfBirth', 'gender', 'phone', 'alternatePhone', 
//       'contractorRole', 'joiningDate', 'bankAccount', 'bankCode'
//     ];
    
//     fieldsToUpdate.forEach(field => {
//       if (updateData[field] !== undefined) {
//         contractor[field] = updateData[field];
//       }
//     });

//     // Update address objects
//     if (updateData.address) {
//       try {
//         contractor.address = typeof updateData.address === 'string' 
//           ? JSON.parse(updateData.address) 
//           : updateData.address;
//       } catch (e) {
//         console.log("Address parsing error:", e);
//       }
//     }

//     if (updateData.permanentAddress) {
//       try {
//         contractor.permanentAddress = typeof updateData.permanentAddress === 'string' 
//           ? JSON.parse(updateData.permanentAddress) 
//           : updateData.permanentAddress;
//       } catch (e) {
//         console.log("Permanent address parsing error:", e);
//       }
//     }

//     // Update files if uploaded
//     if (req.files?.photo) {
//       contractor.photo = `/uploads/${req.files.photo[0].filename}`;
//     }
    
//     if (req.files?.contractorIdProof) {
//       const newIdProofs = req.files.contractorIdProof.map(file => `/uploads/${file.filename}`);
//       contractor.contractorIdProof = [...contractor.contractorIdProof, ...newIdProofs];
//     }

//     // Handle password update
//     if (updateData.password) {
//       const hashedPassword = await bcrypt.hash(updateData.password, 10);
//       contractor.password = hashedPassword;
      
//       // Also update user password
//       await User.findOneAndUpdate(
//         { _id: contractor.userId },
//         { $set: { password: hashedPassword } }
//       );
//     }

//     await contractor.save();
    
//     // Also update the associated User record
//     if (updateData.name || updateData.email) {
//       await User.findOneAndUpdate(
//         { _id: contractor.userId },
//         {
//           $set: {
//             ...(updateData.name && { name: updateData.name }),
//             ...(updateData.email && { email: updateData.email })
//           }
//         }
//       );
//     }

//     return res.status(200).json({ 
//       success: true, 
//       message: "Contractor updated successfully", 
//       data: contractor 
//     });
//   } catch (error) {
//     return res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

// // ✅ Delete Contractor
// export const deleteContractor = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     // Find contractor by _id or userId
//     let contractor;
//     if (!isNaN(id)) {
//       contractor = await Contractor.findOneAndDelete({ _id: parseInt(id) });
//       if (!contractor) {
//         contractor = await Contractor.findOneAndDelete({ userId: parseInt(id) });
//       }
//     }

//     if (!contractor) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Contractor not found" 
//       });
//     }

//     // Delete associated user
//     await User.findOneAndDelete({ _id: contractor.userId });

//     // Clean up uploaded files
//     if (contractor.photo) {
//       const photoPath = path.join(process.cwd(), 'public', contractor.photo);
//       if (fs.existsSync(photoPath)) {
//         fs.unlinkSync(photoPath);
//       }
//     }

//     if (contractor.contractorIdProof && contractor.contractorIdProof.length > 0) {
//       contractor.contractorIdProof.forEach(proof => {
//         const proofPath = path.join(process.cwd(), 'public', proof);
//         if (fs.existsSync(proofPath)) {
//           fs.unlinkSync(proofPath);
//         }
//       });
//     }

//     return res.status(200).json({ 
//       success: true, 
//       message: "Contractor deleted successfully" 
//     });
//   } catch (error) {
//     return res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

// // ✅ Remove ID Proof
// export const removeIdProof = async (req, res) => {
//   try {
//     const { id, proofUrl } = req.params;

//     // Find contractor by _id or userId
//     let contractor;
//     if (!isNaN(id)) {
//       contractor = await Contractor.findOne({ _id: parseInt(id) });
//       if (!contractor) {
//         contractor = await Contractor.findOne({ userId: parseInt(id) });
//       }
//     }

//     if (!contractor) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Contractor not found" 
//       });
//     }

//     // Remove the file from server
//     const proofPath = path.join(process.cwd(), 'public', proofUrl);
//     if (fs.existsSync(proofPath)) {
//       fs.unlinkSync(proofPath);
//     }

//     // Filter out the proof to be removed
//     contractor.contractorIdProof = contractor.contractorIdProof.filter(
//       proof => proof !== proofUrl
//     );

//     await contractor.save();

//     return res.status(200).json({ 
//       success: true, 
//       message: "ID proof removed successfully",
//       data: contractor.contractorIdProof
//     });
//   } catch (error) {
//     return res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

// // ✅ Get Contractors by Role
// export const getContractorsByRole = async (req, res) => {
//   try {
//     const { role } = req.params;
    
//     if (![
//       'Centering Contractor', 
//       'Steel Contractor', 
//       'Mason Contractor', 
//       'Carpenter Contractor', 
//       'Plumber Contractor', 
//       'Electrician Contractor', 
//       'Painter Contractor', 
//       'Tiles Contractor'
//     ].includes(role)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid contractor role"
//       });
//     }

//     const contractors = await Contractor.find({ contractorRole: role })
//       .populate("userId", "-password")
//       .lean();

//     return res.status(200).json({
//       success: true,
//       data: contractors
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };



import Contractor from "../models/Contractor.js";
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
export const upload = multer({ storage }).fields([
  { name: "photo", maxCount: 1 },
  { name: "contractorIdProof", maxCount: 5 },
]);

// ✅ Add Contractor Function
export const addContractor = async (req, res) => {
  try {
    const {
      name, email, gender, phone, alternatePhone, address, contractorRole, joiningDate, bankAccount,
      bankCode, password, roleDetails
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !contractorRole) {
      return res.status(400).json({ 
        success: false, 
        message: "Required fields: name, email, phone, password, contractorRole" 
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

    // Create and save new User first to get the userId
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: "Contractor" 
    });
    await newUser.save();

    // Process uploaded files
    const photo = req.files?.photo ? `/uploads/${req.files.photo[0].filename}` : null;
    const contractorIdProof = req.files?.contractorIdProof 
      ? req.files.contractorIdProof.map(file => `/uploads/${file.filename}`) 
      : [];

    // Parse address objects if they're strings
    let parsedAddress = address;
    let parsedPermanentAddress = permanentAddress;
    let parsedRoleDetails = roleDetails;
    
    try {
      if (typeof address === 'string') parsedAddress = JSON.parse(address);
      if (typeof permanentAddress === 'string') parsedPermanentAddress = JSON.parse(permanentAddress);
      if (typeof roleDetails === 'string') parsedRoleDetails = JSON.parse(roleDetails);
    } catch (e) {
      console.log("Parsing error:", e);
    }

    // Create and save new Contractor record
    const newContractor = new Contractor({
      userId: newUser._id,
      name,
      email,
      gender,
      phone,
      alternatePhone,
      address: parsedAddress,
      role: "Contractor",
      contractorRole,
      joiningDate,
      roleDetails: parsedRoleDetails || {},
      bankAccount,
      bankCode,
      contractorIdProof,
      photo,
      password: hashedPassword
    });

    await newContractor.save();
    
    return res.status(201).json({ 
      success: true, 
      message: "Contractor added successfully", 
      data: newContractor 
    });
  } catch (error) {
    console.error("Error adding contractor:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Get All Contractors
export const getContractors = async (req, res) => {
  try {
    const { contractorRole } = req.query;
    const filter = {};
    
    if (contractorRole) {
      filter.contractorRole = contractorRole;
    }

    const contractors = await Contractor.find(filter)
      .populate("userId", "-password")
      .populate("roleDetails.centering.workers", "name phone")
      .populate("roleDetails.steel.workers", "name phone")
      .populate("roleDetails.mason.workers", "name phone")
      .populate("roleDetails.carpenter.workers", "name phone")
      .populate("roleDetails.plumber.workers", "name phone")
      .populate("roleDetails.electrician.workers", "name phone")
      .populate("roleDetails.painter.workers", "name phone")
      .populate("roleDetails.tiles.workers", "name phone")
      .lean();

    return res.status(200).json({ 
      success: true, 
      data: contractors 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
};

// ✅ Get One Contractor (by ID)
export const getContractorById = async (req, res) => {
  const { id } = req.params;
  try {
    // First try to find by _id (number)
    let contractor;
    if (!isNaN(id)) {
      contractor = await Contractor.findOne({ _id: parseInt(id) })
        .populate("userId", "-password")
        .populate("roleDetails.centering.workers", "name phone workerType")
        .populate("roleDetails.steel.workers", "name phone workerType")
        .populate("roleDetails.mason.workers", "name phone workerType")
        .populate("roleDetails.carpenter.workers", "name phone workerType")
        .populate("roleDetails.plumber.workers", "name phone workerType")
        .populate("roleDetails.electrician.workers", "name phone workerType")
        .populate("roleDetails.painter.workers", "name phone workerType")
        .populate("roleDetails.tiles.workers", "name phone workerType")
        .lean();
    }

    // If not found by _id, try by userId (number)
    if (!contractor) {
      contractor = await Contractor.findOne({ userId: parseInt(id) })
        .populate("userId", "-password")
        .populate("roleDetails.centering.workers", "name phone workerType")
        .populate("roleDetails.steel.workers", "name phone workerType")
        .populate("roleDetails.mason.workers", "name phone workerType")
        .populate("roleDetails.carpenter.workers", "name phone workerType")
        .populate("roleDetails.plumber.workers", "name phone workerType")
        .populate("roleDetails.electrician.workers", "name phone workerType")
        .populate("roleDetails.painter.workers", "name phone workerType")
        .populate("roleDetails.tiles.workers", "name phone workerType")
        .lean();
    }

    if (!contractor) {
      return res.status(404).json({ 
        success: false, 
        message: "Contractor not found" 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: contractor 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Update Contractor
export const updateContractor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find contractor by _id or userId
    let contractor;
    if (!isNaN(id)) {
      contractor = await Contractor.findOne({ _id: parseInt(id) });
      if (!contractor) {
        contractor = await Contractor.findOne({ userId: parseInt(id) });
      }
    }

    if (!contractor) {
      return res.status(404).json({ 
        success: false, 
        message: "Contractor not found" 
      });
    }

    // Update basic fields
    const fieldsToUpdate = [
      'name', 'email', 'gender', 'phone', 'alternatePhone', 
      'contractorRole', 'joiningDate', 'bankAccount', 'bankCode', 'roleDetails'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        // Special handling for roleDetails
        if (field === 'roleDetails') {
          try {
            contractor[field] = typeof updateData[field] === 'string' 
              ? JSON.parse(updateData[field]) 
              : updateData[field];
          } catch (e) {
            console.log("RoleDetails parsing error:", e);
          }
        } else {
          contractor[field] = updateData[field];
        }
      }
    });

    // Update address objects
    if (updateData.address) {
      try {
        contractor.address = typeof updateData.address === 'string' 
          ? JSON.parse(updateData.address) 
          : updateData.address;
      } catch (e) {
        console.log("Address parsing error:", e);
      }
    }

    if (updateData.permanentAddress) {
      try {
        contractor.permanentAddress = typeof updateData.permanentAddress === 'string' 
          ? JSON.parse(updateData.permanentAddress) 
          : updateData.permanentAddress;
      } catch (e) {
        console.log("Permanent address parsing error:", e);
      }
    }

    // Update files if uploaded
    if (req.files?.photo) {
      // Delete old photo if exists
      if (contractor.photo) {
        const oldPhotoPath = path.join(process.cwd(), 'public', contractor.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      contractor.photo = `/uploads/${req.files.photo[0].filename}`;
    }
    
    if (req.files?.contractorIdProof) {
      const newIdProofs = req.files.contractorIdProof.map(file => `/uploads/${file.filename}`);
      contractor.contractorIdProof = [...contractor.contractorIdProof, ...newIdProofs];
    }

    // Handle password update
    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      contractor.password = hashedPassword;
      
      // Also update user password
      await User.findOneAndUpdate(
        { _id: contractor.userId },
        { $set: { password: hashedPassword } }
      );
    }

    await contractor.save();
    
    // Also update the associated User record
    if (updateData.name || updateData.email) {
      await User.findOneAndUpdate(
        { _id: contractor.userId },
        {
          $set: {
            ...(updateData.name && { name: updateData.name }),
            ...(updateData.email && { email: updateData.email })
          }
        }
      );
    }

    return res.status(200).json({ 
      success: true, 
      message: "Contractor updated successfully", 
      data: contractor 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Delete Contractor
export const deleteContractor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find contractor by _id or userId
    let contractor;
    if (!isNaN(id)) {
      contractor = await Contractor.findOneAndDelete({ _id: parseInt(id) });
      if (!contractor) {
        contractor = await Contractor.findOneAndDelete({ userId: parseInt(id) });
      }
    }

    if (!contractor) {
      return res.status(404).json({ 
        success: false, 
        message: "Contractor not found" 
      });
    }

    // Delete associated user
    await User.findOneAndDelete({ _id: contractor.userId });

    // Clean up uploaded files
    if (contractor.photo) {
      const photoPath = path.join(process.cwd(), 'public', contractor.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    if (contractor.contractorIdProof && contractor.contractorIdProof.length > 0) {
      contractor.contractorIdProof.forEach(proof => {
        const proofPath = path.join(process.cwd(), 'public', proof);
        if (fs.existsSync(proofPath)) {
          fs.unlinkSync(proofPath);
        }
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Contractor deleted successfully" 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Remove ID Proof
export const removeIdProof = async (req, res) => {
  try {
    const { id, proofUrl } = req.params;

    // Find contractor by _id or userId
    let contractor;
    if (!isNaN(id)) {
      contractor = await Contractor.findOne({ _id: parseInt(id) });
      if (!contractor) {
        contractor = await Contractor.findOne({ userId: parseInt(id) });
      }
    }

    if (!contractor) {
      return res.status(404).json({ 
        success: false, 
        message: "Contractor not found" 
      });
    }

    // Remove the file from server
    const proofPath = path.join(process.cwd(), 'public', proofUrl);
    if (fs.existsSync(proofPath)) {
      fs.unlinkSync(proofPath);
    }

    // Filter out the proof to be removed
    contractor.contractorIdProof = contractor.contractorIdProof.filter(
      proof => proof !== proofUrl
    );

    await contractor.save();

    return res.status(200).json({ 
      success: true, 
      message: "ID proof removed successfully",
      data: contractor.contractorIdProof
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Get Contractors by Role
export const getContractorsByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    if (![
      'Centering Contractor', 
      'Steel Contractor', 
      'Mason Contractor', 
      'Carpenter Contractor', 
      'Plumber Contractor', 
      'Electrician Contractor', 
      'Painter Contractor', 
      'Tiles Contractor'
    ].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contractor role"
      });
    }

    const contractors = await Contractor.find({ contractorRole: role })
      .populate("userId", "-password")
      .populate("roleDetails.centering.workers", "name phone")
      .populate("roleDetails.steel.workers", "name phone")
      .populate("roleDetails.mason.workers", "name phone")
      .populate("roleDetails.carpenter.workers", "name phone")
      .populate("roleDetails.plumber.workers", "name phone")
      .populate("roleDetails.electrician.workers", "name phone")
      .populate("roleDetails.painter.workers", "name phone")
      .populate("roleDetails.tiles.workers", "name phone")
      .lean();

    return res.status(200).json({
      success: true,
      data: contractors
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Add Worker to Contractor
export const addWorkerToContractor = async (req, res) => {
  try {
    const { contractorId, workerId } = req.params;

    // Find contractor
    const contractor = await Contractor.findOne({ 
      $or: [
        { _id: parseInt(contractorId) },
        { userId: parseInt(contractorId) }
      ]
    });

    if (!contractor) {
      return res.status(404).json({
        success: false,
        message: "Contractor not found"
      });
    }

    // Determine which roleDetails field to update based on contractorRole
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
      return res.status(400).json({
        success: false,
        message: "Invalid contractor role"
      });
    }

    // Add worker to the appropriate roleDetails
    if (!contractor.roleDetails[roleField].workers.includes(workerId)) {
      contractor.roleDetails[roleField].workers.push(workerId);
      await contractor.save();
    }

    return res.status(200).json({
      success: true,
      message: "Worker added to contractor successfully",
      data: contractor
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Remove Worker from Contractor
export const removeWorkerFromContractor = async (req, res) => {
  try {
    const { contractorId, workerId } = req.params;

    // Find contractor
    const contractor = await Contractor.findOne({ 
      $or: [
        { _id: parseInt(contractorId) },
        { userId: parseInt(contractorId) }
      ]
    });

    if (!contractor) {
      return res.status(404).json({
        success: false,
        message: "Contractor not found"
      });
    }

    // Determine which roleDetails field to update based on contractorRole
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
      return res.status(400).json({
        success: false,
        message: "Invalid contractor role"
      });
    }

    // Remove worker from the appropriate roleDetails
    contractor.roleDetails[roleField].workers = 
      contractor.roleDetails[roleField].workers.filter(id => id.toString() !== workerId);
    
    await contractor.save();

    return res.status(200).json({
      success: true,
      message: "Worker removed from contractor successfully",
      data: contractor
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
