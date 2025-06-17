// import mongoose from 'mongoose';

// const userSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true },
//     password: { type: String, required: true },
//     role: { type: String, enum: ["Engineer", "Supervisor", "Contractor", "Worker"], required: true },
//     profileImage: { type: String }
// }, { timestamps: true });

// const User = mongoose.model("User", userSchema);
// export default User;


// models/User.js
import mongoose from "mongoose";
import Counter from "./Counter.js";

const formatDate = (date) => {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const userSchema = new mongoose.Schema({
  _id: Number, // Custom numeric ID
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Engineer", "Supervisor", "Contractor", "Worker"], required: true },
  profileImage: { type: String },
  createdAt: { type: String },
  updatedAt: { type: String }
}, { _id: false });

// Pre-save middleware to handle auto-increment and date formatting
userSchema.pre("save", async function (next) {
  const doc = this;

  // Assign an incremented _id only on new documents
  if (doc.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "userId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    doc._id = counter.seq;
    const now = formatDate(new Date());
    doc.createdAt = now;
    doc.updatedAt = now;
  } else {
    doc.updatedAt = formatDate(new Date());
  }

  next();
});

const User = mongoose.model("User", userSchema);
export default User;
