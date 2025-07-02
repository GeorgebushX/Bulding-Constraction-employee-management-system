
// import Worker from "../models/Workers.js";
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

// // Multer storage config
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
// });

// // File upload config
// export const upload = multer({ storage }).fields([
//   { name: "photo", maxCount: 1 },
//   { name: "workerIdProof", maxCount: 5 }
// ]);

// // ✅ Add Worker
// export const addWorker = async (req, res) => {
//   try {
//     const {
//       name, email, gender, phone, alternatePhone,
//       address, contractorRole, masonRole, centringRole,
//       joiningDate, bankAccount, bankCode, password
//     } = req.body;

//     if (!name || !email || !gender || !phone || !contractorRole || !joiningDate || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: name, email, gender, phone, contractorRole, joiningDate, password"
//       });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ success: false, message: "Email already in use" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create User
//     const newUser = new User({
//       name,
//       email,
//       password: hashedPassword,
//       role: "Worker"
//     });
//     await newUser.save();

//     // Handle uploaded files
//     const photo = req.files?.photo?.[0]?.filename ? `/uploads/${req.files.photo[0].filename}` : null;
//     const workerIdProof = req.files?.workerIdProof?.map(f => `/uploads/${f.filename}`) || [];

//     // Parse address if needed
//     let parsedAddress = address;
//     try {
//       if (typeof address === 'string') parsedAddress = JSON.parse(address);
//     } catch (err) {
//       console.error("Address parsing error:", err);
//     }

//     // Create Worker
//     const newWorker = new Worker({
//       userId: newUser._id,
//       name,
//       email,
//       gender,
//       phone,
//       alternatePhone,
//       address: parsedAddress,
//       contractorRole,
//       masonRole: contractorRole === "Mason" ? masonRole : null,
//       centringRole: contractorRole === "Centring" ? centringRole : null,
//       joiningDate,
//       bankAccount,
//       bankCode,
//       workerIdProof,
//       photo
//     });

//     await newWorker.save();

//     return res.status(201).json({ success: true, message: "Worker added successfully", data: newWorker });

//   } catch (error) {
//     console.error("Error adding worker:", error);
//     return res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// // ✅ Get All Workers
// export const getWorkers = async (req, res) => {
//   try {
//     const workers = await Worker.find().populate("userId", "-password").lean();
//     return res.status(200).json({ success: true, data: workers });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
//   }
// };

// // ✅ Get One Worker by ID or userId
// export const getWorkerById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     let worker = await Worker.findById(id).populate("userId", "-password").lean();

//     if (!worker) {
//       worker = await Worker.findOne({ userId: id }).populate("userId", "-password").lean();
//     }

//     if (!worker) {
//       return res.status(404).json({ success: false, message: "Worker not found" });
//     }

//     return res.status(200).json({ success: true, data: worker });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// // ✅ Update Worker
// export const updateWorker = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     const worker = await Worker.findById(id);
//     if (!worker) {
//       return res.status(404).json({ success: false, message: "Worker not found" });
//     }

//     const updateFields = [
//       'name', 'email', 'gender', 'phone', 'alternatePhone',
//       'contractorRole', 'masonRole', 'centringRole',
//       'joiningDate', 'bankAccount', 'bankCode'
//     ];

//     updateFields.forEach(field => {
//       if (updateData[field] !== undefined) {
//         worker[field] = updateData[field];
//       }
//     });

//     if (updateData.address) {
//       try {
//         worker.address = typeof updateData.address === 'string'
//           ? JSON.parse(updateData.address)
//           : updateData.address;
//       } catch (e) {
//         console.log("Address parsing error:", e);
//       }
//     }

//     if (req.files?.photo) {
//       worker.photo = `/uploads/${req.files.photo[0].filename}`;
//     }

//     if (req.files?.workerIdProof) {
//       const newProofs = req.files.workerIdProof.map(f => `/uploads/${f.filename}`);
//       worker.workerIdProof = [...worker.workerIdProof, ...newProofs];
//     }

//     await worker.save();

//     // Update associated User
//     if (updateData.name || updateData.email) {
//       await User.findByIdAndUpdate(worker.userId, {
//         ...(updateData.name && { name: updateData.name }),
//         ...(updateData.email && { email: updateData.email })
//       });
//     }

