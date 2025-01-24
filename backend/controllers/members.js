const User = require('../db/schema/userlogin');
const StudentProfile = require('../db/schema/profileform');

exports.members = async (req, res) => {
  try {
    // Perform an aggregation to filter out admins and join profiles
    const members = await User.aggregate([
      {
        $match: {
          role: { $ne: 'admin' }, // Exclude users with role 'admin'
        },
      },
      {
        $lookup: {
          from: 'studentprofiles', // The name of the StudentProfile collection in MongoDB
          localField: 'userid', // Field in the User model
          foreignField: 'studentID', // Field in the StudentProfile model
          as: 'studentProfile', // Alias for the matched data
        },
      },
      {
        $unwind: {
          path: '$studentProfile', // Flatten the array of matched profiles
          preserveNullAndEmptyArrays: true, // Include users without a matching profile
        },
      },
      {
        $project: {
          _id: 1,
          userid: 1,
          role: 1,
          'studentProfile.firstName': 1,
          'studentProfile.lastName': 1,
          'studentProfile.email': 1,
          'studentProfile.phoneNumber': 1,
          'studentProfile.department': 1,
          'studentProfile.yearLevel': 1,
        }, // Specify which fields to include in the output
      },
    ]);

    // Count only non-admin users
    const userCount = await User.countDocuments({ role: { $ne: 'admin' } });

    res.status(200).json({ members, userCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch members.' });
  }
};

exports.removeUser = async(req, res)=>{
  const { id } = req.params;

  try {
    // Check if Profile exists
    const profile = await StudentProfile.findOne({userId:id});
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check if Profile ID is associated with a UserLogin
    const userLogin = await User.findById(id);
    if (!userLogin) {
      return res.status(404).json({ message: 'No UserLogin associated with this Profile' });
    }

    // Delete both Profile and UserLogin
    await StudentProfile.findByIdAndDelete(profile._id);
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'Member successfully removed' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}