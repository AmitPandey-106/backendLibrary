
const Waitlist = require('../../db/schema/waitlist')
const mongoose = require('mongoose')

exports.addToWaitlist = async (req, res) => {
    try {
      const { userId, bookId } = req.body;
  
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(bookId)) {
        return res.status(400).json({ message: 'Invalid userId or bookId.' });
      }
  
      // Check if user is already on the waitlist
      const existingEntry = await Waitlist.findOne({ user: userId, book: bookId });
      if (existingEntry) {
        return res.status(409).json({ message: 'You are already on the waitlist for this book.' });
      }
  
      // Add to waitlist
      const newWaitlistEntry = new Waitlist({ user: userId, book: bookId , });
      await newWaitlistEntry.save();
  
      res.status(201).json({ message: 'Added to waitlist successfully.' });
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      res.status(500).json({ error: 'An error occurred while adding to the waitlist.' });
    }
  };

  exports.getWaitlistEntries = async (req, res) => {
    try {
      // Fetch waitlist entries and populate details
      const waitlistEntries = await Waitlist.find()
        .populate('book', 'TITLE') // Populate book details (e.g., title)
        .populate('user', 'firstName lastName email') // Populate user details (e.g., name, email)
        .sort({ createdAt: -1 }); // Sort by newest entries
  
      res.status(200).json(waitlistEntries);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      res.status(500).json({ error: 'An error occurred while fetching the waitlist.' });
    }
  };
  
  exports.getwaitlistcount = async (req, res) => {
    try {
      const count = await Waitlist.countDocuments({ status: 'pending', viewed: false });
      res.json({ count });
    } catch (error) {
      console.error("Error fetching pending requests count:", error);
      res.status(500).json({ error: "Failed to fetch pending requests count" });
    }
  }