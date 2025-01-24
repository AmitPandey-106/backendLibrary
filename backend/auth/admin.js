const bcrypt = require('bcryptjs');
const User = require('../db/schema/userlogin');
const jwt = require('jsonwebtoken');
const jwt_secret = process.env.JWT_SECRET

exports.adminSignin = async (req, res) => {
    if (req.method === 'POST') {
        const { userid, password } = req.body;
        if (!userid || !password) {
            return res.status(422).json({ msg: "Please fill all fields" });
        }
        try {
            const savedUser = await User.findOne({ userid: userid });
            if (!savedUser) {
                return res.status(500).json({ err: "Incorrect email!" });
            }
            const isMatch = await bcrypt.compare(password, savedUser.password);
            if (!isMatch) {
                return res.status(500).json({ err: "Incorrect password!" });
            }
            if (savedUser.role !== 'admin') {
                return res.status(403).json({ err: "Access denied. Not an admin." });
            }
            const token = jwt.sign({ id: savedUser._id, role: savedUser.role }, jwt_secret);

            res.status(200).json({
                msg: "Admin Sign-in successful",
                token
            });

        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        res.status(404).json({ msg: 'Method not allowed' });
    }
};
