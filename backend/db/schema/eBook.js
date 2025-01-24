const mongoose = require('mongoose');

const eBookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  publisher: { type: String },
  publishedYear: { type: Number },
  category: { type: String, required: true },
  language: { type: String, required: true },
  description: { type: String },
  price: { type: Number, default: 0 }, // 0 if free
  isbn: { type: String },
  coverImage: { type: String }, // URL for the cover image
  file: { type: String, required: true }, // URL or path of the uploaded file
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const EBook = mongoose.model('EBook', eBookSchema);
module.exports = EBook