//     return res.status(200).json({ success: true, message: "Worker updated", data: worker });

//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// // ✅ Delete Worker
// export const deleteWorker = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const worker = await Worker.findByIdAndDelete(id);
//     if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });

//     await User.findByIdAndDelete(worker.userId);

//     return res.status(200).json({ success: true, message: "Worker deleted" });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// // ✅ Remove a specific ID proof
// export const removeIdProof = async (req, res) => {
//   try {
//     const { id, proofUrl } = req.params;

//     const worker = await Worker.findById(id);
//     if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });

//     worker.workerIdProof = worker.workerIdProof.filter(p => p !== proofUrl);
//     await worker.save();

//     return res.status(200).json({
//       success: true,
//       message: "ID proof removed",
//       data: worker.workerIdProof
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };


import Worker from "../models/Workers.js";
import User from "../models/User.js";
import Contractor from "../models/Contractor.js"; // to validate contractorRole
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

export const upload = multer({ storage }).fields([
  { name: "photo", maxCount: 1 },
  { name: "workerIdProof", maxCount: 5 }
]);

// Helper: assigns only one specific worker role
function assignRoles(body, contractorRoleStr) {
  const roles = {
    centeringRole: null,
    steelWorkerRole: null,
    masonRole: null,
    carpenterRole: null,
    plumberRole: null,
    electricianRole: null,
    painterRole: null,
    tilesWorkerRole: null
  };
  const keyMap = {
    'Centering Contractor': 'centeringRole',
    'Steel Contractor': 'steelWorkerRole',
    'Mason Contractor': 'masonRole',
    'Carpenter Contractor': 'carpenterRole',
    'Plumber Contractor': 'plumberRole',
    'Electrician Contractor': 'electricianRole',
    'Painter Contractor': 'painterRole',
    'Tiles Contractor': 'tilesWorkerRole'
  };
  const field = keyMap[contractorRoleStr];
  if (field && body[field]) roles[field] = body[field];
  return roles;
}

// 📌 Add Worker
export const addWorker = async (req, res) => {
  try {
    const { name, email, phone, password, contractorRole, address, joiningDate, bankAccount, bankCode } = req.body;
    if (!name || !email || !phone || !password || !contractorRole)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    const contractor = await Contractor.findById(contractorRole);
    if (!contractor)
      return res.status(400).json({ success: false, message: "Invalid contractorRole id" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashed, role: "Worker" });
    await newUser.save();

    const photo = req.files?.photo?.[0]?.filename ? `/uploads/${req.files.photo[0].filename}` : null;
    const proofs = req.files?.workerIdProof?.map(f => `/uploads/${f.filename}`) || [];
    const parsedAddr = typeof address === 'string' ? JSON.parse(address) : address;

    const roles = assignRoles(req.body, contractor.contractorRole);
    const newWorker = new Worker({
      userId: newUser._id,
      name, email, phone,
      gender: req.body.gender,
      alternatePhone: req.body.alternatePhone,
      address: parsedAddr,
      contractorRole,
      ...roles,
      joiningDate, bankAccount, bankCode,
      workerIdProof: proofs, photo
    });
    await newWorker.save();

    return res.status(201).json({ success: true, message: "Worker added", data: newWorker });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// 📌 Get All Workers
export const getWorkers = async (_, res) => {
  try {
    const workers = await Worker.find()
      .populate("userId", "-password")
      .populate({ path: "contractorRole", select: "contractorRole" })
      .lean();
    return res.json({ success: true, data: workers });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching", error: err.message });
  }
};

// 📌 Get One Worker
export const getWorkerById = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { userId: id };
    const worker = await Worker.findOne(filter)
      .populate("userId", "-password")
      .populate({ path: "contractorRole", select: "contractorRole" })
      .lean();
    if (!worker) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: worker });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching", error: err.message });
  }
};

