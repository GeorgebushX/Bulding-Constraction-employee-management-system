// // import Contractor from "../models/Contractor.js";
// // import User from "../models/User.js";
// // import bcrypt from "bcrypt";
// // import multer from "multer";
// // import path from "path";
// // import fs from "fs";

// // // Ensure upload directory exists
// // const uploadDir = path.join(process.cwd(), "public", "uploads");
// // if (!fs.existsSync(uploadDir)) {
// //   fs.mkdirSync(uploadDir, { recursive: true });
// // }

// // // Multer storage configuration
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, uploadDir);
// //   },
// //   filename: (req, file, cb) => {
// //     cb(null, Date.now() + path.extname(file.originalname));
// //   },
// // });

// // // Configure multer for file uploads
// // export const upload = multer({ storage }).fields([
// //   { name: "photo", maxCount: 1 },
// //   { name: "contractorIdProof", maxCount: 5 }, // Allow multiple ID proofs
// // ]);

// // // ✅ Add Contractor Function
// // export const addContractor = async (req, res) => {
// //   try {
// //     const {
// //       name, email, dateOfBirth, gender, phone, alternatePhone, address,
// //       permanentAddress, contractorRole, joiningDate, bankAccount,
// //       bankCode, password
// //     } = req.body;

// //     // Validate required fields
// //     if (!name || !email || !phone || !password || !contractorRole) {
// //       return res.status(400).json({ 
// //         success: false, 
// //         message: "Required fields: name, email, phone, password, contractorRole" 
// //       });
// //     }

// //     // Check if email already exists
// //     const existingUser = await User.findOne({ email });
// //     if (existingUser) {
// //       return res.status(400).json({ 
// //         success: false, 
// //         message: "User already registered with this email" 
// //       });
// //     }

// //     // Hash password
// //     const hashedPassword = await bcrypt.hash(password, 10);

// //     // Create and save new User first to get the userId
// //     const newUser = new User({ 
// //       name, 
// //       email, 
// //       password: hashedPassword, 
// //       role: "Contractor" 
// //     });
// //     await newUser.save();

// //     // Process uploaded files
// //     const photo = req.files?.photo ? `/uploads/${req.files.photo[0].filename}` : null;
// //     const contractorIdProof = req.files?.contractorIdProof 
// //       ? req.files.contractorIdProof.map(file => `/uploads/${file.filename}`) 
// //       : [];

// //     // Parse address objects if they're strings
// //     let parsedAddress = address;
// //     let parsedPermanentAddress = permanentAddress;
    
// //     try {
// //       if (typeof address === 'string') parsedAddress = JSON.parse(address);
// //       if (typeof permanentAddress === 'string') parsedPermanentAddress = JSON.parse(permanentAddress);
// //     } catch (e) {
// //       console.log("Address parsing error:", e);
// //     }

// //     // Create and save new Contractor record
// //     const newContractor = new Contractor({
// //       userId: newUser._id,
// //       name,
// //       email,
// //       dateOfBirth,
// //       gender,
// //       phone,
// //       alternatePhone,
// //       address: parsedAddress,
// //       permanentAddress: parsedPermanentAddress,
// //       contractorRole,
// //       joiningDate,
// //       bankAccount,
// //       bankCode,
// //       contractorIdProof,
// //       photo,
// //       password: hashedPassword
// //     });

// //     await newContractor.save();
    
// //     return res.status(201).json({ 
// //       success: true, 
// //       message: "Contractor added successfully", 
// //       data: newContractor 
// //     });
// //   } catch (error) {
// //     console.error("Error adding contractor:", error);
// //     res.status(500).json({ 
// //       success: false, 
// //       message: "Server error", 
// //       error: error.message 
// //     });
// //   }
// // };

// // // ✅ Get All Contractors
// // export const getContractors = async (req, res) => {
// //   try {
// //     const { contractorRole } = req.query;
// //     const filter = {};
    
// //     if (contractorRole) {
// //       filter.contractorRole = contractorRole;
// //     }

// //     const contractors = await Contractor.find(filter)
// //       .populate("userId", "-password")
// //       .lean();

// //     return res.status(200).json({ 
// //       success: true, 
// //       data: contractors 
// //     });
// //   } catch (error) {
// //     return res.status(500).json({ 
// //       success: false, 
// //       message: "Internal Server Error", 
// //       error: error.message 
// //     });
// //   }
// // };

