const BorrowedBook = require("../db/schema/borrowedbooks");

exports.mostBorrowedBooks = async (req, res) => {
  try {
    // Aggregate to count the most borrowed books
    const mostBorrowed = await BorrowedBook.aggregate([
      {
        $group: {
          _id: "$book", // Group by the 'book' ObjectId
          borrowCount: { $sum: 1 }, // Count occurrences of each book
        },
      },
      { $sort: { borrowCount: -1 } }, // Sort in descending order of borrowCount
      { $limit: 6 }, // Limit the result to the top 6 books
    ]);

    // Populate book details (like title and author)
    const booksWithDetails = await BorrowedBook.populate(mostBorrowed, {
      path: "_id",
      select: "TITLE author", // Select the 'name' and 'author' fields from Bookform
      model: "BooksDetail", // Replace with your book model name
    });

    // Format response
    const response = booksWithDetails.map((book) => ({
      bookTitle: book._id?.TITLE || "Unknown Title",
      borrowCount: book.borrowCount,
    }));
5
    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching most borrowed books:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching most borrowed books." });
  }
};
