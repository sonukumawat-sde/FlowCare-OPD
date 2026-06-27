const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // process.env.MONGODB_URI me hum database ka secure link rakhenge
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    // Agar DB connect nahi hota hai, to application ko safely rok dena chahiye (code 1)
    process.exit(1);
  }
};

// Production-level Edge Case Handling
mongoose.connection.on('disconnected', () => {
  console.warn('[Database Warning] MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Error] Mongoose connection error:', err);
});

// Graceful shutdown: Jab hum terminal me server band karein (Ctrl+C)
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('[Database] MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;