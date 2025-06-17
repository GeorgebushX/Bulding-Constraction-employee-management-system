import Studentmodule from "../models/StudentModel.js"
import User from "../models/User.js";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

// File upload directory setup
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup for photo and certificates
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

export const upload = multer({ storage }).fields([
  { name: "photo", maxCount: 1 },
  { name: "studentCertificates", maxCount: 5 },
]);

// ✅ Add Student
export const addStudent = async (req, res) => {
  try {
    const {
      name, email, dateOfBirth, gender, nationality, bloodGroup, phone,
      alternatePhone, address, permanentAddress, role, shift, admissionDate,
      department, specialization, tenthMarks, twelfthMarks
    } = req.body;

    if (!name || !dateOfBirth || !role || !shift || !department) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const dob = new Date(dateOfBirth);
    const rawPassword = dob.toISOString().split('T')[0];
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Handle file uploads
    const photo = req.files?.photo ? `/uploads/${req.files.photo[0].filename}` : null;
    const studentCertificates = req.files?.studentCertificates?.map(file => `/uploads/${file.filename}`) || [];

    const student = new Studentmodule({
      userId: null, // will be set after creating user
      name,
      email,
      dateOfBirth: dob,
      gender,
      nationality,
      bloodGroup,
      phone,
      alternatePhone,
      address: JSON.parse(address),
      permanentAddress: JSON.parse(permanentAddress),
      role,
      shift,
      admissionDate,
      department,
      specialization,
      tenthMarks,
      twelfthMarks,
      photo,
      studentCertificates
    });

    await student.save();

    // Create user login
    const newUser = new User({
      name: student.roleNumber,
      email,
      role: role.toLowerCase(),
      password: hashedPassword
    });

    await newUser.save();
    student.userId = newUser._id;
    await student.save();

    res.status(201).json({ success: true, message: "Student added successfully", data: student });
  } catch (error) {
    console.error("Add student error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Get all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await Studentmodule.find().populate("department").lean();
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ✅ Get by ID
export const getStudentById = async (req, res) => {
  try {
    const student = await Studentmodule.findById(req.params.id).populate("department").lean();
    if (!student) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ✅ Delete student
export const deleteStudentById = async (req, res) => {
    try {
      const student = await Studentmodule.findByIdAndDelete(req.params.id);
      if (!student) return res.status(404).json({ success: false, message: "Record not found" });
  
      await User.deleteOne({ name: student.roleNumber });
      res.status(200).json({ success: true, message: "Deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  };
  
