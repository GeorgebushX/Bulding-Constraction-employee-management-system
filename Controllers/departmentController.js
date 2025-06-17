import Department from "../models/Department.js";

// Create department
export const addDepartment = async (req, res) => {
  try {
    const data = await Department.create(req.body);
    if (data) {
      return res.status(201).json({ success: true, message: "Department created successfully", data });
    } else {
      return res.status(400).json({ success: false, message: "Department creation failed" });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate key error",
        field: Object.keys(error.keyPattern)[0]
      });
    }
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// Get all departments
export const getDepartments = async (req, res) => {
  try {
    const data = await Department.find().populate("staff");
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: "No departments found" });
    } else {
      return res.status(200).json({ success: true, data });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get department by ID
export const getDepartmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Department.findById(id).populate("staff");
    if (!data) {
      return res.status(404).json({ success: false, message: "Department not found" });
    } else {
      return res.status(200).json({ success: true, data });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update department
export const updateDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Department.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    }).populate("staff");

    if (!data) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Delete department
export const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Department.findByIdAndDelete(id);

    if (!data) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    return res.status(200).json({ success: true, message: "Department deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
