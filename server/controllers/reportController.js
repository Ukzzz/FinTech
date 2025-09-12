// controllers/reportController.js
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Vendor = require('../models/Vendor');

exports.getReport = async (req, res) => {
  const { type } = req.query; // daily, monthly, yearly
  const userId = req.user.id;
  let startDate, endDate;

  const now = new Date();
  if (type === 'daily') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (type === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (type === 'yearly') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    return res.status(400).json({ message: 'Invalid type' });
  }

  try {
    const expenses = await Expense.find({ user: userId, date: { $gte: startDate, $lte: endDate } });
    const incomes = await Income.find({ user: userId, date: { $gte: startDate, $lte: endDate } });
    const vendors = await Vendor.find({ user: userId });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    // Category breakdown
    const categoryBreakdown = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    // Vendor breakdown (assuming recipient is vendor name)
    const vendorBreakdown = expenses.reduce((acc, exp) => {
      if (exp.recipient) {
        acc[exp.recipient] = (acc[exp.recipient] || 0) + exp.amount;
      }
      return acc;
    }, {});

    res.json({
      totalIncome,
      totalExpenses,
      netProfit,
      categoryBreakdown,
      vendorBreakdown,
    });
  } catch (error) {
    console.error('Get Report Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
