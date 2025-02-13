const nodemailer = require("nodemailer");
const User =  require('../db/schema/userlogin')
const bcrypt = require('bcryptjs');

const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

const addmember = async (req, res, next) => {
    const { emails, role } = req.body;
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ error: "A valid list of emails is required" });
    }

    try {
        // Email configurations for Welcome Email
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'gowdadarshan694@gmail.com',
                pass: 'tqhemvyrrerrjikr'  // Make sure you handle sensitive data securely (e.g., environment variables)
            }
        });

        const results = []

        for (const email of emails){
            const userId = email.split('@')[0];
            const password = generatePassword(); // Generate a random password
            const hashedPassword = await bcrypt.hash(password, 10);

            const existingUser = await User.findOne({ userid: userId });
            if (existingUser) {
                results.push({ email, status: "Failed", message: "User already exists" });
                continue;
            }

            let mailOptions = {
                from: '"BooksEra" <arprs9076@gmail.com>',
                to: email,
                subject: "Welcome to the Library",
                text: "Hello! You have been successfully added to the library system.",
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; background-color: #f9f9f9;">
                    <div style="text-align: center; padding: 10px 0; background-color: #4A90E2; color: white;">
                        <h2>Welcome to the Library System</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Dear Member,</p>
                        <p>We are thrilled to have you as a part of our library community!</p>
                        <p>You have been successfully added to our system, and you can now enjoy access to a wide range of books and resources.</p>
                        <p style="margin: 20px 0; font-weight: bold;">Here’s what you can do next:</p>
                        <ul style="list-style: none; padding: 0;">
                            <li>🔍 <strong>Explore Books:</strong> Browse and borrow books from our extensive collection.</li>
                            <li>📅 <strong>Manage Borrowed Books:</strong> Easily keep track of your borrowed items and due dates.</li>
                            <li>🛠️ <strong>Access Member Services:</strong> Use our online services for reservations, renewals, and more.</li>
                        </ul>
                        <p>If you have any questions, feel free to reach out to us at <a href="mailto:arprs9076@gmail.com">arprs9076@gmail.com</a>.</p>
                        <p>Welcome aboard, and happy reading!</p>
                        <p>Best regards,<br>The Library Team</p>
                    </div>
                    <div style="text-align: center; padding: 10px; color: #777; font-size: 12px; border-top: 1px solid #e0e0e0;">
                        © 2025 BooksEra. All rights reserved.
                    </div>
                </div>
                `
            };

        // Email with login credentials
        let loginMailOptions = {
            from: '"BooksEra" <arprs9076@gmail.com>',
            to: email,
            subject: "Your Library Account Details",
            text: `Dear ${userId},\n\nYour library account has been created.\n\nUser ID: ${userId}\nPassword: ${password}\n\nPlease keep these details secure.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; background-color: #f9f9f9;">
                    <h3>Your Library Account Details</h3>
                    <p>Dear ${userId},</p>
                    <p>Your library account has been created. Here are your login details:</p>
                    <p><strong>User ID:</strong> ${userId}</p>
                    <p><strong>Password:</strong> ${password}</p>
                    <p>You can login here: <a href="https://forentend-library.vercel.app/" style="color: #4A90E2;">Library Login</a></p>
                    <p>Please keep these details secure and do not share them with anyone.</p>
                    <p>Best regards,<br>The Library Team</p>
                </div>
            `
        };

        try{
            let info = await transporter.sendMail(mailOptions);
            console.log("Welcome email sent: %s", info.messageId);

            let loginInfo = await transporter.sendMail(loginMailOptions);
            console.log("Login credentials email sent: %s", loginInfo.messageId);
            
            // Save the user in the database
            const newUser = new User({
                userid: userId,
                password: hashedPassword,
                role: role || 'user'
            });

            await newUser.save();
            results.push({ email, status:"Success"})
        }catch(error){
            console.error(`Error processing email ${email}:`, error);

                // Add failure result for this email
            results.push({ email, status: "Failed", error: error.message })
        }

    }

    res.status(200).json({
        msg: "Member Added Successfully",
        results,
      });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to process the request" });
    }
};

module.exports = { addmember };