// // // ✅ Get One Contractor (by ID)
// // export const getContractorById = async (req, res) => {
// //   const { id } = req.params;
// //   try {
// //     // First try to find by _id (number)
// //     let contractor;
// //     if (!isNaN(id)) {
// //       contractor = await Contractor.findOne({ _id: parseInt(id) })
// //         .populate("userId", "-password")
// //         .lean();
// //     }

// //     // If not found by _id, try by userId (number)
// //     if (!contractor) {
// //       contractor = await Contractor.findOne({ userId: parseInt(id) })
// //         .populate("userId", "-password")
// //         .lean();
// //     }

// //     if (!contractor) {
// //       return res.status(404).json({ 
// //         success: false, 
// //         message: "Contractor not found" 
// //       });
// //     }

// //     return res.status(200).json({ 
// //       success: true, 
// //       data: contractor 
// //     });
// //   } catch (error) {
// //     return res.status(500).json({ 
// //       success: false, 
// //       message: "Server error", 
// //       error: error.message 
// //     });
// //   }
// // };

// // // ✅ Update Contractor
// // export const updateContractor = async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const updateData = req.body;

// //     // Find contractor by _id or userId
// //     let contractor;
// //     if (!isNaN(id)) {
// //       contractor = await Contractor.findOne({ _id: parseInt(id) });
// //       if (!contractor) {
// //         contractor = await Contractor.findOne({ userId: parseInt(id) });
// //       }
// //     }

// //     if (!contractor) {
// //       return res.status(404).json({ 
// //         success: false, 
// //         message: "Contractor not found" 
// //       });
// //     }

// //     // Update basic fields
// //     const fieldsToUpdate = [
// //       'name', 'email', 'dateOfBirth', 'gender', 'phone', 'alternatePhone', 
// //       'contractorRole', 'joiningDate', 'bankAccount', 'bankCode'
// //     ];
    
// //     fieldsToUpdate.forEach(field => {
// //       if (updateData[field] !== undefined) {
// //         contractor[field] = updateData[field];
// //       }
// //     });

// //     // Update address objects
// //     if (updateData.address) {
// //       try {
// //         contractor.address = typeof updateData.address === 'string' 
// //           ? JSON.parse(updateData.address) 
// //           : updateData.address;
// //       } catch (e) {
// //         console.log("Address parsing error:", e);
// //       }
// //     }

// //     if (updateData.permanentAddress) {
// //       try {
// //         contractor.permanentAddress = typeof updateData.permanentAddress === 'string' 
// //           ? JSON.parse(updateData.permanentAddress) 
// //           : updateData.permanentAddress;
// //       } catch (e) {
// //         console.log("Permanent address parsing error:", e);
// //       }
// //     }

// //     // Update files if uploaded
// //     if (req.files?.photo) {
// //       contractor.photo = `/uploads/${req.files.photo[0].filename}`;
// //     }
    
// //     if (req.files?.contractorIdProof) {
// //       const newIdProofs = req.files.contractorIdProof.map(file => `/uploads/${file.filename}`);
// //       contractor.contractorIdProof = [...contractor.contractorIdProof, ...newIdProofs];
// //     }

// //     // Handle password update
// //     if (updateData.password) {
// //       const hashedPassword = await bcrypt.hash(updateData.password, 10);
// //       contractor.password = hashedPassword;
      
// //       // Also update user password
// //       await User.findOneAndUpdate(
// //         { _id: contractor.userId },
// //         { $set: { password: hashedPassword } }
// //       );
// //     }

// //     await contractor.save();
    
// //     // Also update the associated User record
// //     if (updateData.name || updateData.email) {
// //       await User.findOneAndUpdate(
// //         { _id: contractor.userId },
// //         {
// //           $set: {
// //             ...(updateData.name && { name: updateData.name }),
// //             ...(updateData.email && { email: updateData.email })
// //           }
// //         }
// //       );
// //     }

// //     return res.status(200).json({ 
// //       success: true, 
// //       message: "Contractor updated successfully", 
// //       data: contractor 
// //     });
// //   } catch (error) {
// //     return res.status(500).json({ 
// //       success: false, 
// //       message: "Server error", 
// //       error: error.message 
// //     });
// //   }
// // };

