// import Client from '../models/ClientDetails.js';
// import Site from '../models/SiteDetails.js';
// import Supervisor from '../models/Supervisor.js';
// import User from '../models/User.js';
// import Dashboard from '../models/EngineerDashboard.js';

// // Helper function to format date as DD/MM/YYYY
// const formatDate = (date) => {
//   if (!date) return null;
//   const d = new Date(date);
//   const day = d.getDate().toString().padStart(2, '0');
//   const month = (d.getMonth() + 1).toString().padStart(2, '0');
//   const year = d.getFullYear();
//   return `${day}/${month}/${year}`;
// };

// // Get dashboard statistics
// export const getDashboardStats = async (req, res) => {
//   try {
//     // Get counts from all collections
//     const totalClients = await Client.countDocuments();
//     const totalSites = await Site.countDocuments();
//     const totalSupervisors = await Supervisor.countDocuments({ role: "Supervisor" });
    
//     // Calculate total budget across all sites
//     const sites = await Site.find().select('totalBudget');
//     const totalBudget = sites.reduce((sum, site) => sum + (site.totalBudget || 0), 0);
    
//     // Get all sites with populated client info
//     const allSites = await Site.find()
//       .populate('client', 'name email phone')
//       .select('siteName location totalAreaSqFt totalBudget siteMap totalSupervisors totalContractors startDate endDate status')
//       .sort({ createdAt: -1 });
    
//     // Get today's date for attendance calculation
//     const today = formatDate(new Date());
    
//     // Get attendance data for today
//     const supervisors = await Supervisor.find({ role: "Supervisor" })
//       .select('name photo site supervisorType currentAttendance perDaySalary')
//       .populate('site', 'siteName siteMap');
    
//     // Calculate attendance counts
//     let fulldayCount = 0;
//     let halfdayCount = 0;
//     let overtimeCount = 0;
//     let absentCount = 0;
    
//     supervisors.forEach(supervisor => {
//       if (supervisor.currentAttendance && 
//           supervisor.currentAttendance.date === today) {
//         switch(supervisor.currentAttendance.status) {
//           case "Fullday":
//             fulldayCount++;
//             break;
//           case "Halfday":
//             halfdayCount++;
//             break;
//           case "Overtime":
//             overtimeCount++;
//             break;
//           default:
//             absentCount++;
//         }
//       } else {
//         absentCount++;
//       }
//     });
    
//     // Calculate total per day salary for present supervisors
//     const totalPerDaySalary = supervisors.reduce((total, supervisor) => {
//       if (supervisor.currentAttendance && 
//           supervisor.currentAttendance.date === today &&
//           supervisor.currentAttendance.status !== null &&
//           supervisor.perDaySalary) {
//         return total + supervisor.perDaySalary;
//       }
//       return total;
//     }, 0);
    
//     // Update or create dashboard record
//     await Dashboard.findOneAndUpdate(
//       {},
//       {
//         totalClients,
//         totalSites,
//         totalSupervisors,
//         totalBudget
//       },
//       { upsert: true, new: true }
//     );
    
//     // Prepare site details with supervisor information
//     const sitesWithDetails = await Promise.all(
//       allSites.map(async (site) => {
//         // Get supervisors assigned to this site
//         const siteSupervisors = await Supervisor.find({ 
//           site: site._id, 
//           role: "Supervisor" 
//         })
//         .select('name photo supervisorType currentAttendance perDaySalary')
//         .lean();
        
//         // Calculate attendance for this site's supervisors
//         let siteFullday = 0;
//         let siteHalfday = 0;
//         let siteOvertime = 0;
//         let siteAbsent = 0;
//         let sitePerDaySalary = 0;
        
