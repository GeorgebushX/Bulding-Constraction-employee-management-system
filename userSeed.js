
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import User from "./models/User.js";  // Make sure this path is correct

// Configure environment variables
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection with better timeout handling
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,  // 5 seconds timeout for server selection
      socketTimeoutMS: 45000,         // 45 seconds timeout for queries
    });
    console.log("Database connected successfully!");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return false;
  }
};

// Admin user creation
const createAdminUser = async () => {
  // Setup upload directory
  const uploadDir = path.join(__dirname, "files", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Connect to database
  const isConnected = await connectDatabase();
  if (!isConnected) {
    console.error("Cannot proceed without database connection");
    process.exit(1);
  }

  try {
    // Check for existing admin
    const existingUser = await User.findOne({ email: "admin@gmail.com" })
      .maxTimeMS(10000);  // 10 seconds timeout for this query

    if (existingUser) {
      console.log("Admin user already exists");
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const hashPassword = await bcrypt.hash("7871870312", 10);
    const defaultImagePath = "/uploads/george.jpg";  // Ensure this file exists

    const newUser = new User({
      name: "Engineer",
      email: "admin@gmail.com",
      password: hashPassword,
      role: "Engineer",
      photo: defaultImagePath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await newUser.save();
    console.log("Admin user created successfully!");
    
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);  // Ensure the script terminates
  }
};

// Execute the script
createAdminUser();