// import Client from "../models/ClientDetails.js";
// import multer from "multer";
// import path from "path";
// import fs from "fs";

// // Ensure uploads directory exists
// const uploadDir = path.join(process.cwd(), "public", "uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Multer config for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// export const upload = multer({ storage }).single("photo");

// // Helper to format date as DD/MM/YYYY
// const formatDate = (date) => {
//   if (!date) return null;
//   const parsedDate = new Date(date);
//   const day = parsedDate.getDate().toString().padStart(2, '0');
//   const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0'); 
//   const year = parsedDate.getFullYear();
//   return `${day}/${month}/${year}`;
// };

// // ✅ Add Client
// export const addClient = async (req, res) => {
//   try {
//     const {
//       name, contactPerson, gender, email, phone, alternatePhone,
//       address, permanentAddress, nationality, companyName,
//       startdate // Accept from frontend if provided
//     } = req.body;

//     if (!name || !email || !phone) {
//       return res.status(400).json({
//         success: false,
//         message: "Required fields: name, email, phone"
//       });
//     }

//     // Validate and determine the correct start date
//     const now = new Date();
//     let parsedStartDate = startdate ? new Date(startdate) : now;

//     // Clear time part for comparison
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     parsedStartDate.setHours(0, 0, 0, 0);

//     if (parsedStartDate < today) {
//       return res.status(400).json({
//         success: false,
//         message: "Start date cannot be in the past"
//       });
//     }

//     const photo = req.file ? `/uploads/${req.file.filename}` : null;

//     const newClient = new Client({
//       name,
//       contactPerson,
//       gender,
//       email,
//       phone,
//       alternatePhone,
//       address,
//       permanentAddress,
//       nationality,
//       companyName,
//       photo,
//       startdate: formatDate(parsedStartDate),
//       createdAt: formatDate(now)
//     });

//     await newClient.save();

//     res.status(201).json({
//       success: true,
//       message: "Client added successfully",
//       data: newClient
//     });

//   } catch (error) {
//     console.error("Error adding client:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };



// // ✅ Add Client
// // export const addClient = async (req, res) => {
// //   try {
// //     const {
// //       name, contactPerson, gender, email, phone, alternatePhone,
// //       address, permanentAddress, nationality, companyName
// //     } = req.body;

// //     if (!name || !email || !phone) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Required fields: name, email, phone"
// //       });
// //     }

// //     const photo = req.file ? `/uploads/${req.file.filename}` : null;

// //     const newClient = new Client({
// //       name,
// //       contactPerson,
// //       gender,
// //       email,
// //       phone,
// //       alternatePhone,
// //       address,
// //       permanentAddress,
// //       nationality,
// //       companyName,
// //       photo,  
// //       startdate: formatDate(new Date()),
// //       createdAt: formatDate(new Date())
// //     });

// //     await newClient.save();

// //     res.status(201).json({
// //       success: true,
// //       message: "Client added successfully",
// //       data: newClient
// //     });

// //   } catch (error) {
// //     console.error("Error adding client:", error);
// //     res.status(500).json({
// //       success: false,
// //       message: "Server error",
// //       error: error.message
// //     });
// //   }
// // };

// // ✅ Get All Clients
// export const getClients = async (req, res) => {
//   try {
//     const clients = await Client.find().lean();
//     res.status(200).json({ success: true, data: clients });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// // ✅ Get Client by ID
// export const getClientById = async (req, res) => {
//   try {
//     const client = await Client.findById(req.params.id).lean();
//     if (!client) {
//       return res.status(404).json({ success: false, message: "Client not found" });
//     }
//     res.status(200).json({ success: true, data: client });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// // ✅ Update Client
// export const updateClient = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     const client = await Client.findById(id);
//     if (!client) {
//       return res.status(404).json({ success: false, message: "Client not found" });
//     }

