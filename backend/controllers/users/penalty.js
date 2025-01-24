const cron = require('node-cron');
const BorrowedBook = require('../../db/schema/borrowedbooks');
const User = require('../../db/schema/userlogin');
const Penalty = require('../../db/schema/penalty');
const Notification = require('../../db/schema/notifymodel')

cron.schedule('* * * * *', async () => { // Runs every day at midnight
  try {
    const currentDate = new Date();

    // Find all overdue books that have not been returned
    const overdueBooks = await BorrowedBook.find({
      dueDate: { $lt: currentDate },
      returned: false,
    });

    for (const book of overdueBooks) {
      const dueDate = new Date(book.dueDate);

      if (currentDate > dueDate) {
        const daysOverdue = Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24));
        const penaltyAmount = daysOverdue * 5;

        // Check if penalty already exists
        const existingPenalty = await Penalty.findOne({
          user: book.user._id,
          book: book.book._id
        });

        if (existingPenalty) {
          // If penalty exists, update the penaltyAmount and daysOverdue
          const updatedPenaltyAmount = existingPenalty.penaltyAmount + penaltyAmount;

          await Penalty.findOneAndUpdate(
            { user: book.user._id, book: book.book._id },
            { daysOverdue, penaltyAmount: updatedPenaltyAmount, createdAt: currentDate },
            { new: true }
          ); 

          // Update the user's penalty in the user model
          await User.updateOne(
            { profileId: book.user._id, 'penalties.book': book.book._id },  // Matching book in penalties
            {
              $set: {
                'penalties.$.penaltyAmount': updatedPenaltyAmount,  // Update the specific penalty
                'penalties.$.daysOverdue': daysOverdue,
                'penalties.$.createdAt': currentDate
              }
            }
          );
          // console.log(`Penalty updated for user ${book.user._id} on book ${book.book}`);
        } else {
          // If no existing penalty, create a new one
          await Penalty.findOneAndUpdate(
            { user: book.user._id, book: book.book._id },
            { daysOverdue, penaltyAmount, createdAt: currentDate },
            { upsert: true, new: true }
          );

          // Add new penalty to user's penalties array
          await User.updateOne(
            { profileId: book.user._id },
            {
              $push: {
                penalties: {
                  book: book.book._id,
                  penaltyAmount: penaltyAmount,
                  daysOverdue: daysOverdue,
                  createdAt: currentDate
                }
              }
            }
          );
          // console.log(`Penalty added for user ${book.user._id} on book ${book.book}`);
          const message = `You have a new penalty for the book "${book.title}". Penalty amount: $${penaltyAmount}.`;
          await Notification.create({
            book: book.book._id,
            user: book.user._id,
            title: book.title,
            message: message,
            read: false,
          });

          console.log('Notification sent to user for new penalty');
        }
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
      .populate('book', 'TITLE autor'); // Populate book details

    res.status(200).json({ success: true, penalties });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching penalties', error });
  }
}