// 📌 Update Worker
export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const worker = await Worker.findById(id);
    if (!worker) return res.status(404).json({ success: false, message: "Not found" });

    if (req.body.contractorRole) {
      const contractor = await Contractor.findById(req.body.contractorRole);
      if (!contractor) return res.status(400).json({ success: false, message: "Invalid contractorRole" });
      worker.contractorRole = req.body.contractorRole;
    }

    ['name','email','phone','alternatePhone','joiningDate','bankAccount','bankCode','gender'].forEach(f => {
      if (req.body[f] != null) worker[f] = req.body[f];
    });

    if (req.body.address) {
      worker.address = typeof req.body.address === 'string'
        ? JSON.parse(req.body.address)
        : req.body.address;
    }

    if (req.files?.photo) worker.photo = `/uploads/${req.files.photo[0].filename}`;
    if (req.files?.workerIdProof) {
      worker.workerIdProof.push(...req.files.workerIdProof.map(f => `/uploads/${f.filename}`));
    }

    const populated = await Contractor.findById(worker.contractorRole);
    Object.assign(worker, assignRoles(req.body, populated.contractorRole));

    await worker.save();

    // sync User
    if (req.body.email || req.body.name) {
      await User.findByIdAndUpdate(worker.userId, {
        ...(req.body.name && { name: req.body.name }),
        ...(req.body.email && { email: req.body.email })
      });
    }

    return res.json({ success: true, message: "Updated", data: worker });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error updating", error: err.message });
  }
};

// 📌 Delete Worker
export const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const worker = await Worker.findByIdAndDelete(id);
    if (!worker) return res.status(404).json({ success: false, message: "Not found" });
    await User.findByIdAndDelete(worker.userId);
    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error deleting", error: err.message });
  }
};







// import Worker from "../models/Workers.js";
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

// // Multer storage config
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
// });

// // File upload config
// export const upload = multer({ storage }).fields([
//   { name: "photo", maxCount: 1 },
//   { name: "workerIdProof", maxCount: 5 }
// ]);

// // ✅ Add Worker
// export const addWorker = async (req, res) => {
//   try {
//     const {
//       name, email, gender, phone, alternatePhone,
//       address, contractorRole, centeringRole, steelWorkerRole,
//       masonRole, carpenterRole, plumberRole, electricianRole,
//       painterRole, tilesWorkerRole, joiningDate, bankAccount, 
//       bankCode, password
//     } = req.body;

//     if (!name || !email || !phone || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: name, email, phone, password"
//       });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ success: false, message: "Email already in use" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create User
//     const newUser = new User({
//       name,
//       email,
//       password: hashedPassword,
//       role: "Worker"
//     });
//     await newUser.save();

//     // Handle uploaded files
//     const photo = req.files?.photo?.[0]?.filename ? `/uploads/${req.files.photo[0].filename}` : null;
//     const workerIdProof = req.files?.workerIdProof?.map(f => `/uploads/${f.filename}`) || [];

//     // Parse address if needed
//     let parsedAddress = address;
//     try {
//       if (typeof address === 'string') parsedAddress = JSON.parse(address);
//     } catch (err) {
//       console.error("Address parsing error:", err);
//     }

//     // Create Worker with appropriate role based on contractor type
//     const newWorker = new Worker({
//       userId: newUser._id,
//       name,
//       email,
//       gender,
//       phone,
//       alternatePhone,
//       address: parsedAddress,
//       contractorRole,
//       centeringRole: contractorRole === "Centering Contractor" ? centeringRole : null,
//       steelWorkerRole: contractorRole === "Steel Contractor" ? steelWorkerRole : null,
//       masonRole: contractorRole === "Mason Contractor" ? masonRole : null,
//       carpenterRole: contractorRole === "Carpenter Contractor" ? carpenterRole : null,
//       plumberRole: contractorRole === "Plumber Contractor" ? plumberRole : null,
//       electricianRole: contractorRole === "Electrician Contractor" ? electricianRole : null,
//       painterRole: contractorRole === "Painter Contractor" ? painterRole : null,
//       tilesWorkerRole: contractorRole === "Tiles Contractor" ? tilesWorkerRole : null,
//       joiningDate,
//       bankAccount,
//       bankCode,
//       workerIdProof,
//       photo
//     });

//     await newWorker.save();

//     return res.status(201).json({ 
//       success: true, 
//       message: "Worker added successfully", 
//       data: newWorker 
//     });

//   } catch (error) {
//     console.error("Error adding worker:", error);
//     return res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

