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
  { name: "contractorIdProof", maxCount: 5 }, // Allow multiple ID proofs
]);

// ✅ Add Contractor Function
export const addContractor = async (req, res) => {
  try {
    const {
      name, email, dateOfBirth, gender, phone, maritalStatus,
      nationality, bloodGroup, alternatePhone, address,
      permanentAddress, role,contractorType, joiningDate, bankAccount,
      bankCode, password
    } = req.body;

  // Validate required fields
if (!name || !email || !dateOfBirth || !gender || !phone || 
  !role || !contractorType || !joiningDate || !password) {
return res.status(400).json({ 
  success: false, 
  message: "Required fields: name, email, dateOfBirth, gender, phone, role, joiningDate, password" 
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
      role: "Contractor" // Force role to Contractor
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
    
    try {
      if (typeof address === 'string') parsedAddress = JSON.parse(address);
      if (typeof permanentAddress === 'string') parsedPermanentAddress = JSON.parse(permanentAddress);
    } catch (e) {
      console.log("Address parsing error:", e);
    }

    // Create and save new Contractor record
    const newContractor = new Contractor({
      userId: newUser._id,
      name,
      email,
      dateOfBirth,
      gender,
      maritalStatus,
      nationality,
      bloodGroup,
      phone,
      alternatePhone,
      address: parsedAddress,
      permanentAddress: parsedPermanentAddress,
      role,
      contractorType,
      joiningDate,
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
    const contractors = await Contractor.find()
      .populate("userId", "-password")
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
    let contractor = await Contractor.findById(id)
      .populate("userId", "-password")
      .lean();

    // If contractor by `_id` is not found, check by `userId`
    if (!contractor) {
      contractor = await Contractor.findOne({ userId: id })
        .populate("userId", "-password")
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

    const contractor = await Contractor.findById(id);
    if (!contractor) {
      return res.status(404).json({ 
        success: false, 
        message: "Contractor not found" 
      });
    }

    // Update basic fields
    const fieldsToUpdate = [
      'name', 'email', 'dateOfBirth', 'gender', 'phone', 'maritalStatus',
      'nationality', 'bloodGroup', 'alternatePhone', 'role','contractorType', 'joiningDate',
      'bankAccount', 'bankCode'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        contractor[field] = updateData[field];
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
      contractor.photo = `/uploads/${req.files.photo[0].filename}`;
    }
    
    if (req.files?.contractorIdProof) {
      const newIdProofs = req.files.contractorIdProof.map(file => `/uploads/${file.filename}`);
      contractor.contractorIdProof = [...contractor.contractorIdProof, ...newIdProofs];
    }

    await contractor.save();
    
    // Also update the associated User record
    if (updateData.name || updateData.email) {
      await User.findByIdAndUpdate(contractor.userId, {
        $set: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.email && { email: updateData.email })
        }
      });
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
    
    // Find contractor and delete
    const contractor = await Contractor.findByIdAndDelete(id);
    if (!contractor) {
      return res.status(404).json({ 
        success: false, 
        message: "Contractor not found" 
      });
    }

    // Delete associated user
    await User.findByIdAndDelete(contractor.userId);

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

    const contractor = await Contractor.findById(id);
    if (!contractor) {
      return res.status(404).json({ 
        success: false, 
        message: "Contractor not found" 
      });
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