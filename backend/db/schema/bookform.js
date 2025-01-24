const mongoose = require('mongoose')

const bookformSchema = new mongoose.Schema({
    ISBN:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    author:{
        type:String,
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    bookimage:{
        type:String,
    },
    stream:{
        type:String
    }
})

const BookForm = mongoose.model('Bookform', bookformSchema)
module.exports = BookForm