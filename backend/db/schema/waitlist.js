const mongoose = require('mongoose')

const waitlistSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Bookform', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, 
    requestedAt: { type: Date, default: Date.now },
  });
  
  const Waitlist = mongoose.model('Waitlist', waitlistSchema);
  module.exports = Waitlist;