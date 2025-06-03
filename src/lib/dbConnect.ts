import mongoose from 'mongoose';

// Cached connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  try {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000, // Timeout auf 10 Sekunden erhöhen
        connectTimeoutMS: 10000,
      };

      const MONGODB_URI = process.env.MONGODB_URI;

      if (!MONGODB_URI) {
        throw new Error(
          'Bitte definiere die MONGODB_URI-Umgebungsvariable'
        );
      }

      console.log('Verbindung zur Datenbank wird hergestellt...');
      cached.promise = mongoose.connect(MONGODB_URI, opts)
        .then((mongoose) => {
          console.log('Erfolgreich mit MongoDB verbunden');
          return mongoose;
        })
        .catch((error) => {
          console.error('Fehler bei der MongoDB-Verbindung:', error);
          // Promise-Cache zurücksetzen, damit beim nächsten Aufruf ein neuer Versuch unternommen wird
          cached.promise = null;
          throw error;
        });
    }
    
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('Schwerwiegender Fehler bei der Datenbankverbindung:', error);
    // Cache komplett zurücksetzen bei Verbindungsproblemen
    cached = global.mongoose = { conn: null, promise: null };
    throw error;
  }
}

export default dbConnect;
