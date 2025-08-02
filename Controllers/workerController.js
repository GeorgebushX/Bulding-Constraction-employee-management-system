import mongoose from 'mongoose';
import Worker from '../models/WorkersModel.js';
import User from '../models/User.js';
import Contractor from '../models/Contractor.js';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Mapping between worker roles and valid sub-roles
const WORKER_ROLE_MAPPING = {
  'Centering Worker': ['Fitter', 'Helper', 'Temporary Centering Worker'],
  'Steel Worker': ['Fitter', 'Helper', 'Temporary Steel Worker'],
  'Mason Worker': ['Mason', 'Chiseler', 'Material Handler', 'Temporary Worker'],
  'Carpenter Worker': ['Fitter', 'Helper', 'Temporary Carpenter'],
  'Plumber Worker': ['Plumber', 'Helper', 'Temporary Plumber'],
  'Electrician Worker': ['Electrician', 'Helper', 'Temporary Electrician'],
  'Painter Worker': ['Painter', 'Helper', 'Temporary Painter'],
  'Tiles Worker': ['Fitter', 'Helper', 'Temporary Tiles Worker']
};

// Mapping between worker roles and contractor roles
const ROLE_MAPPING = {
  'Centering Worker': 'Centering Contractor',
  'Steel Worker': 'Steel Contractor',
  'Mason Worker': 'Mason Contractor',
  'Carpenter Worker': 'Carpenter Contractor',
  'Plumber Worker': 'Plumber Contractor',
  'Electrician Worker': 'Electrician Contractor',
  'Painter Worker': 'Painter Contractor',
  'Tiles Worker': 'Tiles Contractor'
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
  { name: "workersIdProof", maxCount: 5 },
]);

// Helper function to validate worker role and sub-role
const validateWorkerRoles = (workerRole, workerSubRole) => {
  if (!WORKER_ROLE_MAPPING[workerRole]) {
    return { valid: false, message: `Invalid worker role. Valid roles are: ${Object.keys(WORKER_ROLE_MAPPING).join(', ')}` };
  }
  
  if (workerSubRole && !WORKER_ROLE_MAPPING[workerRole].includes(workerSubRole)) {
    return { valid: false, message: `Invalid sub-role for ${workerRole}. Valid sub-roles are: ${WORKER_ROLE_MAPPING[workerRole].join(', ')}` };
  }
  
  return { valid: true };
};

// Helper function to get contractor by name and role
const getContractorByNameAndRole = async (contractorName, workerRole) => {
  const contractorRole = ROLE_MAPPING[workerRole];
  if (!contractorRole) {
    return null;
  }
  
  return await Contractor.findOne({ 
    name: contractorName,
    contractorRole: contractorRole
  });
};

// // GET - Get all workers
// export const getAllWorkers = async (req, res) => {
//   try {
//     const { search = '', site, contractor, role } = req.query;

//     const query = { role: "Worker" };
    
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { email: { $regex: search, $options: 'i' } },
//         { phone: { $regex: search, $options: 'i' } }
//       ];
//     }
    
//     if (site) {
//       query.site = site;
//     }
    
//     if (contractor) {
//       const contractorDoc = await Contractor.findOne({ name: contractor });
//       if (contractorDoc) {
//         query.contractorId = contractorDoc._id;
//       } else {
//         return res.status(404).json({
//           success: false,
//           message: "Contractor not found"
//         });
//       }
//     }

//     if (role) {
//       query.workerRole = role;
//     }

//     const workers = await Worker.find(query)
//       .populate('site', 'name')
//       .populate('contractorId', 'name contractorRole')
//       .lean();

//     res.status(200).json({ 
//       success: true, 
//       data: workers
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: "Server Error", 
//       error: error.message 
//     });
//   }
// };

