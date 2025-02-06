const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'BooksDetail', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification
 