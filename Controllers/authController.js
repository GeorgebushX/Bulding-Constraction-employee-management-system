

// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// import Supervisor from '../models/Supervisor.js';
// import Contractor from '../models/Contractor.js';
// import Worker from "../models/WorkersModel.js"
// import bcrypt from 'bcrypt';
// import dotenv from "dotenv";

// dotenv.config();

// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ success: false, message: "Wrong password" });
//     }

//     let roleType = null;

//     if (user.role === "Supervisor") {
//       const supervisor = await Supervisor.findOne({ userId: user._id });
//       roleType = supervisor?.supervisorType || null;
//     } else if (user.role === "Contractor") {
//       const contractor = await Contractor.findOne({ userId: user._id });
//       roleType = contractor?.contractorRole || null;
//     } else if (user.role === "Worker") {
//       const worker = await Worker.findOne({ userId: user._id});  // ✅ Fixed
//       roleType = worker?.workerRole || null,
//       workerSubRole = worker?.workerSubRole || null;
//     }

//     // Create unified user response
//     const userResponse = {
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       ...(roleType && { roleType }),
//        ...(user.role === "Worker" && { workerSubRole }) // Only include if Worker
//     };

//     const tokenPayload = {
//       _id: user._id,
//       role: user.role,
//       ...(roleType && { roleType }),
//       ...(user.role === "Worker" && { workerSubRole }) // Only include if Worker
//     };

//     const token = jwt.sign(tokenPayload, process.env.JWT_KEY, { expiresIn: "10d" });

//     res.status(200).json({
//       success: true,
//       token,
//       user: userResponse
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message
//     });
//   }
// };

// export const verify = async (req, res) => {
//   try {
//     const { _id, role } = req.user;

//     const user = await User.findById(_id);
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     let roleType = null;

//     if (role === "Supervisor") {
//       const supervisor = await Supervisor.findOne({ userId: _id });
//       roleType = supervisor?.supervisorType || null;
//     } else if (role === "Contractor") {
//       const contractor = await Contractor.findOne({ userId: _id });
//       roleType = contractor?.contractorRole || null;
//     } else if (role === "Worker") {
//       const worker = await Worker.findOne({ userId: _id });
//       roleType = worker?.workerRole || null,
//       workerSubRole = worker?.workerSubRole || null;
//     }

//     res.status(200).json({
//       success: true,
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         roleType,
//          ...(role === "Worker" && { workerSubRole }), // Only include if Worker,
//         createdAt: user.createdAt,
//         updatedAt: user.updatedAt
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message
//     });
//   }
// };







import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Supervisor from '../models/Supervisor.js';
import Contractor from '../models/Contractor.js';
import Worker from "../models/WorkersModel.js"
import bcrypt from 'bcrypt';
import dotenv from "dotenv";

dotenv.config();

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Wrong password" });
    }

    let roleType = null;
    let workerSubRole = null; // Initialize workerSubRole here
    

    if (user.role === "Supervisor") {
      const supervisor = await Supervisor.findOne({ userId: user._id });
      roleType = supervisor?.supervisorType || null;
     
    } else if (user.role === "Contractor") {
      const contractor = await Contractor.findOne({ userId: user._id });
      roleType = contractor?.contractorRole || null;
      
    } else if (user.role === "Worker") {
      const worker = await Worker.findOne({ userId: user._id});
      roleType = worker?.workerRole || null;
      workerSubRole = worker?.workerSubRole || null; // Now properly defined
      
    }

    // Create unified user response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      role: user.role,
      ...(roleType && { roleType }),
      ...(user.role === "Worker" && { workerSubRole })
    };

    const tokenPayload = {
      _id: user._id,
      role: user.role,
      ...(roleType && { roleType }),
      ...(user.role === "Worker" && { workerSubRole }) // Only include if Worker
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_KEY, { expiresIn: "10d" });

    res.status(200).json({
      success: true,
      token,
      user: userResponse
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

export const verify = async (req, res) => {
  try {
    const { _id, role } = req.user;

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let roleType = null;
    let workerSubRole = null; // Initialize workerSubRole here
    if (role === "Supervisor") {
      const supervisor = await Supervisor.findOne({ userId: _id });
      roleType = supervisor?.supervisorType || null;
     
    } else if (role === "Contractor") {
      const contractor = await Contractor.findOne({ userId: _id });
      roleType = contractor?.contractorRole || null;
     
    } else if (role === "Worker") {
      const worker = await Worker.findOne({ userId: _id });
      roleType = worker?.workerRole || null;
      workerSubRole = worker?.workerSubRole || null;
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photo:user.photo,
        role: user.role,
        roleType,
        ...(role === "Worker" && { workerSubRole }), // Only include if Worker
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};