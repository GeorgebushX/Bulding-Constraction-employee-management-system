
import express from "express";
import cors from "cors";
import connectDatabase from "./DataBase/mongoDB.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url'; // Fix for __dirname issue

dotenv.config();

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// import routes
import authRouter from './Routers/auth.js';

import centeringsupervisorRouter from "././Routers/centeringWorkersRouter.js"
import paintersupervisorRouter from "././Routers/supervisor/painterSupervisorRouter.js"
import steelsupervisorRouter from "././Routers/supervisor/steelSupervisorRouter.js"
import mesonsupervisorRouter from "././Routers/supervisor/mesonSupervisorRouter.js"
import carpentersupervisorRouter from "././Routers/supervisor/carpenterSupervisorRouter.js"
import plumbersupervisorRouter from "././Routers/supervisor/plumberSupervisorRouter.js"
import electriciansupervisorRouter from "././Routers/supervisor/electricianSupervisorRouter.js"
import tilessupervisorRouter from "././Routers/supervisor/tilesSupervisorRouter.js"

import supervisorRouter from "./Routers/SupervisorRouter.js"
import contractorAttendance from "./Routers/contractorAttendanceRouter.js"
import centeringcontractorRouter from "./Routers/contractorRouter.js"
import centeringWorkersRouter from "./Routers/centeringWorkersRouter.js"
import clientRouter from "./Routers/clientRouter.js"
import siteRouter from "./Routers/siteRouter.js"
// import attendanceSupervisor from "./Routers/AttendanceSupervisorRouter.js"
import supervisorSalary from "./Routers/supervisorSalaryRouter.js"
import changePassword from "./Routers/settings.js"

// connect to the database
connectDatabase();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// ✅ Serve uploaded files correctly
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// Routes
app.use('/api', authRouter);

app.use("/api",centeringsupervisorRouter)
app.use("/api",paintersupervisorRouter)
app.use("/api",steelsupervisorRouter)
app.use("/api",mesonsupervisorRouter)
app.use("/api",carpentersupervisorRouter)
app.use("/api",plumbersupervisorRouter)
app.use("/api",electriciansupervisorRouter)
app.use("/api",tilessupervisorRouter)

app.use("/api",supervisorRouter)


app.use("/api",centeringcontractorRouter)
app.use("/api",centeringWorkersRouter)
app.use("/api", clientRouter)
app.use("/api",siteRouter)
// app.use("/api",attendanceSupervisor)
app.use("/api",supervisorSalary)
app.use("/api",changePassword)
app.use("/api",contractorAttendance)


// start the server
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {  // Fixed: Added PORT parameter
    console.log(`Server is Running on port ${PORT}`);
});