// // ✅ Get All Workers
// export const getWorkers = async (req, res) => {
//   try {
//     const workers = await Worker.find().populate("userId", "-password").lean();
//     return res.status(200).json({ 
//       success: true, 
//       data: workers 
//     });
//   } catch (error) {
//     return res.status(500).json({ 
//       success: false, 
//       message: "Internal Server Error", 
//       error: error.message 
//     });
//   }
// };

// // ✅ Get One Worker by ID or userId
// export const getWorkerById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     let worker = await Worker.findById(id).populate("userId", "-password").lean();

//     if (!worker) {
//       worker = await Worker.findOne({ userId: id }).populate("userId", "-password").lean();
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

//     const worker = await Worker.findById(id);
//     if (!worker) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Worker not found" 
//       });
//     }

//     const updateFields = [
//       'name', 'email', 'gender', 'phone', 'alternatePhone',
//       'contractorRole', 'centeringRole', 'steelWorkerRole',
//       'masonRole', 'carpenterRole', 'plumberRole',
//       'electricianRole', 'painterRole', 'tilesWorkerRole',
//       'joiningDate', 'bankAccount', 'bankCode'
//     ];

//     updateFields.forEach(field => {
//       if (updateData[field] !== undefined) {
//         worker[field] = updateData[field];
//       }
//     });

//     // Handle address update
//     if (updateData.address) {
//       try {
//         worker.address = typeof updateData.address === 'string'
//           ? JSON.parse(updateData.address)
//           : updateData.address;
//       } catch (e) {
//         console.log("Address parsing error:", e);
//       }
//     }

//     // Handle file uploads
//     if (req.files?.photo) {
//       worker.photo = `/uploads/${req.files.photo[0].filename}`;
//     }

//     if (req.files?.workerIdProof) {
//       const newProofs = req.files.workerIdProof.map(f => `/uploads/${f.filename}`);
//       worker.workerIdProof = [...worker.workerIdProof, ...newProofs];
//     }

//     // Reset role fields based on contractor type
//     if (updateData.contractorRole) {
//       worker.centeringRole = updateData.contractorRole === "Centering Contractor" ? worker.centeringRole : null;
//       worker.steelWorkerRole = updateData.contractorRole === "Steel Contractor" ? worker.steelWorkerRole : null;
//       worker.masonRole = updateData.contractorRole === "Mason Contractor" ? worker.masonRole : null;
//       worker.carpenterRole = updateData.contractorRole === "Carpenter Contractor" ? worker.carpenterRole : null;
//       worker.plumberRole = updateData.contractorRole === "Plumber Contractor" ? worker.plumberRole : null;
//       worker.electricianRole = updateData.contractorRole === "Electrician Contractor" ? worker.electricianRole : null;
//       worker.painterRole = updateData.contractorRole === "Painter Contractor" ? worker.painterRole : null;
//       worker.tilesWorkerRole = updateData.contractorRole === "Tiles Contractor" ? worker.tilesWorkerRole : null;
//     }

//     await worker.save();

//     // Update associated User
//     if (updateData.name || updateData.email) {
//       await User.findByIdAndUpdate(worker.userId, {
//         ...(updateData.name && { name: updateData.name }),
//         ...(updateData.email && { email: updateData.email })
//       });
//     }

//     return res.status(200).json({ 
//       success: true, 
//       message: "Worker updated", 
//       data: worker 
//     });

//   } catch (error) {
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
//     const worker = await Worker.findByIdAndDelete(id);
//     if (!worker) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Worker not found" 
//       });
//     }

//     await User.findByIdAndDelete(worker.userId);

//     return res.status(200).json({ 
//       success: true, 
//       message: "Worker deleted" 
//     });
//   } catch (error) {
//     return res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

// // ✅ Remove a specific ID proof
// export const removeIdProof = async (req, res) => {
//   try {
//     const { id, proofUrl } = req.params;

//     const worker = await Worker.findById(id);
//     if (!worker) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Worker not found" 
//       });
//     }

//     worker.workerIdProof = worker.workerIdProof.filter(p => p !== proofUrl);
//     await worker.save();

//     return res.status(200).json({
//       success: true,
//       message: "ID proof removed",
//       data: worker.workerIdProof
//     });
//   } catch (error) {
//     return res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };