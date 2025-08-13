
// import Site from "../models/SiteDetails.js";
// import Client from "../models/ClientDetails.js";
// import multer from "multer";
// import path from "path";
// import fs from "fs";

// // Ensure uploads directory exists
// const uploadDir = path.join(process.cwd(), "public", "uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Multer config for siteMap image upload
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// export const upload = multer({ storage }).single("siteMap");

// // ✅ Add Site
// export const addSite = async (req, res) => {
//   try {
//     const {
//       client,
//       siteName,
//       location,
//       totalAreaSqFt,
//       oneAreaSqFtAmount,
//       startDate,
//       endDate,
//       status = 'Planned',
//       notes,
//       totalSupervisors = 0,
//       totalContractors = 0
//     } = req.body;

//     // Validate required fields
//     if (!siteName || !location || !totalAreaSqFt || !oneAreaSqFtAmount) {
//       return res.status(400).json({
//         success: false,
//         message: "Site name, location, total area, and area amount are required fields"
//       });
//     }

//     // Validate client exists if provided
//     if (client) {
//       const clientExists = await Client.findById(client);
//       if (!clientExists) {
//         return res.status(404).json({
//           success: false,
//           message: "Client not found"
//         });
//       }
//     }

//     const siteMap = req.file ? `/uploads/${req.file.filename}` : undefined;

//     const newSite = new Site({
//       client: client || undefined,
//       siteName,
//       location,
//       totalAreaSqFt: Number(totalAreaSqFt),
//       oneAreaSqFtAmount: Number(oneAreaSqFtAmount),
//       startDate: startDate || formatDate(new Date()),
//       endDate: endDate || undefined,
//       status,
//       notes,
//       siteMap,
//       totalSupervisors: Number(totalSupervisors),
//       totalContractors: Number(totalContractors)
//     });
    
//     await newSite.save();

//     const populatedSite = await Site.findById(newSite._id)
//       .populate("client")
//       .lean();
    
//     res.status(201).json({
//       success: true,
//       message: "Site added successfully",
//       data: populatedSite
//     });

