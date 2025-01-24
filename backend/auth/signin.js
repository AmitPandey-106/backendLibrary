const bcrypt = require('bcryptjs');
const mongoose = require('mongoose')
const User = require('../db/schema/userlogin');
const profileform = require('../db/schema/profileform')
const jwt = require('jsonwebtoken');
const jwt_secret = process.env.JWT_SECRET

exports.signin = async (req, res) => {
    if (req.method == 'POST') {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(422).json({ msg: "Please fill all fields" });
        }

        try {
            const savedUser = await User.findOne({ userid: email });

            if (!savedUser) {
                return res.status(500).json({ err: "Incorrect userId!" });
            }

            const isMatch = await bcrypt.compare(password, savedUser.password);
            if (!isMatch) {
                return res.status(500).json({ err: "Incorrect password!" });
            }

            const token = jwt.sign(
                { id: savedUser._id, role: savedUser.role || 'user' }, // default to 'user' if no role
                jwt_secret
            );
            const studentprofile = await profileform.findOne({ studentID: email})

            // Differentiate response message for admin and regular users
            const message = savedUser.role === 'admin' ? "Admin Signin" : "User Signin";
            
            res.status(200).json({
                msg: message,
                token,
                role: savedUser.role,
                profile: studentprofile || null
            });
            // console.log(studentprofile)

        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        res.status(404).json({ msg: 'Method not allowed' });
    }
    
};
