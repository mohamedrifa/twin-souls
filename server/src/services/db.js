const mongoose = require('mongoose');

let mongoMemoryServerInstance = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to provided MONGODB_URI...');
      await mongoose.connect(uri);
      console.log('Connected successfully to MongoDB Atlas / remote MongoDB database.');
      return;
    } catch (err) {
      console.error('Failed to connect to provided MONGODB_URI:', err.message);
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.log('Falling back to local in-memory MongoDB server for testing/development...');
    }
  } else {
    console.log('No MONGODB_URI provided in environment. Initializing MongoMemoryServer...');
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServerInstance = await MongoMemoryServer.create();
    const memUri = mongoMemoryServerInstance.getUri();
    await mongoose.connect(memUri);
    console.log('Connected to embedded MongoMemoryServer at:', memUri);
  } catch (memErr) {
    console.error('Could not start MongoMemoryServer:', memErr.message);
    throw memErr;
  }
}

async function closeDB() {
  await mongoose.disconnect();
  if (mongoMemoryServerInstance) {
    await mongoMemoryServerInstance.stop();
  }
}

module.exports = { connectDB, closeDB };
