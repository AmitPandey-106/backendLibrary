require('dotenv').config(); // This should be at the very top of your file
const { addmember } = require('./controllers/addmember');
const { mostBorrowedBooks } = require('./controllers/mostborrowedbooks')
const path = require('path')
const express = require('express');
const app = express();
const PortNo = process.env.PORT || 8001;
const cors = require('cors');
const mongoose = require('./db/dbConnection/db')
const loginrequire = require('./middleware/loginrequired')
const BookForm = require('./db/schema/bookform');
const { upload, uploadEBook, Allebooks, getAllCategory, getEbookById } = require('./controllers/Ebook');
// const corsOptions = {
//   origin: 'https://forentend-library.vercel.app', // Replace with your Vercel app URL
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   credentials: true,
//   optionsSuccessStatus: 204
// }

app.use(cors());
app.use(express.json());
app.use('/uploads/ebooks', express.static(path.join(__dirname, 'uploads/ebooks')))
const Signin = require('./auth/signin')
const adminsignin = require('./auth/admin')
const userProfile = require('./controllers/users/profileform')
const addbooks= require('./controllers/addbook')
const allbooks = require('./controllers/allbook')
const allborrowbook = require('./controllers/users/userborrow')
const userbrbook = require('./controllers/users/usebrbook')
const notification = require('./controllers/users/notification')
const confirmpassword = require('./controllers/users/changepass')
const resetlink = require('./controllers/users/forgetlink')
const resetpassword = require('./controllers/users/resetpassword');
const waitlistController = require('./controllers/users/waitlist')
const Allmembers = require('./controllers/members')
const TommorrowDue = require('./controllers/users/duedate')
const AdminHistory = require('./controllers/history')
const Penalty = require('./controllers/users/penalty')
const AddClgBook = require('./controllers/addclgbook')
const filtered = require('./controllers/filterbooks')
const addebooks = require('./controllers/Ebook')

app.get('/', (req, res) => {
    res.json("Libray Server ....")
});

// app.get('/search', async (req, res) => {
//     const { query } = req.query; // Get user query
//     try {
//       const results = await BookForm.find(
//         { $text: { $search: query } },
//         { score: { $meta: "textScore" } }
//       ).sort({ score: { $meta: "textScore" } });
//       res.json(results);
//     } catch (err) {
//       res.status(500).json({ message: 'Error searching books', error: err });
//     }
//   });

app.post('/api/addmember', addmember);
app.post('/auth/signin-user', Signin.signin)
app.post('/auth/signin-admin', adminsignin.adminSignin)
app.put('/user-profile-edit', userProfile.userprofile)
app.get('/get-user-profile',loginrequire ,userProfile.getProfile)
app.post('/add-books', addbooks.BookForm)
app.get('/all-books', allbooks.getAllBooks)
app.get('/book/:id', allbooks.getBookById)
app.put('/update-book/:id', allbooks.updatebook)
app.get('/search-books', allbooks.searchbook)

app.post('/uploadEBook', addebooks.uploadEBook)
// app.get('/all-streams', allbooks.getAllStreams)
app.post('/borrow/:userId/:bookId',loginrequire ,allborrowbook.createBorrowRequest)
app.get('/borrow-requests/pending', allborrowbook.getPendingRequests)
app.get('/borrow-requests/count-pending', allborrowbook.getpendingcount)
app.get('/waitlist-requests/count-pending', allborrowbook.getpendingcount)
app.post('/borrow-requests/mark-viewed', allborrowbook.pendingRequestView)
app.post('/waitlist', loginrequire ,waitlistController.addToWaitlist);
app.get('/get-waitlist', waitlistController.getWaitlistEntries);
app.post('/user-borrow/request', allborrowbook.handleBorrowRequest)
app.post('/remove-borrow/:borrowedBookId', allborrowbook.handleReturnRequest)
app.get('/user/:userId/borrowed-books', userbrbook.showborrow)
app.get('/all-borrow-books', userbrbook.getAllBorrowedBooks)
app.get('/users/:userId/history', userbrbook.getUserBookHistory)
app.post('/change-user/password', loginrequire, confirmpassword.changepassword)
app.post('/auth/forgot-password', resetlink.forgotPassword)
app.post('/forget/reset-password', resetpassword.resetPassword)
app.get('/notifications/:userId', notification.appNotify)
app.patch('/notifications/details/:id', notification.detailNotify)
app.post('/upload-ebook', upload.single('file'), uploadEBook);
app.get('/all-ebooks', Allebooks)
app.get('/get-ebook/:id', getEbookById)
app.get('/all-categorys', getAllCategory)
app.get('/all-members', Allmembers.members)
app.get('/tmr-due-books', TommorrowDue.tommorowdue)
app.get('/today-due-books', TommorrowDue.todaydue)
app.get('/most-borrowed', mostBorrowedBooks)
app.get('/api/autocomplete-books', userbrbook.autocompleteBooks);
app.get('/api/autocomplete-author', userbrbook.autocompleteAuthor);
app.post('/borrow-by-admin', userbrbook.presentBorrow)
app.get('/admin-history', AdminHistory.getAdminHistory)
app.get('/user-penalties', Penalty.getPenalty)
app.post('/add-clg-books', AddClgBook.AddClgBook)
app.get('/get-clg-books', AddClgBook.getClgBooks)
app.get('/subjects', AddClgBook.Subjects)
app.get('/filter-books', AddClgBook.getBooksBySubject)
app.get('/search-by-filter', allbooks.filterSearch)



app.listen(PortNo, () => {
    console.log(`Server started at port number ${PortNo}`);
});