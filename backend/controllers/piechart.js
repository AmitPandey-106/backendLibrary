const BorrowedBooks = require('../db/schema/borrowedbooks')

exports.pieChartData = async (req, res) => {
    try {
      const issuedBooksCount = await BorrowedBooks.countDocuments({ status: "issued" });
      const borrowedBooksCount = await BorrowedBooks.countDocuments({});
      const returnedBooksCount = await BorrowedBooks.countDocuments({ status: "returned" });
      const overdueBooksCount = await BorrowedBooks.countDocuments({ dueDate: { $lt: new Date() } });
  
      const pieChartData = {
        success: true,
        data: {
          labels: ['Issued Books', 'Borrowed Books', 'Returned Books', 'Overdue Books'],
          datasets: [
            {
              label: 'Books Statistics',
              data: [issuedBooksCount, borrowedBooksCount, returnedBooksCount, overdueBooksCount],
              backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'],
            },
          ],
        },
      };
  
      res.status(200).json(pieChartData);
    } catch (error) {
      console.error("Error fetching pie chart data:", error);
      res.status(500).json({ success: false, message: "Failed to fetch data." });
    }
  }