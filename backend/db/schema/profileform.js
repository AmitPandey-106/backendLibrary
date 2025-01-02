// models/StudentProfile.js
const mongoose = require('mongoose')

const studentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  firstName: { type: String, required: true },
  middleName: String,
  lastName: { type: String, required: true },
  dob: Date,
  gender: String,
  email: { type: String, required: true, unique: true },
  phoneNumber: String,
  studentID: { type: String, required: true, unique: true },
  department: String,
  yearLevel: String,
  libraryCardNumber: String,
}, { timestamps: true });

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
module.exports = StudentProfile