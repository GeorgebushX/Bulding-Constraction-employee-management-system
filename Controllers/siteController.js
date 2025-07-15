

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

// // ✅ Add Site with Workers
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
//       status,
//       notes,
//       totalSupervisors,
//       totalContractors
//     } = req.body;

//     if (!siteName || !location) {
//       return res.status(400).json({
//         success: false,
//         message: "Site name and location are required fields"
//       });
//     }

//     // Validate client exists
//     if (client) {
//       const clientExists = await Client.findById(client);
//       if (!clientExists) {
//         return res.status(404).json({
//           success: false,
//           message: "Client not found"
//         });
//       }
//     }

//     const siteMap = req.file ? `/uploads/${req.file.filename}` : null;

//     const newSite = new Site({
//       client,
//       siteName,
//       location,
//       totalAreaSqFt,
//       oneAreaSqFtAmount,
//       startDate: startDate || new Date(),
//       endDate,
//       status: status || "active",
//       notes,
//       siteMap,
//        totalSupervisors,
//       totalContractors
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
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// // ✅ Get All Sites with Workers
// export const getSites = async (req, res) => {
//   try {
//     const sites = await Site.find()
//       .populate("client")
//       .sort({ createdAt: -1 })
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

// // ✅ Get Site by ID with Workers
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
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

// // ✅ Update Site with Workers
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
//       'client',
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

// ✅ Add Site
export const addSite = async (req, res) => {
  try {
    const {
      client,
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

    // Validate client exists if provided
    if (client) {
      const clientExists = await Client.findById(client);
      if (!clientExists) {
        return res.status(404).json({
          success: false,
          message: "Client not found"
        });
      }
    }

    const siteMap = req.file ? `/uploads/${req.file.filename}` : undefined;

    const newSite = new Site({
      client: client || undefined,
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