//   } catch (error) {
//     console.error("Error adding site:", error);
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({
//         success: false,
//         message: "Validation error",
//         error: error.message
//       });
//     }
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };


import Site from "../models/SiteDetails.js";
import Client from "../models/ClientDetails.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for siteMap image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

export const upload = multer({ storage }).single("siteMap");

// Helper function to format dates as DD/MM/YYYY
function formatDate(date) {
  if (!date) return null;
  const parsedDate = new Date(date);
  if (!isNaN(parsedDate.getTime())) {
    const day = parsedDate.getDate().toString().padStart(2, '0');
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return date;
}

// ✅ Add Site (Updated to handle client name lookup)
export const addSite = async (req, res) => {
  try {
    const {
      client: clientNameOrId, // Can be either name or ID
      siteName,
      location,
      totalAreaSqFt,
      oneAreaSqFtAmount,
      startDate,
      endDate,
      status = 'Planned',
      notes,
      totalSupervisors = 0,
      totalContractors = 0
    } = req.body;

    // Validate required fields
    if (!siteName || !location || !totalAreaSqFt || !oneAreaSqFtAmount) {
      return res.status(400).json({
        success: false,
        message: "Site name, location, total area, and area amount are required fields"
      });
    }

    let clientId = null;
    
    // If client reference is provided
    if (clientNameOrId) {
      // Try to find client by name if not a number
      if (isNaN(clientNameOrId)) {
        const client = await Client.findOne({ name: clientNameOrId });
        if (!client) {
          return res.status(404).json({
            success: false,
            message: "Client not found with the provided name"
          });
        }
        clientId = client._id;
      } else {
        // If it's a number, treat as ID
        const client = await Client.findById(clientNameOrId);
        if (!client) {
          return res.status(404).json({
            success: false,
            message: "Client not found with the provided ID"
          });
        }
        clientId = client._id;
      }
    }

    const siteMap = req.file ? `/uploads/${req.file.filename}` : undefined;

    const newSite = new Site({
      client: clientId || undefined,
      siteName,
      location,
      totalAreaSqFt: Number(totalAreaSqFt),
      oneAreaSqFtAmount: Number(oneAreaSqFtAmount),
      startDate: startDate || formatDate(new Date()),
      endDate: endDate || undefined,
      status,
      notes,
      siteMap,
      totalSupervisors: Number(totalSupervisors),
      totalContractors: Number(totalContractors)
    });
    
    await newSite.save();

    const populatedSite = await Site.findById(newSite._id)
      .populate("client")
      .lean();
    
    res.status(201).json({
      success: true,
      message: "Site added successfully",
      data: populatedSite
    });

  } catch (error) {
    console.error("Error adding site:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ... (rest of the controller methods remain the same)


// ✅ Get All Sites
export const getSites = async (req, res) => {
  try {
    const sites = await Site.find()
      .populate("client")
      .sort({ _id: -1 }) // Using _id for sorting since it's auto-incremented
      .lean();
    
    res.status(200).json({ 
      success: true, 
      count: sites.length,
      data: sites 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Get Site by ID
export const getSiteById = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id)
      .populate("client")
      .lean();
    
    if (!site) {
      return res.status(404).json({ 
        success: false, 
        message: "Site not found" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: site 
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid site ID format"
      });
    }
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Update Site
export const updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({ 
        success: false, 
        message: "Site not found" 
      });
    }

    // Update basic fields
    const fields = [
      'siteName', 
      'location', 
      'totalAreaSqFt', 
      'oneAreaSqFtAmount',
      'status', 
      'notes',
      'startDate', 
      'endDate', 
      'client',
      'totalSupervisors',
      'totalContractors'
    ];
    
    fields.forEach(field => {
      if (updateData[field] !== undefined) {
        site[field] = updateData[field];
      }
    });

    // Handle file upload
    if (req.file) {
      // Delete old file if exists
      if (site.siteMap) {
        const oldFilePath = path.join(process.cwd(), 'public', site.siteMap);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      site.siteMap = `/uploads/${req.file.filename}`;
    }

    await site.save();

    const updatedSite = await Site.findById(id)
      .populate("client")
      .lean();

    res.status(200).json({
      success: true,
      message: "Site updated successfully",
      data: updatedSite
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Delete Site
export const deleteSite = async (req, res) => {
  try {
    const site = await Site.findByIdAndDelete(req.params.id);
    
    if (!site) {
      return res.status(404).json({ 
        success: false, 
        message: "Site not found" 
      });
    }

    // Delete associated file if exists
    if (site.siteMap) {
      const filePath = path.join(process.cwd(), 'public', site.siteMap);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(200).json({
      success: true,
      message: "Site deleted successfully"
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid site ID format"
      });
    }
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};








// import Site from "../models/SiteDetails.js";
// import Client from "../models/ClientDetails.js";
// import multer from "multer";
// import path from "path";
// import fs from "fs";

// // Ensure uploads directory exists
// const uploadDir = path.join(process.cwd(), "public", "uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Multer config for siteMap image upload
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// export const upload = multer({ storage }).single("siteMap");

// // ✅ Add Site
// export const addSite = async (req, res) => {
//   try {
//     const {
//       clientName,  // Changed from client to clientName
//       siteName,
//       location,
//       totalAreaSqFt,
//       oneAreaSqFtAmount,
//       startDate,
//       endDate,
//       status = 'Planned',
//       notes,
//       totalSupervisors = 0,
//       totalContractors = 0
//     } = req.body;

//     // Validate required fields
//     if (!siteName || !location || !totalAreaSqFt || !oneAreaSqFtAmount) {
//       return res.status(400).json({
//         success: false,
//         message: "Site name, location, total area, and area amount are required fields"
//       });
//     }

//     let client = null;
//     // Validate client exists if provided
//     if (clientName) {
//       client = await Client.findOne({ name: clientName });
//       if (!client) {
//         return res.status(404).json({
//           success: false,
//           message: "Client not found with the provided name"
//         });
//       }
//     }

//     const siteMap = req.file ? `/uploads/${req.file.filename}` : undefined;

//     const newSite = new Site({
//       client: client ? client._id : undefined, // Store the client ID but reference by name
//       clientName: clientName || undefined,    // Also store the name for easy reference
//       siteName,
//       location,
//       totalAreaSqFt: Number(totalAreaSqFt),
//       oneAreaSqFtAmount: Number(oneAreaSqFtAmount),
//       startDate: startDate || formatDate(new Date()),
//       endDate: endDate || undefined,
//       status,
//       notes,
//       siteMap,
//       totalSupervisors: Number(totalSupervisors),
//       totalContractors: Number(totalContractors)
//     });
    
//     await newSite.save();

//     const populatedSite = await Site.findById(newSite._id)
//       .populate("client")
//       .lean();
    
//     res.status(201).json({
//       success: true,
//       message: "Site added successfully",
//       data: populatedSite
//     });

//   } catch (error) {
//     console.error("Error adding site:", error);
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({
//         success: false,
//         message: "Validation error",
//         error: error.message
//       });
//     }
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// // ✅ Get All Sites
// export const getSites = async (req, res) => {
//   try {
//     const sites = await Site.find()
//       .populate("client")
//       .sort({ _id: -1 })
//       .lean();
    
//     res.status(200).json({ 
//       success: true, 
//       count: sites.length,
//       data: sites 
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

// // ✅ Get Site by ID
// export const getSiteById = async (req, res) => {
//   try {
//     const site = await Site.findById(req.params.id)
//       .populate("client")
//       .lean();
    
//     if (!site) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Site not found" 
//       });
//     }
    
//     res.status(200).json({ 
//       success: true, 
//       data: site 
//     });
//   } catch (error) {
//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid site ID format"
//       });
//     }
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

// // ✅ Update Site
// export const updateSite = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     const site = await Site.findById(id);
//     if (!site) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Site not found" 
//       });
//     }

//     // Handle client name update
//     if (updateData.clientName) {
//       const client = await Client.findOne({ name: updateData.clientName });
//       if (!client) {
//         return res.status(404).json({
//           success: false,
//           message: "Client not found with the provided name"
//         });
//       }
//       site.client = client._id;
//       site.clientName = updateData.clientName;
//     }

//     // Update basic fields
//     const fields = [
//       'siteName', 
//       'location', 
//       'totalAreaSqFt', 
//       'oneAreaSqFtAmount',
//       'status', 
//       'notes',
//       'startDate', 
//       'endDate', 
//       'totalSupervisors',
//       'totalContractors'
//     ];
    
//     fields.forEach(field => {
//       if (updateData[field] !== undefined) {
//         site[field] = updateData[field];
//       }
//     });

//     // Handle file upload
//     if (req.file) {
//       // Delete old file if exists
//       if (site.siteMap) {
//         const oldFilePath = path.join(process.cwd(), 'public', site.siteMap);
//         if (fs.existsSync(oldFilePath)) {
//           fs.unlinkSync(oldFilePath);
//         }
//       }
//       site.siteMap = `/uploads/${req.file.filename}`;
//     }

//     await site.save();

//     const updatedSite = await Site.findById(id)
//       .populate("client")
//       .lean();

//     res.status(200).json({
//       success: true,
//       message: "Site updated successfully",
//       data: updatedSite
//     });

//   } catch (error) {
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({
//         success: false,
//         message: "Validation error",
//         error: error.message
//       });
//     }
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// // ✅ Delete Site
// export const deleteSite = async (req, res) => {
//   try {
//     const site = await Site.findByIdAndDelete(req.params.id);
    
//     if (!site) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Site not found" 
//       });
//     }

//     // Delete associated file if exists
//     if (site.siteMap) {
//       const filePath = path.join(process.cwd(), 'public', site.siteMap);
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: "Site deleted successfully"
//     });
//   } catch (error) {
//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid site ID format"
//       });
//     }
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };