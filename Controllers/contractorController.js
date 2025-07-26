
// controllers/contractorController.js
import Contractor from "../models/Contractor.js";
import User from "../models/User.js";
import Site from "../models/SiteDetails.js";
import Supervisor from "../models/Supervisor.js";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

// Mapping between contractor roles and supervisor types
const ROLE_MAPPING = {
  'Centering Contractor': 'Centering Supervisor',
  'Steel Contractor': 'Steel Supervisor',
  'Mason Contractor': 'Mason Supervisor',
  'Carpenter Contractor': 'Carpenter Supervisor',
  'Plumber Contractor': 'Plumber Supervisor',
  'Electrician Contractor': 'Electrician Supervisor',
  'Painter Contractor': 'Painter Supervisor',
  'Tiles Contractor': 'Tiles Supervisor'
};

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
  { name: "contractorIdProof", maxCount: 5 },
]);

// GET - Get supervisors by contractor role
export const getSupervisorsByContractorRole = async (req, res) => {
  try {
    const { contractorRole } = req.params;
    
    if (!ROLE_MAPPING[contractorRole]) {
      return res.status(400).json({
        success: false,
        message: "Invalid contractor role"
      });
    }
    
    const supervisorType = ROLE_MAPPING[contractorRole];
    const supervisors = await Supervisor.find({ 
      supervisorType,
      site: req.query.siteName // optional siteName filter
    }).select('_id name email phone site').populate('site', 'name');
    
    res.status(200).json({
      success: true,
      data: supervisors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// POST - Create a new Contractor with supervisorName (site derived from supervisor)
export const createContractor = async (req, res) => {
  try {
    const {
      name, email, gender, phone, alternatePhone, address,
      joiningDate, bankName, bankAccount, bankCode, password, perDaySalary,
      supervisorName, contractorRole
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !contractorRole || !supervisorName) {
      return res.status(400).json({ 
        success: false, 
        message: "Required fields: name, email, password, supervisorName, contractorRole" 
      });
    }

    // Validate contractor role
    if (!ROLE_MAPPING[contractorRole]) {
      return res.status(400).json({
        success: false,
        message: "Invalid contractor role"
      });
    }

    // Find supervisor by name
    const expectedSupervisorType = ROLE_MAPPING[contractorRole];
    const supervisor = await Supervisor.findOne({ 
      name: supervisorName,
      supervisorType: expectedSupervisorType
    }).populate('site');
    
    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: `Supervisor not found with name '${supervisorName}' and type '${expectedSupervisorType}'`
      });
    }

    // Get site from supervisor
    const site = supervisor.site;
    if (!site) {
      return res.status(400).json({
        success: false,
        message: "Supervisor is not assigned to any site"
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
      role: "Contractor"
    });
    await newUser.save();

    // Process uploaded files
    const photo = req.files?.photo ? `/uploads/${req.files.photo[0].filename}` : null;
    const contractorIdProof = req.files?.contractorIdProof 
      ? req.files.contractorIdProof.map(file => `/uploads/${file.filename}`) 
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

    // Create and save new Contractor record
    const newContractor = new Contractor({
      userId: newUser._id,
      name,
      password: hashedPassword,
      gender,
      email,
      phone,
      alternatePhone,
      address: parsedAddress,
      role: "Contractor",
      contractorRole,
      joiningDate,
      bankName,
      bankAccount,
      bankCode,
      contractorIdProof,
      photo,
      perDaySalary,
      site: site._id,
      supervisorId: supervisor._id
    });

    await newContractor.save();

    // Populate site and supervisor details in the response
    const populatedContractor = await Contractor.findById(newContractor._id)
      .populate('site')
      .populate('supervisorId')
      .lean();

    res.status(201).json({
      success: true,
      message: "Contractor created successfully",
      data: populatedContractor
    });

  } catch (error) {
    console.error("Error creating contractor:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// GET - Get all Contractors with site and supervisor details
export const getAllContractors = async (req, res) => {
  try {
    const { search = '', site, supervisor, role } = req.query;

    const query = { role: "Contractor" };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (site) {
      const siteDoc = await Site.findOne({ name: site });
      if (siteDoc) {
        query.site = siteDoc._id;
      } else {
        return res.status(404).json({
          success: false,
          message: "Site not found"
        });
      }
    }
    
    if (supervisor) {
      const supervisorDoc = await Supervisor.findOne({ name: supervisor });
      if (supervisorDoc) {
        query.supervisorId = supervisorDoc._id;
      } else {
        return res.status(404).json({
          success: false,
          message: "Supervisor not found"
        });
      }
    }

    if (role) {
      query.contractorRole = role;
    }

    const contractors = await Contractor.find(query)
      .populate('site')
      .populate('supervisorId')
      .lean();

    res.status(200).json({ 
      success: true, 
      data: contractors
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: error.message 
    });
  }
};

// GET - Get Contractor by ID with full details
export const getContractorById = async (req, res) => {
  const { id } = req.params;
  try {
    let contractor;

    // First try as numeric ID
    if (!isNaN(id)) {
      contractor = await Contractor.findOne({ 
        _id: Number(id), 
        role: "Contractor"
      })
        .populate('site', 'name')
        .populate('supervisorId', 'name')
        .lean();
    }
    
    // If not found, try as userId
    if (!contractor && !isNaN(id)) {
      contractor = await Contractor.findOne({ 
        userId: Number(id), 
        role: "Contractor"
      })
        .populate('site', 'name')
        .populate('supervisorId', 'name')
        .lean();
    }

    if (!contractor) {
      return res.status(404).json({ 
        success: false, 
        message: "Contractor not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: contractor
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// PUT - Update Contractor by ID with supervisorName (site derived from supervisor)
export const updateContractorById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    let contractor;
    
    // First try as numeric ID (contractor _id)
    if (!isNaN(id)) {
      contractor = await Contractor.findOne({ 
        _id: Number(id), 
        role: "Contractor"
      });
    }
    
    // If not found, try as userId
    if (!contractor && !isNaN(id)) {
      contractor = await Contractor.findOne({ 
        userId: Number(id), 
        role: "Contractor"
      });
    }

    if (!contractor) {
      return res.status(404).json({ 
        success: false, 
        message: "Contractor not found" 
      });
    }

    // Validate contractor role if being updated
    if (updateData.contractorRole) {
      if (!ROLE_MAPPING[updateData.contractorRole]) {
        return res.status(400).json({
          success: false,
          message: "Invalid contractor role"
        });
      }
    }

    // Handle supervisor name update - this will also update the site
    if (updateData.supervisorName) {
      const expectedSupervisorType = ROLE_MAPPING[updateData.contractorRole || contractor.contractorRole];
      const supervisor = await Supervisor.findOne({ 
        name: updateData.supervisorName,
        supervisorType: expectedSupervisorType
      }).populate('site');
      
      if (!supervisor) {
        return res.status(404).json({
          success: false,
          message: `Supervisor not found with name '${updateData.supervisorName}' and type '${expectedSupervisorType}'`
        });
      }

      if (!supervisor.site) {
        return res.status(400).json({
          success: false,
          message: "Supervisor is not assigned to any site"
        });
      }

      contractor.supervisorId = supervisor._id;
      contractor.site = supervisor.site._id; // Update site from supervisor
    }

    // Prevent direct siteName updates
    if (updateData.siteName) {
      return res.status(400).json({
        success: false,
        message: "Cannot directly update siteName. Update supervisorName instead to change site."
      });
    }

    // Update other fields
    const fieldsToUpdate = [
      'name', 'email', 'gender', 'phone', 'alternatePhone', 'address',
      'joiningDate', 'bankName', 'bankAccount', 'bankCode', 'contractorRole',
      'perDaySalary'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        contractor[field] = updateData[field];
      }
    });

    // Update password if provided
    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      contractor.password = hashedPassword;
      await User.findOneAndUpdate(
        { _id: contractor.userId }, 
        { password: hashedPassword }
      );
    }

    // Update files if uploaded
    if (req.files?.photo) {
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

    contractor.updatedAt = new Date().toISOString();
    await contractor.save();
    
    // Update the associated User record
    const userUpdate = {};
    if (updateData.name) userUpdate.name = updateData.name;
    if (updateData.email) userUpdate.email = updateData.email;
    
    if (Object.keys(userUpdate).length > 0) {
      await User.findOneAndUpdate(
        { _id: contractor.userId }, 
        { $set: userUpdate }
      );
    }

    // Get updated contractor with populated details
    const updatedContractor = await Contractor.findById(contractor._id)
      .populate('site', 'name')
      .populate('supervisorId', 'name')
      .lean();

    res.status(200).json({ 
      success: true, 
      message: "Contractor updated successfully", 
      data: updatedContractor 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// DELETE - Delete Contractor by ID
export const deleteContractorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let contractor;
    
    // First try as numeric ID (contractor _id)
    if (!isNaN(id)) {
      contractor = await Contractor.findOneAndDelete({ 
        _id: Number(id), 
        role: "Contractor"
      });
    }
    
    // If not found, try as userId
    if (!contractor && !isNaN(id)) {
      contractor = await Contractor.findOneAndDelete({ 
        userId: Number(id), 
        role: "Contractor"
      });
    }

    if (!contractor) {
      return res.status(404).json({ 
        success: false, 
        message: "Contractor not found" 
      });
    }

    // Delete associated user
    await User.findOneAndDelete({ _id: contractor.userId });

    // Delete associated files
    if (contractor.photo) {
      const photoPath = path.join(process.cwd(), 'public', contractor.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    if (contractor.contractorIdProof?.length > 0) {
      contractor.contractorIdProof.forEach(proof => {
        const proofPath = path.join(process.cwd(), 'public', proof);
        if (fs.existsSync(proofPath)) {
          fs.unlinkSync(proofPath);
        }
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Contractor deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};