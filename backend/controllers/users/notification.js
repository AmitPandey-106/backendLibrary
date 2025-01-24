const cron = require('node-cron');
const nodemailer = require("nodemailer");
const BorrowedBook = require('../../db/schema/borrowedbooks'); // Adjust path as needed
const User = require('../../db/schema/profileform'); // Adjust path as needed
const Notification = require('../../db/schema/notifymodel')
const Books = require('../../db/schema/booksdetails')
const AuthorModel = require('../../db/schema/author')

// Function to send an email notification
const sendEmail = async (email, subject, title, duedate) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
      user: 'gowdadarshan694@gmail.com', // Your email
      pass: 'tqhemvyrrerrjikr', // Your app password
    },
  });

  const mailOptions = {
    from: '"Library System" <gowdadarshan694@gmail.com>', // Sender name and email
    to: email,
    subject: subject,
    text:`Sending reminder for book: ${title || 'Unknown Title'}`,
    html:`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; background-color: #f9f9f9;">
    <div style="text-align: center; padding: 10px 0; background-color: #f44336; color: white;">
        <h2>Return Reminder: Borrowed Book</h2>
    </div>
    <div style="padding: 20px;">
        <p>Dear Student,</p>
        <p>This is a friendly reminder that you have a book that is due for return tomorrow.</p>
        <p>Please make sure to return it by the end of the day to avoid any late fees.</p>
        <p style="margin: 20px 0; font-weight: bold;">Here are the details of your borrowed book:</p>
        <ul style="list-style: none; padding: 0;">
            <li>📚 <strong>Book Title:</strong> ${title}</li>
            <li>🗓️ <strong>Due Date:</strong> ${duedate}</li>
        </ul>
        <p>If you need assistance or would like to renew your borrowing period, please don't hesitate to contact us at <a href="mailto:gowdadarshan694@gmail.com">gowdadarshan694@gmail.com</a>.</p>
        <p>Thank you for being a valued member of our library community!</p>
        <p>Best regards,<br>The Library Team</p>
    </div>
    <div style="text-align: center; padding: 10px; color: #777; font-size: 12px; border-top: 1px solid #e0e0e0;">
        © 2024 Library System. All rights reserved.
    </div>
</div>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to', email);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Function to send notification
const sendNotification = async (userId, bookId, duedate) => {
  try {
    const user = await User.findById(userId);
    const book = await Books.findById(bookId);

    if (user) {
      console.log(`Sending notification to ${user.email}`);
      await sendEmail(user.email, 'Book Return Reminder', book.title, duedate);

      const notificationMessage = `Your borrowed book "${book.title}" is due for return on ${new Date(duedate).toLocaleString()}.`;
      await Notification.create({
        book:bookId,
        user: userId,
        title: 'Book Return Reminder',
        message: notificationMessage,
      });
      console.log("Notification created", {userId , notificationMessage})

    } else {
      console.error(`User with ID ${userId} not found`);
    }
  } catch (error) {
    console.error('Error in sendNotification:', error);
  }
};

// Scheduled task to run daily at 9:00 AM
cron.schedule('*/1 * * * *', async () => {
    console.log('Checking for books due in 5 minutes.');
    const now = new Date();
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
    const fiveMinutesBefore = new Date(now.getTime() - 5 * 60 * 1000);

    try {
        // Find books that are due in the next 5 minutes or already overdue by less than 5 minutes
        const booksDueSoon = await BorrowedBook.find({
            $or: [
              {
                dueDate: { $gte: now, $lt: fiveMinutesLater },  // Due in the next 5 minutes
                notificationSent: false, // Notification not sent yet
              },
              {
                dueDate: { $gte: fiveMinutesBefore, $lt: now },  // Overdue by less than 5 minutes
                notificationSent: false, // Notification not sent yet
              }
            ]
        });
  
      if (booksDueSoon.length === 0) {
        console.log('No books due for return in the next 5 minutes.');
      }else {
        console.log(`Found ${booksDueSoon.length} book(s) due soon.`);

        for (const book of booksDueSoon) {
            console.log(`Sending reminder for book: ${book || 'Unknown Title'}`);
            
            // Send the notification
            await sendNotification(book.user, book.book, book.dueDate);

            // Mark the notification as sent for this book
            book.notificationSent = true;
            await book.save(); // Save the updated notificationSent status
        }
      }
    } catch (error) {
      console.error('Error during notification job:', error);
    }
  });
  
  exports.appNotify = async (req, res) => {
    const { userId } = req.params;
  
    try {
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Invalid or missing userId' });
      }
  
      const notifications = await Notification.find({ user: userId })
      .populate('book', 'TITLE author PHOTO')
      .populate('user', 'firstName lastName')
      .sort({ timestamp: -1 })
      res.json({ success: true, notifications });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  };
  
exports.returnNotify= async (req, res) => {
    try {
      const detailedNotification = await Notification.findById(req.params.id)
        .populate('book', 'TITLE PHOTO')
        .populate('user', 'firstName lastName')
        .lean();

      const author = await AuthorModel.findOne({ AUTH_ID: detailedNotification.book.AUTH_ID1 });
      if (!detailedNotification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.status(200).json({
        detailedNotification, 
        author: author ? author.AUTH_NAME : "Author not found"});
    } catch (error) {
      console.error('Error fetching notification details:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
