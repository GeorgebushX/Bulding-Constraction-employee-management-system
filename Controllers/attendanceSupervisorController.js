
import SupervisorAttendance from "../models/AttendanceSupervisor.js";
import Supervisor from "../models/CenteringSupervisor.js";
import exceljs from 'exceljs';
import pdfkit from 'pdfkit';

// Helper function to format date (from YYYY-MM-DD to DD/MM/YYYY)
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // If already in DD/MM/YYYY format, return as-is
  if (dateString.includes('/')) {
    return dateString;
  }
  
  // Convert from YYYY-MM-DD to DD/MM/YYYY
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Helper function to parse date (from DD/MM/YYYY to YYYY-MM-DD)
const parseToDbDate = (dateString) => {
  if (!dateString) return '';
  
  // If already in YYYY-MM-DD format, return as-is
  if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
    return dateString;
  }
  
  // Convert from DD/MM/YYYY to YYYY-MM-DD
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
};

// 1. GET all attendance records
export const getAllAttendance = async (req, res) => {
  try {
    const attendanceRecords = await SupervisorAttendance.find({})
      .populate({
        path: 'supervisorId',
        select: '_id name email photo',
        match: { _id: { $exists: true } }
      })
      .lean();

    const validRecords = attendanceRecords.filter(record => record.supervisorId);

    const formattedData = validRecords.map(record => ({
      _id: record._id,
      date: formatDate(record.date),
      supervisor: {
        _id: record.supervisorId._id,
        photo: record.supervisorId.photo,
        name: record.supervisorId.name,
        email: record.supervisorId.email
      },
      status: record.status
    }));

    res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// [Rest of your controller methods remain the same, just ensure they use formatDate() and parseToDbDate() consistently]



// 2. UPDATE Attendance by ID
export const updateAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const numericId = Number(id);
    
    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID format"
      });
    }

    if (!["Fullday", "Halfday", "Overtime", null].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status value"
      });
    }

    const updatedAttendance = await SupervisorAttendance.findOneAndUpdate(
      { _id: numericId },
      { status },
      { new: true }
    ).populate('supervisorId', '_id name email photo');

    if (!updatedAttendance) {
      return res.status(404).json({
        success: false,
        error: "Attendance record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: {
        _id: updatedAttendance._id,
        date: formatDate(updatedAttendance.date),
        supervisor: {
          _id: updatedAttendance.supervisorId._id,
          photo: updatedAttendance.supervisorId.photo,
          name: updatedAttendance.supervisorId.name,
          email: updatedAttendance.supervisorId.email
        },
        status: updatedAttendance.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


export const updateStatusBySupervisorAndDate = async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const { date, status } = req.body;

    // 1. Validate status
    if (!["Fullday", "Halfday", "Overtime", null].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status value. Allowed values: Fullday, Halfday, Overtime,null"
      });
    }

    // 2. Validate supervisorId (must be numeric)
    const numericSupervisorId = Number(supervisorId);
    if (isNaN(numericSupervisorId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid supervisor ID format. Must be a number."
      });
    }

    // 3. Parse and format date (DD/MM/YYYY → YYYY-MM-DD)
    const [day, month, year] = date.split('/');
    if (!day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use DD/MM/YYYY."
      });
    }

    const dbFormattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // 4. Update attendance record
    const updatedAttendance = await SupervisorAttendance.findOneAndUpdate(
      { 
        _id: numericSupervisorId,
        date: dbFormattedDate
      },
      { status },
      { 
        new: true,       // Return the updated document
        upsert: false    // Do not create if doesn't exist
      }
    ).populate('supervisorId', '_id name email photo');

    // 5. Handle record not found
    if (!updatedAttendance) {
      return res.status(404).json({
        success: false,
        error: "Attendance record not found for the given supervisor ID and date."
      });
    }

    // 6. Success response
    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: {
        _id: updatedAttendance._id,
        date: formatDate(updatedAttendance.date), // Format back to DD/MM/YYYY
        supervisor: {
          _id: updatedAttendance.supervisorId._id,
          photo: updatedAttendance.supervisorId.photo,
          name: updatedAttendance.supervisorId.name,
          email: updatedAttendance.supervisorId.email
        },
        status: updatedAttendance.status
      }
    });

  } catch (error) {
    // 7. Server error handling
    console.error("Error updating attendance:", error);
    res.status(500).json({
      success: false,
      error: "Server error: " + error.message
    });
  }
};







