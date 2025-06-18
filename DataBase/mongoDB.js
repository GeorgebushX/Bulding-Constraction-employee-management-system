import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGODB_URI);
        console.log("Database is connected successfully!");      
    } catch (error) {
        console.log("Database connection failed:", error.message);
        process.exit(1); // Exit process with failure
    }
};

export default connectDatabase;


// import mongoose from "mongoose";
// import dotenv from "dotenv";

// dotenv.config();

// const connectDatabase = async () => {
//     try {
//         await mongoose.connect(process.env.MONGODB_URL, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true
//         });
//         console.log("Database is connected successfully!");      
//     } catch (error) {
//         console.log("Database connection failed:", error.message);
//     }
// };

// export default connectDatabase;