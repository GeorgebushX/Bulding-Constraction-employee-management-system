
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
import supervisorRouter from "./Routers/supervisorRouter.js"
import contractorRouter from "./Routers/contractorRouter.js"
import workersRouter from "./Routers/workersRouter.js"
import clientRouter from "./Routers/clientRouter.js"
import siteRouter from "./Routers/siteRouter.js"
import attendanceSupervisor from "./Routers/AttendanceSupervisorRouter.js"
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
app.use("/api",supervisorRouter)
app.use("/api",contractorRouter)
app.use("/api",workersRouter)
app.use("/api", clientRouter)
app.use("/api",siteRouter)
app.use("/api",attendanceSupervisor)
app.use("/api",supervisorSalary)
app.use("/api",changePassword)


// start the server
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {  // Fixed: Added PORT parameter
    console.log(`Server is Running on port ${PORT}`);
});


