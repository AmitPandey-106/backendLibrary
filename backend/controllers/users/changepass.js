const User = require('../../db/schema/userlogin');
const bcrypt = require('bcryptjs');

exports.changepassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Retrieve `userid` from the middleware
        const { userid } = req.user;
        
        // Find the authenticated user by their userid
        const user = await User.findOne({ userid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Compare the current password with the stored hash
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }
        console.log(user.password , currentPassword)

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        // Send success response
        return res.status(200).json({ msg: 'Password changed successfully' });
    } catch (error) {
        console.error('Error while changing password:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
