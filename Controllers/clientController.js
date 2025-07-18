
import Client from "../models/ClientDetails.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure upload directory
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

export const upload = multer({ storage }).single("photo");

// Helper function to format dates as DD/MM/YYYY
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper function to validate future or current date

// const validateStartDate = (dateStr) => {
//   if (!dateStr) return false; // Handle empty input
  
//   // Check if the string matches DD/MM/YYYY format
//   if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
//     return false;
//   }

//   const today = new Date();
//   today.setHours(0, 0, 0, 0); // Set to start of day (00:00:00)

//   // Split DD/MM/YYYY into day, month, year
//   const [day, month, year] = dateStr.split('/');

//   // Create a new Date in ISO format (YYYY-MM-DD) to avoid parsing issues
//   const inputDate = new Date(`${year}-${month}-${day}`);

//   // Check if the parsed date is valid (e.g., no "Invalid Date")
//   if (isNaN(inputDate.getTime())) {
//     return false;
//   }

//   // Compare dates (inputDate should be >= today)
//   return inputDate >= today;
// };

const validateStartDate = (dateStr) => {
  if (!dateStr) return false; // Handle empty input

  // Check if the string matches DD/MM/YYYY format
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to midnight for accurate comparison

  // Split DD/MM/YYYY into day, month, year
  const [day, month, year] = dateStr.split('/').map(Number);

  // Create a Date object (months are 0-indexed, so subtract 1)
  const inputDate = new Date(year, month - 1, day);

  // Check if the date is invalid (e.g., 31/02/2025)
  if (
    inputDate.getDate() !== day ||
    inputDate.getMonth() !== month - 1 ||
    inputDate.getFullYear() !== year
  ) {
    return false;
  }

  // Compare dates (inputDate should be >= today)
  return inputDate >= today;
};

// const validateStartDate = (dateStr) => {
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
  
//   const [day, month, year] = dateStr.split('/');
//   const inputDate = new Date(`${day}/${month}/${year}`);
  
//   return inputDate >= today;
// };

/**
 * @desc    Create a new client
 * @route   POST /api/clients
 * @access  Public
 */
export const createClient = async (req, res) => {
  try {
    const {
      name,
      email,
      gender,
      phone,
      alternatePhone,
      address,
      permanentAddress,
      nationality,
      organizationName,
      contactPerson,
      contactPersonPhone,
      contactPersonAddress,
      startdate
    } = req.body;

    // Required field validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required fields"
      });
    }

    // Handle startdate validation
    const formattedStartDate = startdate ? formatDate(startdate) : formatDate(new Date());
    
    if (startdate && !validateStartDate(formattedStartDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date must be today or a future date"
      });
    }

    // Handle photo upload
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const newClient = new Client({
      name,
      email,
      gender,
      phone,
      alternatePhone,
      address,
      permanentAddress,
      nationality,
      organizationName,
      contactPerson,
      contactPersonPhone,
      contactPersonAddress,
      photo,
      startdate: formattedStartDate
    });

    await newClient.save();

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: newClient
    });

  } catch (error) {
    console.error("Error creating client:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Client with this phone or email already exists"
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * @desc    Get all clients
 * @route   GET /api/clients
 * @access  Public
 */
export const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ _id: -1 }).lean();
    
    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch clients",
      error: error.message
    });
  }
};

/**
 * @desc    Get single client by ID
 * @route   GET /api/clients/:id
 * @access  Public
 */
export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).lean();
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }

    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID format"
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to fetch client",
      error: error.message
    });
  }
};

/**
 * @desc    Update client
 * @route   PUT /api/clients/:id
 * @access  Public
 */
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find client
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }

    // Validate startdate if provided
    if (updateData.startdate) {
      const formattedDate = formatDate(updateData.startdate);
      if (!validateStartDate(formattedDate)) {
        return res.status(400).json({
          success: false,
          message: "Start date must be today or a future date"
        });
      }
      updateData.startdate = formattedDate;
    }

    // Update fields
    const updatableFields = [
      'name', 'email', 'gender', 'phone', 'alternatePhone',
      'address', 'permanentAddress', 'nationality', 'organizationName',
      'contactPerson', 'contactPersonPhone', 'contactPersonAddress', 'startdate'
    ];
    
    updatableFields.forEach(field => {
      if (updateData[field] !== undefined) {
        client[field] = updateData[field];
      }
    });

    // Update photo if new file uploaded
    if (req.file) {
      // Delete old photo if exists
      if (client.photo) {
        const oldPhotoPath = path.join(process.cwd(), 'public', client.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      client.photo = `/uploads/${req.file.filename}`;
    }

    await client.save();

    res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: client
    });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID format"
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update client",
      error: error.message
    });
  }
};

/**
 * @desc    Delete a client
 * @route   DELETE /api/clients/:id
 * @access  Public
 */
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }

    // Delete associated photo file if exists
    if (client.photo) {
      const photoPath = path.join(process.cwd(), 'public', client.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    res.status(200).json({
      success: true,
      message: "Client deleted successfully",
      data: {}
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID format"
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to delete client",
      error: error.message
    });
  }
};

/**
 * @desc    Delete all clients (Dangerous operation - use with caution)
 * @route   DELETE /api/clients
 * @access  Public
 */
export const deleteAllClients = async (req, res) => {
  try {
    // Get all clients first to delete their photos
    const clients = await Client.find();
    
    // Delete all photo files
    clients.forEach(client => {
      if (client.photo) {
        const photoPath = path.join(process.cwd(), 'public', client.photo);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }
    });

    // Delete all clients from database
    const result = await Client.deleteMany({});

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} clients and their associated files`,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete all clients",
      error: error.message
    });
  }
};