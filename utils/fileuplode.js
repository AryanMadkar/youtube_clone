const { v2 } = require("cloudinary");
const fs = require("fs"); // Import the file system module

// Configuration
v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadVideo = async (filePath) => {
  try {
    if (!filePath) {
      return null;
    }
    const result = await v2.uploader.upload(filePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(filePath);
    return result;
  } catch (error) {
    fs.unlinkSync(filePath);
    console.error("Error uploading video:", error);
    throw error;
  }
};

module.exports = { uploadVideo };
