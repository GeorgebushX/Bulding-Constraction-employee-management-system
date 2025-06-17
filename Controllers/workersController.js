import Worker from "../models/Workers.js";
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
  { name: "workerIdProof", maxCount: 5 }, // Allow multiple ID proofs
]);

// ✅ Add Worker Function
export const addWorker = async (req, res) => {
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
      role: "Worker" // Force role to Worker
    });
    await newUser.save();

    // Process uploaded files
    const photo = req.files?.photo ? `/uploads/${req.files.photo[0].filename}` : null;
    const workerIdProof = req.files?.workerIdProof 
      ? req.files.workerIdProof.map(file => `/uploads/${file.filename}`) 
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

    // Create and save new Worker record
    const newWorker = new Worker({
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
      workerIdProof,
      photo,
      password: hashedPassword
    });

    await newWorker.save();
    return res.status(201).json({ 
      success: true, 
      message: "Worker added successfully", 
      data: newWorker 
    });
  } catch (error) {
    console.error("Error adding worker:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Get All Workers
export const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find()
      .populate("userId", "-password")
      .lean();

    return res.status(200).json({ 
      success: true, 
      data: workers 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
};

// ✅ Get One Worker (by ID)
export const getWorkerById = async (req, res) => {
  const { id } = req.params;
  try {
    let worker = await Worker.findById(id)
      .populate("userId", "-password")
      .lean();

    // If worker by `_id` is not found, check by `userId`
    if (!worker) {
      worker = await Worker.findOne({ userId: id })
        .populate("userId", "-password")
        .lean();
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
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Update Worker
export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Worker not found" 
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
        worker[field] = updateData[field];
      }
    });

    // Update address objects
    if (updateData.address) {
      try {
        worker.address = typeof updateData.address === 'string' 
          ? JSON.parse(updateData.address) 
          : updateData.address;
      } catch (e) {
        console.log("Address parsing error:", e);
      }
    }

    if (updateData.permanentAddress) {
      try {
        worker.permanentAddress = typeof updateData.permanentAddress === 'string' 
          ? JSON.parse(updateData.permanentAddress) 
          : updateData.permanentAddress;
      } catch (e) {
        console.log("Permanent address parsing error:", e);
      }
    }

    // Update files if uploaded
    if (req.files?.photo) {
      worker.photo = `/uploads/${req.files.photo[0].filename}`;
    }
    
    if (req.files?.workerIdProof) {
      const newIdProofs = req.files.workerIdProof.map(file => `/uploads/${file.filename}`);
      worker.workerIdProof = [...worker.workerIdProof, ...newIdProofs];
    }

    await worker.save();
    
    // Also update the associated User record
    if (updateData.name || updateData.email) {
      await User.findByIdAndUpdate(worker.userId, {
        $set: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.email && { email: updateData.email })
        }
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Worker updated successfully", 
      data: worker 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Delete Worker
export const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find worker and delete
    const worker = await Worker.findByIdAndDelete(id);
    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Worker not found" 
      });
    }

    // Delete associated user
    await User.findByIdAndDelete(worker.userId);

    return res.status(200).json({ 
      success: true, 
      message: "Worker deleted successfully" 
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

    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Worker not found" 
      });
    }

    // Filter out the proof to be removed
    worker.workerIdProof = worker.workerIdProof.filter(
      proof => proof !== proofUrl
    );

    await worker.save();

    return res.status(200).json({ 
      success: true, 
      message: "ID proof removed successfully",
      data: worker.workerIdProof
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};