// // // ✅ Delete Contractor
// // export const deleteContractor = async (req, res) => {
// //   try {
// //     const { id } = req.params;
    
// //     // Find contractor by _id or userId
// //     let contractor;
// //     if (!isNaN(id)) {
// //       contractor = await Contractor.findOneAndDelete({ _id: parseInt(id) });
// //       if (!contractor) {
// //         contractor = await Contractor.findOneAndDelete({ userId: parseInt(id) });
// //       }
// //     }

// //     if (!contractor) {
// //       return res.status(404).json({ 
// //         success: false, 
// //         message: "Contractor not found" 
// //       });
// //     }

// //     // Delete associated user
// //     await User.findOneAndDelete({ _id: contractor.userId });

// //     // Clean up uploaded files
// //     if (contractor.photo) {
// //       const photoPath = path.join(process.cwd(), 'public', contractor.photo);
// //       if (fs.existsSync(photoPath)) {
// //         fs.unlinkSync(photoPath);
// //       }
// //     }

// //     if (contractor.contractorIdProof && contractor.contractorIdProof.length > 0) {
// //       contractor.contractorIdProof.forEach(proof => {
// //         const proofPath = path.join(process.cwd(), 'public', proof);
// //         if (fs.existsSync(proofPath)) {
// //           fs.unlinkSync(proofPath);
// //         }
// //       });
// //     }

// //     return res.status(200).json({ 
// //       success: true, 
// //       message: "Contractor deleted successfully" 
// //     });
// //   } catch (error) {
// //     return res.status(500).json({ 
// //       success: false, 
// //       message: "Server error", 
// //       error: error.message 
// //     });
// //   }
// // };

// // // ✅ Remove ID Proof
// // export const removeIdProof = async (req, res) => {
// //   try {
// //     const { id, proofUrl } = req.params;

// //     // Find contractor by _id or userId
// //     let contractor;
// //     if (!isNaN(id)) {
// //       contractor = await Contractor.findOne({ _id: parseInt(id) });
// //       if (!contractor) {
// //         contractor = await Contractor.findOne({ userId: parseInt(id) });
// //       }
// //     }

// //     if (!contractor) {
// //       return res.status(404).json({ 
// //         success: false, 
// //         message: "Contractor not found" 
// //       });
// //     }

// //     // Remove the file from server
// //     const proofPath = path.join(process.cwd(), 'public', proofUrl);
// //     if (fs.existsSync(proofPath)) {
// //       fs.unlinkSync(proofPath);
// //     }

// //     // Filter out the proof to be removed
// //     contractor.contractorIdProof = contractor.contractorIdProof.filter(
// //       proof => proof !== proofUrl
// //     );

// //     await contractor.save();

// //     return res.status(200).json({ 
// //       success: true, 
// //       message: "ID proof removed successfully",
// //       data: contractor.contractorIdProof
// //     });
// //   } catch (error) {
// //     return res.status(500).json({ 
// //       success: false, 
// //       message: "Server error", 
// //       error: error.message 
// //     });
// //   }
// // };

// // // ✅ Get Contractors by Role
// // export const getContractorsByRole = async (req, res) => {
// //   try {
// //     const { role } = req.params;
    
// //     if (![
// //       'Centering Contractor', 
// //       'Steel Contractor', 
// //       'Mason Contractor', 
// //       'Carpenter Contractor', 
// //       'Plumber Contractor', 
// //       'Electrician Contractor', 
// //       'Painter Contractor', 
// //       'Tiles Contractor'
// //     ].includes(role)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Invalid contractor role"
// //       });
// //     }

// //     const contractors = await Contractor.find({ contractorRole: role })
// //       .populate("userId", "-password")
// //       .lean();

// //     return res.status(200).json({
// //       success: true,
// //       data: contractors
// //     });
// //   } catch (error) {
// //     return res.status(500).json({
// //       success: false,
// //       message: "Server error",
// //       error: error.message
// //     });
// //   }
// // };



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
//   { name: "contractorIdProof", maxCount: 5 },
// ]);

// // ✅ Add Contractor Function
// export const addContractor = async (req, res) => {
//   try {
//     const {
//       name, email, gender, phone, alternatePhone, address, contractorRole, joiningDate, bankAccount,
//       bankCode, password, roleDetails
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
//     let parsedRoleDetails = roleDetails;
    
