// models/Income.js
const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  source: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String },
  notes: { type: String },
  recurring: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Income', incomeSchema);