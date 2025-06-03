import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global variable to track the connection status
 */
let isConnected = false;

/**
 * Connect to MongoDB using Mongoose
 */
export async function connectToDatabase() {
  if (isConnected) {
    // Reuse existing connection if already connected
    return;
  }

  try {
    // Connect to MongoDB
    const db = await mongoose.connect(MONGODB_URI);
    
    isConnected = db.connections[0].readyState === 1; // 1 = connected
    
    console.log('MongoDB connected successfully');
    
    // Get the default connection
    const connection = mongoose.connection;
    
    // Bind connection to error event (to get notification of connection errors)
    connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    // Log when connection is disconnected
    connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
    // Return the connection
    return connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectFromDatabase() {
  if (!isConnected) {
    return;
  }
  
  await mongoose.disconnect();
  isConnected = false;
  console.log('MongoDB disconnected');
}