//     const fields = [
//       'name', 'contactPerson', 'gender', 'email', 'phone', 'alternatePhone',
//       'address', 'permanentAddress', 'nationality', 'companyName'
//     ];
//     fields.forEach(field => {
//       if (updateData[field] !== undefined) client[field] = updateData[field];
//     });

//     if (req.file) {
//       client.photo = `/uploads/${req.file.filename}`;
//     }

//     await client.save();

//     res.status(200).json({
//       success: true,
//       message: "Client updated successfully",
//       data: client
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// // ✅ Delete Client
// export const deleteClient = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const client = await Client.findByIdAndDelete(id);
//     if (!client) {
//       return res.status(404).json({ success: false, message: "Client not found" });
//     }
//     res.status(200).json({
//       success: true,
//       message: "Client deleted successfully"
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };


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

// Helper function to format dates
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * @desc    Create a new client
 * @route   POST /api/clients
 * @access  Public
 */

export const createClient = async (req, res) => {
  try {
    const {
      name, contactPerson, gender, email, phone, alternatePhone,
      address, permanentAddress, nationality, companyName,
      startdate // Accept from frontend if provided
    } = req.body;

    // Basic required field validation
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Required fields: name, email, phone"
      });
    }

    const now = new Date();

    // Handle and validate startdate
    let parsedStartDate = startdate ? new Date(startdate) : now;

    // Strip time from both dates to compare only date part
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsedStartDate.setHours(0, 0, 0, 0);

    if (parsedStartDate < today) {
      return res.status(400).json({
        success: false,
        message: "Do not enter previous date."
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
      startdate: formatDate(parsedStartDate), // only if date is valid
      createdAt: formatDate(now)
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


// export const createClient = async (req, res) => {
//   try {
//     const {
//       name, contactPerson, gender, email, phone, alternatePhone,
//       address, permanentAddress, nationality, companyName,
//       startdate
//     } = req.body;

//     // Validate required fields
//     if (!name || !email || !phone) {
//       return res.status(400).json({
//         success: false,
//         message: "Name, email, and phone are required fields"
//       });
//     }

//     // Validate start date
//     const now = new Date();
//     let parsedStartDate = startdate ? new Date(startdate) : now;
//     parsedStartDate.setHours(0, 0, 0, 0);
    
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     if (parsedStartDate < today) {
//       return res.status(400).json({
//         success: false,
//         message: "Start date cannot be in the past"
//       });
//     }

//     // Handle file upload
//     const photo = req.file ? `/uploads/${req.file.filename}` : null;

//     // Create new client
//     const client = new Client({
//       name,
//       contactPerson,
//       gender,
//       email,
//       phone,
//       alternatePhone,
//       address,
//       permanentAddress,
//       nationality,
//       companyName,
//       photo,
//       startdate: formatDate(parsedStartDate),
//       createdAt: formatDate(now)
//     });

//     await client.save();

//     res.status(201).json({
//       success: true,
//       message: "Client created successfully",
//       data: client
//     });

//   } catch (error) {
//     console.error("Error creating client:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

/**
 * @desc    Get all clients
 * @route   GET /api/clients
 * @access  Public
 */
export const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find().lean();
    
    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
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
        message: "Invalid client ID"
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

    // Update fields
    const updatableFields = [
      'name', 'contactPerson', 'gender', 'email', 'phone', 'alternatePhone',
      'address', 'permanentAddress', 'nationality', 'companyName', 'startdate'
    ];
    
    updatableFields.forEach(field => {
      if (updateData[field] !== undefined) {
        client[field] = field === 'startdate' 
          ? formatDate(updateData[field])
          : updateData[field];
      }
    });

    // Update photo if new file uploaded
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
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID"
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

    res.status(200).json({
      success: true,
      message: "Client deleted successfully",
      data: {}
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID"
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
 * @desc    Delete all clients
 * @route   DELETE /api/clients
 * @access  Public
 */
export const deleteAllClients = async (req, res) => {
  try {
    // Warning: This is a dangerous operation!
    const result = await Client.deleteMany({});

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} clients`,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};