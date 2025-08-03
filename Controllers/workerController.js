import mongoose from 'mongoose';
import Worker from '../models/WorkersModel.js';
import User from '../models/User.js';
import Contractor from '../models/Contractor.js';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Site from '../models/SiteDetails.js'; // Add this import
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

// POST - Create a new worker (with exact response format you want)
export const createWorker = async (req, res) => {
  try {
    const {
      name, email, gender, phone, alternatePhone, address,
      joiningDate, bankName, bankAccount, bankCode, password, perDaySalary,
      workerRole, workerSubRole, contractorName
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

    // Find contractor by name and role with site information
    const contractor = await Contractor.findOne({ 
      name: contractorName,
      contractorRole: ROLE_MAPPING[workerRole]
    }).populate('site', 'name');

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
      site: contractor.site?._id || null,
      name,
      email,
      phone,
      alternatePhone,
      address: typeof address === 'string' ? JSON.parse(address) : address,
      role: "Worker",
      workerRole,
      workerSubRole,
      joiningDate,
      centeringWorkerIdProof: workersIdProof, // Changed to match your desired response
      photo,
      perDaySalary
    });

    await newWorker.save();

    // Get the worker data in the exact format you want
    const result = {
      _id: newWorker._id,
      userId: newUser._id,
      site: contractor.site?._id || null,
      name,
      email,
      phone,
      alternatePhone,
      address: newWorker.address,
      role: "Worker",
      workerRole,
      workerSubRole,
      joiningDate,
      centeringWorkerIdProof: workersIdProof, // Matches your desired response
      photo,
      perDaySalary,
      __v: 0,
      contractorId: {
        _id: contractor._id,
        name: contractor.name,
        contractorRole: contractor.contractorRole,
        site: contractor.site?.name || null // Changed to match your desired response
      }
    };

    res.status(201).json({
      success: true,
      message: "Worker created successfully",
      data: result // Using our custom formatted result
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



// GET - Get all Workers with complete details (contractor, site, supervisor, user)
export const getAllWorkers = async (req, res) => {
  try {
    const { 
      search = '', 
      site, 
      contractor, 
      supervisor,
      workerRole,
      status,
      page = 1,
      limit = 100000000000
    } = req.query;

    const query = { role: "Worker" };
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by site name or ID
    if (site) {
      const siteDoc = await Site.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(site) ? site : null },
          { siteName: site }
        ]
      });
      if (siteDoc) {
        query.site = siteDoc._id;
      } else {
        return res.status(404).json({
          success: false,
          message: "Site not found"
        });
      }
    }
    
    // Filter by contractor name or ID
    if (contractor) {
      const contractorDoc = await Contractor.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(contractor) ? contractor : null },
          { name: contractor }
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

    // Filter by supervisor name or ID
    if (supervisor) {
      const supervisorDoc = await Supervisor.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(supervisor) ? supervisor : null },
          { name: supervisor }
        ]
      });
      if (supervisorDoc) {
        query.supervisorId = supervisorDoc._id;
      } else {
        return res.status(404).json({
          success: false,
          message: "Supervisor not found"
        });
      }
    }

    // Filter by worker role
    if (workerRole) {
      query.workerRole = workerRole;
    }

    // Filter by attendance status
    if (status) {
      query['currentAttendance.status'] = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalWorkers = await Worker.countDocuments(query);

    // Get all workers with populated references
    const workers = await Worker.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: 'contractorId',
        select: 'name contractorRole site email phone address photo',
        populate: {
          path: 'site',
          select: 'siteName location startDate endDate status'
        }
      })
      .populate({
        path: 'supervisorId',
        select: 'name supervisorType site email phone address photo',
        populate: {
          path: 'site',
          select: 'siteName location startDate endDate status'
        }
      })
      .populate('site', 'siteName location startDate endDate status')
      .populate('userId', 'name email role createdAt')
      .lean();

    // Format the response with complete data
    const formattedWorkers = workers.map(worker => {
      const formattedWorker = {
        _id: worker._id,
        userId: worker.userId ? {
          _id: worker.userId._id,
        } : null,
        // supervisorId: worker.supervisorId ? {
        //   _id: worker.supervisorId._id,
        //   name: worker.supervisorId.name,
        //   supervisorType: worker.supervisorId.supervisorType,
        //   email: worker.supervisorId.email,
        //   phone: worker.supervisorId.phone,
        //   address: worker.supervisorId.address,
        //   photo: worker.supervisorId.photo,
        //   site: worker.supervisorId.site ? {
        //     _id: worker.supervisorId.site._id,
        //     siteName: worker.supervisorId.site.siteName,
        //     location: worker.supervisorId.site.location,
        //     startDate: worker.supervisorId.site.startDate,
        //     endDate: worker.supervisorId.site.endDate,
        //     status: worker.supervisorId.site.status
        //   } : null
        // } : null,
        contractorId: worker.contractorId ? {
          _id: worker.contractorId._id,
          name: worker.contractorId.name,
          contractorRole: worker.contractorId.contractorRole,
          email: worker.contractorId.email,
          phone: worker.contractorId.phone,
          address: worker.contractorId.address,
          photo: worker.contractorId.photo,
          site: worker.contractorId.site ? {
            _id: worker.contractorId.site._id,
            siteName: worker.contractorId.site.siteName,
            location: worker.contractorId.site.location,
            startDate: worker.contractorId.site.startDate,
            endDate: worker.contractorId.site.endDate,
            status: worker.contractorId.site.status
          } : null
        } : null,
        site: worker.site ? {
          _id: worker.site._id,
          siteName: worker.site.siteName,
          location: worker.site.location,
          startDate: worker.site.startDate,
          endDate: worker.site.endDate,
          status: worker.site.status
        } : null,
        name: worker.name,
        password: undefined, // Never return password
        gender: worker.gender,
        email: worker.email,
        phone: worker.phone,
        alternatePhone: worker.alternatePhone,
        address: worker.address,
        role: worker.role,
        workerRole: worker.workerRole,
        workerSubRole: worker.workerSubRole,
        joiningDate: worker.joiningDate,
        bankName: worker.bankName,
        bankAccount: worker.bankAccount,
        bankCode: worker.bankCode,
        workerIdProof: worker.workerIdProof || worker.centeringWorkerIdProof || [],
        photo: worker.photo,
        perDaySalary: worker.perDaySalary,
        currentAttendance: worker.currentAttendance || null,
        attendanceRecords: worker.attendanceRecords || [],
        createdAt: worker.createdAt,
        updatedAt: worker.updatedAt,
        __v: worker.__v
      };

      return formattedWorker;
    });

    res.status(200).json({ 
      success: true,
      total: totalWorkers,
      page: parseInt(page),
      pages: Math.ceil(totalWorkers / limit),
      data: formattedWorkers
    });
  } catch (error) {
    console.error("Error fetching workers:", error);
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

