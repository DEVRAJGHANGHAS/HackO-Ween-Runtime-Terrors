const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodresq_ai';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[Database Error] Connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database Warning] MongoDB disconnected. Reconnection will be attempted.');
    });

    return conn;
  } catch (error) {
    console.error(`[Database Critical Error] Failed to connect to MongoDB: ${error.message}`);
    console.warn('[Database Notice] If MongoDB is not running locally, please start mongod or provide a valid MONGODB_URI in backend/.env');
    return null;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed gracefully.');
  } catch (err) {
    console.error(`[Database Error] Error during disconnection: ${err.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
