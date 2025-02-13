const ClgBook = require('../db/schema/booksdetails');
const AdminHistory = require('../db/schema/adminhistroy');
const Author = require('../db/schema/author'); // Import the Author model

exports.getAdminHistory = async (req, res) => {
  try {
    const history = await AdminHistory.find()
      .populate('user', 'firstName lastName email') // Populate user details
      .populate('book', 'TITLE AUTH_ID1') // Fetch book details
      .sort({ returnedDate: -1 }); // Most recent first

    // Transform the data to replace AUTH_ID1 with the author's name
    const updatedHistory = await Promise.all(history.map(async (record) => {
      if (record.book && record.book.AUTH_ID1) {
        // Find the author based on AUTH_ID1
        const author = await Author.findOne({ AUTH_ID: record.book.AUTH_ID1 });
        // Replace AUTH_ID1 with the author's name if found
        return {
          ...record.toObject(),
          book: {
            ...record.book.toObject(),
            authorName: author ? author.AUTH_NAME : "Unknown Author"
          }
        };
      }
      return record.toObject();
    }));

    res.json({ history: updatedHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
