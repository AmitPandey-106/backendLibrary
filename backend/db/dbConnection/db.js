const mongoose = require('mongoose');
const mongoUrl = "mongodb+srv://arprs9076:2LCIBrJTiHfwO6pa@nextjsdatabase.vrxec.mongodb.net/Library?retryWrites=true&w=majority&appName=nextjsdatabase";

if (!mongoUrl) {
    console.error('Mongo URI is not defined in the .env file');
    process.exit(1); // Exit the application if no URI is defined
}

mongoose.connect(mongoUrl);

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Failed to connect to MongoDB', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Disconnected from MongoDB');
});

module.exports = mongoose;
