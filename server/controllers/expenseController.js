// backend/controllers/expenseController.js
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const XLSX = require('xlsx');

exports.validateExpense = [
  body('date').isISO8601().toDate().withMessage('Invalid date format'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
];

exports.getExpenses = async (req, res) => {
  try {
    const { from, to, vendor, category } = req.query;
    const query = { user: req.user.id };
    if (from && to) {
      query.date = { $gte: new Date(from), $lte: new Date(to) };
    }
    if (vendor) query.recipient = vendor;
    if (category) query.category = category;
    const expenses = await Expense.find(query);
    res.json(expenses);
  } catch (error) {
    console.error('Get Expenses Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addExpense = [
  exports.validateExpense,
  async (req, res) => {
    console.log('=== ADD EXPENSE REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('User ID:', req.user?.id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    const { date, amount, category, recipient, paymentMethod, notes } = req.body;
    const invoice = req.file ? `/uploads/${req.file.filename}` : null;
    try {
      const expenseData = {
        date: new Date(date),
        amount: parseFloat(amount),
        category,
        recipient,
        paymentMethod,
        notes,
        invoice,
        user: req.user.id,
      };
      console.log('Creating expense with data:', expenseData);
      
      const expense = new Expense(expenseData);
      await expense.save();
      console.log('Expense saved successfully:', expense._id);
      res.status(201).json(expense);
    } catch (error) {
      console.error('Add Expense Error:', error.message);
      console.error('Full error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

exports.updateExpense = [
  exports.validateExpense,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { date, amount, category, recipient, paymentMethod, notes } = req.body;
    const invoice = req.file ? `/uploads/${req.file.filename}` : req.body.invoice;
    try {
      const expense = await Expense.findById(id);
      if (!expense || expense.user.toString() !== req.user.id) {
        return res.status(404).json({ message: 'Expense not found' });
      }
      expense.date = date ? new Date(date) : expense.date;
      expense.amount = amount ? parseFloat(amount) : expense.amount;
      expense.category = category || expense.category;
      expense.recipient = recipient || expense.recipient;
      expense.paymentMethod = paymentMethod || expense.paymentMethod;
      expense.notes = notes || expense.notes;
      expense.invoice = invoice || expense.invoice;
      await expense.save();
      res.json(expense);
    } catch (error) {
      console.error('Update Expense Error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

exports.deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await Expense.findById(id);
    if (!expense || expense.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Only allow deletion if user is admin OR it's their own expense
    if (req.user.role !== 'admin' && expense.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }
    
    await expense.deleteOne();
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete Expense Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.importExpenses = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const expenses = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Map Excel columns to expense fields
        const expense = new Expense({
          date: new Date(row.Date || row.date),
          amount: parseFloat(row.Amount || row.amount),
          category: row.Category || row.category,
          recipient: row.Recipient || row.recipient || '',
          paymentMethod: row['Payment Method'] || row.paymentMethod || '',
          notes: row.Notes || row.notes || '',
          user: req.user.id,
        });

        await expense.save();
        expenses.push(expense);
      } catch (error) {
        errors.push({ row: i + 1, error: error.message });
      }
    }

    res.json({
      message: `Imported ${expenses.length} expenses`,
      imported: expenses.length,
      errors: errors.length,
      errorDetails: errors
    });
  } catch (error) {
    console.error('Import Expenses Error:', error.message);
    res.status(500).json({ message: 'Import failed', error: error.message });
  }
};

exports.exportExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id });
    
    const data = expenses.map(exp => ({
      Date: exp.date.toISOString().split('T')[0],
      Amount: exp.amount,
      Category: exp.category,
      Recipient: exp.recipient,
      'Payment Method': exp.paymentMethod,
      Notes: exp.notes
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Export Expenses Error:', error.message);
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
};