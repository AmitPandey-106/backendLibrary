const jwt = require('jsonwebtoken');
const jwt_secret = process.env.JWT_SECRET
const mongoose = require('mongoose');
const User = require('../db/schema/userlogin');

module.exports = (req, res, next) => {
    const { authorization } = req.headers;

    // Check if the authorization header is present
    if (!authorization) {
        return res.status(401).json({ error: 'Authorization token is required' });
    }

    const token = authorization.replace('Bearer ', '');

    // Verify the token
    jwt.verify(token, jwt_secret, (err, payload) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid or expired token, please log in' });
        }

        const { id } = payload;

        // Find the user by the payload _id
        User.findById(id)
            .then((userdata) => {
                if (!userdata) {
                    return res.status(404).json({ error: 'User not found' });
                }

                // Attach user data to the request object
                req.user = {
                    userid : userdata.userid,
                    id:userdata._id,
                    role:userdata.role
                }
                // console.log(userdata)
                next();
            })
            .catch((err) => {
                return res.status(500).json({ error: 'Internal server error' });
            });
    });
};
