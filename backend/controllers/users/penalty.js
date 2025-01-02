// const moment = require('moment') // For date calculations (optional but useful)
// const BorrowedBook = require('../../db/schema/borrowedbooks')
// const User = require('../../db/schema/userlogin')
// const Penalty = require('../../db/schema/penalty')

// // Define a penalty rate (e.g., per day)
// const PENALTY_RATE = 5; // Adjust this value as per your requirements

// exports.addPenaltyForLateReturn = async (borrowedBookId) => {

//   try {
//     // Find the borrowed book record
//     const borrowedBook = await BorrowedBook.findById(borrowedBookId).populate('user book');
//     if (!borrowedBook) {
//       console.error('Borrowed book record not found');
//       return res.status(404).json({ message: 'Borrowed book record not found' });
//     }

//     // Check if the book is returned late
//     const today = moment(); // Current date
//     const dueDate = moment(borrowedBook.dueDate); // Due date of the book

//     if (today.isAfter(dueDate)) {
//       const overdueDays = today.diff(dueDate, 'days'); // Calculate overdue days
//       const penaltyAmount = overdueDays * PENALTY_RATE; // Total penalty amount

//       // Add penalty to the user's record
//       const user = await User.findOne({profileId: borrowedBook.user});
//       if (!user) {
//         console.error('User not found');
//         return res.status(404).json({ message: 'User not found' });
//       }

//       user.penalty = (user.penalty || 0) + penaltyAmount; // Update user's penalty (accumulate)
//       await user.save();

//       // Optionally, save the penalty details in a separate collection (if needed for admin/history purposes)
//       const penaltyRecord = new Penalty({
//         user: borrowedBook.user,
//         book: borrowedBook.book,
//         overdueDays,
//         penaltyAmount,
//         imposedDate: new Date(),
//       });
//       await penaltyRecord.save();

//       return {
//         message: 'Penalty added successfully',
//         overdueDays,
//         penaltyAmount,
//         totalPenalty: user.penalty,
//       }
//     } else {
//       return { message: 'No penalty applied. The book is not overdue.' }
//     }
//   } catch (error) {
//     console.error('Error adding penalty:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

const cron = require('node-cron');
const BorrowedBook = require('../../db/schema/borrowedbooks');
const Penalty = require('../../db/schema/penalty');
const User = require('../../db/schema/userlogin')

cron.schedule('* * * * *', async () => {

  try {
    const currentDate = new Date();

    // Find all overdue borrowed books
    const overdueBooks = await BorrowedBook.find({ dueDate: { $lt: currentDate }, returned: false })

    for (const book of overdueBooks) {
      // Calculate "simulated days overdue"
      const minutesOverdue = Math.ceil((currentDate - new Date(book.dueDate)) / (1000 * 60));
      const simulatedDaysOverdue = Math.floor(minutesOverdue / 15); // 15 minutes = 1 day
      const penaltyAmount = simulatedDaysOverdue * 10; // ₹10 penalty per simulated day

      // Check if a penalty record already exists for this book and user
      const existingPenalty = await Penalty.findOne({
        user: book.user,
        book: book.book._id,
      });

      if (!existingPenalty) {
        // Create a new penalty record if it doesn't exist
        await Penalty.create({
          user: book.user,
          book: book.book._id,
          daysOverdue: simulatedDaysOverdue,
          penaltyAmount,
          createdAt: currentDate,
        }); 

        console.log(`Penalty created for user ${book.user} on book ${book.book.title}`);
      } else {
        // Update the existing penalty if it exists
        existingPenalty.daysOverdue = simulatedDaysOverdue;
        existingPenalty.penaltyAmount = penaltyAmount;
        await existingPenalty.save();

        console.log(`Penalty updated for user ${book.user} on book ${book.book.title}`);
      }

      // Update user's penalty details in their record
      const user = await User.findOne({ profile: book.user});
      if (user) {
        const penaltyIndex = user.penalties.findIndex(
          (penalty) => penalty.book.toString() === book.book._id.toString()
        );

        if (penaltyIndex === -1) {
          user.penalties.push({
            book: book.book._id,
            penaltyAmount,
            daysOverdue: simulatedDaysOverdue,
            createdAt: currentDate,
          });
        } else {
          user.penalties[penaltyIndex].penaltyAmount = penaltyAmount;
          user.penalties[penaltyIndex].daysOverdue = simulatedDaysOverdue;
        }
        await user.save();
      }
    }
  } catch (error) {
    console.error('Error in penalty cron job:', error);
  }
});

exports.getPenalty = async (req, res) => {
  try {
    const penalties = await Penalty.find()
      .populate('user', 'firstName lastName studentID email') // Populate user details
      .populate('book', 'title autor'); // Populate book details

    res.status(200).json({ success: true, penalties });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching penalties', error });
  }
}
