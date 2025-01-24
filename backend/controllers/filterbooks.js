const ClgBookform = require('../db/schema/booksdetails')
const AuthorModel = require('../db/schema/author')

exports.filteredbook =async (req, res) => {
    const { title, author } = req.query;
  
    const filters = {};
    if (title) filters.TITLE = new RegExp(title, 'i'); // Case-insensitive filter
    if (author) filters.authorName = new RegExp(author, 'i');
  
    try {
      const books = await ClgBookform.find(filters); // Fetch books based on filters
      res.json({ books });
    } catch (error) {
      console.error('Error fetching books:', error);
      res.status(500).json({ error: 'Error fetching books' });
    }
  }
  