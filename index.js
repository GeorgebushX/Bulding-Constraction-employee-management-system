
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
// login
import authRouter from './Routers/auth.js';
import clientRouter from "./Routers/clientRouter.js"
import siteRouter from "./Routers/siteRouter.js"
// supervisor
import supervisorRouter from "./Routers/SupervisorRouter.js"
import supervisorSalary from "./Routers/supervisorSalaryRouter.js"
import changePassword from "./Routers/settings.js"
// contractor
import contractorRouter from "./Routers/contractorRouter.js"
import contractorAttendance from "./Routers/contractorAttendanceRouter.js"
import ContractorSalaries from "./Routers/ContractorSalaryRouter.js"
// workers
import WorkersDetails from "./Routers/WorkerRouter.js"
import WorkersAttendance from "./Routers/workersAttendanceRouter.js"
import workersSalary from "./Routers/workerSalaryRouter.js"
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
app.use("/api", clientRouter)
app.use("/api",siteRouter)
app.use("/api",supervisorRouter)
app.use("/api",supervisorSalary)
app.use("/api",changePassword)
app.use("/api",contractorRouter)
app.use("/api",contractorAttendance)
app.use("/api",ContractorSalaries)
app.use("/api",WorkersDetails)
app.use("/api",WorkersAttendance)
app.use("/api",workersSalary)
// start the server
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {  // Fixed: Added PORT parameter
    console.log(`Server is Running on port ${PORT}`);
});