// GET - Get all workers
export const getAllWorkers = async (req, res) => {
  try {
    const { search = '', site, contractor, role } = req.query;

    // Start with a base query that only looks for workers
    const query = { role: "Worker" };
    
    // Add search criteria if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add site filter if provided
    if (site) {
      if (mongoose.Types.ObjectId.isValid(site)) {
        query.site = new mongoose.Types.ObjectId(site);
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid site ID format"
        });
      }
    }
    
    // Add contractor filter if provided
    if (contractor) {
      const contractorDoc = await Contractor.findOne({ 
        $or: [
          { name: contractor },
          { _id: mongoose.Types.ObjectId.isValid(contractor) ? new mongoose.Types.ObjectId(contractor) : null }
        ]
      });
      
      if (contractorDoc) {
        query.contractorId = contractorDoc._id;
      } else {
        return res.status(404).json({
          success: false,
          message: "Contractor not found"
        });
      }
    }

    // Add role filter if provided
    if (role) {
      if (Object.keys(WORKER_ROLE_MAPPING).includes(role)) {
        query.workerRole = role;
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid worker role. Valid roles are: ${Object.keys(WORKER_ROLE_MAPPING).join(', ')}`
        });
      }
    }

    console.log("Final query:", query); // Debugging log

    const workers = await Worker.find(query)
      .populate({
        path: 'site',
        select: 'name'
      })
      .populate({
        path: 'contractorId',
        select: 'name contractorRole'
      })
      .lean();

    console.log("Found workers:", workers.length); // Debugging log

    if (workers.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No workers found matching the criteria",
        data: []
      });
    }

    res.status(200).json({ 
      success: true, 
      data: workers,
      count: workers.length
    });
  } catch (error) {
    console.error("Error in getAllWorkers:", error); // Detailed error logging
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// GET - Get workers by role
export const getWorkersByRole = async (req, res) => {
  try {
    const { workerRole } = req.params;
    
    // Validate worker role
    if (!WORKER_ROLE_MAPPING[workerRole]) {
      return res.status(400).json({
        success: false,
        message: "Invalid worker role",
        validRoles: Object.keys(WORKER_ROLE_MAPPING)
      });
    }
    
    // Build query
    const query = { workerRole };
    if (req.query.site) {
      query.site = req.query.site;
    }
    
    const workers = await Worker.find(query)
      .select('_id name email phone workerRole site')
      .populate('site', 'name')
      .populate('contractorId', 'name contractorRole');
    
    if (workers.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No workers found for this role",
        data: []
      });
    }
    
    res.status(200).json({
      success: true,
      data: workers
    });
  } catch (error) {
    console.error("Error in getWorkersByRole:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// GET - Get contractors by worker role
export const getContractorsByWorkerRole = async (req, res) => {
  try {
    const { workerRole } = req.params;
    
    // Validate worker role
    if (!ROLE_MAPPING[workerRole]) {
      return res.status(400).json({
        success: false,
        message: "Invalid worker role",
        validRoles: Object.keys(ROLE_MAPPING)
      });
    }
    
    const contractorRole = ROLE_MAPPING[workerRole];
    
    // Build query
    const query = { contractorRole };
    if (req.query.site) {
      query.site = req.query.site;
    }
    
    const contractors = await Contractor.find(query)
      .select('_id name email phone contractorRole site')
      .populate('site', 'name');
    
    if (contractors.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No contractors found for this worker role",
        data: []
      });
    }
    
    res.status(200).json({
      success: true,
      data: contractors
    });
  } catch (error) {
    console.error("Error in getContractorsByWorkerRole:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// GET - Get valid sub-roles for a worker role
export const getSubRoles = async (req, res) => {
  try {
    const { workerRole } = req.params;
    
    if (!WORKER_ROLE_MAPPING[workerRole]) {
      return res.status(400).json({
        success: false,
        message: "Invalid worker role",
        validRoles: Object.keys(WORKER_ROLE_MAPPING)
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        workerRole,
        subRoles: WORKER_ROLE_MAPPING[workerRole],
        contractorRole: ROLE_MAPPING[workerRole]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// GET - Get worker by ID
export const getWorkerById = async (req, res) => {
  const { id } = req.params;
  try {
    let worker;

    // First try as numeric ID
    if (!isNaN(id)) {
      worker = await Worker.findOne({ 
        _id: Number(id), 
        role: "Worker"
      })
        .populate('site', 'name')
        .populate('contractorId', 'name contractorRole')
        .lean();
    }
    
    // If not found, try as userId
    if (!worker && !isNaN(id)) {
      worker = await Worker.findOne({ 
        userId: Number(id), 
        role: "Worker"
      })
        .populate('site', 'name')
        .populate('contractorId', 'name contractorRole')
        .lean();
    }

    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Worker not found" 
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


// POST - Create a new worker
export const createWorker = async (req, res) => {
  try {
    const {
      name, email, gender, phone, alternatePhone, address,
      joiningDate, bankName, bankAccount, bankCode, password, perDaySalary,
      workerRole, workerSubRole, contractorName, site
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !workerRole || !contractorName) {
      return res.status(400).json({ 
        success: false, 
        message: "Required fields: name, email, password, workerRole, contractorName" 
      });
    }

    // Validate worker roles
    const roleValidation = validateWorkerRoles(workerRole, workerSubRole);
    if (!roleValidation.valid) {
      return res.status(400).json({
        success: false,
        message: roleValidation.message
      });
    }

    // Find contractor by name and role
    const contractor = await Contractor.findOne({ 
      name: contractorName,
      contractorRole: ROLE_MAPPING[workerRole]
    });

    if (!contractor) {
      return res.status(404).json({
        success: false,
        message: `Contractor not found with name '${contractorName}' and role '${ROLE_MAPPING[workerRole]}'`
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
    const workersIdProof = req.files?.workersIdProof 
      ? req.files.workersIdProof.map(file => `/uploads/${file.filename}`) 
      : [];

    // Create and save new Worker record
    const newWorker = new Worker({
      userId: newUser._id,
      contractorId: contractor._id,
      site,
      name,
      password: hashedPassword,
      gender,
      email,
      phone,
      alternatePhone,
      address: typeof address === 'string' ? JSON.parse(address) : address,
      role: "Worker",
      workerRole,
      workerSubRole,
      joiningDate,
      bankName,
      bankAccount,
      bankCode,
      workerIdProof: workersIdProof,
      photo,
      perDaySalary
    });

    await newWorker.save();

    // Get the populated worker data without triggering population errors
    const result = await Worker.findOne({ _id: newWorker._id }).lean();
    const populatedResult = {
      ...result,
      contractorId: {
        _id: contractor._id,
        name: contractor.name,
        contractorRole: contractor.contractorRole
      },
      site: result.site ? { _id: result.site, name: 'Site Name' } : null
    };

    res.status(201).json({
      success: true,
      message: "Worker created successfully",
      data: populatedResult
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

// PUT - Update worker by ID
export const updateWorkerById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    let worker;
    
    // First try as numeric ID (worker _id)
    if (!isNaN(id)) {
      worker = await Worker.findOne({ 
        _id: Number(id), 
        role: "Worker"
      });
    }
    
    // If not found, try as userId
    if (!worker && !isNaN(id)) {
      worker = await Worker.findOne({ 
        userId: Number(id), 
        role: "Worker"
      });
    }

    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Worker not found" 
      });
    }

    // Handle contractor name update
    if (updateData.contractorName) {
      const workerRole = updateData.workerRole || worker.workerRole;
      const contractor = await getContractorByNameAndRole(updateData.contractorName, workerRole);
      
      if (!contractor) {
        const contractorRole = ROLE_MAPPING[workerRole];
        return res.status(404).json({
          success: false,
          message: `Contractor not found with name '${updateData.contractorName}' and role '${contractorRole}'`
        });
      }
      
      worker.contractorId = contractor._id;
    }

    // Validate worker role if being updated
    if (updateData.workerRole) {
      const roleValidation = validateWorkerRoles(updateData.workerRole, updateData.workerSubRole);
      if (!roleValidation.valid) {
        return res.status(400).json({
          success: false,
          message: roleValidation.message
        });
      }
    }

    // Update worker sub-role based on workerRole
    if (updateData.workerRole && updateData.workerSubRole) {
      const subRoleField = updateData.workerRole.toLowerCase().replace(' ', '') + 'SubRole';
      worker[subRoleField] = updateData.workerSubRole;
    }

    // Update other fields
    const fieldsToUpdate = [
      'name', 'email', 'gender', 'phone', 'alternatePhone', 'address',
      'joiningDate', 'bankName', 'bankAccount', 'bankCode', 'workerRole',
      'perDaySalary', 'site'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        worker[field] = updateData[field];
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
    
    if (req.files?.workersIdProof) {
      const newIdProofs = req.files.workersIdProof.map(file => `/uploads/${file.filename}`);
      worker.workersIdProof = [...worker.workersIdProof, ...newIdProofs];
    }

    worker.updatedAt = new Date().toISOString();
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
      .populate('site', 'name')
      .populate('contractorId', 'name contractorRole')
      .lean();

    res.status(200).json({ 
      success: true, 
      message: "Worker updated successfully", 
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

// DELETE - Delete worker by ID
export const deleteWorkerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let worker;
    
    // First try as numeric ID (worker _id)
    if (!isNaN(id)) {
      worker = await Worker.findOneAndDelete({ 
        _id: Number(id), 
        role: "Worker"
      });
    }
    
    // If not found, try as userId
    if (!worker && !isNaN(id)) {
      worker = await Worker.findOneAndDelete({ 
        userId: Number(id), 
        role: "Worker"
      });
    }

    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: "Worker not found" 
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

    if (worker.workersIdProof?.length > 0) {
      worker.workersIdProof.forEach(proof => {
        const proofPath = path.join(process.cwd(), 'public', proof);
        if (fs.existsSync(proofPath)) {
          fs.unlinkSync(proofPath);
        }
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Worker deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};