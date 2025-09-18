const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const connectToDatabase = require('../lib/db');
const Item = require('../models/Item');

const app = express();
app.use(cors());
app.use(express.json());

// test route
app.get('/', (req, res) => {
  res.send('✅ Backend running on Vercel');
});

// items routes
app.get('/api/items', async (req, res) => {
  await connectToDatabase();
  const items = await Item.find();
  res.json(items);
});

app.post('/api/items', async (req, res) => {
  await connectToDatabase();
  const { name, price, originalPrice } = req.body;
  const discountPercent = originalPrice
    ? Math.round((1 - price / originalPrice) * 100)
    : 0;
  const item = new Item({ name, price, originalPrice, discountPercent });
  await item.save();
  res.status(201).json(item);
});

// export for vercel
module.exports = app;
module.exports.handler = serverless(app);
