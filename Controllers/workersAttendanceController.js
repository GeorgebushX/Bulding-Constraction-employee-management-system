import mongoose from 'mongoose';
import Worker from "../models/WorkersModel.js";
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

    await Worker.updateMany(
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

    console.log(`Worker attendance initialized for ${currentDate}`);
  } catch (error) {
    console.error("Error initializing worker attendance:", error);
  }
};

// Run on server start and schedule daily cron job
initializeAttendanceData();
cron.schedule("0 0 * * *", initializeAttendanceData);

// Controller methods
export const getWorkerAttendance = async (req, res) => {
  try {
    const currentDate = formatCurrentDate();

    await Worker.updateMany(
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

    const data = await Worker.find()
      .select("_id name photo workerRole currentAttendance")
      .populate({
        path: 'contractorId',
        select: '_id name contractorRole'
      })
      .populate({
        path: 'supervisorId',
        select: '_id name supervisorType'
      })
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data,
      currentDate,
    });
  } catch (error) {
    console.error("Error fetching worker attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const updateWorkerAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const currentDate = formatCurrentDate();

    // Convert id to number and validate
    const workerId = Number(id);
    if (isNaN(workerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid worker ID",
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

    const updatedWorker = await Worker.findOneAndUpdate(
      { _id: workerId },
      updateObj,
      { new: true }
    ).select("_id name photo workerRole currentAttendance");

    if (!updatedWorker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedWorker,
      message: "Attendance updated successfully",
    });
  } catch (error) {
    console.error("Error updating worker attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const bulkUpdateWorkerAttendanceByDate = async (req, res) => {
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

    const result = await Worker.updateMany({}, updateQuery);

    const updatedWorkers = await Worker.find()
      .select("_id userId name currentAttendance")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: `Bulk attendance updated for date: ${date}`,
      updatedCount: result.modifiedCount,
      data: updatedWorkers,
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

export const getWorkerAttendanceByDate = async (req, res) => {
  try {
    const date = `${req.params.day}/${req.params.month}/${req.params.year}`;

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use DD/MM/YYYY",
      });
    }

    const workers = await Worker.aggregate([
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
          workerRole: 1,
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
          workerRole: 1,
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
      data: workers,
      date,
    });
  } catch (error) {
    console.error("Error fetching worker attendance by date:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const bulkUpdateWorkerAttendanceStatus = async (req, res) => {
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

    const result = await Worker.updateMany({}, updateQuery);

    const updatedWorkers = await Worker.find()
      .select("_id userId name currentAttendance")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: `Bulk attendance status updated to: ${status}`,
      updatedCount: result.modifiedCount,
      data: updatedWorkers,
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

export const getWorkerDailyReport = async (req, res) => {
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

    const workers = await Worker.aggregate([
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
          workerRole: 1,
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
          workerRole: 1,
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
        data: workers,
        date,
        reportType: "daily",
      });
    } else if (format === "excel") {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet("Daily Worker Attendance");

      worksheet.columns = [
        { header: "ID", key: "userId", width: 10 },
        { header: "Name", key: "name", width: 30 },
        { header: "Role", key: "workerRole", width: 25 },
        { header: "Status", key: "status", width: 15 },
      ];

      workers.forEach((worker) => {
        worksheet.addRow({
          userId: worker.userId,
          name: worker.name,
          workerRole: worker.workerRole,
          status: worker.status || "Not Recorded",
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=worker_daily_report_${DD}_${MM}_${YYYY}.xlsx`
      );

      return workbook.xlsx.write(res).then(() => {
        res.end();
      });
    } else if (format === "pdf") {
      const doc = new pdfkit();
      const filename = `worker_daily_report_${DD}_${MM}_${YYYY}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      doc.pipe(res);
      doc.fontSize(18).text(`Worker Daily Report - ${date}`, {
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
      workers.forEach((worker, index) => {
        const status = worker.status || "Not Marked";
        
        if (status === "Fullday") statusCounts.Fullday++;
        else if (status === "Halfday") statusCounts.Halfday++;
        else if (status === "Overtime") statusCounts.Overtime++;
        else statusCounts.Absent++;

        doc.text(
          `${index + 1}. ${worker.name} (${worker.workerRole}) - ${status}`
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
        `Total Workers: ${workers.length}`,
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
    console.error("Error generating worker daily report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getWorkerWeeklyReport = async (req, res) => {
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

    const workers = await Worker.aggregate([
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          workerRole: 1,
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
        data: workers,
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
      const worksheet = workbook.addWorksheet("Weekly Worker Attendance");

      worksheet.columns = [
        { header: "ID", key: "userId", width: 10 },
        { header: "Name", key: "name", width: 30 },
        { header: "Role", key: "workerRole", width: 25 },
        { header: "Days Present", key: "daysPresent", width: 15 },
        { header: "Total Days", key: "totalDays", width: 15 },
        { header: "Attendance Rate", key: "attendanceRate", width: 20 },
      ];

      workers.forEach((worker) => {
        const attendanceRate =
          worker.totalDays > 0
            ? ((worker.daysPresent / worker.totalDays) * 100).toFixed(2) + "%"
            : "N/A";

        worksheet.addRow({
          userId: worker.userId,
          name: worker.name,
          workerRole: worker.workerRole,
          daysPresent: worker.daysPresent,
          totalDays: worker.totalDays,
          attendanceRate,
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=worker_weekly_report_${weekRange.month}_${weekRange.year}_week${weekRange.weekNumber}.xlsx`
      );

      return workbook.xlsx.write(res).then(() => {
        res.end();
      });
    } else if (format === "pdf") {
      const doc = new pdfkit();
      const filename = `worker_weekly_report_${weekRange.month}_${weekRange.year}_week${weekRange.weekNumber}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      doc.pipe(res);
      doc.fontSize(18).text(
        `Worker Weekly Report - ${weekRange.month}/${weekRange.year} (Week ${weekRange.weekNumber})`,
        { align: "center" }
      );
      doc.fontSize(14).text(`Date Range: ${weekRange.start} to ${weekRange.end}`, {
        align: "center",
      });
      doc.moveDown();

      doc.fontSize(12);
      workers.forEach((worker, index) => {
        const attendanceRate =
          worker.totalDays > 0
            ? ((worker.daysPresent / worker.totalDays) * 100).toFixed(2) + "%"
            : "N/A";

        doc.text(`${index + 1}. ${worker.name} (${worker.workerRole})`);
        doc.text(
          `   Days Present: ${worker.daysPresent} of ${worker.totalDays} (${attendanceRate})`
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
    console.error("Error generating worker weekly report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getWorkerMonthlyReport = async (req, res) => {
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

    const workers = await Worker.aggregate([
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          workerRole: 1,
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
        data: workers,
        monthYear,
        reportType: "monthly",
      });
    } else if (format === "excel") {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet("Monthly Worker Attendance");

      worksheet.columns = [
        { header: "ID", key: "userId", width: 10 },
        { header: "Name", key: "name", width: 30 },
        { header: "Role", key: "workerRole", width: 25 },
        { header: "Days Present", key: "daysPresent", width: 15 },
        { header: "Total Days", key: "totalDays", width: 15 },
        { header: "Attendance Rate", key: "attendanceRate", width: 20 },
      ];

      workers.forEach((worker) => {
        const attendanceRate =
          worker.totalDays > 0
            ? ((worker.daysPresent / worker.totalDays) * 100).toFixed(2) + "%"
            : "N/A";

        worksheet.addRow({
          userId: worker.userId,
          name: worker.name,
          workerRole: worker.workerRole,
          daysPresent: worker.daysPresent,
          totalDays: worker.totalDays,
          attendanceRate,
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=worker_monthly_report_${MM}_${YYYY}.xlsx`
      );

      return workbook.xlsx.write(res).then(() => {
        res.end();
      });
    } else if (format === "pdf") {
      const doc = new pdfkit();
      const filename = `worker_monthly_report_${MM}_${YYYY}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      doc.pipe(res);
      doc.fontSize(18).text(
        `Worker Monthly Report - ${MM}/${YYYY}`,
        { align: "center" }
      );
      doc.moveDown();

      doc.fontSize(12);
      workers.forEach((worker, index) => {
        const attendanceRate =
          worker.totalDays > 0
            ? ((worker.daysPresent / worker.totalDays) * 100).toFixed(2) + "%"
            : "N/A";

        doc.text(`${index + 1}. ${worker.name} (${worker.workerRole})`);
        doc.text(
          `   Days Present: ${worker.daysPresent} of ${worker.totalDays} (${attendanceRate})`
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
    console.error("Error generating worker monthly report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getWorkerDailyAttendanceReport = async (req, res) => {
  try {
    const { date, workerId, format = "json" } = req.body;

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

    if (workerId) {
      query.userId = workerId;
    }

    const workers = await Worker.aggregate([
      { $match: query },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          workerRole: 1,
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
          workerRole: 1,
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
        data: workers,
        date,
        reportType: "daily",
      });
    } else if (format === "excel") {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet("Worker Daily Attendance");

      worksheet.columns = [
        { header: "ID", key: "userId", width: 10 },
        { header: "Name", key: "name", width: 30 },
        { header: "Role", key: "workerRole", width: 25 },
        { header: "Status", key: "status", width: 15 },
      ];

      workers.forEach((worker) => {
        worksheet.addRow({
          userId: worker.userId,
          name: worker.name,
          workerRole: worker.workerRole,
          status: worker.status || "Not Recorded",
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=worker_daily_report_${date.replace(/\//g, "_")}.xlsx`
      );

      return workbook.xlsx.write(res).then(() => res.end());
    } else if (format === "pdf") {
      const doc = new pdfkit();
      const filename = `worker_daily_report_${date.replace(/\//g, "_")}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      doc.pipe(res);
      doc.fontSize(18).text(`Worker Daily Report - ${date}`, {
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

      workers.forEach((worker, index) => {
        const status = worker.status || "Not Marked";

        if (status === "Fullday") statusCounts.Fullday++;
        else if (status === "Halfday") statusCounts.Halfday++;
        else if (status === "Overtime") statusCounts.Overtime++;
        else statusCounts.Absent++;

        doc.text(
          `${index + 1}. ${worker.name} (${worker.workerRole}) - ${status}`
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
        `Total Workers: ${workers.length}`,
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
    console.error("Error generating worker daily report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getWorkerDateRangeReport = async (req, res) => {
  try {
    const { startDate, endDate, workerId, format = "json" } = req.body;

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
    if (workerId) {
      query.userId = workerId;
    }

    const workers = await Worker.aggregate([
      { $match: query },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          workerRole: 1,
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
        data: workers,
        dateRange: { startDate, endDate },
        reportType: "dateRange",
      });
    } else if (format === "excel") {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet("Worker Date Range Attendance");

      worksheet.columns = [
        { header: "ID", key: "userId", width: 10 },
        { header: "Name", key: "name", width: 30 },
        { header: "Role", key: "workerRole", width: 25 },
        { header: "Days Present", key: "daysPresent", width: 15 },
        { header: "Total Days", key: "totalDays", width: 15 },
        { header: "Attendance Rate", key: "attendanceRate", width: 20 },
      ];

      workers.forEach((worker) => {
        const attendanceRate =
          worker.totalDays > 0
            ? ((worker.daysPresent / worker.totalDays) * 100).toFixed(2) + "%"
            : "N/A";

        worksheet.addRow({
          userId: worker.userId,
          name: worker.name,
          workerRole: worker.workerRole,
          daysPresent: worker.daysPresent,
          totalDays: worker.totalDays,
          attendanceRate,
        });
      });

      const detailsSheet = workbook.addWorksheet("Details");
      detailsSheet.columns = [
        { header: "ID", key: "userId", width: 10 },
        { header: "Name", key: "name", width: 30 },
        { header: "Role", key: "workerRole", width: 25 },
        { header: "Date", key: "date", width: 15 },
        { header: "Status", key: "status", width: 15 },
      ];

      workers.forEach((worker) => {
        worker.attendanceDetails.forEach((detail) => {
          detailsSheet.addRow({
            userId: worker.userId,
            name: worker.name,
            workerRole: worker.workerRole,
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
        `attachment; filename=worker_range_report_${startDate.replace(
          /\//g,
          "_"
        )}_to_${endDate.replace(/\//g, "_")}.xlsx`
      );

      return workbook.xlsx.write(res).then(() => res.end());
    } else if (format === "pdf") {
      const doc = new pdfkit();
      const filename = `worker_range_report_${startDate.replace(
        /\//g,
        "_"
      )}_to_${endDate.replace(/\//g, "_")}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      doc.pipe(res);
      doc.fontSize(18).text(
        `Worker Attendance Report - ${startDate} to ${endDate}`,
        { align: "center" }
      );
      doc.moveDown();

      doc.fontSize(12);
      workers.forEach((worker, index) => {
        const attendanceRate =
          worker.totalDays > 0
            ? ((worker.daysPresent / worker.totalDays) * 100).toFixed(2) + "%"
            : "N/A";

        doc.text(
          `${index + 1}. ${worker.name} (${worker.workerRole})`
        );
        doc.text(
          `   Days Present: ${worker.daysPresent} of ${worker.totalDays} (${attendanceRate})`
        );

        if (worker.attendanceDetails.length > 0) {
          doc.text("   Details:");
          worker.attendanceDetails.forEach((detail) => {
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
    console.error("Error generating worker date range report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getWorkerMonthlyAttendanceReport = async (req, res) => {
  try {
    const { month, year, workerId, format = "json" } = req.body;

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
    if (workerId) {
      query.userId = workerId;
    }

    const workers = await Worker.aggregate([
      { $match: query },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          photo: 1,
          workerRole: 1,
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
        data: workers,
        month,
        year,
        reportType: "monthly",
      });
    } else if (format === "excel") {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet("Monthly Worker Attendance");

      worksheet.columns = [
        { header: "ID", key: "userId", width: 10 },
        { header: "Name", key: "name", width: 30 },
        { header: "Role", key: "workerRole", width: 25 },
        { header: "Days Present", key: "daysPresent", width: 15 },
        { header: "Total Days", key: "totalDays", width: 15 },
        { header: "Attendance Rate", key: "attendanceRate", width: 20 },
      ];

      workers.forEach((worker) => {
        const attendanceRate =
          worker.totalDays > 0
            ? ((worker.daysPresent / worker.totalDays) * 100).toFixed(2) + "%"
            : "N/A";

        worksheet.addRow({
          userId: worker.userId,
          name: worker.name,
          workerRole: worker.workerRole,
          daysPresent: worker.daysPresent,
          totalDays: worker.totalDays,
          attendanceRate,
        });
      });

      const detailsSheet = workbook.addWorksheet("Details");
      detailsSheet.columns = [
        { header: "ID", key: "userId", width: 10 },
        { header: "Name", key: "name", width: 30 },
        { header: "Role", key: "workerRole", width: 25 },
        { header: "Date", key: "date", width: 15 },
        { header: "Status", key: "status", width: 15 },
      ];

      workers.forEach((worker) => {
        worker.attendanceDetails.forEach((detail) => {
          detailsSheet.addRow({
            userId: worker.userId,
            name: worker.name,
            workerRole: worker.workerRole,
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
        `attachment; filename=worker_monthly_report_${month}_${year}.xlsx`
      );

      return workbook.xlsx.write(res).then(() => res.end());
    } else if (format === "pdf") {
      const doc = new pdfkit();
      const filename = `worker_monthly_report_${month}_${year}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      doc.pipe(res);
      doc.fontSize(18).text(
        `Worker Monthly Report - ${month} ${year}`,
        { align: "center" }
      );
      doc.moveDown();

      doc.fontSize(12);
      workers.forEach((worker, index) => {
        const attendanceRate =
          worker.totalDays > 0
            ? ((worker.daysPresent / worker.totalDays) * 100).toFixed(2) + "%"
            : "N/A";

        doc.text(
          `${index + 1}. ${worker.name} (${worker.workerRole})`
        );
        doc.text(
          `   Days Present: ${worker.daysPresent} of ${worker.totalDays} (${attendanceRate})`
        );

        if (worker.attendanceDetails.length > 0) {
          doc.text("   Details:");
          worker.attendanceDetails.forEach((detail) => {
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
    console.error("Error generating worker monthly report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getBulkWorkerDataReport = async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const workers = await Worker.aggregate([
      { 
        $project: {
          _id: 1,
          userId: 1,
          contractorId: 1,
          name: 1,
          photo: 1,
          workerRole: 1,
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
        data: workers,
        reportType: 'workerBulkData'
      });
    } else if (format === 'excel') {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet('Worker Attendance');
      
      worksheet.columns = [
        { header: 'Worker ID', key: '_id', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Role', key: 'role', width: 25 },
        { header: 'Contractor ID', key: 'contractorId', width: 15 },
        { header: 'Days Present', key: 'daysPresent', width: 15 },
        { header: 'Total Days', key: 'totalDays', width: 15 },
        { header: 'Attendance Rate', key: 'attendanceRate', width: 20 }
      ];
      
      workers.forEach(worker => {
        const attendanceRate = worker.totalDays > 0 
          ? (worker.daysPresent / worker.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        worksheet.addRow({
          _id: worker._id,
          name: worker.name,
          role: worker.workerRole,
          contractorId: worker.contractorId,
          daysPresent: worker.daysPresent,
          totalDays: worker.totalDays,
          attendanceRate
        });
      });
      
      // Add details sheet
      const detailsSheet = workbook.addWorksheet('Details');
      detailsSheet.columns = [
        { header: 'Worker ID', key: '_id', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      
      workers.forEach(worker => {
        worker.attendanceDetails.forEach(detail => {
          detailsSheet.addRow({
            _id: worker._id,
            name: worker.name,
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
        'attachment; filename=worker_attendance_full_report.xlsx'
      );
      
      return workbook.xlsx.write(res).then(() => res.end());
      
    } else if (format === 'pdf') {
      const doc = new pdfkit();
      const filename = 'worker_attendance_full_report.pdf';
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      doc.pipe(res);
      doc.fontSize(18).text('Complete Worker Attendance Report', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12);
      workers.forEach((worker, index) => {
        const attendanceRate = worker.totalDays > 0 
          ? (worker.daysPresent / worker.totalDays * 100).toFixed(2) + '%'
          : 'N/A';
          
        doc.text(`${index + 1}. ${worker.name} (${worker.workerRole})`);
        doc.text(`   Contractor ID: ${worker.contractorId}`);
        doc.text(`   Days Present: ${worker.daysPresent} of ${worker.totalDays} (${attendanceRate})`);
        
        // Add details for each worker
        if (worker.attendanceDetails.length > 0) {
          doc.text('   Details:');
          worker.attendanceDetails.forEach(detail => {
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
    console.error("Error generating worker bulk data report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};