//     try {
//       if (typeof address === 'string') parsedAddress = JSON.parse(address);
//       if (typeof permanentAddress === 'string') parsedPermanentAddress = JSON.parse(permanentAddress);
//       if (typeof roleDetails === 'string') parsedRoleDetails = JSON.parse(roleDetails);
//     } catch (e) {
//       console.log("Parsing error:", e);
//     }

//     // Create and save new Contractor record
//     const newContractor = new Contractor({
//       userId: newUser._id,
//       name,
//       email,
//       gender,
//       phone,
//       alternatePhone,
//       address: parsedAddress,
//       role: "Contractor",
//       contractorRole,
//       joiningDate,
//       roleDetails: parsedRoleDetails || {},
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
//       .populate("roleDetails.centering.workers", "name phone")
//       .populate("roleDetails.steel.workers", "name phone")
//       .populate("roleDetails.mason.workers", "name phone")
//       .populate("roleDetails.carpenter.workers", "name phone")
//       .populate("roleDetails.plumber.workers", "name phone")
//       .populate("roleDetails.electrician.workers", "name phone")
//       .populate("roleDetails.painter.workers", "name phone")
//       .populate("roleDetails.tiles.workers", "name phone")
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
//         .populate("roleDetails.centering.workers", "name phone workerType")
//         .populate("roleDetails.steel.workers", "name phone workerType")
//         .populate("roleDetails.mason.workers", "name phone workerType")
//         .populate("roleDetails.carpenter.workers", "name phone workerType")
//         .populate("roleDetails.plumber.workers", "name phone workerType")
//         .populate("roleDetails.electrician.workers", "name phone workerType")
//         .populate("roleDetails.painter.workers", "name phone workerType")
//         .populate("roleDetails.tiles.workers", "name phone workerType")
//         .lean();
//     }

//     // If not found by _id, try by userId (number)
//     if (!contractor) {
//       contractor = await Contractor.findOne({ userId: parseInt(id) })
//         .populate("userId", "-password")
//         .populate("roleDetails.centering.workers", "name phone workerType")
//         .populate("roleDetails.steel.workers", "name phone workerType")
//         .populate("roleDetails.mason.workers", "name phone workerType")
//         .populate("roleDetails.carpenter.workers", "name phone workerType")
//         .populate("roleDetails.plumber.workers", "name phone workerType")
//         .populate("roleDetails.electrician.workers", "name phone workerType")
//         .populate("roleDetails.painter.workers", "name phone workerType")
//         .populate("roleDetails.tiles.workers", "name phone workerType")
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
//       'name', 'email', 'gender', 'phone', 'alternatePhone', 
//       'contractorRole', 'joiningDate', 'bankAccount', 'bankCode', 'roleDetails'
//     ];
    
//     fieldsToUpdate.forEach(field => {
//       if (updateData[field] !== undefined) {
//         // Special handling for roleDetails
//         if (field === 'roleDetails') {
//           try {
//             contractor[field] = typeof updateData[field] === 'string' 
//               ? JSON.parse(updateData[field]) 
//               : updateData[field];
//           } catch (e) {
//             console.log("RoleDetails parsing error:", e);
//           }
//         } else {
//           contractor[field] = updateData[field];
//         }
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
//       // Delete old photo if exists
//       if (contractor.photo) {
//         const oldPhotoPath = path.join(process.cwd(), 'public', contractor.photo);
//         if (fs.existsSync(oldPhotoPath)) {
//           fs.unlinkSync(oldPhotoPath);
//         }
//       }
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
//       .populate("roleDetails.centering.workers", "name phone")
//       .populate("roleDetails.steel.workers", "name phone")
//       .populate("roleDetails.mason.workers", "name phone")
//       .populate("roleDetails.carpenter.workers", "name phone")
//       .populate("roleDetails.plumber.workers", "name phone")
//       .populate("roleDetails.electrician.workers", "name phone")
//       .populate("roleDetails.painter.workers", "name phone")
//       .populate("roleDetails.tiles.workers", "name phone")
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

// // ✅ Add Worker to Contractor
// export const addWorkerToContractor = async (req, res) => {
//   try {
//     const { contractorId, workerId } = req.params;