// Generate PDF Report
const generatePDFReport = (data, periodType) => {
  return new Promise((resolve) => {
    const doc = new pdfkit();
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    doc.fontSize(18).text(`Attendance ${periodType} Report`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    doc.font('Helvetica-Bold');
    doc.text('Date', 50, 100);
    doc.text('Supervisor Name', 150, 100);
    doc.text('Status', 300, 100);
    doc.font('Helvetica');

    let y = 120;
    data.forEach((record) => {
      doc.text(record.date, 50, y);
      doc.text(record.supervisor.name, 150, y);
      doc.text(record.status, 300, y);
      y += 20;
    });

    doc.end();
  });
};

// Generate Excel Report
const generateExcelReport = (data, periodType) => {
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Report');

  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Supervisor ID', key: 'id', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  data.forEach(record => {
    worksheet.addRow({
      date: record.date,
      id: record.supervisor._id,
      name: record.supervisor.name,
      email: record.supervisor.email,
      status: record.status
    });
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });

  return workbook;
};

// Daily Report
export const getDailyReport = async (req, res) => {
  try {
    const { date, format = 'json' } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Date parameter is required for daily report"
      });
    }

    const attendanceData = await SupervisorAttendance.find({ date })
      .populate({
        path: 'supervisorId',
        select: '_id name email photo',
        match: { _id: { $exists: true } }
      });

    const formattedData = attendanceData.map(record => ({
      date: formatDate(record.date),
      supervisor: {
        _id: record.supervisorId._id,
        name: record.supervisorId.name,
        email: record.supervisorId.email,
        photo: record.supervisorId.photo
      },
      status: record.status || "Not Marked"
    }));

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(formattedData, 'Daily');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_daily_report.pdf`);
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const workbook = generateExcelReport(formattedData, 'Daily');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_daily_report.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      return res.status(200).json({
        success: true,
        period: 'daily',
        date,
        data: formattedData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Weekly Report
export const getWeeklyReport = async (req, res) => {
  try {
    const { date, format = 'json' } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Date parameter is required for weekly report"
      });
    }

    const dateObj = new Date(date);
    const startDate = new Date(dateObj.setDate(dateObj.getDate() - dateObj.getDay()));
    const endDate = new Date(dateObj.setDate(dateObj.getDate() + 6));
    
    const attendanceData = await SupervisorAttendance.find({
      date: { 
        $gte: startDate.toISOString().split('T')[0], 
        $lte: endDate.toISOString().split('T')[0] 
      }
    })
    .populate({
      path: 'supervisorId',
      select: '_id name email photo',
      match: { _id: { $exists: true } }
    });

    const formattedData = attendanceData.map(record => ({
      date: formatDate(record.date),
      supervisor: {
        _id: record.supervisorId._id,
        name: record.supervisorId.name,
        email: record.supervisorId.email,
        photo: record.supervisorId.photo
      },
      status: record.status || "Not Marked"
    }));

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(formattedData, 'Weekly');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_weekly_report.pdf`);
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const workbook = generateExcelReport(formattedData, 'Weekly');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_weekly_report.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      return res.status(200).json({
        success: true,
        period: 'weekly',
        startDate: formatDate(startDate.toISOString().split('T')[0]),
        endDate: formatDate(endDate.toISOString().split('T')[0]),
        data: formattedData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Monthly Report
export const getMonthlyReport = async (req, res) => {
  try {
    const { year, month, format = 'json' } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: "Year and month parameters are required for monthly report"
      });
    }

    const attendanceData = await SupervisorAttendance.find({
      date: {
        $regex: `^${year}-${month.padStart(2, '0')}`
      }
    })
    .populate({
      path: 'supervisorId',
      select: '_id name email photo',
      match: { _id: { $exists: true } }
    });

    const formattedData = attendanceData.map(record => ({
      date: formatDate(record.date),
      supervisor: {
        _id: record.supervisorId._id,
        name: record.supervisorId.name,
        email: record.supervisorId.email,
        photo: record.supervisorId.photo
      },
      status: record.status || "Not Marked"
    }));

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(formattedData, 'Monthly');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_monthly_report.pdf`);
      return res.send(pdfBuffer);
    } else if (format === 'excel') {
      const workbook = generateExcelReport(formattedData, 'Monthly');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_monthly_report.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    } else {
      return res.status(200).json({
        success: true,
        period: 'monthly',
        year,
        month,
        data: formattedData
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