//         siteSupervisors.forEach(supervisor => {
//           if (supervisor.currentAttendance && 
//               supervisor.currentAttendance.date === today) {
//             switch(supervisor.currentAttendance.status) {
//               case "Fullday":
//                 siteFullday++;
//                 if (supervisor.perDaySalary) sitePerDaySalary += supervisor.perDaySalary;
//                 break;
//               case "Halfday":
//                 siteHalfday++;
//                 if (supervisor.perDaySalary) sitePerDaySalary += supervisor.perDaySalary / 2;
//                 break;
//               case "Overtime":
//                 siteOvertime++;
//                 if (supervisor.perDaySalary) sitePerDaySalary += supervisor.perDaySalary * 1.5;
//                 break;
//               default:
//                 siteAbsent++;
//             }
//           } else {
//             siteAbsent++;
//           }
//         });
        
//         return {
//           _id: site._id,
//           siteName: site.siteName,
//           location: site.location,
//           totalAreaSqFt: site.totalAreaSqFt,
//           totalBudget: site.totalBudget,
//           siteMap: site.siteMap,
//           totalSupervisors: site.totalSupervisors,
//           totalContractors: site.totalContractors,
//           startDate: site.startDate,
//           endDate: site.endDate,
//           status: site.status,
//           client: site.client,
//           supervisors: siteSupervisors,
//           attendance: {
//             fullday: siteFullday,
//             halfday: siteHalfday,
//             overtime: siteOvertime,
//             absent: siteAbsent
//           },
//           perDaySalary: sitePerDaySalary
//         };
//       })
//     );
    
//     res.status(200).json({
//       success: true,
//       data: {
//         summary: {
//           totalClients,
//           totalSites,
//           totalSupervisors,
//           totalBudget
//         },
//         attendance: {
//           fullday: fulldayCount,
//           halfday: halfdayCount,
//           overtime: overtimeCount,
//           absent: absentCount,
//           totalPerDaySalary
//         },
//         sites: sitesWithDetails
//       }
//     });
    
//   } catch (error) {
//     console.error("Error fetching dashboard data:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// // Get site details with supervisors
// export const getSiteDetails = async (req, res) => {
//   try {
//     const { siteId } = req.params;
    
//     // Get site details
//     const site = await Site.findById(siteId)
//       .populate('client', 'name email phone organizationName')
//       .select('siteName location totalAreaSqFt oneAreaSqFtAmount totalBudget siteMap totalSupervisors totalContractors startDate endDate status notes');
    
//     if (!site) {
//       return res.status(404).json({
//         success: false,
//         message: "Site not found"
//       });
//     }
    
//     // Get supervisors assigned to this site
//     const supervisors = await Supervisor.find({ 
//       site: siteId, 
//       role: "Supervisor" 
//     })
//     .select('name photo email phone supervisorType perDaySalary currentAttendance')
//     .sort({ name: 1 });
    
//     // Get today's date for attendance
//     const today = formatDate(new Date());
    
//     // Calculate attendance for this site
//     let fulldayCount = 0;
//     let halfdayCount = 0;
//     let overtimeCount = 0;
//     let absentCount = 0;
//     let totalPerDaySalary = 0;
    
//     supervisors.forEach(supervisor => {
//       if (supervisor.currentAttendance && 
//           supervisor.currentAttendance.date === today) {
//         switch(supervisor.currentAttendance.status) {
//           case "Fullday":
//             fulldayCount++;
//             if (supervisor.perDaySalary) totalPerDaySalary += supervisor.perDaySalary;
//             break;
//           case "Halfday":
//             halfdayCount++;
//             if (supervisor.perDaySalary) totalPerDaySalary += supervisor.perDaySalary / 2;
//             break;
//           case "Overtime":
//             overtimeCount++;
//             if (supervisor.perDaySalary) totalPerDaySalary += supervisor.perDaySalary * 1.5;
//             break;
//           default:
//             absentCount++;
//         }
//       } else {
//         absentCount++;
//       }
//     });
    
