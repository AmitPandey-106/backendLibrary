const BorrowedBook = require('../db/schema/borrowedbooks')
const AdminHistory = require('../db/schema/adminhistroy')

exports.getAdminHistory = async (req, res) => {
    try {
      const history = await AdminHistory.find()
      .populate('user', 'firstName lastName email') // Populate user details
      .populate('book', 'TITLE author')
      .sort({ returnedDate: -1 }); // Most recent first
      res.json({ history });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  