const mongoose = require('mongoose')

const authorsNameSchema = new mongoose.Schema({
    AUTH_ID:{
        type:Number,
        required:true
    },
    AUTH_NAME:{
        type:String,
        required:true
    }
})

const Author = mongoose.model('Author',authorsNameSchema)
module.exports = Author