//     res.status(200).json({
//       success: true,
//       data: {
//         site,
//         supervisors,
//         attendance: {
//           fullday: fulldayCount,
//           halfday: halfdayCount,
//           overtime: overtimeCount,
//           absent: absentCount,
//           total: supervisors.length,
//           totalPerDaySalary
//         }
//       }
//     });
    
//   } catch (error) {
//     console.error("Error fetching site details:", error);
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

// // Get supervisor attendance details
// export const getSupervisorAttendanceDetails = async (req, res) => {
//   try {
//     const { supervisorId } = req.params;
    
//     const supervisor = await Supervisor.findOne({ 
//       _id: supervisorId, 
//       role: "Supervisor" 
//     })
//     .select('name photo email phone supervisorType perDaySalary currentAttendance attendanceRecords')
//     .populate('site', 'siteName location');
    
//     if (!supervisor) {
//       return res.status(404).json({
//         success: false,
//         message: "Supervisor not found"
//       });
//     }
    
//     // Get today's date
//     const today = formatDate(new Date());
    
//     // Get current attendance status
//     let currentStatus = "Not Marked";
//     if (supervisor.currentAttendance && supervisor.currentAttendance.date === today) {
//       currentStatus = supervisor.currentAttendance.status || "Not Marked";
//     }
    
//     // Calculate attendance statistics
//     const totalRecords = supervisor.attendanceRecords.length;
//     const presentRecords = supervisor.attendanceRecords.filter(
//       record => record.status !== null
//     ).length;
    
//     const attendanceRate = totalRecords > 0 
//       ? (presentRecords / totalRecords * 100).toFixed(2) 
//       : 0;
    
//     res.status(200).json({
//       success: true,
//       data: {
//         supervisor,
//         currentStatus,
//         statistics: {
//           totalRecords,
//           presentRecords,
//           absentRecords: totalRecords - presentRecords,
//           attendanceRate: `${attendanceRate}%`
//         }
//       }
//     });
    
//   } catch (error) {
//     console.error("Error fetching supervisor attendance:", error);
//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid supervisor ID format"
//       });
//     }
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };



import mongoose from 'mongoose';
import Client from '../models/ClientDetails.js';
import Site from '../models/SiteDetails.js';
import Supervisor from '../models/Supervisor.js';
import User from '../models/User.js';
import Dashboard from '../models/EngineerDashboard.js';

