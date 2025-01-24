const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../../db/schema/userlogin');
const userProfile = require('../../db/schema/profileform');

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const userId = email.split('@')[0];
  console.log(userId)

  try {
    const user = await User.findOne({ userid:userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userprofile = await userProfile.findOne({ email })
    if (!userprofile) {
        return res.status(404).json({ error: 'email not found' });
      }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email with reset link
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'gowdadarshan694@gmail.com',
        pass: 'tqhemvyrrerrjikr',
      },
    });

    const mailOptions = {
      to: userprofile.email,
      from: 'gowdadarshan694@gmail.com',
      subject: 'Password Reset',
      text: `You requested a password reset. Click the link to reset your password: 
      http://localhost:3000/auth/reset-password/${resetToken}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ msg: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Error sending reset link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
