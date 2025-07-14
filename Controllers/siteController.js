

import Site from "../models/SiteDetails.js";
import Client from "../models/ClientDetails.js";
import Supervisor from "../models/Supervisor.js";
import Contractor from "../models/Contractor.js";
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

// ✅ Add Site with Workers
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
      status,
      notes,
      supervisors,
      contractors
    } = req.body;

    if (!siteName || !location) {
      return res.status(400).json({
        success: false,
        message: "Site name and location are required fields"
      });
    }

    // Validate client exists
    if (client) {
      const clientExists = await Client.findById(client);
      if (!clientExists) {
        return res.status(404).json({
          success: false,
          message: "Client not found"
        });
      }
    }

    // Validate supervisors exist
    if (supervisors) {
      const supervisorIds = JSON.parse(supervisors);
      const supervisorsExist = await Supervisor.countDocuments({ _id: { $in: supervisorIds } });
      // if (supervisorsExist !== supervisorIds.length) {
      //   return res.status(404).json({
      //     success: false,
      //     message: "One or more supervisors not found"
      //   });
      // }
    }

    // Validate contractors exist
    if (contractors) {
      const contractorIds = JSON.parse(contractors);
      const contractorsExist = await Contractor.countDocuments({ _id: { $in: contractorIds } });
      // if (contractorsExist !== contractorIds.length) {
      //   return res.status(404).json({
      //     success: false,
      //     message: "One or more contractors not found"
      //   });
      // }
    }

    const siteMap = req.file ? `/uploads/${req.file.filename}` : null;

    const newSite = new Site({
      client,
      siteName,
      location,
      totalAreaSqFt,
      oneAreaSqFtAmount,
      startDate: startDate || new Date(),
      endDate,
      status: status || "active",
      notes,
      siteMap,
      workersCount: {
        supervisors: supervisors ? JSON.parse(supervisors) : [],
        contractors: contractors ? JSON.parse(contractors) : []
      }
    });
    
    await newSite.save();

    const populatedSite = await Site.findById(newSite._id)
      .populate("client")
      .populate("workersCount.supervisors")
      .populate("workersCount.contractors")
      .lean();
    
    res.status(201).json({
      success: true,
      message: "Site added successfully",
      data: populatedSite
    });

  } catch (error) {
    console.error("Error adding site:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Get All Sites with Workers
export const getSites = async (req, res) => {
  try {
    const sites = await Site.find()
      .populate("client")
      .populate("workersCount.supervisors")
      .populate("workersCount.contractors")
      .sort({ createdAt: -1 })
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

// ✅ Get Site by ID with Workers
export const getSiteById = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id)
      .populate("client")
      .populate("workersCount.supervisors")
      .populate("workersCount.contractors")
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
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ✅ Update Site with Workers
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
      'client'
    ];
    
    fields.forEach(field => {
      if (updateData[field] !== undefined) {
        site[field] = updateData[field];
      }
    });

    // Update contractors if provided
    if (updateData.contractors) {
      const contractorIds = JSON.parse(updateData.contractors);
      const contractorsExist = await Contractor.countDocuments({ _id: { $in: contractorIds } });
      // if (contractorsExist !== contractorIds.length) {
      //   return res.status(404).json({
      //     success: false,
      //     message: "One or more contractors not found"
      //   });
      // }
      site.workersCount.contractors = contractorIds;
    }

    // Update supervisors if provided
    if (updateData.supervisors) {
      const supervisorIds = JSON.parse(updateData.supervisors);
      const supervisorsExist = await Supervisor.countDocuments({ _id: { $in: supervisorIds } });
      // if (supervisorsExist !== supervisorIds.length) {
      //   return res.status(404).json({
      //     success: false,
      //     message: "One or more supervisors not found"
      //   });
      // }
      site.workersCount.supervisors = supervisorIds;
    }

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
      .populate("workersCount.supervisors")
      .populate("workersCount.contractors")
      .lean();

    res.status(200).json({
      success: true,
      message: "Site updated successfully",
      data: updatedSite
    });

  } catch (error) {
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
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};


