// hashExistingAdminPassword.js
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./db/schema/userlogin'); // Adjust path to your User schema

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/library', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("Error connecting to MongoDB", err));

// Function to hash and update admin password
async function hashAdminPassword() {
    try {
        // Retrieve the admin user (replace with actual admin ID or identifier)
        const adminUser = await User.findOne({ userid: "admin123" }); // Use actual admin identifier

        if (!adminUser) {
            console.log("Admin user not found!");
            return;
        }

        // Hash the plaintext password
        const plainPassword = adminUser.password; // The current plaintext password
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Update the admin password with the hashed version
        adminUser.password = hashedPassword;
        await adminUser.save();
        
        console.log("Admin password hashed and updated successfully.");
    } catch (err) {
        console.error("Error hashing admin password", err);
    } finally {
        mongoose.connection.close();
    }
}

// Execute the function
hashAdminPassword();
