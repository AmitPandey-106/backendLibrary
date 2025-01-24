const mongoose = require('mongoose')

const borrowedBookSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'BooksDetail', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },  // Ensure `user` is required
    status: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
    title: { type: String, required: true },
    returned: { type: Boolean, default: false },
    borrowDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    notificationSent: { type: Boolean, default: false },
});


const borrowedbook = mongoose.model('Borrowedbook', borrowedBookSchema)
module.exports = borrowedbook