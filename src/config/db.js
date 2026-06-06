const mongoose = require('mongoose');
// Windows DNS servers often block SRV record queries required by mongodb+srv://
// Force Node.js to use Google DNS (8.8.8.8) for reliable SRV lookups
require('dns').setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.error(`MongoDB connection error (attempt ${attempt}/${retries}): ${err.message}`);
      if (attempt === retries) {
        console.error('All connection attempts failed. Check:\n  1. Atlas cluster is not paused (cloud.mongodb.com)\n  2. Your IP is whitelisted in Atlas Network Access\n  3. MONGODB_URI in .env is correct');
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

module.exports = connectDB;
