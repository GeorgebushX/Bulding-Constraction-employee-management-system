import Staffmodule from "../models/StaffModel.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";

// File upload directory setup
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup for photo and certificate upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const upload = multer({ storage }).fields([
  { name: "photo", maxCount: 1 },
  { name: "staffCertificates", maxCount: 5 },
]);

// ✅ Add Staff/Student
export const addStaffOrStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      dateOfBirth,
      gender,
      nationality,
      bloodGroup,
      phone,
      alternatePhone,
      address,
      permanentAddress,
      role,
      joiningDate,
      bankCode,
      bankAccount,
      password,
      maritalStatus,
      department,
      staffIdProof
    } = req.body;

    if (!name || !dateOfBirth || !role || !department) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already registered with this email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle file uploads
    const photo = req.files?.photo ? `/uploads/${req.files.photo[0].filename}` : null;
    const staffCertificates = req.files?.staffCertificates?.map(file => `/uploads/${file.filename}`) || [];

    // Create Staff/Student record
    const student = new Staffmodule({
      name,
      email,
      dateOfBirth,
      gender,
      nationality,
      bloodGroup,
      phone,
      alternatePhone,
      address: JSON.parse(address),
      permanentAddress: JSON.parse(permanentAddress),
      role,
      joiningDate,
      department,
      bankCode,
      bankAccount,
      maritalStatus,
      photo,
      staffIdProof,
      staffCertificates,
    });

    await student.save();

    // Create corresponding User with roleNumber and hashed password
    const user = new User({
      name: student.roleNumber,
      email,
      role: role.toLowerCase(),
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({ success: true, message: "Entry created successfully", data: student });
  } catch (error) {
    console.error("Error creating record:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ✅ Get All
export const getAll = async (req, res) => {
  try {
    const all = await Staffmodule.find().populate("department").lean();
    res.status(200).json({ success: true, data: all });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ✅ Get by ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Staffmodule.findById(id).populate("department").lean();
    if (!user) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ✅ Delete by ID
export const deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Staffmodule.findByIdAndDelete(id);
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });

    await User.deleteOne({ name: record.roleNumber }); // Assuming roleNumber = username
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