//     // Find contractor
//     const contractor = await Contractor.findOne({ 
//       $or: [
//         { _id: parseInt(contractorId) },
//         { userId: parseInt(contractorId) }
//       ]
//     });

//     if (!contractor) {
//       return res.status(404).json({
//         success: false,
//         message: "Contractor not found"
//       });
//     }

//     // Determine which roleDetails field to update based on contractorRole
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

//     const roleField = roleFieldMap[contractor.contractorRole];
    
//     if (!roleField) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid contractor role"
//       });
//     }

//     // Add worker to the appropriate roleDetails
//     if (!contractor.roleDetails[roleField].workers.includes(workerId)) {
//       contractor.roleDetails[roleField].workers.push(workerId);
//       await contractor.save();
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Worker added to contractor successfully",
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

// // ✅ Remove Worker from Contractor
// export const removeWorkerFromContractor = async (req, res) => {
//   try {
//     const { contractorId, workerId } = req.params;

//     // Find contractor
//     const contractor = await Contractor.findOne({ 
//       $or: [
//         { _id: parseInt(contractorId) },
//         { userId: parseInt(contractorId) }
//       ]
//     });

//     if (!contractor) {
//       return res.status(404).json({
//         success: false,
//         message: "Contractor not found"
//       });
//     }

//     // Determine which roleDetails field to update based on contractorRole
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

//     const roleField = roleFieldMap[contractor.contractorRole];
    
//     if (!roleField) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid contractor role"
//       });
//     }

//     // Remove worker from the appropriate roleDetails
//     contractor.roleDetails[roleField].workers = 
//       contractor.roleDetails[roleField].workers.filter(id => id.toString() !== workerId);
    
//     await contractor.save();

//     return res.status(200).json({
//       success: true,
//       message: "Worker removed from contractor successfully",
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

export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).fields([
  { name: "photo", maxCount: 1 },
  { name: "contractorIdProof", maxCount: 5 },
]);

// Helper function to clean up uploaded files on error
const cleanUpFiles = (files) => {
  if (files?.photo?.[0]) {
    fs.unlinkSync(path.join(uploadDir, files.photo[0].filename));
  }
  if (files?.contractorIdProof) {
    files.contractorIdProof.forEach(file => {
      fs.unlinkSync(path.join(uploadDir, file.filename));
    });
  }
};

// Add Contractor
export const addContractor = async (req, res) => {
  try {
    const { name, email, phone, password, contractorRole, ...rest } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !contractorRole) {
      return res.status(400).json({ 
        success: false, 
        message: "Required fields: name, email, phone, password, contractorRole",
        errorType: "VALIDATION_ERROR"
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: "Email already registered",
        errorType: "DUPLICATE_ENTRY"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: "Contractor",
      phone
    });
    await newUser.save();

    // Process files
    const photo = req.files?.photo?.[0]?.filename ? `/uploads/${req.files.photo[0].filename}` : null;
    const contractorIdProof = req.files?.contractorIdProof?.map(file => `/uploads/${file.filename}`) || [];

    // Parse address if it's a string
    let parsedAddress = rest.address;
    try {
      if (typeof rest.address === 'string') parsedAddress = JSON.parse(rest.address);
    } catch (e) {
      console.log("Address parsing error:", e);
      cleanUpFiles(req.files);
      return res.status(400).json({ 
        success: false, 
        message: "Invalid address format",
        errorType: "VALIDATION_ERROR"
      });
    }

    // Create Contractor
    const newContractor = new Contractor({
      userId: newUser._id,
      name,
      email,
      phone,
      password: hashedPassword,
      contractorRole,
      address: parsedAddress,
      gender: rest.gender,
      alternatePhone: rest.alternatePhone,
      joiningDate: rest.joiningDate,
      bankAccount: rest.bankAccount,
      bankCode: rest.bankCode,
      photo,
      contractorIdProof
    });

    await newContractor.save();

    const populatedContractor = await Contractor.findById(newContractor._id)
      .populate("userId", "-password")
      .lean();

    return res.status(201).json({ 
      success: true, 
      message: "Contractor created successfully",
      data: populatedContractor
    });

  } catch (error) {
    console.error("Error adding contractor:", error);
    cleanUpFiles(req.files);
    
    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    return res.status(statusCode).json({ 
      success: false, 
      message: error.message || "Failed to create contractor",
      errorType: error.name || 'SERVER_ERROR'
    });
  }
};

