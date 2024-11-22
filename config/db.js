const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

process.env.MONGO_URI = 'mongodb://localhost:27017/';
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
