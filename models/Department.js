import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  department_Id: {
    type: String,
    required: true,
    unique: true
  },
  departmentName: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: false,
    unique: true
  },
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  }]
});

const Department = mongoose.model('Department', departmentSchema);
export default Department;
