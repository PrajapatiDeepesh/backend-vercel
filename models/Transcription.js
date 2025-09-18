// backend/models/Transcription.js
const mongoose = require("mongoose");

const TranscriptionSchema = new mongoose.Schema({
  filename: { type: String },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transcription", TranscriptionSchema);
