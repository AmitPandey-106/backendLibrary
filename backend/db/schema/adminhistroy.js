const mongoose = require('mongoose');

// History schema definition
const adminHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, // ObjectId reference to the User model
        ref: 'StudentProfile',
        required: true
    },
    book: {
        type: mongoose.Schema.Types.ObjectId, // ObjectId reference to the Book model
        ref: 'BooksDetail',
        required: true
    },
    borrowedDate: {
        type: Date,
        required: true,
        default: Date.now // Default to current date
    },
    dueDate: {
        type: Date,
        required: true
    },
    returnedDate: {
        type: Date,
        default: null // The date when the book is returned, initially null
    }
});

// Creating the model from the schema
const AdminHistory = mongoose.model('AdminHistory', adminHistorySchema);

module.exports = AdminHistory;
