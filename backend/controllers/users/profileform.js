// pages/api/student-profile.js
const StudentProfile = require('../../db/schema/profileform');
const User = require('../../db/schema/userlogin')

exports.userprofile = async (req, res) => {
  if (req.method === 'PUT') {
    try {
      const {
        userId,
        firstName,
        lastName,
        dob,
        email,
        studentID,
        ...restData
      } = req.body;

      // Check for missing required fields
      if (!userId || !firstName || !lastName || !email || !studentID) {
        return res.status(400).json({ message: 'All required fields must be filled.' });
      }

      // Find existing profile by studentID
      let profile;
      const existingProfile = await StudentProfile.findOne({ studentID });

      if (existingProfile) {
        // Update the existing profile
        existingProfile.userId = userId;
        existingProfile.firstName = firstName;
        existingProfile.lastName = lastName;
        existingProfile.dob = dob;
        existingProfile.email = email;
        Object.assign(existingProfile, restData); // Assign other fields

        profile = await existingProfile.save();
      } else {
        // Create a new profile if none exists
        profile = new StudentProfile({
          userId,
          firstName,
          lastName,
          dob,
          email,
          studentID,
          ...restData,
        });

        profile = await profile.save();
      }

      // Save the profile ID in the User table
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      user.profileId = profile._id; // Assuming `profileId` is a field in your User schema
      await user.save();

      // Respond with success
      res.status(existingProfile ? 200 : 201).json({
        message: existingProfile
          ? 'Profile updated successfully!'
          : 'Student profile created successfully!',
        profile,
      });
    } catch (error) {
      console.error('Error processing student profile:', error);
      res.status(500).json({ message: 'Error processing student profile.', error });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed.' });
  }
};


// Profile Controller (add this to your profile controller file or create a new one)

exports.getProfile = async (req, res) => {
  const userId = req.user.userid; // Extracted from token middleware
  const role = req.user.role
  if (role !== 'admin') {
    try {
      const profile = await StudentProfile.findOne({ studentID: userId });
      if (!profile) {
        return res.status(404).json({ msg: "Profile not found", profile: {} });
      }

      res.status(200).json({ profile });
      // console.log(profile)
    } catch (err) {
      res.status(500).json({ error: "Error fetching profile data" });
    }
  }
};
