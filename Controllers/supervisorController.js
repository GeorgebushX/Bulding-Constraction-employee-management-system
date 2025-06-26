

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
export const upload = multer({ storage }).fields([
  { name: "photo", maxCount: 1 },
  { name: "supervisorIdProof", maxCount: 5 }, // Allow multiple ID proofs
]);

// ✅ Add Supervisor Function
export const addSupervisor = async (req, res) => {
  try {
    const {
      name, email, dateOfBirth, gender, phone, maritalStatus,
      nationality, bloodGroup, alternatePhone, address,
      permanentAddress, role, joiningDate, bankAccount,
      bankCode, password
    } = req.body;

    // Validate required fields
    if (!name || !email || !dateOfBirth || !gender || !phone || 
        !role || !joiningDate || !password) {
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
      role: "Supervisor" // Force role to Supervisor
    });
    await newUser.save();

    // Process uploaded files
    const photo = req.files?.photo ? `/uploads/${req.files.photo[0].filename}` : null;
    const supervisorIdProof = req.files?.supervisorIdProof 
      ? req.files.supervisorIdProof.map(file => `/uploads/${file.filename}`) 
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

    // Create and save new Supervisor record
    const newSupervisor = new Supervisor({
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
      joiningDate,
      bankAccount,
      bankCode,
      supervisorIdProof,
      photo,
      password: hashedPassword
    });

    await newSupervisor.save();
    return res.status(201).json({ 
      success: true, 
      message: "Supervisor added successfully", 
      data: newSupervisor 
    });
  } catch (error) {
    console.error("Error adding supervisor:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Get All Supervisors
export const getSupervisors = async (req, res) => {
  try {
    const supervisors = await Supervisor.find()
      .populate("userId", "-password")
      .lean();

    return res.status(200).json({ 
      success: true, 
      data: supervisors 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
};

// ✅ Get One Supervisor (by ID)
export const getSupervisorById = async (req, res) => {
  const { id } = req.params;
  try {
    let supervisor = await Supervisor.findById(id)
      .populate("userId", "-password")
      .lean();

    // If supervisor by `_id` is not found, check by `userId`
    if (!supervisor) {
      supervisor = await Supervisor.findOne({ userId: id })
        .populate("userId", "-password")
        .lean();
    }

    if (!supervisor) {
      return res.status(404).json({ 
        success: false, 
        message: "Supervisor not found" 
      });
    }

    return res.status(200).json({ 
      success: true, 
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

// ✅ Update Supervisor
export const updateSupervisor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const supervisor = await Supervisor.findById(id);
    if (!supervisor) {
      return res.status(404).json({ 
        success: false, 
        message: "Supervisor not found" 
      });
    }

    // Update basic fields
    const fieldsToUpdate = [
      'name', 'email', 'dateOfBirth', 'gender', 'phone', 'maritalStatus',
      'nationality', 'bloodGroup', 'alternatePhone', 'role', 'joiningDate',
      'bankAccount', 'bankCode'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        supervisor[field] = updateData[field];
      }
    });

    // Update address objects
    if (updateData.address) {
      try {
        supervisor.address = typeof updateData.address === 'string' 
          ? JSON.parse(updateData.address) 
          : updateData.address;
      } catch (e) {
        console.log("Address parsing error:", e);
      }
    }

    if (updateData.permanentAddress) {
      try {
        supervisor.permanentAddress = typeof updateData.permanentAddress === 'string' 
          ? JSON.parse(updateData.permanentAddress) 
          : updateData.permanentAddress;
      } catch (e) {
        console.log("Permanent address parsing error:", e);
      }
    }

    // Update files if uploaded
    if (req.files?.photo) {
      supervisor.photo = `/uploads/${req.files.photo[0].filename}`;
    }
    
    if (req.files?.supervisorIdProof) {
      const newIdProofs = req.files.supervisorIdProof.map(file => `/uploads/${file.filename}`);
      supervisor.supervisorIdProof = [...supervisor.supervisorIdProof, ...newIdProofs];
    }

    await supervisor.save();
    
    // Also update the associated User record
    if (updateData.name || updateData.email) {
      await User.findByIdAndUpdate(supervisor.userId, {
        $set: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.email && { email: updateData.email })
        }
      });
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

// ✅ Delete Supervisor
export const deleteSupervisor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find supervisor and delete
    const supervisor = await Supervisor.findByIdAndDelete(id);
    if (!supervisor) {
      return res.status(404).json({ 
        success: false, 
        message: "Supervisor not found" 
      });
    }

    // Delete associated user
    await User.findByIdAndDelete(supervisor.userId);

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

// ✅ Remove ID Proof
export const removeIdProof = async (req, res) => {
  try {
    const { id, proofUrl } = req.params;

    const supervisor = await Supervisor.findById(id);
    if (!supervisor) {
      return res.status(404).json({ 
        success: false, 
        message: "Supervisor not found" 
      });
    }

    // Filter out the proof to be removed
    supervisor.supervisorIdProof = supervisor.supervisorIdProof.filter(
      proof => proof !== proofUrl
    );

    await supervisor.save();

    return res.status(200).json({ 
      success: true, 
      message: "ID proof removed successfully",
      data: supervisor.supervisorIdProof
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};