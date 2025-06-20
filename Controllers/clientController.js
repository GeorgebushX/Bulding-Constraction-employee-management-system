import Client from "../models/ClientDetails.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

export const upload = multer({ storage }).single("photo");

// Helper to format date as MM/DD/YYYY
const formatDate = (date) => {
  if (!date) return null;
  const parsedDate = new Date(date);
  const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
  const day = parsedDate.getDate().toString().padStart(2, '0');
  const year = parsedDate.getFullYear();
  return `${month}/${day}/${year}`;
};

// ✅ Add Client
export const addClient = async (req, res) => {
  try {
    const {
      name, contactPerson, gender, email, phone, alternatePhone,
      address, permanentAddress, nationality, companyName
    } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Required fields: name, email, phone"
      });
    }

    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const newClient = new Client({
      name,
      contactPerson,
      gender,
      email,
      phone,
      alternatePhone,
      address,
      permanentAddress,
      nationality,
      companyName,
      photo,
      startdate: formatDate(new Date()),
      createdAt: formatDate(new Date())
    });

    await newClient.save();

    res.status(201).json({
      success: true,
      message: "Client added successfully",
      data: newClient
    });

  } catch (error) {
    console.error("Error adding client:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Get All Clients
export const getClients = async (req, res) => {
  try {
    const clients = await Client.find().lean();
    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Get Client by ID
export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).lean();
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    res.status(200).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Update Client
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const fields = [
      'name', 'contactPerson', 'gender', 'email', 'phone', 'alternatePhone',
      'address', 'permanentAddress', 'nationality', 'companyName'
    ];
    fields.forEach(field => {
      if (updateData[field] !== undefined) client[field] = updateData[field];
    });

    if (req.file) {
      client.photo = `/uploads/${req.file.filename}`;
    }

    await client.save();

    res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: client
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Delete Client
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByIdAndDelete(id);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    res.status(200).json({
      success: true,
      message: "Client deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
