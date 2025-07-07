

// import User from "../models/User.js";
// import bcrypt from "bcrypt";

// export const changePassword = async (req,res)=>{
//     try {
//         const {userId, newPassword}=req.body;

//         // Find user by ID
//         const user = await User.findById(userId);
//         if(!user){
//             return res.status(404).josn({success:false, error:"User not found"})
//         }
//         const isMatch = await bcrypt.compare(user.password);
//         if(!isMatch){
//             return res.status(400).josn({success:false, error:"" })
//         }
//         // Hash new password
//         const hashedPassword = await bcrypt.hash(newPassword, 10)
//         // updte user password
//         await User.findByIdAndUpdate(userId, {password:hashedPassword},{new:true})
//         return res.status(200).josn({success:true, message:"Password changed successfully"})
//     } catch (error) {
//         return res.status(500).josn({success:false, error:"Server error, please try again"})
//     }
// };

import User from "../models/User.js";
import bcrypt from "bcrypt";

export const changePassword = async (req, res) => {
    try {
        const { userId, newPassword, confirmPassword } = req.body;

        // Validate input
        // if (!userId || !newPassword || !confirmPassword) {
        //     return res.status(400).json({ 
        //         success: false, 
        //         error: "Please provide userId, newPassword and confirmPassword" 
        //     });
        // }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                error: "Passwords do not match" 
            });
        }

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: "User not found" 
            });
        }

        // Optional: Check if new password is different from current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ 
                success: false, 
                error: "New password must be different from current password" 
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        await User.findByIdAndUpdate(
            userId, 
            { password: hashedPassword }, 
            { new: true }
        );

        return res.status(200).json({ 
            success: true, 
            message: "Password changed successfully" 
        });
    } catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Server error, please try again" 
        });
    }
};