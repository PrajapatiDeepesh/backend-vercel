// backend/api/index.js
require('dotenv').config(); // only used locally; on Vercel env vars set in dashboard
const express = require('express');
const serverless = require('serverless-http'); // optional but safe
const cors = require('cors');

const connectToDatabase = require('../lib/db');
const Item = require('../models/Item');

const app = express();
app.use(cors());
app.use(express.json());

// Connect once per cold-start (cached in lib/db.js)
connectToDatabase().catch(err => {
  console.error('MongoDB connection error:', err);
});

// simple root test
app.get('/', (req, res) => {
  res.send('✅ Backend running on Vercel');
});

// GET /api/items
app.get('/api/items', async (req, res) => {
  try {
    // ensure DB connected
    await connectToDatabase();
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/items
app.post('/api/items', async (req, res) => {
  try {
    await connectToDatabase();
    const { name, price, originalPrice } = req.body;
    const discountPercent = originalPrice
      ? Math.round((1 - price / originalPrice) * 100)
      : 0;
    const item = new Item({ name, price, originalPrice, discountPercent });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Export app for Vercel serverless
module.exports = app;
module.exports.handler = serverless(app);

// Allow local running for testing: `node api/index.js`
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectToDatabase()
    .then(() => {
      app.listen(PORT, () => console.log(`Local server listening on ${PORT}`));
    })
    .catch(err => console.error(err));
}
