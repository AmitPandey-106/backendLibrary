const User = require('../../db/schema/userlogin');
const ClgBook = require('../../db/schema/booksdetails');
const AuthorModel = require('../../db/schema/author');
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
      select: 'TITLE AUTH_ID1 PHOTO'  // Select the necessary fields from the Book collection
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Enrich the borrowedBooks with author_name
  const enrichedBorrowedBooks = await Promise.all(
    user.borrowedBooks.map(async (borrowedBook) => {
      if (!borrowedBook.book) return borrowedBook;

      // Find the author using AUTH_ID1 from the book
      const author = await AuthorModel.findOne({ AUTH_ID: borrowedBook.book.AUTH_ID1 }).exec();

      // Add the author_name to the book details
      return {
        ...borrowedBook._doc,
        book: {
          ...borrowedBook.book._doc,
          author_name: author ? author.AUTH_NAME : "Unknown Author",
        },
      };
    })
  );

  return enrichedBorrowedBooks; // Return the enriched list of borrowed books
};

exports.getUserBookHistory = async (req, res) => {
  const { userId } = req.params; // Pass user ID as a parameter

  try {
    // Find the user and their book history
    const user = await User.findById(userId).select('BooksHistory');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch book details for each borrowed book in the history
    const booksWithAuthors = await Promise.all(
      user.BooksHistory.map(async (historyItem) => {
        const book = await ClgBook.findById(historyItem.book).select('TITLE AUTH_ID1 PHOTO borrowDate returnDate');

        if (!book) return null;

        // Find the author based on the AUTH_ID1 field in the book
        const author = await AuthorModel.findOne({ AUTH_ID: book.AUTH_ID1 }).select('name');

        return {
          ...historyItem.toObject(), // Convert history item to a plain object
          book: {
            ...book.toObject(),
            authorName: author ? author.name : 'Unknown Author', // Add the author's name if found
          },
        };
      })
    );

    // Remove any null values (in case some books are not found)
    const filteredBooks = booksWithAuthors.filter((item) => item !== null);

    res.status(200).json({ history: filteredBooks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getAllBorrowedBooks = async (req, res) => {
  try {
    // Fetch all borrowed books
    const borrowedBooks = await BorrowedBook.find()
      .populate('user', 'userid firstName lastName studentID') // Populate user details
      .exec();

    const allborrows = await BorrowedBook.countDocuments();

    if (!borrowedBooks || borrowedBooks.length === 0) {
      return res.status(404).json({ message: 'No borrowed books found' });
    }

    // Enrich each book with author_name by matching AUTH_ID1 with AUTH_ID
    const enrichedBooks = await Promise.all(
      borrowedBooks.map(async (borrowedBook) => {
        if (!borrowedBook.book) return borrowedBook;

        // Fetch the book details
        const book = await ClgBook.findById(borrowedBook.book).exec();
        if (!book) return borrowedBook;

        // Fetch the author details by matching AUTH_ID1 with AUTH_ID
        const author = await AuthorModel.findOne({ AUTH_ID: book.AUTH_ID1 }).exec();

        // Add the author_name to the response
        return {
          ...borrowedBook._doc,
          book: {
            ...book._doc,
            author_name: author ? author.AUTH_NAME : "Unknown Author",
          },
        };
      })
    );

    res.status(200).json({ borrowedBooks: enrichedBooks, allborrows });
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
      const book = await ClgBook.findOne({ title: booktitle });
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
      const books = await ClgBook.find(
        { TITLE: { $regex: q, $options: 'i' } }, // Case-insensitive search
        { TITLE: 1 } // Return only the `title` field
      ).limit(10); // Limit the results to 10 suggestions
  
      if (books.length === 0) {
        return res.status(404).json({ success: false, message: 'No books found.' });
      }
  
      res.status(200).json({
        success: true,
        suggestions: books.map((book) => book.TITLE), // Return `title` for the frontend
      });
    } catch (error) {
      console.error('Error in autocompleteBooks API:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };
  