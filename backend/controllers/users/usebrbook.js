const User = require('../../db/schema/userlogin');
const BorrowedBook = require('../../db/schema/borrowedbooks');
const BookForm = require('../../db/schema/bookform');
const BorrowRequest = require('../../db/schema/borrowrequest');
const StudentProfile = require('../../db/schema/profileform')

exports.showborrow = async(req, res)=>{
    try {
        const borrowedBooks = await getUserBorrowedBooks(req.params.userId);
        res.status(200).json(borrowedBooks);
    } catch (error) {
        res.status(400).send(error.message);
    }
}

const getUserBorrowedBooks = async (userId) => {
  const user = await User.findById(userId).populate({
    path: 'borrowedBooks', // Populate the borrowedBooks array
    populate: {
      path: 'book',  // Populate the 'book' field within each borrowedBook
      select: 'title author bookimage'  // Select the necessary fields from the Book collection
    }
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  return user.borrowedBooks;  // This will return the borrowed books with details
};

exports.getUserBookHistory = async (req, res) => {
  const { userId } = req.params; // Pass user ID as a parameter

  try {
    // Find the user by ID and populate their book history
    const user = await User.findById(userId)
      .select('BooksHistory')
      .populate({
        path: 'BooksHistory.book', // Populate book details if needed
        select: 'title author borrowDate returnDate bookimage', // Include desired fields
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ history: user.BooksHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllBorrowedBooks = async (req, res) => {
    try {
      // Fetch all borrowed books and populate the related user and book fields
      const borrowedBooks = await BorrowedBook.find()
        .populate('user', 'userid firstName lastName studentID') // Populate user details with specific fields
        .populate('book', 'title author bookimage') // Populate book details with specific fields
        .exec();

      const allborrows = await BorrowedBook.countDocuments()
  
      if (!borrowedBooks || borrowedBooks.length === 0) {
        return res.status(404).json({ message: 'No borrowed books found' });
      }
  
      res.status(200).json({ borrowedBooks, allborrows });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  

  exports.presentBorrow = async (req, res) => {
    try {
      const { userId, booktitle, email } = req.body;
  
      // Validate required fields
      if (!userId || !booktitle || !email) {
        return res.status(400).json({ success: false, message: 'All fields are required!' });
      }
  
      // Validate user existence
      const user = await User.findOne({ userid: userId });
      if (!user) return res.status(404).json({ success: false, message: 'User does not exist!' });
  
      // Validate book existence
      const book = await BookForm.findOne({ title: booktitle });
      if (!book) return res.status(404).json({ success: false, message: 'Book not available!' });
  
      // Validate email existence
      const emailcheck = await StudentProfile.findOne({ email:email });
      if (!emailcheck) {
        return res.status(404).json({ success: false, message: 'Profile is not created!' });
      }
  
      // Check for existing borrow requests
      const existingRequest = await BorrowRequest.findOne({ book: book._id, user: emailcheck._id });
      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending borrow request for this book.',
        });
      }
  
      // Check if already borrowed
      const existingBorrowedBook = await BorrowedBook.findOne({ book: book._id, user: emailcheck._id });
      if (existingBorrowedBook) {
        return res.status(400).json({
          success: false,
          message: 'You have already borrowed this book.',
        });
      }
  
      // Ensure book availability
      if (book.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Book is currently out of stock.',
        });
      }
  
      // Check book borrow limit (max 2)
      const totalBooksBorrowedOrPending = await BorrowRequest.countDocuments({
        user: emailcheck._id,
        status: 'pending',
      });
      const totalBorrowed = await BorrowedBook.countDocuments({ user: emailcheck._id });
  
      if (totalBooksBorrowedOrPending + totalBorrowed >= 2) {
        return res.status(400).json({
          success: false,
          message: 'You cannot borrow more than two books (including pending requests).',
        });
      }
  
      // Decrease book quantity
      book.quantity -= 1;
      await book.save();
  
      // Create new borrow request
      const borrowRequest = new BorrowRequest({
        book: book._id,
        user: emailcheck._id,
        status: 'pending',
      });
      await borrowRequest.save();
  
      return res.status(201).json({
        success: true,
        message: 'Borrow request created successfully. Please wait for admin approval!',
      });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  

  exports.autocompleteBooks = async (req, res) => {
    try {
      const { q } = req.query; // Get the search term from the query string
  
      if (!q || q.trim() === '') {
        return res.status(400).json({ success: false, message: 'Query parameter is required.' });
      }
  
      // Search for books where the title matches the input
      const books = await BookForm.find(
        { title: { $regex: q, $options: 'i' } }, // Case-insensitive search
        { title: 1 } // Return only the `title` field
      ).limit(10); // Limit the results to 10 suggestions
  
      if (books.length === 0) {
        return res.status(404).json({ success: false, message: 'No books found.' });
      }
  
      res.status(200).json({
        success: true,
        suggestions: books.map((book) => book.title), // Return `title` for the frontend
      });
    } catch (error) {
      console.error('Error in autocompleteBooks API:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };
  