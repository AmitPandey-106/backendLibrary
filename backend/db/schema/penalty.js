const mongoose = require('mongoose');

const penaltySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Bookform', required: true },
  overdueDays: { type: Number, required: true },
  penaltyAmount: { type: Number, required: true },
  imposedDate: { type: Date, default: Date.now },
});

const Penalty = mongoose.model('Penalty', penaltySchema);
module.exports = Penalty