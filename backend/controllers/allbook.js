const Bookform = require('../db/schema/bookform');
const ClgBook = require('../db/schema/booksdetails')
const AuthorModel = require('../db/schema/author')
const db = require('../db/dbConnection/db')

exports.getAllBooks = async (req, res) => {
  if (req.method === "GET") {
    try {
      // Fetch all books from the Bookform collection
      const books = await Bookform.find();
      const booklen = await Bookform.countDocuments()

      // If no books found
      if (books.length === 0) {
        return res.status(404).json({ msg: "No books found" });
      }

      // Send the list of books as a response
      res.status(200).json({ books, booklen });
    } catch (error) {
      console.log("Error fetching books:", error);
      res.status(500).json({ err: "Error while fetching books" });
    }
  } else {
    res.status(405).json({ err: "Method not allowed. Use GET." });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await ClgBook.findById(req.params.id);

    if (book) {
      // Fetch related books based on the book_type (you can adjust the filter logic)
      const recommendations = await Bookform.find({
        _id: { $ne: req.params.id }, // Exclude the current book
      }); // Limit the number of recommendations

      res.status(200).json({ book, recommendations });
    } else {
      res.status(404).json({ message: "Book not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching book details", error });
  }
};


exports.updatebook = async (req, res) => {
  const { id } = req.params;
  const { CAT_NO, LANG_CODE, TITLE, SUB_TITLE, AUTH_ID1, AUTH_ID2, PLACE_OF_PUB, PUB_ID, YEAR_OF_PUB, SUB_ID, TOTAL_VOL, PHOTO } = req.body

  try {
    const book = await ClgBook.findByIdAndUpdate(id, {
      CAT_NO,
      LANG_CODE,
      TITLE,
      SUB_TITLE,
      AUTH_ID1,
      AUTH_ID2,
      PLACE_OF_PUB,
      PUB_ID,
      YEAR_OF_PUB,
      SUB_ID,
      TOTAL_VOL,
      PHOTO
    }, { new: true });

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json({ book });
  } catch (error) {
    res.status(500).json({ message: 'Error updating book details' });
  }
}

exports.getAllStreams = async (req, res) => {
  try {
    // Get distinct streams
    const streams = await Bookform.distinct('stream');

    // If no streams found
    if (!streams || streams.length === 0) {
      return res.status(404).json({ msg: "No streams found" });
    }

    // Send the list of streams as a response
    res.status(200).json({ streams });
  } catch (error) {
    console.log("Error fetching streams:", error);
    res.status(500).json({ err: "Error while fetching streams" });
  }
};

exports.searchbook = async (req, res) => {
  const { query } = req.query; // Get the search query

  if (!query.trim()) {
    return res.status(400).json({ msg: 'Query cannot be empty' });
  }

  try {
    // Step 1: Find authors whose names match the query
    const authors = await AuthorModel.find({
      AUTH_NAME: { $regex: query, $options: 'i' }
    });

    // Get an array of matching author IDs (AUTH_ID)
    const authorIds = authors.map(author => author.AUTH_ID);

    // Step 2: Find books that match either the title or matching author ID (AUTH_ID1)
    const books = await ClgBook.find({
      $or: [
        { TITLE: { $regex: query, $options: 'i' } }, // Search for title
        { AUTH_ID1: { $in: authorIds } } // Match books by author IDs
      ]
    });

    // Step 3: Manually fetch the author name for each book
    const searchbook = await Promise.all(books.map(async (book) => {
      // Manually find the author based on AUTH_ID1
      const author = await AuthorModel.findOne({ AUTH_ID: book.AUTH_ID1 });

      // If the author exists, add the author's name to the book
      const authorName = author ? author.AUTH_NAME : 'Unknown';

      // Return the book with the author's name
      return {
        ...book.toObject(),
        authorName: authorName  // Add author name field to the book object
      };
    }));

    // Step 4: Return the result with the books and their respective author names
    res.status(200).json({ searchbook });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ msg: 'Failed to fetch books' });
  }
};

exports.filterSearch = async (req, res) => {
  try {
    const { subname, query } = req.query;

    // Step 1: Find the subject ID based on the subject name (if subname is provided)
    let subjectId = null;
    if (subname) {
      const subjectCollection = db.connection.collection("subjects");
      const subject = await subjectCollection.findOne({ SUB_NAME: subname });
      if (subject) {
        subjectId = subject.SUB_ID; // Extract the subject ID
      } else {
        return res.status(404).json({ error: 'Subject not found' });
      }
    }

    // Step 2: Find the Author ID based on the author's name (if query is related to an author name)
    let authorId = null;
    if (query) {
      const author = await AuthorModel.findOne({ AUTH_NAME: { $regex: query, $options: 'i' } });
      if (author) {
        authorId = author.AUTH_ID; // Extract the Author ID
      }
    }

    // Step 3: Build the filter for the book search
    const filter = {};

    // Apply the subject filter if a subjectId is found
    if (subjectId) {
      filter.SUB_ID = subjectId; // Match the subject ID in books
    }

    // Apply the author filter if an authorId is found
    if (authorId) {
      filter.$or = filter.$or || []; // Initialize $or if it's not already initialized
      filter.$or.push(
        { AUTH_ID1: authorId }, // Match author ID1 in the books
        { AUTH_ID2: authorId }  // Match author ID2 in the books
      );
    }

    // Apply additional query for title search (if query exists)
    if (query && !authorId) {
      filter.$or = filter.$or || []; // Initialize $or if it's not already initialized
      filter.$or.push(
        { TITLE: { $regex: query, $options: 'i' } } // Case-insensitive search for title
      );
    }

    // Step 4: Use aggregation to include author name in the results
    const books = await ClgBook.aggregate([
      {
        $match: filter, // Apply the constructed filter
      },
      {
        $lookup: {
          from: "authors", // Join with authors collection
          localField: "AUTH_ID1", // Match AUTH_ID1 from books collection
          foreignField: "AUTH_ID", // Match AUTH_ID from authors collection
          as: "authorDetails1", // Alias for matched author
        },
      },
      {
        $lookup: {
          from: "authors", // Join with authors collection for AUTH_ID2
          localField: "AUTH_ID2", // Match AUTH_ID2 from books collection
          foreignField: "AUTH_ID", // Match AUTH_ID from authors collection
          as: "authorDetails2", // Alias for matched author
        },
      },
      {
        $project: {
          CAT_NO: 1,
          LANG_CODE: 1,
          TITLE: 1,
          SUB_TITLE: 1,
          PLACE_OF_PUB: 1,
          PUB_ID: 1,
          YEAR_OF_PUB: 1,
          SUB_ID: 1,
          TOTAL_VOL: 1,
          PHOTO: 1,
          LIB_CODE: 1,
          authorName1: { $arrayElemAt: ["$authorDetails1.AUTH_NAME", 0] }, // Get the first author name
          authorName2: { $arrayElemAt: ["$authorDetails2.AUTH_NAME", 0] }, // Get the second author name
        },
      },
    ]);

    // Step 5: Return the results with author names
    res.status(200).json(books);
  } catch (error) {
    console.error('Error searching books:', error);
    res.status(500).json({ error: 'Failed to search books' });
  }
};
