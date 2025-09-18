// backend/api/index.js
require('dotenv').config(); // only for local dev
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const connectToDatabase = require('../lib/db');
const Item = require('../models/Item');

const app = express();
app.use(cors());
app.use(express.json());

// Connect once on cold start (lib/db caches connection)
connectToDatabase().catch(err => {
  console.error('MongoDB connection error (cold start):', err);
});

// Root test route
app.get('/', (req, res) => {
  res.send('✅ Backend running on Vercel');
});

// GET items
app.get('/api/items', async (req, res) => {
  try {
    await connectToDatabase();
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('GET /api/items error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST item
app.post('/api/items', async (req, res) => {
  try {
    await connectToDatabase();
    const { name, price, originalPrice } = req.body;
    if (!name || price == null) return res.status(400).json({ error: 'name and price required' });

    const discountPercent = originalPrice
      ? Math.round((1 - price / originalPrice) * 100)
      : 0;

    const item = new Item({ name, price, originalPrice: originalPrice || 0, discountPercent });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error('POST /api/items error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export for Vercel serverless
module.exports = app;
module.exports.handler = serverless(app);

// Allow local run with `node api/index.js`
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectToDatabase()
    .then(() => app.listen(PORT, () => console.log(`Local server listening on ${PORT}`)))
    .catch(err => {
      console.error('Failed to start local server:', err);
      process.exit(1);
    });
}