// Get All Contractors (with pagination)
export const getContractors = async (req, res) => {
  try {
    const { contractorRole, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    if (contractorRole) filter.contractorRole = contractorRole;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: "userId", select: "-password" },
        { path: "roleDetails.centering.workers", select: "name phone workerType" },
        { path: "roleDetails.steel.workers", select: "name phone workerType" },
        { path: "roleDetails.mason.workers", select: "name phone workerType" },
        { path: "roleDetails.carpenter.workers", select: "name phone workerType" },
        { path: "roleDetails.plumber.workers", select: "name phone workerType" },
        { path: "roleDetails.electrician.workers", select: "name phone workerType" },
        { path: "roleDetails.painter.workers", select: "name phone workerType" },
        { path: "roleDetails.tiles.workers", select: "name phone workerType" }
      ],
      sort: { createdAt: -1 }
    };

    const contractors = await Contractor.paginate(filter, options);

    return res.status(200).json({ 
      success: true, 
      data: contractors 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch contractors",
      errorType: "SERVER_ERROR"
    });
  }
};

// Get Contractor by ID
export const getContractorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let contractor;
    if (!isNaN(id)) {
      contractor = await Contractor.findOne({ 
        $or: [{ _id: parseInt(id) }, { userId: parseInt(id) }]
      })
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
        message: "Contractor not found",
        errorType: "NOT_FOUND"
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: contractor 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch contractor",
      errorType: "SERVER_ERROR"
    });
  }
};

// Update Contractor
export const updateContractor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find contractor
    let contractor;
    if (!isNaN(id)) {
      contractor = await Contractor.findOne({ 
        $or: [{ _id: parseInt(id) }, { userId: parseInt(id) }]
      });
    }

    if (!contractor) {
      return res.status(404).json({ 
        success: false, 
        message: "Contractor not found",
        errorType: "NOT_FOUND"
      });
    }

    // Update basic fields
    const fieldsToUpdate = [
      'name', 'email', 'gender', 'phone', 'alternatePhone', 
      'contractorRole', 'joiningDate', 'bankAccount', 'bankCode'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        contractor[field] = updateData[field];
      }
    });

    // Update address
    if (updateData.address) {
      try {
        contractor.address = typeof updateData.address === 'string' 
          ? JSON.parse(updateData.address) 
          : updateData.address;
      } catch (e) {
        console.log("Address parsing error:", e);
        return res.status(400).json({ 
          success: false, 
          message: "Invalid address format",
          errorType: "VALIDATION_ERROR"
        });
      }
    }

    // Handle file updates
    if (req.files?.photo) {
      // Delete old photo if exists
      if (contractor.photo) {
        const oldPhotoPath = path.join(process.cwd(), 'public', contractor.photo);
        if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
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
      await User.findByIdAndUpdate(contractor.userId, { password: hashedPassword });
    }

    await contractor.save();

    // Update associated User
    const userUpdate = {};
    if (updateData.name) userUpdate.name = updateData.name;
    if (updateData.email) userUpdate.email = updateData.email;
    if (updateData.phone) userUpdate.phone = updateData.phone;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(contractor.userId, userUpdate);
    }

    const updatedContractor = await Contractor.findById(contractor._id)
      .populate("userId", "-password")
      .populate("roleDetails.centering.workers", "name phone workerType")
      .populate("roleDetails.steel.workers", "name phone workerType")
      .populate("roleDetails.mason.workers", "name phone workerType")
      .populate("roleDetails.carpenter.workers", "name phone workerType")
      .populate("roleDetails.plumber.workers", "name phone workerType")
      .populate("roleDetails.electrician.workers", "name phone workerType")
      .populate("roleDetails.painter.workers", "name phone workerType")
      .populate("roleDetails.tiles.workers", "name phone workerType");

    return res.status(200).json({ 
      success: true, 
      message: "Contractor updated successfully",
      data: updatedContractor
    });
  } catch (error) {
    console.error("Error updating contractor:", error);
    cleanUpFiles(req.files);
    
    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    return res.status(statusCode).json({ 
      success: false, 
      message: error.message || "Failed to update contractor",
      errorType: error.name || 'SERVER_ERROR'
    });
  }
};

