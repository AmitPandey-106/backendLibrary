const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userid:{
        type:String,
        required:true,
        unique: true
    },
    password:{
        type:String,
        required:true
    },
    role: { type: String, default: 'user', enum: ['user', 'staff', 'admin'] },
    profileId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"StudentProfile"
    },
    borrowedBooks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Borrowedbook'  // References the BorrowedBook collection
    }],
    BooksHistory: [{
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BooksDetail'
        },
        title: String, // Title of the book
        borrowDate: Date,
        dueDate:Date,
        returnDate: Date,
        status: {
            type: String,
            enum: ['returned', 'overdue','accepted'], // Status of the book
            default: 'returned'
        }
    }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    penalties: [
        {
          book: { type: mongoose.Schema.Types.ObjectId, ref: 'Borrowedbook' },
          penaltyAmount: { type: Number, default: 0 },
          daysOverdue: { type: Number, default: 0 },
          createdAt: { type: Date, default: Date.now },
        },
      ]
})

const User = mongoose.model('User', userSchema)
module.exports = User;