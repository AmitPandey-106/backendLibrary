const mongoose = require('mongoose');

const eBookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String, required: true },
  language: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  isbn: { type: String, required: true },
  coverImage: { type: String },
  file: { type: String, required: true }, // ✅ THIS FIELD IS REQUIRED
  fileType: { type: String },
  fileSize: { type: Number },
  uploadedBy: { type: String, default: 'admin' },
});

module.exports = mongoose.model('EBook', eBookSchema);
