const Bookform = require('../db/schema/bookform')
const cloudinary = require('../lib/cloudinary')

exports.BookForm = async(req, res)=>{
    if(req.method == "POST"){
        try{

            const {isbn, title, author, quantity, stream, bookimage} = req.body
            // console.log(isbn, title, author, quantity, bookimage)
            
            if(!title || !author || !quantity || !stream){
                return res.status(400).json({ msg: "please fill all fields"})
            }

            const uploadedImage = await cloudinary.uploader.upload(bookimage, {
                folder: 'reels_shorts',
                public_id: `user_${Date.now()}`,
                overwrite: true,
              });

              const photoUrl = uploadedImage.secure_url;
            const newBook = new Bookform({
                ISBN:isbn,
                title,
                author,
                quantity,
                stream,
                bookimage:photoUrl
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
