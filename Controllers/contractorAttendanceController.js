
import mongoose from 'mongoose';
import Contractor from "../models/Contractor.js";
import cron from "node-cron";
import exceljs from 'exceljs';
import pdfkit from 'pdfkit';

// Helper functions
const formatCurrentDate = () => {
  const date = new Date();
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getWeekRangeInMonth = (year, month, weekNumber) => {
  const firstDay = new Date(year, month - 1, 1);
  let firstMonday = new Date(firstDay);
  firstMonday.setDate(1 + ((8 - firstDay.getDay()) % 7));

  const startDate = new Date(firstMonday);
  startDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const format = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return {
    start: format(startDate),
    end: format(endDate),
    month: month.toString().padStart(2, "0"),
    year: year.toString(),
    weekNumber,
  };
};

// Initialize attendance data
const initializeAttendanceData = async () => {
  try {
    const currentDate = formatCurrentDate();

    await Contractor.updateMany(
      {
        $or: [
          { "currentAttendance.date": { $ne: currentDate } },
          { "currentAttendance.date": { $exists: false } },
        ],
      },
      {
        $set: {
          "currentAttendance.date": currentDate,
          "currentAttendance.status": null,
        },
      }
    );

    console.log(`Attendance initialized for ${currentDate}`);
  } catch (error) {
    console.error("Error initializing attendance:", error);
  }
};

// Run on server start and schedule daily cron job
initializeAttendanceData();
cron.schedule("0 0 * * *", initializeAttendanceData);

// Controller methods
// Export individual controller functions
export const getContractorAttendance =  async (req, res) => {
    try {
      const currentDate = formatCurrentDate();

      await Contractor.updateMany(
        {
          $or: [
            { "currentAttendance.date": { $ne: currentDate } },
            { "currentAttendance.date": { $exists: false } },
          ],
        },
        {
          $set: {
            "currentAttendance.date": currentDate,
            "currentAttendance.status": null,
          },
        }
      );

      const data = await Contractor.find()
        .select("_id name photo currentAttendance")
        .sort({ name: 1 });

      return res.status(200).json({
        success: true,
        data,
        currentDate,
      });
    } catch (error) {
      console.error("Error fetching contractor attendance:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };

  // Update single contractor attendance
// export const updateContractorAttendance = async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { status } = req.body;
//       const currentDate = formatCurrentDate();

//       // Convert id to number and validate
//       const contractorId = Number(id);
//       if (isNaN(contractorId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid contractor ID",
//         });
//       }

//       const validStatuses = ["Fullday", "Halfday", "Overtime", null];
//       if (!validStatuses.includes(status)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid attendance status",
//         });
//       }

//       const updatedContractor = await Contractor.findOneAndUpdate(
//         { _id: contractorId },
//         {
//           $set: {
//             "currentAttendance.date": currentDate,
//             "currentAttendance.status": status,
//           },
//           $push: status ? {
//             attendanceRecords: {
//               currentAttendance: {
//                 date: currentDate,
//                 status: status,
//               },
//             },
//           } : undefined,
//         },
//         { new: true }
//       ).select("_id name photo currentAttendance");

//       if (!updatedContractor) {
//         return res.status(404).json({
//           success: false,
//           message: "Contractor not found",
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         data: updatedContractor,
//         message: "Attendance updated successfully",
//       });
//     } catch (error) {
//       console.error("Error updating contractor attendance:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Internal Server Error",
//         error: error.message,
//       });
//     }
// };

// Update single contractor attendance
export const updateContractorAttendance = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const currentDate = formatCurrentDate();

      // Convert id to number and validate
      const contractorId = Number(id);
      if (isNaN(contractorId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contractor ID",
        });
      }

      const validStatuses = ["Fullday", "Halfday", "Overtime", null];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid attendance status",
        });
      }

      // Prepare the update object
      const updateObj = {
        $set: {
          "currentAttendance.date": currentDate,
          "currentAttendance.status": status,
        }
      };

      // Only add $push if status is not null
      if (status !== null) {
        updateObj.$push = {
          attendanceRecords: {
            currentAttendance: {
              date: currentDate,
              status: status,
            },
          },
        };
      }

      const updatedContractor = await Contractor.findOneAndUpdate(
        { _id: contractorId },
        updateObj,
        { new: true }
      ).select("_id name photo currentAttendance");

      if (!updatedContractor) {
        return res.status(404).json({
          success: false,
          message: "Contractor not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedContractor,
        message: "Attendance updated successfully",
      });
    } catch (error) {
      console.error("Error updating contractor attendance:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
};
  // Bulk update attendance by date
export const bulkUpdateContractorAttendanceByDate = async (req, res) => {
    try {
      const { date, status } = req.body;

      const validStatuses = ["Fullday", "Halfday", "Overtime", null];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }

      const updateQuery = {
        $set: {
          "currentAttendance.date": date,
          "currentAttendance.status": status,
        },
      };

      if (status) {
        updateQuery.$push = {
          attendanceRecords: {
            currentAttendance: {
              date,
              status,
            },
          },
        };
      }

      const result = await Contractor.updateMany({}, updateQuery);

      const updatedContractors = await Contractor.find()
        .select("_id userId name currentAttendance")
        .sort({ name: 1 });

      return res.status(200).json({
        success: true,
        message: `Bulk attendance updated for date: ${date}`,
        updatedCount: result.modifiedCount,
        data: updatedContractors,
      });
    } catch (error) {
      console.error("Error in bulk attendance update by date:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
};

  // Get attendance by specific date
  export const getContractorAttendanceByDate = async (req, res) => {
    try {
      const date = `${req.params.day}/${req.params.month}/${req.params.year}`;

      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Please use DD/MM/YYYY",
        });
      }

      const contractors = await Contractor.aggregate([
        {
          $match: {
            $or: [
              { "currentAttendance.date": date },
              { "attendanceRecords.currentAttendance.date": date },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            name: 1,
            photo: 1,
            contractorRole: 1,
            currentStatus: {
              $cond: {
                if: { $eq: ["$currentAttendance.date", date] },
                then: "$currentAttendance.status",
                else: null,
              },
            },
            historicalStatus: {
              $let: {
                vars: {
                  filteredRecords: {
                    $filter: {
                      input: "$attendanceRecords",
                      as: "record",
                      cond: { $eq: ["$$record.currentAttendance.date", date] },
                    },
                  },
                },
                in: { $arrayElemAt: ["$$filteredRecords.currentAttendance.status", 0] },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            name: 1,
            photo: 1,
            contractorRole: 1,
            status: {
              $cond: {
                if: { $ne: ["$currentStatus", null] },
                then: "$currentStatus",
                else: "$historicalStatus",
              },
            },
          },
        },
        { $sort: { name: 1 } },
      ]);

      return res.status(200).json({
        success: true,
        data: contractors,
        date,
      });
    } catch (error) {
      console.error("Error fetching contractor attendance by date:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }


  // Bulk update attendance status for current date
 export const bulkUpdateContractorAttendanceStatus = async (req, res) => {
    try {
      const { status } = req.body;
      const currentDate = formatCurrentDate();

      const validStatuses = ["Fullday", "Halfday", "Overtime", null];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }

      const updateQuery = {
        $set: {
          "currentAttendance.date": currentDate,
          "currentAttendance.status": status,
        },
      };

      if (status) {
        updateQuery.$push = {
          attendanceRecords: {
            currentAttendance: {
              date: currentDate,
              status,
            },
          },
        };
      }

      const result = await Contractor.updateMany({}, updateQuery);

      const updatedContractors = await Contractor.find()
        .select("_id userId name currentAttendance")
        .sort({ name: 1 });

      return res.status(200).json({
        success: true,
        message: `Bulk attendance status updated to: ${status}`,
        updatedCount: result.modifiedCount,
        data: updatedContractors,
      });
    } catch (error) {
      console.error("Error in bulk attendance status update:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };

  // Generate daily report
 export const getContractorDailyReport = async (req, res) => {
    try {
      const { DD, MM, YYYY } = req.params;
      const date = `${DD}/${MM}/${YYYY}`;
      const format = req.query.format || "json";

      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Please use DD/MM/YYYY",
        });
      }

      const contractors = await Contractor.aggregate([
        {
          $match: {
            $or: [
              { "currentAttendance.date": date },
              { "attendanceRecords.currentAttendance.date": date },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            name: 1,
            photo: 1,
            contractorRole: 1,
            currentStatus: {
              $cond: {
                if: { $eq: ["$currentAttendance.date", date] },
                then: "$currentAttendance.status",
                else: null,
              },
            },
            historicalStatus: {
              $let: {
                vars: {
                  filteredRecords: {
                    $filter: {
                      input: "$attendanceRecords",
                      as: "record",
                      cond: { $eq: ["$$record.currentAttendance.date", date] },
                    },
                  },
                },
                in: { $arrayElemAt: ["$$filteredRecords.currentAttendance.status", 0] },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            name: 1,
            photo: 1,
            contractorRole: 1,
            status: {
              $cond: {
                if: { $ne: ["$currentStatus", null] },
                then: "$currentStatus",
                else: "$historicalStatus",
              },
            },
          },
        },
        { $sort: { name: 1 } },
      ]);

      if (format === "json") {
        return res.status(200).json({
          success: true,
          data: contractors,
          date,
          reportType: "daily",
        });
      } else if (format === "excel") {
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet("Daily Contractor Attendance");

        worksheet.columns = [
          { header: "ID", key: "userId", width: 10 },
          { header: "Name", key: "name", width: 30 },
          { header: "Role", key: "contractorRole", width: 25 },
          { header: "Status", key: "status", width: 15 },
        ];

        contractors.forEach((contractor) => {
          worksheet.addRow({
            userId: contractor.userId,
            name: contractor.name,
            contractorRole: contractor.contractorRole,
            status: contractor.status || "Not Recorded",
          });
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=contractor_daily_report_${DD}_${MM}_${YYYY}.xlsx`
        );

        return workbook.xlsx.write(res).then(() => {
          res.end();
        });
      } else if (format === "pdf") {
        const doc = new pdfkit();
        const filename = `contractor_daily_report_${DD}_${MM}_${YYYY}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        doc.pipe(res);
        doc.fontSize(18).text(`Contractor Daily Report - ${date}`, {
          align: "center",
        });
        doc.moveDown();

        // Initialize counters
        const statusCounts = {
          Fullday: 0,
          Halfday: 0,
          Overtime: 0,
          Absent: 0,
        };

        doc.fontSize(12);
        contractors.forEach((contractor, index) => {
          const status = contractor.status || "Not Marked";
          
          if (status === "Fullday") statusCounts.Fullday++;
          else if (status === "Halfday") statusCounts.Halfday++;
          else if (status === "Overtime") statusCounts.Overtime++;
          else statusCounts.Absent++;

          doc.text(
            `${index + 1}. ${contractor.name} (${contractor.contractorRole}) - ${status}`
          );
          doc.moveDown(0.5);
        });

        // Add summary
        doc.moveDown();
        doc.font("Helvetica-Bold").text("Attendance Summary:", {
          underline: true,
        });
        doc.moveDown(0.3);
        doc.font("Helvetica");

        const summaryY = doc.y;
        const startX = 50;
        const colWidth = 100;

        doc.text("Status", startX, summaryY);
        doc.text("Count", startX + colWidth, summaryY);
        doc.moveDown(0.5);

        doc.text("Fullday", startX);
        doc.text(statusCounts.Fullday.toString(), startX + colWidth);
        doc.moveDown(0.3);

        doc.text("Halfday", startX);
        doc.text(statusCounts.Halfday.toString(), startX + colWidth);
        doc.moveDown(0.3);

        doc.text("Overtime", startX);
        doc.text(statusCounts.Overtime.toString(), startX + colWidth);
        doc.moveDown(0.3);

        doc.text("Absent/Not Marked", startX);
        doc.text(statusCounts.Absent.toString(), startX + colWidth);
        doc.moveDown(0.5);

        doc.font("Helvetica-Bold").text(
          `Total Contractors: ${contractors.length}`,
          { align: "right" }
        );

        doc.end();
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid format parameter. Use json, excel, or pdf",
        });
      }
    } catch (error) {
      console.error("Error generating contractor daily report:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };

  // Generate weekly report
 export const getContractorWeeklyReport = async (req, res) => {
    try {
      const { MM, YYYY, week } = req.params;
      const format = req.query.format || "json";

      const weekNumber = parseInt(week);
      if (weekNumber < 1 || weekNumber > 4) {
        return res.status(400).json({
          success: false,
          message: "Invalid week number. Please use 01-04",
        });
      }

      const monthYear = `${MM}/${YYYY}`;
      if (!/^\d{2}\/\d{4}$/.test(monthYear)) {
        return res.status(400).json({
          success: false,
          message: "Invalid month/year format. Please use MM/YYYY",
        });
      }

      const weekRange = getWeekRangeInMonth(
        parseInt(YYYY),
        parseInt(MM),
        weekNumber
      );

      const contractors = await Contractor.aggregate([
        {
          $project: {
            _id: 1,
            userId: 1,
            name: 1,
            photo: 1,
            contractorRole: 1,
            currentAttendance: 1,
            weeklyRecords: {
              $filter: {
                input: "$attendanceRecords",
                as: "record",
                cond: {
                  $and: [
                    { $gte: ["$$record.currentAttendance.date", weekRange.start] },
                    { $lte: ["$$record.currentAttendance.date", weekRange.end] },
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            daysPresent: {
              $size: {
                $filter: {
                  input: "$weeklyRecords",
                  as: "record",
                  cond: { $ne: ["$$record.currentAttendance.status", null] },
                },
              },
            },
            totalDays: {
              $size: "$weeklyRecords",
            },
          },
        },
        { $sort: { name: 1 } },
      ]);

      if (format === "json") {
        return res.status(200).json({
          success: true,
          data: contractors,
          weekRange,
          reportType: "weekly",
          weekInfo: {
            month: weekRange.month,
            year: weekRange.year,
            weekNumber: weekRange.weekNumber,
          },
        });
      } else if (format === "excel") {
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet("Weekly Contractor Attendance");

        worksheet.columns = [
          { header: "ID", key: "userId", width: 10 },
          { header: "Name", key: "name", width: 30 },
          { header: "Role", key: "contractorRole", width: 25 },
          { header: "Days Present", key: "daysPresent", width: 15 },
          { header: "Total Days", key: "totalDays", width: 15 },
          { header: "Attendance Rate", key: "attendanceRate", width: 20 },
        ];

        contractors.forEach((contractor) => {
          const attendanceRate =
            contractor.totalDays > 0
              ? ((contractor.daysPresent / contractor.totalDays) * 100).toFixed(2) + "%"
              : "N/A";

          worksheet.addRow({
            userId: contractor.userId,
            name: contractor.name,
            contractorRole: contractor.contractorRole,
            daysPresent: contractor.daysPresent,
            totalDays: contractor.totalDays,
            attendanceRate,
          });
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=contractor_weekly_report_${weekRange.month}_${weekRange.year}_week${weekRange.weekNumber}.xlsx`
        );

        return workbook.xlsx.write(res).then(() => {
          res.end();
        });
      } else if (format === "pdf") {
        const doc = new pdfkit();
        const filename = `contractor_weekly_report_${weekRange.month}_${weekRange.year}_week${weekRange.weekNumber}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        doc.pipe(res);
        doc.fontSize(18).text(
          `Contractor Weekly Report - ${weekRange.month}/${weekRange.year} (Week ${weekRange.weekNumber})`,
          { align: "center" }
        );
        doc.fontSize(14).text(`Date Range: ${weekRange.start} to ${weekRange.end}`, {
          align: "center",
        });
        doc.moveDown();

        doc.fontSize(12);
        contractors.forEach((contractor, index) => {
          const attendanceRate =
            contractor.totalDays > 0
              ? ((contractor.daysPresent / contractor.totalDays) * 100).toFixed(2) + "%"
              : "N/A";

          doc.text(`${index + 1}. ${contractor.name} (${contractor.contractorRole})`);
          doc.text(
            `   Days Present: ${contractor.daysPresent} of ${contractor.totalDays} (${attendanceRate})`
          );
          doc.moveDown(0.5);
        });

        doc.end();
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid format parameter. Use json, excel, or pdf",
        });
      }
    } catch (error) {
      console.error("Error generating contractor weekly report:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };

  // Generate monthly report
export const getContractorMonthlyReport  = async (req, res) => {
    try {
      const { MM, YYYY } = req.params;
      const format = req.query.format || "json";
      const monthYear = `${MM}/${YYYY}`;

      if (!/^\d{2}\/\d{4}$/.test(monthYear)) {
        return res.status(400).json({
          success: false,
          message: "Invalid month/year format. Please use MM/YYYY",
        });
      }

      const contractors = await Contractor.aggregate([
        {
          $project: {
            _id: 1,
            userId: 1,
            name: 1,
            photo: 1,
            contractorRole: 1,
            currentAttendance: 1,
            monthlyRecords: {
              $filter: {
                input: "$attendanceRecords",
                as: "record",
                cond: {
                  $eq: [
                    { $substr: ["$$record.currentAttendance.date", 3, 7] },
                    monthYear,
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            daysPresent: {
              $size: {
                $filter: {
                  input: "$monthlyRecords",
                  as: "record",
                  cond: { $ne: ["$$record.currentAttendance.status", null] },
                },
              },
            },
            totalDays: {
              $size: "$monthlyRecords",
            },
          },
        },
        { $sort: { name: 1 } },
      ]);

      if (format === "json") {
        return res.status(200).json({
          success: true,
          data: contractors,
          monthYear,
          reportType: "monthly",
        });
      } else if (format === "excel") {
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet("Monthly Contractor Attendance");

        worksheet.columns = [
          { header: "ID", key: "userId", width: 10 },
          { header: "Name", key: "name", width: 30 },
          { header: "Role", key: "contractorRole", width: 25 },
          { header: "Days Present", key: "daysPresent", width: 15 },
          { header: "Total Days", key: "totalDays", width: 15 },
          { header: "Attendance Rate", key: "attendanceRate", width: 20 },
        ];

        contractors.forEach((contractor) => {
          const attendanceRate =
            contractor.totalDays > 0
              ? ((contractor.daysPresent / contractor.totalDays) * 100).toFixed(2) + "%"
              : "N/A";

          worksheet.addRow({
            userId: contractor.userId,
            name: contractor.name,
            contractorRole: contractor.contractorRole,
            daysPresent: contractor.daysPresent,
            totalDays: contractor.totalDays,
            attendanceRate,
          });
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=contractor_monthly_report_${MM}_${YYYY}.xlsx`
        );

        return workbook.xlsx.write(res).then(() => {
          res.end();
        });
      } else if (format === "pdf") {
        const doc = new pdfkit();
        const filename = `contractor_monthly_report_${MM}_${YYYY}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        doc.pipe(res);
        doc.fontSize(18).text(
          `Contractor Monthly Report - ${MM}/${YYYY}`,
          { align: "center" }
        );
        doc.moveDown();

        doc.fontSize(12);
        contractors.forEach((contractor, index) => {
          const attendanceRate =
            contractor.totalDays > 0
              ? ((contractor.daysPresent / contractor.totalDays) * 100).toFixed(2) + "%"
              : "N/A";

          doc.text(`${index + 1}. ${contractor.name} (${contractor.contractorRole})`);
          doc.text(
            `   Days Present: ${contractor.daysPresent} of ${contractor.totalDays} (${attendanceRate})`
          );
          doc.moveDown(0.5);
        });

        doc.end();
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid format parameter. Use json, excel, or pdf",
        });
      }
    } catch (error) {
      console.error("Error generating contractor monthly report:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };

  // Get daily attendance report with flexible parameters
 export const getContractorDailyAttendanceReport = async (req, res) => {
    try {
      const { date, contractorId, format = "json" } = req.body;

      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Please use DD/MM/YYYY",
        });
      }

      const query = {
        $or: [
          { "currentAttendance.date": date },
          { "attendanceRecords.currentAttendance.date": date },
        ],
      };

      if (contractorId) {
        query.userId = contractorId;
      }

      const contractors = await Contractor.aggregate([
        { $match: query },
        {
          $project: {
            _id: 1,
            userId: 1,
            name: 1,
            photo: 1,
            contractorRole: 1,
            currentStatus: {
              $cond: {
                if: { $eq: ["$currentAttendance.date", date] },
                then: "$currentAttendance.status",
                else: null,
              },
            },
            historicalStatus: {
              $let: {
                vars: {
                  filteredRecords: {
                    $filter: {
                      input: "$attendanceRecords",
                      as: "record",
                      cond: { $eq: ["$$record.currentAttendance.date", date] },
                    },
                  },
                },
                in: { $arrayElemAt: ["$$filteredRecords.currentAttendance.status", 0] },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            name: 1,
            photo: 1,
            contractorRole: 1,
            status: {
              $cond: {
                if: { $ne: ["$currentStatus", null] },
                then: "$currentStatus",
                else: "$historicalStatus",
              },
            },
          },
        },
        { $sort: { name: 1 } },
      ]);

      if (format === "json") {
        return res.status(200).json({
          success: true,
          data: contractors,
          date,
          reportType: "daily",
        });
      } else if (format === "excel") {
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet("Contractor Daily Attendance");

        worksheet.columns = [
          { header: "ID", key: "userId", width: 10 },
          { header: "Name", key: "name", width: 30 },
          { header: "Role", key: "contractorRole", width: 25 },
          { header: "Status", key: "status", width: 15 },
        ];

        contractors.forEach((contractor) => {
          worksheet.addRow({
            userId: contractor.userId,
            name: contractor.name,
            contractorRole: contractor.contractorRole,
            status: contractor.status || "Not Recorded",
          });
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=contractor_daily_report_${date.replace(/\//g, "_")}.xlsx`
        );

        return workbook.xlsx.write(res).then(() => res.end());
      } else if (format === "pdf") {
        const doc = new pdfkit();
        const filename = `contractor_daily_report_${date.replace(/\//g, "_")}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        doc.pipe(res);
        doc.fontSize(18).text(`Contractor Daily Report - ${date}`, {
          align: "center",
        });
        doc.moveDown();

        doc.fontSize(12);

        const statusCounts = {
          Fullday: 0,
          Halfday: 0,
          Overtime: 0,
          Absent: 0,
        };

        contractors.forEach((contractor, index) => {
          const status = contractor.status || "Not Marked";

          if (status === "Fullday") statusCounts.Fullday++;
          else if (status === "Halfday") statusCounts.Halfday++;
          else if (status === "Overtime") statusCounts.Overtime++;
          else statusCounts.Absent++;

          doc.text(
            `${index + 1}. ${contractor.name} (${contractor.contractorRole}) - ${status}`
          );
          doc.moveDown(0.5);
        });

        doc.moveDown();
        doc.font("Helvetica-Bold").text("Attendance Summary:", {
          underline: true,
        });
        doc.moveDown(0.3);
        doc.font("Helvetica");

        const summaryY = doc.y;
        const startX = 50;
        const colWidth = 100;

        doc.text("Status", startX, summaryY);
        doc.text("Count", startX + colWidth, summaryY);
        doc.moveDown(0.5);

        doc.text("Fullday", startX);
        doc.text(statusCounts.Fullday.toString(), startX + colWidth);
        doc.moveDown(0.3);

        doc.text("Halfday", startX);
        doc.text(statusCounts.Halfday.toString(), startX + colWidth);
        doc.moveDown(0.3);

        doc.text("Overtime", startX);
        doc.text(statusCounts.Overtime.toString(), startX + colWidth);
        doc.moveDown(0.3);

        doc.text("Absent/Not Marked", startX);
        doc.text(statusCounts.Absent.toString(), startX + colWidth);
        doc.moveDown(0.5);

        doc.font("Helvetica-Bold").text(
          `Total Contractors: ${contractors.length}`,
          { align: "right" }
        );

        doc.end();
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid format parameter. Use json, excel, or pdf",
        });
      }
    } catch (error) {
      console.error("Error generating contractor daily report:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };

  // Get date range report
 export const getContractorDateRangeReport = async (req, res) => {
    try {
      const { startDate, endDate, contractorId, format = "json" } = req.body;

      if (
        !/^\d{2}\/\d{2}\/\d{4}$/.test(startDate) ||
        !/^\d{2}\/\d{2}\/\d{4}$/.test(endDate)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Please use DD/MM/YYYY",
        });
      }

      const query = {};
      if (contractorId) {
        query.userId = contractorId;
      }

      const contractors = await Contractor.aggregate([
        { $match: query },
        {
          $project: {
            _id: 1,
            userId: 1,
            name: 1,
            photo: 1,
            contractorRole: 1,
            rangeRecords: {
              $filter: {
                input: "$attendanceRecords",
                as: "record",
                cond: {
                  $and: [
                    { $gte: ["$$record.currentAttendance.date", startDate] },
                    { $lte: ["$$record.currentAttendance.date", endDate] },
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            daysPresent: {
              $size: {
                $filter: {
                  input: "$rangeRecords",
                  as: "record",
                  cond: { $ne: ["$$record.currentAttendance.status", null] },
                },
              },
            },
            totalDays: {
              $size: "$rangeRecords",
            },
            attendanceDetails: {
              $map: {
                input: "$rangeRecords",
                as: "record",
                in: {
                  date: "$$record.currentAttendance.date",
                  status: "$$record.currentAttendance.status",
                },
              },
            },
          },
        },
        { $sort: { name: 1 } },
      ]);

      if (format === "json") {
        return res.status(200).json({
          success: true,
          data: contractors,
          dateRange: { startDate, endDate },
          reportType: "dateRange",
        });
      } else if (format === "excel") {
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet("Contractor Date Range Attendance");

        worksheet.columns = [
          { header: "ID", key: "userId", width: 10 },
          { header: "Name", key: "name", width: 30 },
          { header: "Role", key: "contractorRole", width: 25 },
          { header: "Days Present", key: "daysPresent", width: 15 },
          { header: "Total Days", key: "totalDays", width: 15 },
          { header: "Attendance Rate", key: "attendanceRate", width: 20 },
        ];

        contractors.forEach((contractor) => {
          const attendanceRate =
            contractor.totalDays > 0
              ? ((contractor.daysPresent / contractor.totalDays) * 100).toFixed(2) + "%"
              : "N/A";

          worksheet.addRow({
            userId: contractor.userId,
            name: contractor.name,
            contractorRole: contractor.contractorRole,
            daysPresent: contractor.daysPresent,
            totalDays: contractor.totalDays,
            attendanceRate,
          });
        });

        const detailsSheet = workbook.addWorksheet("Details");
        detailsSheet.columns = [
          { header: "ID", key: "userId", width: 10 },
          { header: "Name", key: "name", width: 30 },
          { header: "Role", key: "contractorRole", width: 25 },
          { header: "Date", key: "date", width: 15 },
          { header: "Status", key: "status", width: 15 },
        ];

        contractors.forEach((contractor) => {
          contractor.attendanceDetails.forEach((detail) => {
            detailsSheet.addRow({
              userId: contractor.userId,
              name: contractor.name,
              contractorRole: contractor.contractorRole,
              date: detail.date,
              status: detail.status || "Not Recorded",
            });
          });
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=contractor_range_report_${startDate.replace(
            /\//g,
            "_"
          )}_to_${endDate.replace(/\//g, "_")}.xlsx`
        );

        return workbook.xlsx.write(res).then(() => res.end());
      } else if (format === "pdf") {
        const doc = new pdfkit();
        const filename = `contractor_range_report_${startDate.replace(
          /\//g,
          "_"
        )}_to_${endDate.replace(/\//g, "_")}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        doc.pipe(res);
        doc.fontSize(18).text(
          `Contractor Attendance Report - ${startDate} to ${endDate}`,
          { align: "center" }
        );
        doc.moveDown();

        doc.fontSize(12);
        contractors.forEach((contractor, index) => {
          const attendanceRate =
            contractor.totalDays > 0
              ? ((contractor.daysPresent / contractor.totalDays) * 100).toFixed(2) + "%"
              : "N/A";

          doc.text(
            `${index + 1}. ${contractor.name} (${contractor.contractorRole})`
          );
          doc.text(
            `   Days Present: ${contractor.daysPresent} of ${contractor.totalDays} (${attendanceRate})`
          );

          if (contractor.attendanceDetails.length > 0) {
            doc.text("   Details:");
            contractor.attendanceDetails.forEach((detail) => {
              doc.text(`     ${detail.date}: ${detail.status || "Not Recorded"}`);
            });
          }

          doc.moveDown(0.5);
        });

        doc.end();
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid format parameter. Use json, excel, or pdf",
        });
      }
    } catch (error) {
      console.error("Error generating contractor date range report:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };

  // Get monthly attendance report
 export const getContractorMonthlyAttendanceReport = async (req, res) => {
    try {
      const { month, year, contractorId, format = "json" } = req.body;

      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      if (!months.includes(month) || !/^\d{4}$/.test(year)) {
        return res.status(400).json({
          success: false,
          message: "Invalid month or year format",
        });
      }

      const monthNumber = (months.indexOf(month) + 1).toString().padStart(2, "0");
      const monthYear = `${monthNumber}/${year}`;

      const query = {};
      if (contractorId) {
        query.userId = contractorId;
      }

      const contractors = await Contractor.aggregate([
        { $match: query },
        {
          $project: {
            _id: 1,
            userId: 1,
            name: 1,
            photo: 1,
            contractorRole: 1,
            monthlyRecords: {
              $filter: {
                input: "$attendanceRecords",
                as: "record",
                cond: {
                  $eq: [
                    { $substr: ["$$record.currentAttendance.date", 3, 7] },
                    `${monthNumber}/${year}`,
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            daysPresent: {
              $size: {
                $filter: {
                  input: "$monthlyRecords",
                  as: "record",
                  cond: { $ne: ["$$record.currentAttendance.status", null] },
                },
              },
            },
            totalDays: {
              $size: "$monthlyRecords",
            },
            attendanceDetails: {
              $map: {
                input: "$monthlyRecords",
                as: "record",
                in: {
                  date: "$$record.currentAttendance.date",
                  status: "$$record.currentAttendance.status",
                },
              },
            },
          },
        },
        { $sort: { name: 1 } },
      ]);

      if (format === "json") {
        return res.status(200).json({
          success: true,
          data: contractors,
          month,
          year,
          reportType: "monthly",
        });
      } else if (format === "excel") {
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet("Monthly Contractor Attendance");

        worksheet.columns = [
          { header: "ID", key: "userId", width: 10 },
          { header: "Name", key: "name", width: 30 },
          { header: "Role", key: "contractorRole", width: 25 },
          { header: "Days Present", key: "daysPresent", width: 15 },
          { header: "Total Days", key: "totalDays", width: 15 },
          { header: "Attendance Rate", key: "attendanceRate", width: 20 },
        ];

        contractors.forEach((contractor) => {
          const attendanceRate =
            contractor.totalDays > 0
              ? ((contractor.daysPresent / contractor.totalDays) * 100).toFixed(2) + "%"
              : "N/A";

          worksheet.addRow({
            userId: contractor.userId,
            name: contractor.name,
            contractorRole: contractor.contractorRole,
            daysPresent: contractor.daysPresent,
            totalDays: contractor.totalDays,
            attendanceRate,
          });
        });

        const detailsSheet = workbook.addWorksheet("Details");
        detailsSheet.columns = [
          { header: "ID", key: "userId", width: 10 },
          { header: "Name", key: "name", width: 30 },
          { header: "Role", key: "contractorRole", width: 25 },
          { header: "Date", key: "date", width: 15 },
          { header: "Status", key: "status", width: 15 },
        ];

        contractors.forEach((contractor) => {
          contractor.attendanceDetails.forEach((detail) => {
            detailsSheet.addRow({
              userId: contractor.userId,
              name: contractor.name,
              contractorRole: contractor.contractorRole,
              date: detail.date,
              status: detail.status || "Not Recorded",
            });
          });
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=contractor_monthly_report_${month}_${year}.xlsx`
        );

        return workbook.xlsx.write(res).then(() => res.end());
      } else if (format === "pdf") {
        const doc = new pdfkit();
        const filename = `contractor_monthly_report_${month}_${year}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        doc.pipe(res);
        doc.fontSize(18).text(
          `Contractor Monthly Report - ${month} ${year}`,
          { align: "center" }
        );
        doc.moveDown();

        doc.fontSize(12);
        contractors.forEach((contractor, index) => {
          const attendanceRate =
            contractor.totalDays > 0
              ? ((contractor.daysPresent / contractor.totalDays) * 100).toFixed(2) + "%"
              : "N/A";

          doc.text(
            `${index + 1}. ${contractor.name} (${contractor.contractorRole})`
          );
          doc.text(
            `   Days Present: ${contractor.daysPresent} of ${contractor.totalDays} (${attendanceRate})`
          );

          if (contractor.attendanceDetails.length > 0) {
            doc.text("   Details:");
            contractor.attendanceDetails.forEach((detail) => {
              doc.text(`     ${detail.date}: ${detail.status || "Not Recorded"}`);
            });
          }

          doc.moveDown(0.5);
        });

        doc.end();
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid format parameter. Use json, excel, or pdf",
        });
      }
    } catch (error) {
      console.error("Error generating contractor monthly report:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };


//   import exceljs from 'exceljs';
// import PDFDocument from 'pdfkit';

// import exceljs from 'exceljs';
// import PDFDocument from 'pdfkit';
// import Contractor from '../models/Contractor.js';

export const getBulkDataReport = async (req, res) => {
  try {
    // Get format parameter from query string (default to json)
    const { format = 'json' } = req.query;

    // Get all contractors with their complete attendance records
    const contractors = await Contractor.aggregate([
      {
        $project: {
          _id: 1,
          userId: 1,
          supervisorId: 1,
          name: 1,
          photo: 1,
          contractorRole: 1,
          allRecords: '$attendanceRecords',
          daysPresent: {
            $size: {
              $filter: {
                input: '$attendanceRecords',
                as: 'record',
                cond: { $ne: ['$$record.currentAttendance.status', null] }
              }
            }
          },
          totalDays: {
            $size: '$attendanceRecords'
          }
        }
      },
      {
        $addFields: {
          attendanceDetails: {
            $map: {
              input: '$allRecords',
              as: 'record',
              in: {
                date: '$$record.currentAttendance.date',
                status: '$$record.currentAttendance.status'
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
        reportType: 'contractorBulkData'
      });
    } else if (format === 'excel') {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Contractor Attendance');
      
      worksheet.columns = [
        { header: 'Contractor ID', key: '_id', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Role', key: 'role', width: 25 },
        { header: 'Supervisor ID', key: 'supervisorId', width: 15 },
        { header: 'Days Present', key: 'daysPresent', width: 15 },
        { header: 'Total Days', key: 'totalDays', width: 15 },
        { header: 'Attendance Rate', key: 'attendanceRate', width: 20 }
      ];
      
      contractors.forEach(contractor => {
        const attendanceRate = contractor.totalDays > 0 
          ? (contractor.daysPresent / contractor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        worksheet.addRow({
          _id: contractor._id,
          name: contractor.name,
          role: contractor.contractorRole,
          supervisorId: contractor.supervisorId,
          daysPresent: contractor.daysPresent,
          totalDays: contractor.totalDays,
          attendanceRate
        });
      });
      
      // Add details sheet
      const detailsSheet = workbook.addWorksheet('Details');
      detailsSheet.columns = [
        { header: 'Contractor ID', key: '_id', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      
      contractors.forEach(contractor => {
        contractor.attendanceDetails.forEach(detail => {
          detailsSheet.addRow({
            _id: contractor._id,
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
        'attachment; filename=contractor_attendance_full_report.xlsx'
      );
      
      return workbook.xlsx.write(res).then(() => res.end());
      
    } else if (format === 'pdf') {
      const doc = new PDFDocument();
      const filename = 'contractor_attendance_full_report.pdf';
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      doc.pipe(res);
      doc.fontSize(18).text('Complete Contractor Attendance Report', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12);
      contractors.forEach((contractor, index) => {
        const attendanceRate = contractor.totalDays > 0 
          ? (contractor.daysPresent / contractor.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        doc.text(`${index + 1}. ${contractor.name} (${contractor.contractorRole})`);
        doc.text(`   Supervisor ID: ${contractor.supervisorId}`);
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
    console.error("Error generating contractor bulk data report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

  