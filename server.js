// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// uploads directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// multer storage + file type validation
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, Date.now() + ext);
  }
});
const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp3'];
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// mongoose model
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const transcriptionSchema = new mongoose.Schema({
  filename: { type: String, default: null },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Transcription = mongoose.model('Transcription', transcriptionSchema);

// ROUTES

// Upload audio file
app.post('/api/upload', (req, res) => {
  upload.single('audio')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    try {
      const file = req.file;
      let text = '';

      if (req.body && req.body.text) {
        text = req.body.text;
      } else {
        text = 'Transcription pending (no server STT connected).';
      }

      const doc = await Transcription.create({
        filename: file ? file.filename : null,
        text
      });

      res.json({ success: true, transcription: doc });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error while uploading file.' });
    }
  });
});

// Save plain text transcription
app.post('/api/transcriptions', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });
    const doc = await Transcription.create({ text });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while saving transcription.' });
  }
});

// List transcriptions
app.get('/api/transcriptions', async (req, res) => {
  try {
    const list = await Transcription.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching transcriptions.' });
  }
});

// serve uploaded files
app.use('/uploads', express.static(uploadDir));

// global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  res.status(500).json({ error: 'Something went wrong. Please try again later.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Server running on port', PORT));
