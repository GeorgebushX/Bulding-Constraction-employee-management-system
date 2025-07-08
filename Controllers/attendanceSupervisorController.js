import SupervisorAttendance from "../models/AttendanceSupervisor.js";
import Supervisor from "../models/Supervisor.js";

// ✅ GET today's attendance with full population
export const getAttendance = async (req, res) => {
  try {
    const date = new Date().toISOString().split("T")[0];

    const data = await SupervisorAttendance.find({ date })
  .select("supervisorId status date")
  .populate({
    path: "supervisorId",
    model: "Supervisor",
    // populate: {
    //   path: "userId",
    //   model: "User",
    // }
  })
  .lean();

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE attendance by attendance _id
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const attendance = await SupervisorAttendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    attendance.status = status;
    await attendance.save();

    res.status(200).json({ success: true, message: "Attendance updated successfully", attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE attendance status by supervisorId + date
export const updateStatus = async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const { status, date } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required" });
    }

    const attendance = await SupervisorAttendance.findOneAndUpdate(
      { supervisorId: parseInt(supervisorId), date },
      { status },
      { new: true, upsert: false }
    );

    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    res.status(200).json({ success: true, message: "Status updated successfully", attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
