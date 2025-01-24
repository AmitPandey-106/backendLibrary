const moment = require('moment-timezone')
const nodemailer = require("nodemailer");
const User = require('../../db/schema/userlogin')
const StudentProfile = require('../../db/schema/profileform')
const BorrowedBook = require('../../db/schema/borrowedbooks');
const BorrowRequest = require('../../db/schema/borrowrequest');
const Waitlist = require('../../db/schema/waitlist')
const History = require('../../db/schema/adminhistroy')
const ClgBook = require('../../db/schema/booksdetails')
const AuthorModel = require('../../db/schema/author')
const db = require('../../db/dbConnection/db')

// user request for book api
exports.createBorrowRequest = async (req, res) => {
  try {
    const { userId, bookId } = req.params;

    // console.log(userId,  bookId)

    // Check if the book exists
    const book = await ClgBook.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not available' });
    }

    // Check if the user already has a pending borrow request for the same book
    const existingRequest = await BorrowRequest.findOne({
      book: bookId,
      user: userId,
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending borrow request for this book.' });
    }

    // Check if the user has already borrowed the book
    const existingBorrowedBook = await BorrowedBook.findOne({
      book: bookId,
      user: userId,
    });
    if (existingBorrowedBook) {
      return res.status(400).json({ message: 'You have already borrowed this book.' });
    }

    // Ensure the book is available
    if (book.TOTAL_VOL <= 0) {
      return res.status(400).json({ message: 'Book is currently out of stock.' });
    }

    // Check if the user has already borrowed or has pending requests for 2 books
    const totalBooksBorrowedOrPending = await Promise.all([
      BorrowRequest.find({ user: userId, status: 'pending' }).countDocuments(),
      BorrowedBook.find({ user: userId }).countDocuments(),
    ]);
    const totalBooks = totalBooksBorrowedOrPending.reduce((a, b) => a + b, 0);

    if (totalBooks >= 2) {
      return res.status(400).json({ message: 'You cannot borrow more than two books (including pending requests).' });
    }

    // Decrease the book quantity
    book.TOTAL_VOL -= 1;
    await book.save();

    // Create a new borrow request with status 'pending'
    const borrowRequest = new BorrowRequest({
      book: bookId,
      user: userId,
      status: 'pending',
    });
    await borrowRequest.save();

    res.status(200).json({ message: 'Borrow request submitted successfully.' });
  } catch (error) {
    console.error("Error in createBorrowRequest:", error);  // Log the error
    res.status(500).json({ error: error.message });
  }
};


exports.handleBorrowRequest = async (req, res) => {
  const { requestId, action } = req.body; // action can be 'approve' or 'reject'

  try {
    // Find the borrow request and populate necessary fields
    const borrowRequest = await BorrowRequest.findById(requestId).populate('book');
    if (!borrowRequest) return res.status(404).json({ message: 'Request not found' });

    const book = await ClgBook.findById(borrowRequest.book._id);
    if (!book) return res.status(400).json({ message: 'Book not found' });

    // Reject the request
    if (action === 'reject') {
      // Update the book quantity only if it was decreased earlier
      book.TOTAL_VOL += 1;
      await book.save();

      // Delete the borrow request after rejecting
      await BorrowRequest.findByIdAndDelete(requestId);

      return res.json({ message: 'Borrow request rejected and removed from records' });
    }

    // Approve the request
    if (action === 'approve') {
      if (book.TOTAL_VOL < 0) {
        return res.status(400).json({ message: 'Book unavailable' });
      }
      await book.save();

      // Calculate due date (7 days from now)
      const borrowDate = moment().utc().toDate();
      const dueDate = moment().utc().add(2, 'days').toDate();

      const borrowedBook = new BorrowedBook({
        book: borrowRequest.book._id,
        user: borrowRequest.user,
        status: 'confirmed',
        title: borrowRequest.book.TITLE,
        borrowDate,
        dueDate,
      });
      await borrowedBook.save();

      // Update the User table: Add borrowed book to user's borrowedBooks array
      const user = await User.findOne({ profileId: borrowRequest.userId });
      if (!user) return res.status(404).json({ message: 'User not found' });

      user.borrowedBooks.push(borrowedBook._id);

      // Add to BooksHistory
      user.BooksHistory.push({
        book: borrowRequest.book._id,
        title: borrowRequest.book.TITLE,
        borrowDate: borrowDate,
        dueDate: dueDate,
        status: 'accepted',
      });
      await user.save();

      // Delete the borrow request after approval
      await BorrowRequest.findByIdAndDelete(requestId);

      return res.json({ message: 'Borrow request approved and added to user history' });
    }
  } catch (error) {
    console.error("Error handling borrow request:", error);
    res.status(404).json({ error: error.message });
  }
};