// Helper function to format date as DD/MM/YYYY
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Get counts from all collections
    const totalClients = await Client.countDocuments();
    const totalSites = await Site.countDocuments();
    const totalSupervisors = await Supervisor.countDocuments({ role: "Supervisor" });
    
    // Calculate total budget across all sites
    const sites = await Site.find().select('totalBudget');
    const totalBudget = sites.reduce((sum, site) => sum + (site.totalBudget || 0), 0);
    
    // Get all sites with populated client info
    const allSites = await Site.find()
      .populate('client', 'name email phone')
      .select('siteName location totalAreaSqFt totalBudget siteMap totalSupervisors totalContractors startDate endDate status')
      .sort({ createdAt: -1 });
    
    // Get today's date for attendance calculation
    const today = formatDate(new Date());
    
    // Get all supervisors with their attendance
    const supervisors = await Supervisor.find({ role: "Supervisor" })
      .select('name photo email phone site supervisorType currentAttendance perDaySalary')
      .populate('site', 'siteName siteMap');
    
    // Calculate attendance counts
    let fulldayCount = 0;
    let halfdayCount = 0;
    let overtimeCount = 0;
    let absentCount = 0;
    let totalPerDaySalary = 0;
    
    supervisors.forEach(supervisor => {
      if (supervisor.currentAttendance && 
          supervisor.currentAttendance.date === today) {
        switch(supervisor.currentAttendance.status) {
          case "Fullday":
            fulldayCount++;
            if (supervisor.perDaySalary) totalPerDaySalary += supervisor.perDaySalary;
            break;
          case "Halfday":
            halfdayCount++;
            if (supervisor.perDaySalary) totalPerDaySalary += supervisor.perDaySalary / 2;
            break;
          case "Overtime":
            overtimeCount++;
            if (supervisor.perDaySalary) totalPerDaySalary += supervisor.perDaySalary * 1.5;
            break;
          default:
            absentCount++;
        }
      } else {
        absentCount++;
      }
    });
    
    // Update or create dashboard record
    await Dashboard.findOneAndUpdate(
      {},
      {
        totalClients,
        totalSites,
        totalSupervisors,
        totalBudget
      },
      { upsert: true, new: true }
    );
    
    // Prepare site details with supervisor information
    const sitesWithDetails = await Promise.all(
      allSites.map(async (site) => {
        // Get supervisors assigned to this site
        const siteSupervisors = await Supervisor.find({ 
          site: site._id, 
          role: "Supervisor" 
        })
        .select('name photo email phone supervisorType currentAttendance perDaySalary')
        .lean();
        
        // Calculate attendance for this site's supervisors
        let siteFullday = 0;
        let siteHalfday = 0;
        let siteOvertime = 0;
        let siteAbsent = 0;
        let sitePerDaySalary = 0;
        
        siteSupervisors.forEach(supervisor => {
          if (supervisor.currentAttendance && 
              supervisor.currentAttendance.date === today) {
            switch(supervisor.currentAttendance.status) {
              case "Fullday":
                siteFullday++;
                if (supervisor.perDaySalary) sitePerDaySalary += supervisor.perDaySalary;
                break;
              case "Halfday":
                siteHalfday++;
                if (supervisor.perDaySalary) sitePerDaySalary += supervisor.perDaySalary / 2;
                break;
              case "Overtime":
                siteOvertime++;
                if (supervisor.perDaySalary) sitePerDaySalary += supervisor.perDaySalary * 1.5;
                break;
              default:
                siteAbsent++;
            }
          } else {
            siteAbsent++;
          }
        });
        
        return {
          _id: site._id,
          siteName: site.siteName,
          location: site.location,
          totalAreaSqFt: site.totalAreaSqFt,
          totalBudget: site.totalBudget,
          siteMap: site.siteMap,
          totalSupervisors: site.totalSupervisors,
          totalContractors: site.totalContractors,
          startDate: site.startDate,
          endDate: site.endDate,
          status: site.status,
          client: site.client,
          supervisors: siteSupervisors,
          attendance: {
            fullday: siteFullday,
            halfday: siteHalfday,
            overtime: siteOvertime,
            absent: siteAbsent
          },
          perDaySalary: sitePerDaySalary
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalClients,
          totalSites,
          totalSupervisors,
          totalBudget
        },
        attendance: {
          fullday: fulldayCount,
          halfday: halfdayCount,
          overtime: overtimeCount,
          absent: absentCount,
          totalPerDaySalary
        },
        sites: sitesWithDetails,
        supervisors: supervisors // Include all supervisors in response
      }
    });
    
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get site details with supervisors
export const getSiteDetails = async (req, res) => {
  try {
    const { siteId } = req.params;
    
    // Get site details
    const site = await Site.findById(siteId)
      .populate('client', 'name email phone organizationName')
      .select('siteName location totalAreaSqFt oneAreaSqFtAmount totalBudget siteMap totalSupervisors totalContractors startDate endDate status notes');
    
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }
    
    // Get supervisors assigned to this site
    const supervisors = await Supervisor.find({ 
      site: siteId, 
      role: "Supervisor" 
    })
    .select('name photo email phone supervisorType perDaySalary currentAttendance')
    .sort({ name: 1 });
    
    // Get today's date for attendance
    const today = formatDate(new Date());
    
    // Calculate attendance for this site
    let fulldayCount = 0;
    let halfdayCount = 0;
    let overtimeCount = 0;
    let absentCount = 0;
    let totalPerDaySalary = 0;
    
    supervisors.forEach(supervisor => {
      if (supervisor.currentAttendance && 
          supervisor.currentAttendance.date === today) {
        switch(supervisor.currentAttendance.status) {
          case "Fullday":
            fulldayCount++;
            if (supervisor.perDaySalary) totalPerDaySalary += supervisor.perDaySalary;
            break;
          case "Halfday":
            halfdayCount++;
            if (supervisor.perDaySalary) totalPerDaySalary += supervisor.perDaySalary / 2;
            break;
          case "Overtime":
            overtimeCount++;
            if (supervisor.perDaySalary) totalPerDaySalary += supervisor.perDaySalary * 1.5;
            break;
          default:
            absentCount++;
        }
      } else {
        absentCount++;
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        site,
        supervisors,
        attendance: {
          fullday: fulldayCount,
          halfday: halfdayCount,
          overtime: overtimeCount,
          absent: absentCount,
          total: supervisors.length,
          totalPerDaySalary
        }
      }
    });
    
  } catch (error) {
    console.error("Error fetching site details:", error);
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

// Get supervisor attendance details
export const getSupervisorAttendanceDetails = async (req, res) => {
  try {
    const { supervisorId } = req.params;
    
    const supervisor = await Supervisor.findOne({ 
      _id: supervisorId, 
      role: "Supervisor" 
    })
    .select('name photo email phone supervisorType perDaySalary currentAttendance attendanceRecords')
    .populate('site', 'siteName location');
    
    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found"
      });
    }
    
    // Get today's date
    const today = formatDate(new Date());
    
    // Get current attendance status
    let currentStatus = "Not Marked";
    if (supervisor.currentAttendance && supervisor.currentAttendance.date === today) {
      currentStatus = supervisor.currentAttendance.status || "Not Marked";
    }
    
    // Calculate attendance statistics
    const totalRecords = supervisor.attendanceRecords.length;
    const presentRecords = supervisor.attendanceRecords.filter(
      record => record.status && record.status !== "Absent"
    ).length;
    
    const attendanceRate = totalRecords > 0 
      ? (presentRecords / totalRecords * 100).toFixed(2) 
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        supervisor,
        currentStatus,
        statistics: {
          totalRecords,
          presentRecords,
          absentRecords: totalRecords - presentRecords,
          attendanceRate: `${attendanceRate}%`
        }
      }
    });
    
  } catch (error) {
    console.error("Error fetching supervisor attendance:", error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid supervisor ID format"
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get all supervisors with details
export const getAllSupervisors = async (req, res) => {
  try {
    const supervisors = await Supervisor.find({ role: "Supervisor" })
      .select('name photo email phone supervisorType perDaySalary currentAttendance site')
      .populate('site', 'siteName location')
      .sort({ name: 1 });
    
    // Get today's date for attendance
    const today = formatDate(new Date());
    
    // Calculate overall attendance statistics
    let fulldayCount = 0;
    let halfdayCount = 0;
    let overtimeCount = 0;
    let absentCount = 0;
    let totalPerDaySalary = 0;
    
    supervisors.forEach(supervisor => {
      if (supervisor.currentAttendance && 
          supervisor.currentAttendance.date === today) {
        switch(supervisor.currentAttendance.status) {
          case "Fullday":
            fulldayCount++;
            if (supervisor.perDaySalary) totalPerDaySalary += supervisor.perDaySalary;
            break;
          case "Halfday":
            halfdayCount++;
            if (supervisor.perDaySalary) totalPerDaySalary += supervisor.perDaySalary / 2;
            break;
          case "Overtime":
            overtimeCount++;
            if (supervisor.perDaySalary) totalPerDaySalary += supervisor.perDaySalary * 1.5;
            break;
          default:
            absentCount++;
        }
      } else {
        absentCount++;
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        supervisors,
        attendanceSummary: {
          total: supervisors.length,
          fullday: fulldayCount,
          halfday: halfdayCount,
          overtime: overtimeCount,
          absent: absentCount,
          totalPerDaySalary
        }
      }
    });
    
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};