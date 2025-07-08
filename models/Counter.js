// models/Counter.js
import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },  // Changed from Number to String
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model("Counter", counterSchema);
export default Counter;