exports.handleReturnRequest = async (req, res) => {
  const { borrowedBookId } = req.params;
  console.log(borrowedBookId)

  try {
    // Find the borrowed book record and populate relevant fields
    const borrowedBook = await BorrowedBook.findById(borrowedBookId).populate('book user');
    if (!borrowedBook) {
      console.error('Borrowed book record not found');
      return res.status(404).json({ message: 'Borrowed book record not found' });
    }

    // Find the user who borrowed the book
    const user = await User.findOne({ profileId: borrowedBook.user });
    if (!user) {
      console.error('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the book quantity in the BookForm collection (return the book)
    const book = await ClgBook.findById(borrowedBook.book._id);
    if (!book) {
      console.error('Book not found');
      return res.status(404).json({ message: 'Book not found' });
    }

    book.TOTAL_VOL += 1; // Increase the book quantity as it's returned
    await book.save();

    // Add the book return details to the AdminHistory model
    const historyEntry = new History({
      user: borrowedBook.user, // Reference to the user ID
      book: book._id, // Reference to the book ID
      borrowedDate: borrowedBook.borrowDate,
      dueDate: borrowedBook.dueDate,
      returnedDate: new Date(), // Current date as the returned date
    });
    await historyEntry.save();

    // Update the user's BooksHistory with returned details
    const historyItem = user.BooksHistory.find(
      (item) => item.book.toString() === borrowedBook.book._id.toString()
    );
    if (historyItem) {
      historyItem.returnDate = new Date(); // Set the returned date
      historyItem.status = 'returned'; // Update the status to 'returned'
    } else {
      // If no history exists, add a new one (unlikely, but handled for robustness)
      user.BooksHistory.push({
        book: borrowedBook.book._id,
        title: borrowedBook.book.TITLE,
        borrowDate: borrowedBook.borrowDate,
        returnDate: new Date(),
        status: 'returned',
      });
    }
    await user.save();

    // Remove the borrowed book record from BorrowedBook collection
    await BorrowedBook.findByIdAndDelete(borrowedBookId);
    // Check if there are any waitlisted users for this book
    const waitlistEntry = await Waitlist.findOne({ book: book._id }).sort({ createdAt: 1 }); // Get the oldest waitlist entry
    if (waitlistEntry) {
      // Create a new borrow request for the first user in the waitlist
      const borrowRequest = new BorrowRequest({
        book: book._id,
        user: waitlistEntry.user,
        status: 'pending',
        requestDate: waitlistEntry.requestedAt,
      });

      await borrowRequest.save();

      // Notify the user (requires a notification system)
      // const transport = nodemailer.createTransport({
      //   service: 'gmail',
      //   auth: {
      //     user: 'your-email@gmail.com', // Use environment variables for security
      //     pass: 'your-email-password', // Use environment variables for security
      //   },
      // });

      // const userToNotify = await User.findById(waitlistEntry.user);

      // const message = {
      //   from: 'your-email@gmail.com',
      //   to: userToNotify.email,
      //   subject: 'Book Available for Borrowing',
      //   text: `Hello ${userToNotify.firstName} ${userToNotify.lastName},\n\nThe book "${book.TITLE}" is now available for borrowing. Please log in to your account to borrow the book.\n\nThank you!`,
      // };

      // await transport.sendMail(message);

      // Remove the processed waitlist entry
      await Waitlist.findByIdAndDelete(waitlistEntry._id);
    }

    // Remove the borrowed book ID from the user's borrowedBooks array
    user.borrowedBooks = user.borrowedBooks.filter(
      (borrowedId) => borrowedId.toString() !== borrowedBookId
    );
    await user.save();

    res.status(200).json({ message: 'Book returned successfully, and user history updated.', });
  } catch (error) {
    console.error('Error handling return request:', error);
    res.status(500).json({ error: error.message });
  }
};


exports.getPendingRequests = async (req, res) => {
  try {
    const pendingRequests = await BorrowRequest.find({ status: 'pending' })
      .populate('book', 'TITLE')
      .populate('user', 'firstName email');
    res.json(pendingRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getpendingcount = async (req, res) => {
  try {
    const count = await BorrowRequest.countDocuments({ status: 'pending', viewed: false });
    res.json({ count });
  } catch (error) {
    console.error("Error fetching pending requests count:", error);
    res.status(500).json({ error: "Failed to fetch pending requests count" });
  }
}

exports.pendingRequestView = async (req, res) => {
  try {
    // Update the admin's "viewed" status (optional if tied to user state)
    // Or simply log it for now if not persisting to DB
    await BorrowRequest.updateMany({ status: 'pending' }, { $set: { viewed: true } });
    res.json({ message: "Borrow requests marked as viewed." });
  } catch (error) {
    console.error("Error marking requests as viewed:", error);
    res.status(500).json({ error: "Failed to mark requests as viewed" });
  }
}

