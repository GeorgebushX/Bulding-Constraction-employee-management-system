// // import jwt from 'jsonwebtoken';
// // import User from '../models/User.js';
// // import bcrypt from 'bcrypt';
// // import dotenv from "dotenv";

// // dotenv.config();

// // export const login = async (req, res) => {
// //     try {
// //         const { email, password } = req.body;

// //         // Check if the user exists
// //         const user = await User.findOne({ email });
// //         if (!user) {
// //             return res.status(404).json({ success: false, message: "User not found" });
// //         }

// //         // Compare the entered password with the stored hashed password
// //         const isMatch = await bcrypt.compare(password, user.password);
// //         if (!isMatch) {
// //             return res.status(401).json({ success: false, message: "Wrong password" });
// //         }

// //         // Generate JWT token if credentials are correct
// //         const token = jwt.sign(
// //             { _id: user._id, role: user.role },
// //             process.env.JWT_KEY,
// //             { expiresIn: "10d" }
// //         );

// //         // Send response with user details and token
// //         res.status(200).json({
// //             success: true,
// //             token,
// //             user: {
// //                 _id: user._id,
// //                 name: user.name,
// //                 role: user.role
// //             }
// //         });

// //     } catch (error) {
// //         res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
// //     }
// // };


// // // to create verify method and use in the auth middleware

// // export const verify = (req,res)=>{
// // return res.status(200).json({success:true, user:req.user})
// // }


import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Supervisor from '../models/Supervisor.js';
import Contractor from '../models/Contractor.js';
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

    if (user.role === "Supervisor") {
      const supervisor = await Supervisor.findOne({ userId: user._id });
      roleType = supervisor?.supervisorType || null;
    } else if (user.role === "Contractor") {
      const contractor = await Contractor.findOne({ userId: user._id });
      roleType = contractor?.contractorRole || null;
    }

    // Create unified user response
    const userResponse = {
      _id: user._id,
      name: user.name,
      role: user.role,
      ...(roleType && { roleType })
    };

    const tokenPayload = {
      _id: user._id,
      role: user.role,
      ...(roleType && { roleType })
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

    if (role === "Supervisor") {
      const supervisor = await Supervisor.findOne({ userId: _id });
      roleType = supervisor?.supervisorType || null;
    } else if (role === "Contractor") {
      const contractor = await Contractor.findOne({ userId: _id });
      roleType = contractor?.contractorRole || null;
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleType, // ✅ this is now properly returned
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








// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// import Supervisor from '../models/Supervisor.js';
// import Contractor from '../models/Contractor.js';
// import bcrypt from 'bcrypt';
// import dotenv from "dotenv";

// dotenv.config();

// export const login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Check if the user exists
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not found" });
//         }

//         // Compare the entered password with the stored hashed password
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({ success: false, message: "Wrong password" });
//         }

//         // Prepare the base user response
//         const userResponse = {
//             _id: user._id,
//             name: user.name,
//             role: user.role
//         };

//         // Add role-specific fields based on user role
//         if (user.role === "Supervisor") {
//             const supervisor = await Supervisor.findOne({ userId: user._id });
//             if (supervisor) {
//                 userResponse.supervisorType = supervisor.supervisorType;
//             }
//         } else if (user.role === "Contractor") {
//             const contractor = await Contractor.findOne({ userId: user._id });
//             if (contractor) {
//                 userResponse.contractorRole = contractor.contractorRole;
//             }
//         }

//         // Generate JWT token
//         const token = jwt.sign(
//             { 
//                 _id: user._id, 
//                 role: user.role,
//                 ...(user.role === "Supervisor" && { supervisorType: userResponse.supervisorType }),
//                 ...(user.role === "Contractor" && { contractorRole: userResponse.contractorRole })
//             },
//             process.env.JWT_KEY,
//             { expiresIn: "10d" }
//         );

//         // Send response with user details and token
//         res.status(200).json({
//             success: true,
//             token,
//             user: userResponse
//         });

//     } catch (error) {
//         res.status(500).json({ 
//             success: false, 
//             message: "Internal Server Error", 
//             error: error.message 
//         });
//     }
// };

// export const verify = (req, res) => {
//     return res.status(200).json({ success: true, user: req.user });
// };
