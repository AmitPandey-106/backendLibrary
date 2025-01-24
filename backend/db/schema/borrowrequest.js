// models/BorrowRequest.js
const mongoose = require('mongoose');

const borrowRequestSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'BooksDetail', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestDate: { type: Date, default: Date.now },
  viewed: { type: Boolean, default: false },
});

const BorrowRequest = mongoose.model('BorrowRequest', borrowRequestSchema);
module.exports = BorrowRequest;

