const mongoose = require('mongoose');

const penaltySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'BooksDetail', required: true },
  overdueDays: { type: Number, required: true },
  penaltyAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Penalty = mongoose.model('Penalty', penaltySchema);
module.exports = Penalty