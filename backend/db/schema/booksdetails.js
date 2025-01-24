const mongoose = require('mongoose')

const BooksDetailSchema = new mongoose.Schema({
    CAT_NO:{
        type:Number,
        required:true
    },
    LANG_CODE:{
        type:String,
        required:true
    },
    TITLE:{
        type:String,
        required:true
    },
    SUB_TITLE:{
        type:String,
        default:null
    },
    AUTH_ID1:{
        type:Number,
        default:null
    },
    AUTH_ID2:{
        type:Number,
        default:null
    },
    PLACE_OF_PUB:{
        type:String
    },
    PUB_ID:{
        type:Number
    },
    YEAR_OF_PUB:{
        type:Number,
        required:true
    },
    SUB_ID:{
        type:Number
    },
    TOTAL_VOL:{
        type:Number,
        required:true
    },
    PHOTO:{
        type:String,
        default:null
    },
    LIB_CODE:{
        type:String,
        default:"VDPCOELIB"
    }
})

const BookDetails = mongoose.model("BooksDetail", BooksDetailSchema)
module.exports = BookDetails