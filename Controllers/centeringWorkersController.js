// controllers/workerController.js
import Worker from "../models/CenteringWorkers.js";
import User from "../models/User.js";
import Site from "../models/SiteDetails.js";
import Contractor from "../models/Contractor.js";
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
  { name: "centeringWorkerIdProof", maxCount: 5 },
]);

// POST - Create a new Centering Worker
export const createWorker = async (req, res) => {
  try {
    const {
      name, email, phone, alternatePhone, address,
      centeringWorkerType, joiningDate, bankDetails,
      password, site, centeringContractor
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Required fields: name, email, password" 
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

    // Validate centering contractor exists
    const contractorExists = await Contractor.findById(centeringContractor);
    if (!contractorExists || contractorExists.contractorRole !== 'Centering Contractor') {
      return res.status(404).json({
        success: false,
        message: "Valid Centering Contractor not found"
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
      role: "Worker"
    });
    await newUser.save();

    // Process uploaded files
    const photo = req.files?.photo ? `/uploads/${req.files.photo[0].filename}` : null;
    const centeringWorkerIdProof = req.files?.centeringWorkerIdProof 
      ? req.files.centeringWorkerIdProof.map(file => `/uploads/${file.filename}`) 
      : [];

    // Parse address and bankDetails if they're strings
    let parsedAddress = address;
    let parsedBankDetails = bankDetails;
    
    try {
      if (typeof address === 'string') parsedAddress = JSON.parse(address);
      if (typeof bankDetails === 'string') parsedBankDetails = JSON.parse(bankDetails);
    } catch (e) {
      console.log("Parsing error:", e);
      return res.status(400).json({
        success: false,
        message: "Invalid address or bank details format. Please provide valid JSON"
      });
    }

    // Create and save new Worker record
    const newWorker = new Worker({
      userId: newUser._id,
      name,
      password: hashedPassword,
      email,
      phone,
      alternatePhone,
      address: parsedAddress,
      centeringWorkerType,
      joiningDate,
      bankDetails: parsedBankDetails,
      centeringWorkerIdProof,
      photo,
      site,
      centeringContractor
    });

    await newWorker.save();

    // Populate site and contractor details in the response
    const populatedWorker = await Worker.findById(newWorker._id)
      .populate('site')
      .populate('centeringContractor')
      .lean();

    res.status(201).json({
      success: true,
      message: "Centering Worker created successfully",
      data: populatedWorker
    });

  } catch (error) {
    console.error("Error creating worker:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// GET - Get all Centering Workers with site and contractor details
export const getAllWorkers = async (req, res) => {
  try {
    const { search = '', site, contractor, workerType } = req.query;

    const query = { 
      role: "Worker",
      centeringWorkerType: { $ne: null } // Only centering workers
    };
    
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
    
    if (contractor) {
      query.centeringContractor = contractor;
    }
    
    if (workerType) {
      query.centeringWorkerType = workerType;
    }

    const workers = await Worker.find(query)
      .populate('site')
      .populate('centeringContractor')
      .lean();

    res.status(200).json({ 
      success: true, 
      data: workers
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: error.message 
    });
  }
};

// GET - Get Centering Worker by ID with full details
export const getWorkerById = async (req, res) => {
  const { id } = req.params;
  try {
    let worker;

    // First try as numeric ID
    if (!isNaN(id)) {
      worker = await Worker.findOne({ 
        _id: Number(id),
        centeringWorkerType: { $ne: null } // Only centering workers
      })
        .populate('site')
        .populate('centeringContractor')
        .lean();
    }
    
    // If not found, try as userId
    if (!worker && !isNaN(id)) {
      worker = await Worker.findOne({ 
        userId: Number(id),
        centeringWorkerType: { $ne: null } // Only centering workers
      })
        .populate('site')
        .populate('centeringContractor')
        .lean();
    }

    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Centering Worker not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: worker
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// PUT - Update Centering Worker by ID
export const updateWorkerById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    let worker;
    
    // First try as numeric ID (worker _id)
    if (!isNaN(id)) {
      worker = await Worker.findOne({ 
        _id: Number(id),
        centeringWorkerType: { $ne: null } // Only centering workers
      });
    }
    
    // If not found, try as userId
    if (!worker && !isNaN(id)) {
      worker = await Worker.findOne({ 
        userId: Number(id),
        centeringWorkerType: { $ne: null } // Only centering workers
      });
    }

    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Centering Worker not found" 
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
      worker.site = updateData.site;
    }

    // Validate contractor if being updated
    if (updateData.centeringContractor) {
      const contractorExists = await Contractor.findById(updateData.centeringContractor);
      if (!contractorExists || contractorExists.contractorRole !== 'Centering Contractor') {
        return res.status(404).json({
          success: false,
          message: "Valid Centering Contractor not found"
        });
      }
      worker.centeringContractor = updateData.centeringContractor;
    }

    // Update other fields
    const fieldsToUpdate = [
      'name', 'email', 'phone', 'alternatePhone', 'address',
      'centeringWorkerType', 'joiningDate', 'bankDetails'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        // Parse address and bankDetails if they're strings
        if (field === 'address' || field === 'bankDetails') {
          try {
            if (typeof updateData[field] === 'string') {
              worker[field] = JSON.parse(updateData[field]);
            } else {
              worker[field] = updateData[field];
            }
          } catch (e) {
            console.log(`Error parsing ${field}:`, e);
            throw new Error(`Invalid ${field} format. Please provide valid JSON`);
          }
        } else {
          worker[field] = updateData[field];
        }
      }
    });

    // Update password if provided
    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      worker.password = hashedPassword;
      await User.findOneAndUpdate(
        { _id: worker.userId }, 
        { password: hashedPassword }
      );
    }

    // Update files if uploaded
    if (req.files?.photo) {
      if (worker.photo) {
        const oldPhotoPath = path.join(process.cwd(), 'public', worker.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      worker.photo = `/uploads/${req.files.photo[0].filename}`;
    }
    
    if (req.files?.centeringWorkerIdProof) {
      const newIdProofs = req.files.centeringWorkerIdProof.map(file => `/uploads/${file.filename}`);
      worker.centeringWorkerIdProof = [...worker.centeringWorkerIdProof, ...newIdProofs];
    }

    worker.updatedAt = new Date();
    await worker.save();
    
    // Update the associated User record
    const userUpdate = {};
    if (updateData.name) userUpdate.name = updateData.name;
    if (updateData.email) userUpdate.email = updateData.email;
    
    if (Object.keys(userUpdate).length > 0) {
      await User.findOneAndUpdate(
        { _id: worker.userId }, 
        { $set: userUpdate }
      );
    }

    // Get updated worker with populated details
   const updatedWorker = await Worker.findById(worker._id)
      .populate('site')
      .populate('centeringContractor')
      .lean();

    res.status(200).json({ 
      success: true, 
      message: "Centering Worker updated successfully", 
      data: updatedWorker 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// DELETE - Delete Centering Worker by ID
export const deleteWorkerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let worker;
    
    // First try as numeric ID (worker _id)
    if (!isNaN(id)) {
      worker = await Worker.findOneAndDelete({ 
        _id: Number(id),
        centeringWorkerType: { $ne: null } // Only centering workers
      });
    }
    
    // If not found, try as userId
    if (!worker && !isNaN(id)) {
      worker = await Worker.findOneAndDelete({ 
        userId: Number(id),
        centeringWorkerType: { $ne: null } // Only centering workers
      });
    }

    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Centering Worker not found" 
      });
    }

    // Delete associated user
    await User.findOneAndDelete({ _id: worker.userId });

    // Delete associated files
    if (worker.photo) {
      const photoPath = path.join(process.cwd(), 'public', worker.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    if (worker.centeringWorkerIdProof?.length > 0) {
      worker.centeringWorkerIdProof.forEach(proof => {
        const proofPath = path.join(process.cwd(), 'public', proof);
        if (fs.existsSync(proofPath)) {
          fs.unlinkSync(proofPath);
        }
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Centering Worker deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// DELETE - Delete all Centering Workers (for development only)
export const deleteAllWorkers = async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: "This operation is only allowed in development environment"
      });
    }

    const workers = await Worker.find({ 
      centeringWorkerType: { $ne: null } // Only centering workers
    });

    // Delete all associated users and files
    for (const worker of workers) {
      await User.findOneAndDelete({ _id: worker.userId });

      if (worker.photo) {
        const photoPath = path.join(process.cwd(), 'public', worker.photo);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }

      if (worker.centeringWorkerIdProof?.length > 0) {
        worker.centeringWorkerIdProof.forEach(proof => {
          const proofPath = path.join(process.cwd(), 'public', proof);
          if (fs.existsSync(proofPath)) {
            fs.unlinkSync(proofPath);
          }
        });
      }
    }

    // Delete all centering workers
    const result = await Worker.deleteMany({ 
      centeringWorkerType: { $ne: null } // Only centering workers
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} Centering Workers successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};