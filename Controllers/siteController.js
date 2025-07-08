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

// Format date as MM/DD/YYYY
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

// ✅ Add Site
export const addSite = async (req, res) => {
  try {
    const {
      client, siteName, location, areaSqFt, workersCount,
      startDate, endDate, status, budget, notes
    } = req.body;

    if ( !siteName ) {
      return res.status(400).json({
        success: false,
        message: "Required fields: siteName"
      });
    }

    const siteMap = req.file ? `/uploads/${req.file.filename}` : null;

    const newSite = new Site({
      client,
      siteName,
      location,
      areaSqFt,
      workersCount: workersCount ? JSON.parse(workersCount) : {},
      startDate: formatDate(startDate || new Date()),
      endDate: formatDate(endDate || new Date()),
      status,
      budget,
      notes,
      siteMap,
      createdAt: formatDate(new Date())
    });
    
    await newSite.save();

    const populatedSite = await Site.findById(newSite._id).populate("client").lean();
    
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

// ✅ Get All Sites
export const getSites = async (req, res) => {
  try {
    const sites = await Site.find().populate("client").lean();
    res.status(200).json({ success: true, data: sites });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Get Site by ID
export const getSiteById = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id).populate("client").lean();
    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }
    res.status(200).json({ success: true, data: site });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Update Site
export const updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    const fields = [
      'siteName', 'location', 'areaSqFt', 'status', 'budget', 'notes',
      'startDate', 'endDate', 'client'
    ];
    fields.forEach(field => {
      if (updateData[field] !== undefined) {
        site[field] = updateData[field];
      }
    });

    if (updateData.workersCount) {
      site.workersCount = JSON.parse(updateData.workersCount);
    }

    if (req.file) {
      site.siteMap = `/uploads/${req.file.filename}`;
    }

    await site.save();

    const updatedSite = await Site.findById(id).populate("client").lean();

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
      return res.status(404).json({ success: false, message: "Site not found" });
    }
    res.status(200).json({
      success: true,
      message: "Site deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
