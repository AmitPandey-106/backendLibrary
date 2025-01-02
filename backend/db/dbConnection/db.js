const mongoose = require('mongoose');
const mongoUrl = process.env.MONGO_URL;

if (!mongoUrl) {
    console.error('Mongo URI is not defined in the .env file');
    process.exit(1); // Exit the application if no URI is defined
}

mongoose.connect(mongoUrl, {
    useUnifiedTopology: true,
});

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
