const mongoose = require("mongoose");
require("dotenv").config();

const connectToDb = async () => {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    console.error("MongoDB URL not defined in environment variables.");
    process.exit(1); // Exit the process if MONGO_URL is not defined
  }

  try {
    await mongoose.connect(mongoUrl);

    console.log("Successfully connected to MongoDB.");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1); // Exit the process if the connection fails
  }
};

module.exports = connectToDb;
