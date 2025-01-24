const ClgBookform = require('../db/schema/booksdetails')
const cloudinary = require('../lib/cloudinary')
const AuthorModel = require('../db/schema/author')
const db = require('../db/dbConnection/db')

exports.AddClgBook = async(req, res)=>{
    if(req.method == "POST"){
        try{

            const {CAT_NO, LANG_CODE, TITLE, SUB_TITLE, AUTH_ID1, AUTH_ID2, PLACE_OF_PUB, PUB_ID, YEAR_OF_PUB, SUB_ID, TOTAL_VOL, PHOTO} = req.body
            // console.log(isbn, title, author, quantity, bookimage)
            
            if(!CAT_NO || !LANG_CODE || !TITLE || !YEAR_OF_PUB || !TOTAL_VOL){
                return res.status(400).json({ msg: "please fill all fields"})
            }

            const uploadedImage = await cloudinary.uploader.upload(PHOTO, {
                folder: 'reels_shorts',
                public_id: `user_${Date.now()}`,
                overwrite: true,
              });

              const photoUrl = uploadedImage.secure_url;
            const newBook = new ClgBookform({
                CAT_NO,
                LANG_CODE,
                TITLE,
                SUB_TITLE,
                AUTH_ID1,
                AUTH_ID2,
                PLACE_OF_PUB,
                PUB_ID,
                YEAR_OF_PUB,
                SUB_ID,
                TOTAL_VOL,
                PHOTO: photoUrl
            })
            
            const savebook = await newBook.save()
            res.status(200).json({ msg :"Book added successfully", savebook})
        }catch(error){
            console.log("getting error while saving")
            res.status(500).json({ err: "Get error while saving book"})
        }
    }else{
        res.status(405).json({ err: "Not correct method"})
    }
}

exports.getClgBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;  // Default to page 1
    const booksPerPage = 10;  // Number of books per page

    const clgbooks = await ClgBookform.aggregate([
      {
        $lookup: {
          from: "authors",
          localField: "AUTH_ID1",
          foreignField: "AUTH_ID",
          as: "authorDetails",
        },
      },
      {
        $unwind: {
          path: "$authorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          CAT_NO: 1,
          LANG_CODE: 1,
          TITLE: 1,
          SUB_TITLE: 1,
          PLACE_OF_PUB: 1,
          PUB_ID: 1,
          YEAR_OF_PUB: 1,
          SUB_ID: 1,
          TOTAL_VOL: 1,
          PHOTO: 1,
          LIB_CODE: 1,
          authorName: "$authorDetails.AUTH_NAME",
        },
      },
      { $skip: (page - 1) * booksPerPage },  // Skip books based on the current page
      { $limit: booksPerPage }  // Limit to the number of books per page
    ]);

    const totalBooks = await ClgBookform.countDocuments();  // Total number of books in the database

    if (clgbooks.length === 0) {
      return res.status(404).json({ msg: "No books found" });
    }

    res.status(200).json({
      clgbooks,
      totalBooks,
      totalPages: Math.ceil(totalBooks / booksPerPage),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.Subjects = async (req, res) => {
    try {
        // Access the 'books' collection directly from the database
        const subjects = await db.connection.collection('subjects').find().toArray();
        
        // Send the books as the response
        res.status(200).json(subjects);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: 'Error fetching books' });
    }
};

exports.getBooksBySubject = async (req, res) => {
  try {
    const { subname } = req.query;

    if (!subname) {
      return res.status(400).json({ message: "Subject name is required" });
    }

    // Fetch the subject using the provided subject name
    const subjectCollection = db.connection.collection("subjects");
    const subject = await subjectCollection.findOne({ SUB_NAME: subname });

    if (!subject) {
      return res.status(404).json({ message: "No subject found with the given name" });
    }

    // Use aggregation to fetch books along with author details
    const books = await ClgBookform.aggregate([
      {
        $match: { SUB_ID: subject.SUB_ID },
      },
      {
        $lookup: {
          from: "authors",
          localField: "AUTH_ID1",
          foreignField: "AUTH_ID",
          as: "authorDetails",
        },
      },
      {
        $unwind: {
          path: "$authorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          CAT_NO: 1,
          LANG_CODE: 1,
          TITLE: 1,
          SUB_TITLE: 1,
          PLACE_OF_PUB: 1,
          PUB_ID: 1,
          YEAR_OF_PUB: 1,
          SUB_ID: 1,
          TOTAL_VOL: 1,
          PHOTO: 1,
          LIB_CODE: 1,
          authorName: "$authorDetails.AUTH_NAME", // Include author name
        },
      },
    ]);

    if (books.length === 0) {
      return res.status(404).json({ message: "No books found for the given subject" });
    }

    res.status(200).json(books);
  } catch (error) {
    console.error("Error fetching books by subject:", error);
    res.status(500).json({ message: "Error fetching books" });
  }
};

