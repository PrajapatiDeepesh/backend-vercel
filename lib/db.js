// backend/lib/db.js
const mongoose = require('mongoose');

let cached = global._mongoCache; // global to persist across invocations

if (!cached) {
  cached = global._mongoCache = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      // recommended options
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // optional: poolSize / serverSelectionTimeoutMS can be set here
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then(m => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectToDatabase;
