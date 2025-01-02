const User = require('../db/schema/userlogin');
const StudentProfile = require('../db/schema/profileform');

exports.members = async (req, res) => {
  try {
    // Perform an aggregation to match `userid` in `User` with `studentID` in `StudentProfile`
    const members = await User.aggregate([
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
    const userCount = await User.countDocuments();

    res.status(200).json({members , userCount});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch members.' });
  }
};
