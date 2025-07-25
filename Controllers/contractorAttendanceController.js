// controllers/contractorAttendanceController.js
import Contractor from "../models/Contractor.js";
import cron from 'node-cron';
import exceljs from 'exceljs';
import pdfkit from 'pdfkit';

// Helper function to format date as DD/MM/YYYY
const formatCurrentDate = () => {
  const date = new Date();
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Initialize or reset attendance data
const initializeAttendanceData = async () => {
  try {
    const currentDate = formatCurrentDate();
    
    // Update all contractors with missing date or outdated date
    await Contractor.updateMany(
      {
        $or: [
          { 'currentAttendance.date': { $ne: currentDate } },
          { 'currentAttendance.date': { $exists: false } }
        ]
      },
      {
        $set: {
          'currentAttendance.date': currentDate,
          'currentAttendance.status': null
        }
      }
    );
    
    console.log(`Contractor attendance data initialized for date: ${currentDate}`);
  } catch (error) {
    console.error("Error initializing contractor attendance data:", error);
  }
};

// Run initialization on server start
initializeAttendanceData();

// Schedule daily reset at midnight
cron.schedule('0 0 * * *', initializeAttendanceData);

export const getContractorAttendance = async (req, res) => {
  try {
    const currentDate = formatCurrentDate();
    
    // Only initialize attendance for contractors without today's date
    await Contractor.updateMany(
      {
        $or: [
          { 'currentAttendance.date': { $ne: currentDate } },
          { 'currentAttendance.date': { $exists: false } }
        ]
      },
      {
        $set: {
          'currentAttendance.date': currentDate,
          'currentAttendance.status': null
        }
      }
    );

    // Fetch all contractors with their current data
    const contractors = await Contractor.find()
      .select('_id name photo currentAttendance attendanceRecords')
      .sort({ name: 1 });

    // Transform the data
    const data = contractors.map(contractor => {
      // Use current status if date matches, otherwise look in records
      const status = contractor.currentAttendance?.date === currentDate
        ? contractor.currentAttendance.status
        : contractor.attendanceRecords.find(r => 
            new Date(r.date).toLocaleDateString('en-GB') === currentDate
          )?.status || null;

      return {
        currentAttendance: {
          date: currentDate,
          status: status
        },
        _id: contractor._id,
        name: contractor.name,
        photo: contractor.photo
      };
    });

    return res.status(200).json({
      success: true,
      data,
      currentDate
    });

  } catch (error) {
    console.error("Error fetching contractor attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Update attendance status for a contractor
export const updateContractorAttendance = async (req, res) => {
  try {
    const { contractorId } = req.params;
    const { status } = req.body;
    const currentDate = formatCurrentDate();

    // First update the attendance
    await Contractor.updateOne(
      { _id: contractorId },
      { 
        $set: { 
          'currentAttendance.status': status,
          'currentAttendance.date': currentDate
        } 
      }
    );

    // Then fetch the updated contractor with all needed fields
    const updatedContractor = await Contractor.findById(contractorId)
      .select('_id name photo currentAttendance');

    if (!updatedContractor) {
      return res.status(404).json({
        success: false,
        message: "Contractor not found"
      });
    }

    // Ensure currentAttendance exists in the response
    if (!updatedContractor.currentAttendance) {
      updatedContractor.currentAttendance = {
        date: currentDate,
        status: status
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        currentAttendance: updatedContractor.currentAttendance,
        _id: updatedContractor._id,
        name: updatedContractor.name,
        photo: updatedContractor.photo
      }
    });

  } catch (error) {
    console.error("Error updating contractor attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};


export const bulkUpdateContractorAttendanceByDate = async (req, res) => {
  try {
    const { date, status } = req.body;

    // Validate date format (DD/MM/YYYY)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use DD/MM/YYYY"
      });
    }

    // Validate status
    const validStatuses = ["Fullday", "Halfday", "Overtime", null];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    // Update operation - store the result
    const updateResult = await Contractor.updateMany(
      {},
      {
        $set: {
          'currentAttendance.date': date,
          'currentAttendance.status': status
        },
        $push: status ? {
          attendanceRecords: {
            date,
            status,
            recordedAt: new Date()
          }
        } : undefined
      }
    );

    // Fetch ALL contractors (not filtered by date) since we updated all
    const updatedContractors = await Contractor.find({})
      .select('_id userId name currentAttendance')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: `Bulk attendance updated for date: ${date}`,
      updatedCount: updateResult.modifiedCount,
      data: updatedContractors.map(contractor => ({
        currentAttendance: contractor.currentAttendance || {
          date: date,
          status: status
        },
        _id: contractor._id,
        userId: contractor.userId,
        name: contractor.name
      }))
    });

  } catch (error) {
    console.error("Bulk update error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to bulk update attendance",
      error: error.message
    });
  }
};
// Bulk update attendance status for all contractors (regardless of date)
export const bulkUpdateContractorAttendanceStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ["Fullday", "Halfday", "Overtime", null];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    // Update currentAttendance status for all contractors
    const updateQuery = {
      $set: {
        'currentAttendance.status': status
      }
    };

    // If status is provided, also add to attendanceRecords with current date
    if (status) {
      updateQuery.$push = {
        attendanceRecords: {
          date: new Date(), // Using current date
          status
        }
      };
    }

    const result = await Contractor.updateMany({}, updateQuery);

    // Get updated records
    const updatedContractors = await Contractor.find()
      .select('_id userId name currentAttendance')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: `Bulk attendance status updated to: ${status}`,
      updatedCount: result.modifiedCount,
      data: updatedContractors
    });

  } catch (error) {
    console.error("Error in bulk attendance status update:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};
// Get attendance details for a specific date
// Get attendance details for a specific date
export const getContractorAttendanceByDate = async (req, res) => {
  try {
    const date = `${req.params.day}/${req.params.month}/${req.params.year}`;

    // Validate date format (DD/MM/YYYY)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use DD/MM/YYYY"
      });
    }

    // Get all contractors with either current attendance or historical records matching the date
    const contractors = await Contractor.aggregate([
      {
        $match: {
          $or: [
            { 'currentAttendance.date': date },
            { 'attendanceRecords.date': date }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          status: {
            $cond: {
              if: { $eq: ['$currentAttendance.date', date] },
              then: '$currentAttendance.status',
              else: {
                $let: {
                  vars: {
                    matchingRecord: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$attendanceRecords',
                            as: 'record',
                            cond: { $eq: ['$$record.date', date] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: '$$matchingRecord.status'
                }
              }
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: contractors,
      date
    });

  } catch (error) {
    console.error("Error fetching contractor attendance by date:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};
// Helper function to get week range within a month
const getWeekRangeInMonth = (year, month, weekNumber) => {
  // Create date for the first day of the month
  const firstDay = new Date(year, month - 1, 1);
  
  // Calculate the first Monday of the month
  let firstMonday = new Date(firstDay);
  firstMonday.setDate(1 + ((8 - firstDay.getDay()) % 7));
  
  // Calculate start and end dates for the requested week
  const startDate = new Date(firstMonday);
  startDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  // Format dates as DD/MM/YYYY
  const format = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  return {
    start: format(startDate),
    end: format(endDate),
    month: month.toString().padStart(2, '0'),
    year: year.toString(),
    weekNumber
  };
};

// Generate Daily Report
export const getContractorDailyReport = async (req, res) => {
  try {
    const { DD, MM, YYYY } = req.params;
    const date = `${DD}/${MM}/${YYYY}`;
    const format = req.query.format || 'json'; // Default to JSON, options: json, excel, pdf

    // Validate date format
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use DD/MM/YYYY"
      });
    }

    // Get attendance data for the specified date
    const contractors = await Contractor.aggregate([
      {
        $match: {
          $or: [
            { 'currentAttendance.date': date },
            { 'attendanceRecords.date': date }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          currentStatus: {
            $cond: {
              if: { $eq: ['$currentAttendance.date', date] },
              then: '$currentAttendance.status',
              else: null
            }
          },
          historicalStatus: {
            $let: {
              vars: {
                filteredRecords: {
                  $filter: {
                    input: '$attendanceRecords',
                    as: 'record',
                    cond: { $eq: ['$$record.date', date] }
                  }
                }
              },
              in: { $arrayElemAt: ['$$filteredRecords.status', 0] }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          status: {
            $cond: {
              if: { $ne: ['$currentStatus', null] },
              then: '$currentStatus',
              else: '$historicalStatus'
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: contractors,
        date,
        reportType: 'daily'
      });
    } else if (format === 'excel') {
      // Create Excel workbook
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Daily Attendance Report');
      
      // Add headers
      worksheet.columns = [
        { header: 'ID', key: 'userId', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      
      // Add data
      contractors.forEach(contractor => {
        worksheet.addRow({
          userId: contractor.userId,
          name: contractor.name,
          status: contractor.status || 'Not Recorded'
        });
      });
      
      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=contractor_daily_report_${DD}_${MM}_${YYYY}.xlsx`
      );
      
      // Send the workbook
      return workbook.xlsx.write(res).then(() => {
        res.end();
      });
    } else if (format === 'pdf') {
      // Create PDF document
      const doc = new pdfkit();
      const filename = `contractor_daily_report_${DD}_${MM}_${YYYY}.pdf`;
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Pipe PDF to response
      doc.pipe(res);
      
      // Add content
      doc.fontSize(18).text(`Contractor Daily Attendance Report - ${date}`, { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12);
      
      // Initialize counters
      const statusCounts = {
        Fullday: 0,
        Halfday: 0,
        Overtime: 0,
        Absent: 0
      };

      // Process each contractor and count statuses
      contractors.forEach((contractor, index) => {
        const status = contractor.status || 'Not Marked';
        
        // Update counters
        if (status === 'Fullday') statusCounts.Fullday++;
        else if (status === 'Halfday') statusCounts.Halfday++;
        else if (status === 'Overtime') statusCounts.Overtime++;
        else statusCounts.Absent++; // Counts both null and "Not Marked"
        
        doc.text(`${index + 1}. ${contractor.name} - ${status}`);
        doc.moveDown(0.5);
      });

      // Add summary section
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Attendance Summary:', { underline: true });
      doc.moveDown(0.3);
      doc.font('Helvetica');

      // Create summary table
      const summaryY = doc.y;
      const startX = 50;
      const colWidth = 100;

      // Table headers
      doc.text('Status', startX, summaryY);
      doc.text('Count', startX + colWidth, summaryY);
      doc.moveDown(0.5);

      // Table rows
      doc.text('Fullday', startX);
      doc.text(statusCounts.Fullday.toString(), startX + colWidth);
      doc.moveDown(0.3);

      doc.text('Halfday', startX);
      doc.text(statusCounts.Halfday.toString(), startX + colWidth);
      doc.moveDown(0.3);

      doc.text('Overtime', startX);
      doc.text(statusCounts.Overtime.toString(), startX + colWidth);
      doc.moveDown(0.3);

      doc.text('Absent/Not Marked', startX);
      doc.text(statusCounts.Absent.toString(), startX + colWidth);
      doc.moveDown(0.5);

      // Add total count
      doc.font('Helvetica-Bold')
         .text(`Total Contractors: ${contractors.length}`, { align: 'right' });

      // Finalize PDF
      doc.end();
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid format parameter. Use json, excel, or pdf"
      });
    }
  } catch (error) {
    console.error("Error generating contractor daily report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Generate Weekly Report within a specific month
export const getContractorWeeklyReport = async (req, res) => {
  try {
    const { MM, YYYY, week } = req.params;
    const format = req.query.format || 'json'; // Default to JSON, options: json, excel, pdf
    
    // Validate week number (01-04)
    const weekNumber = parseInt(week);
    if (weekNumber < 1 || weekNumber > 4) {
      return res.status(400).json({
        success: false,
        message: "Invalid week number. Please use 01-04 for weeks in the month"
      });
    }
    
    // Validate month/year format
    const monthYear = `${MM}/${YYYY}`;
    if (!/^\d{2}\/\d{4}$/.test(monthYear)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month/year format. Please use MM/YYYY"
      });
    }
    
    // Get week range for the specified week in the month
    const weekRange = getWeekRangeInMonth(parseInt(YYYY), parseInt(MM), weekNumber);
    
    // Get attendance data for the week
    const contractors = await Contractor.aggregate([
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          currentAttendance: 1,
          weeklyRecords: {
            $filter: {
              input: '$attendanceRecords',
              as: 'record',
              cond: {
                $and: [
                  { $gte: ['$$record.date', weekRange.start] },
                  { $lte: ['$$record.date', weekRange.end] }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          daysPresent: {
            $size: {
              $filter: {
                input: '$weeklyRecords',
                as: 'record',
                cond: { $ne: ['$$record.status', null] }
              }
            }
          },
          totalDays: {
            $size: '$weeklyRecords'
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: contractors,
        weekRange,
        reportType: 'weekly',
        weekInfo: {
          month: weekRange.month,
          year: weekRange.year,
          weekNumber: weekRange.weekNumber
        }
      });
    } else if (format === 'excel') {
      // Create Excel workbook
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Weekly Attendance Report');
      
      // Add headers
      worksheet.columns = [
        { header: 'ID', key: 'userId', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Days Present', key: 'daysPresent', width: 15 },
        { header: 'Total Days', key: 'totalDays', width: 15 },
        { header: 'Attendance Rate', key: 'attendanceRate', width: 20 }
      ];
      
      // Add data
      contractors.forEach(contractor => {
        const attendanceRate = contractor.totalDays > 0 
          ? (contractor.daysPresent / contractor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        worksheet.addRow({
          userId: contractor.userId,
          name: contractor.name,
          daysPresent: contractor.daysPresent,
          totalDays: contractor.totalDays,
          attendanceRate
        });
      });
      
      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=contractor_weekly_report_${weekRange.month}_${weekRange.year}_week${weekRange.weekNumber}.xlsx`
      );
      
      // Send the workbook
      return workbook.xlsx.write(res).then(() => {
        res.end();
      });
    } else if (format === 'pdf') {
      // Create PDF document
      const doc = new pdfkit();
      const filename = `contractor_weekly_report_${weekRange.month}_${weekRange.year}_week${weekRange.weekNumber}.pdf`;
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Pipe PDF to response
      doc.pipe(res);
      
      // Add content
      doc.fontSize(18).text(
        `Contractor Weekly Attendance Report - ${weekRange.month}/${weekRange.year} (Week ${weekRange.weekNumber})`, 
        { align: 'center' }
      );
      doc.fontSize(14).text(
        `Date Range: ${weekRange.start} to ${weekRange.end}`,
        { align: 'center' }
      );
      doc.moveDown();
      
      doc.fontSize(12);
      contractors.forEach((contractor, index) => {
        const attendanceRate = contractor.totalDays > 0 
          ? (contractor.daysPresent / contractor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        doc.text(`${index + 1}. ${contractor.name}`);
        doc.text(`   Days Present: ${contractor.daysPresent} of ${contractor.totalDays} (${attendanceRate})`);
        doc.moveDown(0.5);
      });
      
      // Finalize PDF
      doc.end();
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid format parameter. Use json, excel, or pdf"
      });
    }
  } catch (error) {
    console.error("Error generating contractor weekly report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Generate Monthly Report
export const getContractorMonthlyReport = async (req, res) => {
  try {
    const { MM, YYYY } = req.params;
    const format = req.query.format || 'json'; // Default to JSON, options: json, excel, pdf
    const monthYear = `${MM}/${YYYY}`;

    // Validate month/year format
    if (!/^\d{2}\/\d{4}$/.test(monthYear)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month/year format. Please use MM/YYYY"
      });
    }

    // Get attendance data for the month
    const contractors = await Contractor.aggregate([
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          currentAttendance: 1,
          monthlyRecords: {
            $filter: {
              input: '$attendanceRecords',
              as: 'record',
              cond: {
                $eq: [
                  { $substr: ['$$record.date', 3, 7] }, // Extract MM/YYYY from DD/MM/YYYY
                  monthYear
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          daysPresent: {
            $size: {
              $filter: {
                input: '$monthlyRecords',
                as: 'record',
                cond: { $ne: ['$$record.status', null] }
              }
            }
          },
          totalDays: {
            $size: '$monthlyRecords'
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: contractors,
        monthYear,
        reportType: 'monthly'
      });
    } else if (format === 'excel') {
      // Create Excel workbook
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Monthly Attendance Report');
      
      // Add headers
      worksheet.columns = [
        { header: 'ID', key: 'userId', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Days Present', key: 'daysPresent', width: 15 },
        { header: 'Total Days', key: 'totalDays', width: 15 },
        { header: 'Attendance Rate', key: 'attendanceRate', width: 20 }
      ];
      
      // Add data
      contractors.forEach(contractor => {
        const attendanceRate = contractor.totalDays > 0 
          ? (contractor.daysPresent / contractor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        worksheet.addRow({
          userId: contractor.userId,
          name: contractor.name,
          daysPresent: contractor.daysPresent,
          totalDays: contractor.totalDays,
          attendanceRate
        });
      });
      
      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=contractor_monthly_report_${MM}_${YYYY}.xlsx`
      );
      
      // Send the workbook
      return workbook.xlsx.write(res).then(() => {
        res.end();
      });
    } else if (format === 'pdf') {
      // Create PDF document
      const doc = new pdfkit();
      const filename = `contractor_monthly_report_${MM}_${YYYY}.pdf`;
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Pipe PDF to response
      doc.pipe(res);
      
      // Add content
      doc.fontSize(18).text(`Contractor Monthly Attendance Report - ${MM}/${YYYY}`, { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12);
      contractors.forEach((contractor, index) => {
        const attendanceRate = contractor.totalDays > 0 
          ? (contractor.daysPresent / contractor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        doc.text(`${index + 1}. ${contractor.name}`);
        doc.text(`   Days Present: ${contractor.daysPresent} of ${contractor.totalDays} (${attendanceRate})`);
        doc.moveDown(0.5);
      });
      
      // Finalize PDF
      doc.end();
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid format parameter. Use json, excel, or pdf"
      });
    }
  } catch (error) {
    console.error("Error generating contractor monthly report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Get daily attendance report for all contractors or specific contractor by ID
export const getContractorDailyAttendanceReport = async (req, res) => {
  try {
    const { date, contractorId, format = 'json' } = req.body;

    // Validate date format
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use DD/MM/YYYY"
      });
    }

    // Build query
    const query = {
      $or: [
        { 'currentAttendance.date': date },
        { 'attendanceRecords.date': date }
      ]
    };

    // Add contractorId filter if provided
    if (contractorId) {
      query.$or.push({ userId: contractorId });
    }

    // Get attendance data
    const contractors = await Contractor.aggregate([
      { $match: query },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          currentStatus: {
            $cond: {
              if: { $eq: ['$currentAttendance.date', date] },
              then: '$currentAttendance.status',
              else: null
            }
          },
          historicalStatus: {
            $let: {
              vars: {
                filteredRecords: {
                  $filter: {
                    input: '$attendanceRecords',
                    as: 'record',
                    cond: { $eq: ['$$record.date', date] }
                  }
                }
              },
              in: { $arrayElemAt: ['$$filteredRecords.status', 0] }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          status: {
            $cond: {
              if: { $ne: ['$currentStatus', null] },
              then: '$currentStatus',
              else: '$historicalStatus'
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: contractors,
        date,
        reportType: 'daily'
      });
    } else if (format === 'excel') {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Daily Attendance');
      
      // Add headers
      worksheet.columns = [
        { header: 'ID', key: 'userId', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      
      // Add data
      contractors.forEach(contractor => {
        worksheet.addRow({
          userId: contractor.userId,
          name: contractor.name,
          status: contractor.status || 'Not Recorded'
        });
      });
      
      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=contractor_daily_report_${date.replace(/\//g, '_')}.xlsx`
      );
      
      return workbook.xlsx.write(res).then(() => res.end());
      
    } else if (format === 'pdf') {
      const doc = new pdfkit();
      const filename = `contractor_daily_report_${date.replace(/\//g, '_')}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      doc.pipe(res);
      doc.fontSize(18).text(`Contractor Daily Attendance Report - ${date}`, { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12);

      // Initialize counters
      const statusCounts = {
        Fullday: 0,
        Halfday: 0,
        Overtime: 0,
        Absent: 0
      };

      // Process each contractor and count statuses
      contractors.forEach((contractor, index) => {
        const status = contractor.status || 'Not Marked';
        
        // Update counters
        if (status === 'Fullday') statusCounts.Fullday++;
        else if (status === 'Halfday') statusCounts.Halfday++;
        else if (status === 'Overtime') statusCounts.Overtime++;
        else statusCounts.Absent++;
        
        doc.text(`${index + 1}. ${contractor.name} - ${status}`);
        doc.moveDown(0.5);
      });

      // Add summary section
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Attendance Summary:', { underline: true });
      doc.moveDown(0.3);
      doc.font('Helvetica');

      // Create summary table
      const summaryY = doc.y;
      const startX = 50;
      const colWidth = 100;

      // Table headers
      doc.text('Status', startX, summaryY);
      doc.text('Count', startX + colWidth, summaryY);
      doc.moveDown(0.5);

      // Table rows
      doc.text('Fullday', startX);
      doc.text(statusCounts.Fullday.toString(), startX + colWidth);
      doc.moveDown(0.3);

      doc.text('Halfday', startX);
      doc.text(statusCounts.Halfday.toString(), startX + colWidth);
      doc.moveDown(0.3);

      doc.text('Overtime', startX);
      doc.text(statusCounts.Overtime.toString(), startX + colWidth);
      doc.moveDown(0.3);

      doc.text('Absent/Not Marked', startX);
      doc.text(statusCounts.Absent.toString(), startX + colWidth);
      doc.moveDown(0.5);

      // Add total count
      doc.font('Helvetica-Bold')
         .text(`Total Contractors: ${contractors.length}`, { align: 'right' });

      doc.end();
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid format parameter. Use json, excel, or pdf"
      });
    }
  } catch (error) {
    console.error("Error generating contractor daily report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Get attendance report between dates for all contractors or specific contractor by ID
export const getContractorDateRangeReport = async (req, res) => {
  try {
    const { startDate, endDate, contractorId, format = 'json' } = req.body;

    // Validate date formats
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(startDate) || !/^\d{2}\/\d{2}\/\d{4}$/.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use DD/MM/YYYY"
      });
    }

    // Build query
    const query = {};
    if (contractorId) {
      query.userId = contractorId;
    }

    // Get attendance data
    const contractors = await Contractor.aggregate([
      { $match: query },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          rangeRecords: {
            $filter: {
              input: '$attendanceRecords',
              as: 'record',
              cond: {
                $and: [
                  { $gte: ['$$record.date', startDate] },
                  { $lte: ['$$record.date', endDate] }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          daysPresent: {
            $size: {
              $filter: {
                input: '$rangeRecords',
                as: 'record',
                cond: { $ne: ['$$record.status', null] }
              }
            }
          },
          totalDays: {
            $size: '$rangeRecords'
          },
          attendanceDetails: {
            $map: {
              input: '$rangeRecords',
              as: 'record',
              in: {
                date: '$$record.date',
                status: '$$record.status'
              }
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: contractors,
        dateRange: { startDate, endDate },
        reportType: 'dateRange'
      });
    } else if (format === 'excel') {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Date Range Attendance');
      
      // Add headers
      worksheet.columns = [
        { header: 'ID', key: 'userId', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Days Present', key: 'daysPresent', width: 15 },
        { header: 'Total Days', key: 'totalDays', width: 15 },
        { header: 'Attendance Rate', key: 'attendanceRate', width: 20 }
      ];
      
      // Add data
      contractors.forEach(contractor => {
        const attendanceRate = contractor.totalDays > 0 
          ? (contractor.daysPresent / contractor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        worksheet.addRow({
          userId: contractor.userId,
          name: contractor.name,
          daysPresent: contractor.daysPresent,
          totalDays: contractor.totalDays,
          attendanceRate
        });
      });
      
      // Add details sheet
      const detailsSheet = workbook.addWorksheet('Details');
      detailsSheet.columns = [
        { header: 'ID', key: 'userId', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      
      contractors.forEach(contractor => {
        contractor.attendanceDetails.forEach(detail => {
          detailsSheet.addRow({
            userId: contractor.userId,
            name: contractor.name,
            date: detail.date,
            status: detail.status || 'Not Recorded'
          });
        });
      });
      
      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=contractor_range_report_${startDate.replace(/\//g, '_')}_to_${endDate.replace(/\//g, '_')}.xlsx`
      );
      
      return workbook.xlsx.write(res).then(() => res.end());
      
    } else if (format === 'pdf') {
      const doc = new pdfkit();
      const filename = `contractor_range_report_${startDate.replace(/\//g, '_')}_to_${endDate.replace(/\//g, '_')}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      doc.pipe(res);
      doc.fontSize(18).text(
        `Contractor Attendance Report - ${startDate} to ${endDate}`, 
        { align: 'center' }
      );
      doc.moveDown();
      
      doc.fontSize(12);
      contractors.forEach((contractor, index) => {
        const attendanceRate = contractor.totalDays > 0 
          ? (contractor.daysPresent / contractor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        doc.text(`${index + 1}. ${contractor.name}`);
        doc.text(`   Days Present: ${contractor.daysPresent} of ${contractor.totalDays} (${attendanceRate})`);
        
        // Add details for each contractor
        if (contractor.attendanceDetails.length > 0) {
          doc.text('   Details:');
          contractor.attendanceDetails.forEach(detail => {
            doc.text(`     ${detail.date}: ${detail.status || 'Not Recorded'}`);
          });
        }
        
        doc.moveDown(0.5);
      });
      
      doc.end();
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid format parameter. Use json, excel, or pdf"
      });
    }
  } catch (error) {
    console.error("Error generating contractor date range report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Get monthly attendance report for all contractors or specific contractor by ID
export const getContractorMonthlyAttendanceReport = async (req, res) => {
  try {
    const { month, year, contractorId, format = 'json' } = req.body;

    // Validate month and year
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    if (!months.includes(month) || !/^\d{4}$/.test(year)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month or year format"
      });
    }

    const monthNumber = (months.indexOf(month) + 1).toString().padStart(2, '0');
    const monthYear = `${monthNumber}/${year}`;

    // Build query
    const query = {};
    if (contractorId) {
      query.userId = contractorId;
    }

    // Get attendance data
    const contractors = await Contractor.aggregate([
      { $match: query },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          monthlyRecords: {
            $filter: {
              input: '$attendanceRecords',
              as: 'record',
              cond: {
                $eq: [
                  { $substr: ['$$record.date', 3, 7] }, // Extract MM/YYYY from DD/MM/YYYY
                  `${monthNumber}/${year}`
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          daysPresent: {
            $size: {
              $filter: {
                input: '$monthlyRecords',
                as: 'record',
                cond: { $ne: ['$$record.status', null] }
              }
            }
          },
          totalDays: {
            $size: '$monthlyRecords'
          },
          attendanceDetails: {
            $map: {
              input: '$monthlyRecords',
              as: 'record',
              in: {
                date: '$$record.date',
                status: '$$record.status'
              }
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: contractors,
        month,
        year,
        reportType: 'monthly'
      });
    } else if (format === 'excel') {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Monthly Attendance');
      
      // Add headers
      worksheet.columns = [
        { header: 'ID', key: 'userId', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Days Present', key: 'daysPresent', width: 15 },
        { header: 'Total Days', key: 'totalDays', width: 15 },
        { header: 'Attendance Rate', key: 'attendanceRate', width: 20 }
      ];
      
      // Add data
      contractors.forEach(contractor => {
        const attendanceRate = contractor.totalDays > 0 
          ? (contractor.daysPresent / contractor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        worksheet.addRow({
          userId: contractor.userId,
          name: contractor.name,
          daysPresent: contractor.daysPresent,
          totalDays: contractor.totalDays,
          attendanceRate
        });
      });
      
      // Add details sheet
      const detailsSheet = workbook.addWorksheet('Details');
      detailsSheet.columns = [
        { header: 'ID', key: 'userId', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      
      contractors.forEach(contractor => {
        contractor.attendanceDetails.forEach(detail => {
          detailsSheet.addRow({
            userId: contractor.userId,
            name: contractor.name,
            date: detail.date,
            status: detail.status || 'Not Recorded'
          });
        });
      });
      
      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=contractor_monthly_report_${month}_${year}.xlsx`
      );
      
      return workbook.xlsx.write(res).then(() => res.end());
      
    } else if (format === 'pdf') {
      const doc = new pdfkit();
      const filename = `contractor_monthly_report_${month}_${year}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      doc.pipe(res);
      doc.fontSize(18).text(
        `Contractor Monthly Attendance Report - ${month} ${year}`, 
        { align: 'center' }
      );
      doc.moveDown();
      
      doc.fontSize(12);
      contractors.forEach((contractor, index) => {
        const attendanceRate = contractor.totalDays > 0 
          ? (contractor.daysPresent / contractor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        doc.text(`${index + 1}. ${contractor.name}`);
        doc.text(`   Days Present: ${contractor.daysPresent} of ${contractor.totalDays} (${attendanceRate})`);
        
        // Add details for each contractor
        if (contractor.attendanceDetails.length > 0) {
          doc.text('   Details:');
          contractor.attendanceDetails.forEach(detail => {
            doc.text(`     ${detail.date}: ${detail.status || 'Not Recorded'}`);
          });
        }
        
        doc.moveDown(0.5);
      });
      
      doc.end();
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid format parameter. Use json, excel, or pdf"
      });
    }
  } catch (error) {
    console.error("Error generating contractor monthly report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// Get attendance report with flexible date range from URL path
export const getContractorDateRangeReportFromPath = async (req, res) => {
  try {
    const { dateRange } = req.params;
    const { contractorId, format = 'json' } = req.query;

    // Validate format
    const validFormats = ['json', 'excel', 'pdf'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: "Invalid format parameter. Use json, excel, or pdf"
      });
    }

    // Date parsing and validation
    let dateFilter = {};
    let startDate, endDate;

    // Parse date range from URL path if provided
    if (dateRange) {
      const dateParts = dateRange.split('-');
      
      if (dateParts.length === 1) {
        // Single date format: DD/MM/YYYY
        startDate = dateParts[0];
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(startDate)) {
          return res.status(400).json({
            success: false,
            message: "Invalid date format in URL. Use DD/MM/YYYY or DD/MM/YYYY-DD/MM/YYYY"
          });
        }
        const [day, month, year] = startDate.split('/');
        const parsedDate = new Date(`${year}-${month}-${day}`);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid date provided"
          });
        }
        dateFilter = {
          $gte: parsedDate,
          $lte: new Date(parsedDate.getTime() + 24 * 60 * 60 * 1000 - 1) // End of day
        };
      } 
      else if (dateParts.length === 2) {
        // Date range format: DD/MM/YYYY-DD/MM/YYYY
        [startDate, endDate] = dateParts;
        
        // Validate both dates
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(startDate) || !/^\d{2}\/\d{2}\/\d{4}$/.test(endDate)) {
          return res.status(400).json({
            success: false,
            message: "Invalid date format in URL. Use DD/MM/YYYY-DD/MM/YYYY"
          });
        }
        
        const [startDay, startMonth, startYear] = startDate.split('/');
        const parsedStartDate = new Date(`${startYear}-${startMonth}-${startDay}`);
        
        const [endDay, endMonth, endYear] = endDate.split('/');
        const parsedEndDate = new Date(`${endYear}-${endMonth}-${endDay}`);
        
        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid date provided"
          });
        }
        
        parsedEndDate.setHours(23, 59, 59, 999); // Include entire end date
        
        // Validate date range
        if (parsedStartDate > parsedEndDate) {
          return res.status(400).json({
            success: false,
            message: "Start date must be before end date"
          });
        }
        
        dateFilter = {
          $gte: parsedStartDate,
          $lte: parsedEndDate
        };
      }
      else {
        return res.status(400).json({
          success: false,
          message: "Invalid date range format. Use DD/MM/YYYY or DD/MM/YYYY-DD/MM/YYYY"
        });
      }
    } else {
      // No date range provided - get all records
      dateFilter = {};
    }

    // Build query
    const query = {};
    if (contractorId) {
      query.userId = contractorId;
    }

    // Get attendance data
    const contractors = await Contractor.aggregate([
      { $match: query },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          rangeRecords: {
            $filter: {
              input: '$attendanceRecords',
              as: 'record',
              cond: {
                $and: [
                  dateFilter.$gte ? { $gte: ['$$record.date', dateFilter.$gte] } : true,
                  dateFilter.$lte ? { $lte: ['$$record.date', dateFilter.$lte] } : true
                ].filter(Boolean)
              }
            }
          }
        }
      },
      {
        $addFields: {
          daysPresent: {
            $size: {
              $filter: {
                input: '$rangeRecords',
                as: 'record',
                cond: { $ne: ['$$record.status', null] }
              }
            }
          },
          totalDays: {
            $size: '$rangeRecords'
          },
          attendanceRate: {
            $cond: [
              { $gt: ['$totalDays', 0] },
              { $multiply: [{ $divide: ['$daysPresent', '$totalDays'] }, 100] },
              0
            ]
          },
          attendanceDetails: {
            $map: {
              input: '$rangeRecords',
              as: 'record',
              in: {
                date: '$$record.date',
                status: '$$record.status'
              }
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    // Generate report based on requested format
    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: contractors,
        dateRange: dateRange ? { 
          startDate: startDate || dateRange, 
          endDate: endDate || dateRange 
        } : { startDate: 'All', endDate: 'Records' },
        reportType: 'dateRange'
      });
    } else if (format === 'excel') {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Date Range Attendance');
      
      // Add headers
      worksheet.columns = [
        { header: 'ID', key: 'userId', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Days Present', key: 'daysPresent', width: 15 },
        { header: 'Total Days', key: 'totalDays', width: 15 },
        { header: 'Attendance Rate', key: 'attendanceRate', width: 20 }
      ];
      
      // Add data
      contractors.forEach(contractor => {
        const attendanceRate = contractor.totalDays > 0 
          ? (contractor.daysPresent / contractor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        worksheet.addRow({
          userId: contractor.userId,
          name: contractor.name,
          daysPresent: contractor.daysPresent,
          totalDays: contractor.totalDays,
          attendanceRate
        });
      });
      
      // Add details sheet
      const detailsSheet = workbook.addWorksheet('Details');
      detailsSheet.columns = [
        { header: 'ID', key: 'userId', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      
      contractors.forEach(contractor => {
        contractor.attendanceDetails.forEach(detail => {
          detailsSheet.addRow({
            userId: contractor.userId,
            name: contractor.name,
            date: detail.date,
            status: detail.status || 'Not Recorded'
          });
        });
      });
      
      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      
      let filename;
      if (dateRange) {
        if (startDate && endDate) {
          filename = `contractor_range_report_${startDate.replace(/\//g, '_')}_to_${endDate.replace(/\//g, '_')}.xlsx`;
        } else {
          filename = `contractor_daily_report_${dateRange.replace(/\//g, '_')}.xlsx`;
        }
      } else {
        filename = 'contractor_all_attendance_records.xlsx';
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      return workbook.xlsx.write(res).then(() => res.end());
      
    } else if (format === 'pdf') {
      const doc = new pdfkit();
      
      let filename;
      if (dateRange) {
        if (startDate && endDate) {
          filename = `contractor_range_report_${startDate.replace(/\//g, '_')}_to_${endDate.replace(/\//g, '_')}.pdf`;
        } else {
          filename = `contractor_daily_report_${dateRange.replace(/\//g, '_')}.pdf`;
        }
      } else {
        filename = 'contractor_all_attendance_records.pdf';
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      doc.pipe(res);
      
      // Set title based on date range
      if (dateRange) {
        if (startDate && endDate) {
          doc.fontSize(18).text(
            `Contractor Attendance Report - ${startDate} to ${endDate}`, 
            { align: 'center' }
          );
        } else {
          doc.fontSize(18).text(
            `Contractor Daily Attendance Report - ${dateRange}`, 
            { align: 'center' }
          );
        }
      } else {
        doc.fontSize(18).text(
          'All Contractor Attendance Records', 
          { align: 'center' }
        );
      }
      
      doc.moveDown();
      
      doc.fontSize(12);
      contractors.forEach((contractor, index) => {
        const attendanceRate = contractor.totalDays > 0 
          ? (contractor.daysPresent / contractor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        doc.text(`${index + 1}. ${contractor.name}`);
        doc.text(`   Days Present: ${contractor.daysPresent} of ${contractor.totalDays} (${attendanceRate})`);
        
        // Add details for each contractor
        if (contractor.attendanceDetails.length > 0) {
          doc.text('   Details:');
          contractor.attendanceDetails.forEach(detail => {
            doc.text(`     ${detail.date}: ${detail.status || 'Not Recorded'}`);
          });
        }
        
        doc.moveDown(0.5);
      });
      
      doc.end();
    }
  } catch (error) {
    console.error("Error generating contractor date range report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};