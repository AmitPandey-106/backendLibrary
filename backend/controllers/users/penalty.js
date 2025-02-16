const cron = require('node-cron');
const BorrowedBook = require('../../db/schema/borrowedbooks');
const User = require('../../db/schema/userlogin');
const Penalty = require('../../db/schema/penalty');
const Notification = require('../../db/schema/notifymodel');

cron.schedule('* * * * *', async () => { // Runs every minute
  try {
    const currentDate = new Date();
    const today = new Date().setHours(0, 0, 0, 0); // Midnight for comparison

    // Find all overdue books that have not been returned
    const overdueBooks = await BorrowedBook.find({
      dueDate: { $lt: currentDate },
      returned: false,
    });

    for (const book of overdueBooks) {
      const dueDate = new Date(book.dueDate);
      const daysOverdue = Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24));
      const penaltyAmount = daysOverdue * 5; // $5 per day

      // Check if penalty already exists
      let existingPenalty = await Penalty.findOne({
        user: book.user._id,
        book: book.book._id
      });

      if (existingPenalty) {
        const lastUpdated = new Date(existingPenalty.createdAt).setHours(0, 0, 0, 0); // Get last update date

        if (lastUpdated < today) {
          // Only update penalty amount if it was NOT updated today
          await Penalty.findOneAndUpdate(
            { user: book.user._id, book: book.book._id },
            { 
              penaltyAmount,  // Update only once per day
              createdAt: currentDate // Mark update timestamp
            },
            { new: true }
          );

          // Update user's penalty in user model
          await User.updateOne(
            { profileId: book.user._id, 'penalties.book': book.book._id },  
            {
              $set: {
                'penalties.$.penaltyAmount': penaltyAmount,
                'penalties.$.createdAt': currentDate
              }
            }
          );
          console.log(`Penalty updated for user ${book.user._id} on book ${book.book}`);
        }

        // Update overdueDays every minute
        await Penalty.updateOne(
          { user: book.user._id, book: book.book._id },
          { overdueDays: daysOverdue }  // Update overdue days continuously
        );

      } else {
        // If no existing penalty, create a new one
        await Penalty.create({
          user: book.user._id,
          book: book.book._id,
          overdueDays: daysOverdue,
          penaltyAmount,
          createdAt: currentDate
        });

        // Add new penalty to user's penalties array
        await User.updateOne(
          { profileId: book.user._id },
          {
            $push: {
              penalties: {
                book: book.book._id,
                penaltyAmount,
                overdueDays: daysOverdue,
                createdAt: currentDate  
              }
            }
          }
        );

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
