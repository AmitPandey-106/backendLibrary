const BorrowedBook = require("../../db/schema/borrowedbooks");

exports.tommorowdue = async (req, res) => {
  try {
    const now = new Date();
    
    // Get tomorrow's start (midnight) and end (11:59:59 PM)
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(now.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Query for books due strictly tomorrow
    const dueBooks = await BorrowedBook.find({
      dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
    })
      .populate("book", "title author") // Populate book details
      .populate("user", "firstName lastName email"); // Populate user details

    res.status(200).json({
      success: true,
      dueBooks,
    });
  } catch (error) {
    console.error("Error fetching books due tomorrow:", error);
    res.status(500).json({ success: false, message: "Error fetching books due tomorrow." });
  }
};


exports.todaydue = async (req, res) => {
  try {
    const now = new Date();

    // Get today's start time (00:00:00 AM) and end time (11:59:59 PM)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0); // Midnight of today

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999); // End of today

    // Query for books due today
    const todayDue = await BorrowedBook.find({
      dueDate: { $gte: startOfToday, $lte: endOfToday },
    })
      .populate("book", "title author") // Populate book details
      .populate("user", "firstName lastName email"); // Populate user details

    // Send a successful response with the retrieved data
    res.status(200).json({
      success: true,
      todayDue,
    });
  } catch (error) {
    console.error("Error fetching books due today:", error);
    res.status(500).json({ success: false, message: "Error fetching books due today." });
  }
};
