
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

import studentRouter from './Routers/studentRouter.js';
import departmentRouter from "./Routers/departmentRouter.js"
import staffRouter from "./Routers/staffRouter.js"

import supervisorRouter from "./Routers/supervisorRouter.js"
import contractorRouter from "./Routers/contractorRouter.js"
import workersRouter from "./Routers/workersRouter.js"
import clientRouter from "./Routers/clientRouter.js"
import siteRouter from "./Routers/siteRouter.js"

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

app.use("/college/student", studentRouter);
app.use("/college/department", departmentRouter)
app.use("/college/staff", staffRouter)

app.use("/api",supervisorRouter)
app.use("/api",contractorRouter)
app.use("/api",workersRouter)
app.use("/api", clientRouter)
app.use("/api",siteRouter)


// start the server
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {  // Fixed: Added PORT parameter
    console.log(`Server is Running on port ${PORT}`);
});