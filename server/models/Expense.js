// models/Expense.js
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  recipient: { type: String },
  paymentMethod: { type: String },
  notes: { type: String },
  invoice: { type: String }, // Path to uploaded file
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);