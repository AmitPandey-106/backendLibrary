const multer = require('multer');
const path = require('path');
const EBook = require('../db/schema/eBook');  // Assuming the eBook model is in models/eBook.js

// Set storage engine for multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/ebooks/');  // Destination folder for the uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // File name with extension
  },
});

// Filter for file types (you can adjust this for eBook file types like PDF, EPUB, etc.)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',           // PDF
    'application/zip',           // ZIP files
    'application/msword',        // Word .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word .docx
    'image/jpeg',                // JPEG images
    'image/png',                 // PNG images
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, Word and zip are allowed.'), false);
  }
};


const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});


// Create API to upload eBook
const uploadEBook = async (req, res) => {
  try {
    // Validate input data
    const { title, author, category, language, description, price, isbn, fileType } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: 'File is required.' });
    }
    // Create new eBook record
    const newEBook = new EBook({
      title,
      author,
      category,
      language,
      description,
      price,
      isbn,
      coverImage: req.body.coverImage || '',  // Optional: Handle cover image separately
      file: req.file.path,  // Path to the uploaded file
      fileType,
      fileSize: req.file.size,
      uploadedBy: 'admin',
    });

    // Save the eBook to the database
    await newEBook.save();

    // Send success response
    res.status(200).json({ message: 'eBook uploaded successfully!', eBook: newEBook });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};


const Allebooks =  async (req, res) => {
  try {
    const ebooks = await EBook.find(); // Fetch all eBooks from the database
    res.status(200).json(ebooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch eBooks.' });
  }
}

const getAllCategory = async (req, res) => {
  try {
    // Get distinct streams
    const category = await EBook.distinct('category');

    // If no streams found
    if (!category || category.length === 0) {
      return res.status(404).json({ msg: "No streams found" });
    }

    // Send the list of streams as a response
    res.status(200).json({ category });
  } catch (error) {
    console.log("Error fetching streams:", error);
    res.status(500).json({ err: "Error while fetching streams" });
  }
};


const getEbookById = async (req, res) => {
  try {
    const book = await EBook.findById(req.params.id);

    if (book) {
      // Fetch related books based on the book_type or other criteria
      const recommendations = await EBook.find({
        _id: { $ne: req.params.id }, // Exclude the current book
      }).limit(5);

      res.status(200).json({
        book,
        recommendations
      });
    } else {
      res.status(404).json({ message: "Book not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching book details", error });
  }
};

module.exports = { upload, uploadEBook, Allebooks, getAllCategory, getEbookById };