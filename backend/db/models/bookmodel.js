const mongoose = require('mongoose')
const {bookSchema} = require('../schema/bookschema')
const {userSchema} = require('../schema/userlogin')
const {studentProfileSchema} = require('../schema/profileform')


const bookModel = new mongoose.model('book', bookSchema)
const userModel = new mongoose.model('user', userSchema)
const userprofileModel = new mongoose.model('userprofile', studentProfileSchema)