// Delete Contractor
export const deleteContractor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find contractor
    let contractor;
    if (!isNaN(id)) {
      contractor = await Contractor.findOneAndDelete({ 
        $or: [{ _id: parseInt(id) }, { userId: parseInt(id) }]
      });
    }

    if (!contractor) {
      return res.status(404).json({ 
        success: false, 
        message: "Contractor not found",
        errorType: "NOT_FOUND"
      });
    }

    // Delete associated user
    await User.findOneAndDelete({ _id: contractor.userId });

    // Clean up files
    const deleteFile = (filePath) => {
      if (filePath) {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
    };

    if (contractor.photo) deleteFile(contractor.photo);
    if (contractor.contractorIdProof?.length > 0) {
      contractor.contractorIdProof.forEach(deleteFile);
    }

    return res.status(200).json({ 
      success: true, 
      message: "Contractor deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Failed to delete contractor",
      errorType: "SERVER_ERROR"
    });
  }
};

// Get Contractors by Role
export const getContractorsByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    const validRoles = [
      'Centering Contractor', 'Steel Contractor', 'Mason Contractor',
      'Carpenter Contractor', 'Plumber Contractor', 'Electrician Contractor',
      'Painter Contractor', 'Tiles Contractor'
    ];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contractor role",
        errorType: "VALIDATION_ERROR"
      });
    }

    const contractors = await Contractor.find({ contractorRole: role })
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

    return res.status(200).json({
      success: true,
      data: contractors
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contractors",
      errorType: "SERVER_ERROR"
    });
  }
};

// Add Worker to Contractor
export const addWorkerToContractor = async (req, res) => {
  try {
    const { contractorId, workerId } = req.params;

    const contractor = await Contractor.findOne({ 
      $or: [
        { _id: parseInt(contractorId) },
        { userId: parseInt(contractorId) }
      ]
    });

    if (!contractor) {
      return res.status(404).json({
        success: false,
        message: "Contractor not found",
        errorType: "NOT_FOUND"
      });
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
      return res.status(400).json({
        success: false,
        message: "Invalid contractor role",
        errorType: "VALIDATION_ERROR"
      });
    }

    // Initialize roleDetails if needed
    if (!contractor.roleDetails) contractor.roleDetails = {};
    if (!contractor.roleDetails[roleField]) {
      contractor.roleDetails[roleField] = { workers: [] };
    }

    // Add worker if not already present
    if (!contractor.roleDetails[roleField].workers.includes(workerId)) {
      contractor.roleDetails[roleField].workers.push(workerId);
      await contractor.save();
    }

    const updatedContractor = await Contractor.findById(contractor._id)
      .populate("userId", "-password")
      .populate(`roleDetails.${roleField}.workers`, "name phone workerType");

    return res.status(200).json({
      success: true,
      message: "Worker added to contractor successfully",
      data: updatedContractor
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add worker to contractor",
      errorType: "SERVER_ERROR"
    });
  }
};

// Remove Worker from Contractor
export const removeWorkerFromContractor = async (req, res) => {
  try {
    const { contractorId, workerId } = req.params;

    const contractor = await Contractor.findOne({ 
      $or: [
        { _id: parseInt(contractorId) },
        { userId: parseInt(contractorId) }
      ]
    });

    if (!contractor) {
      return res.status(404).json({
        success: false,
        message: "Contractor not found",
        errorType: "NOT_FOUND"
      });
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
      return res.status(400).json({
        success: false,
        message: "Invalid contractor role",
        errorType: "VALIDATION_ERROR"
      });
    }

    // Remove worker if exists
    if (contractor.roleDetails?.[roleField]?.workers) {
      contractor.roleDetails[roleField].workers = 
        contractor.roleDetails[roleField].workers.filter(id => id.toString() !== workerId);
      await contractor.save();
    }

    const updatedContractor = await Contractor.findById(contractor._id)
      .populate("userId", "-password")
      .populate(`roleDetails.${roleField}.workers`, "name phone workerType");

    return res.status(200).json({
      success: true,
      message: "Worker removed from contractor successfully",
      data: updatedContractor
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove worker from contractor",
      errorType: "SERVER_ERROR"
    });
  }
};
