const jwt = require('jsonwebtoken');
const { jwt_secret } = require('../key');
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
                    id:userdata._id
                }
                // console.log(userdata)
                next();
            })
            .catch((err) => {
                return res.status(500).json({ error: 'Internal server error' });
            });
    });
};