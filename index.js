
// import express from "express";
// import cors from "cors";
// import connectDatabase from "./DataBase/mongoDB.js";
// import dotenv from "dotenv";
// import path from "path";
// import { fileURLToPath } from 'url'; // Fix for __dirname issue

// dotenv.config();

// // Fix for __dirname in ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config();

// // import routes
// import authRouter from './Routers/auth.js';
// import supervisorRouter from "./Routers/supervisorRouter.js"
// import contractorRouter from "./Routers/contractorRouter.js"
// import workersRouter from "./Routers/workersRouter.js"
// import clientRouter from "./Routers/clientRouter.js"
// import siteRouter from "./Routers/siteRouter.js"

// // connect to the database
// connectDatabase();

// const app = express();

// // middleware
// app.use(cors());
// app.use(express.json());

// // ✅ Serve uploaded files correctly
// app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// // Routes
// app.use('/api', authRouter);
// app.use("/api",supervisorRouter)
// app.use("/api",contractorRouter)
// app.use("/api",workersRouter)
// app.use("/api", clientRouter)
// app.use("/api",siteRouter)


// // start the server
// const PORT = process.env.PORT || 3002;

// app.listen(PORT, () => {  // Fixed: Added PORT parameter
//     console.log(`Server is Running on port ${PORT}`);
// });


import express from "express";
import cors from "cors";
import connectDatabase from "./DataBase/mongoDB.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRouter from './Routers/auth.js';
import supervisorRouter from "./Routers/supervisorRouter.js";
import contractorRouter from "./Routers/contractorRouter.js";
import workersRouter from "./Routers/workersRouter.js";
import clientRouter from "./Routers/clientRouter.js";
import siteRouter from "./Routers/siteRouter.js";

// Connect to the database
connectDatabase();

const app = express();

// Configure CORS options
const corsOptions = {
  origin: [
    'http://localhost:5173', // Your Vite development server
    'https://your-production-frontend.com' // Your production frontend
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// API routes
app.use('/api/auth', authRouter);
app.use("/api/supervisors", supervisorRouter);
app.use("/api/contractors", contractorRouter);
app.use("/api/workers", workersRouter);
app.use("/api/clients", clientRouter);
app.use("/api/sites", siteRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start the server
const PORT = process.env.PORT || 3002;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});