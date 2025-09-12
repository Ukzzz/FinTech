// backend/controllers/incomeController.js
const { body, validationResult } = require('express-validator');
const Income = require('../models/Income');
const XLSX = require('xlsx');

exports.validateIncome = [
  body('date').isISO8601().toDate().withMessage('Invalid date format'),
  body('source').notEmpty().withMessage('Source is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
];

exports.getIncomes = async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = { user: req.user.id };
    if (from && to) {
      query.date = { $gte: new Date(from), $lte: new Date(to) };
    }
    const incomes = await Income.find(query);
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addIncome = [
  exports.validateIncome,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { date, source, amount, paymentMethod, notes, recurring } = req.body;
    try {
      const income = new Income({
        date,
        source,
        amount,
        paymentMethod,
        notes,
        recurring,
        user: req.user.id,
      });
      await income.save();
      res.status(201).json(income);
    } catch (error) {
      console.error('Add Income Error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

exports.updateIncome = [
  exports.validateIncome,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { date, source, amount, paymentMethod, notes, recurring } = req.body;
    try {
      const income = await Income.findById(id);
      if (!income || income.user.toString() !== req.user.id) {
        return res.status(404).json({ message: 'Income not found' });
      }
      income.date = date || income.date;
      income.source = source || income.source;
      income.amount = amount || income.amount;
      income.paymentMethod = paymentMethod || income.paymentMethod;
      income.notes = notes || income.notes;
      income.recurring = recurring !== undefined ? recurring : income.recurring;
      await income.save();
      res.json(income);
    } catch (error) {
      console.error('Update Income Error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

exports.deleteIncome = async (req, res) => {
  const { id } = req.params;
  try {
    const income = await Income.findById(id);
    if (!income || income.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Income not found' });
    }
    
    // Only allow deletion if user is admin OR it's their own income
    if (req.user.role !== 'admin' && income.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this income' });
    }
    
    await income.deleteOne();
    res.json({ message: 'Income deleted' });
  } catch (error) {
    console.error('Delete Income Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.importIncomes = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const incomes = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const income = new Income({
          date: new Date(row.Date || row.date),
          source: row.Source || row.source,
          amount: parseFloat(row.Amount || row.amount),
          paymentMethod: row['Payment Method'] || row.paymentMethod || '',
          notes: row.Notes || row.notes || '',
          recurring: Boolean(row.Recurring || row.recurring),
          user: req.user.id,
        });

        await income.save();
        incomes.push(income);
      } catch (error) {
        errors.push({ row: i + 1, error: error.message });
      }
    }

    res.json({
      message: `Imported ${incomes.length} income records`,
      imported: incomes.length,
      errors: errors.length,
      errorDetails: errors
    });
  } catch (error) {
    console.error('Import Income Error:', error.message);
    res.status(500).json({ message: 'Import failed', error: error.message });
  }
};

exports.exportIncomes = async (req, res) => {
  try {
    const incomes = await Income.find({ user: req.user.id });
    
    const data = incomes.map(inc => ({
      Date: inc.date.toISOString().split('T')[0],
      Source: inc.source,
      Amount: inc.amount,
      'Payment Method': inc.paymentMethod,
      Notes: inc.notes,
      Recurring: inc.recurring
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Income');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=income.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Export Income Error:', error.message);
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
};