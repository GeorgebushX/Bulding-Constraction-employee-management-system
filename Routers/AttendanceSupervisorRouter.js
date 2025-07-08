// import express from "express";
// // In your router file:
// import { getAttendance,updateAttendance } from "../Controllers/attendanceSupervisorController.js";
// import authMiddleware from "../middleware/defaultAttendance.js";
// import defaultAttendance from "../middleware/defaultAttendance.js"; // Why importing twice?

// const router = express.Router();

// router.get("/supervisor/attendance",authMiddleware, defaultAttendance, getAttendance);
// router.put("/supervisor/attendance/:id",authMiddleware, updateAttendance);

// export default router;




import express from "express";
import { 
  getAttendance, 
  updateAttendance,
  updateStatus 
} from "../Controllers/attendanceSupervisorController.js";
import defaultAttendance from "../middleware/defaultAttendance.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/supervisor/attendance", authMiddleware, defaultAttendance, getAttendance);
router.put("/supervisor/attendance/:id", authMiddleware, updateAttendance);
router.put("/supervisor/attendance/status/:supervisorId", authMiddleware, updateStatus);

export default router;




// This is last update
// import express from "express";
// import { getAttendance, updateAttendance } from "../Controllers/attendanceSupervisorController.js";
// import defaultAttendance from "../middleware/defaultAttendance.js";
// import authMiddleware from "../middleware/authMiddleware.js";
// const router = express.Router();

// router.get("/supervisor/attendance", authMiddleware, defaultAttendance, getAttendance);
// router.put("/supervisor/attendance/:id",authMiddleware, updateAttendance);

// export default router;




// import express from "express";
// import { getAttendance } from "../Controllers/attendanceSupervisorController.js";
// import authMiddleware from "../middleware/authMiddleware.js";
// const router = express.Router();

// // Make sure this matches your frontend request
// router.get("/attendance", authMiddleware, getAttendance);

// export default router;