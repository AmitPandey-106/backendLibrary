// Import Mongoose
const mongoose = require('mongoose');
const { mongoUrl } = require('../../key');

// MongoDB connection URI
const uri = mongoUrl;

// Mongoose connection options
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // You can add more options if needed, such as server selection timeout
});

// Events for successful or failed connection
mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Failed to connect to MongoDB', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Disconnected from MongoDB');
});

// Export mongoose for use in other files
module.exports = mongoose;
