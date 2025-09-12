// routes/expenses.js
const express = require('express');
const { getExpenses, addExpense, updateExpense, deleteExpense, importExpenses, exportExpenses } = require('../controllers/expenseController');
const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').get(protect, getExpenses).post(protect, upload.single('invoice'), addExpense);
router.post('/import', protect, upload.single('file'), importExpenses);
router.get('/export', protect, exportExpenses);
router.route('/:id').put(protect, upload.single('invoice'), updateExpense).delete(protect, deleteExpense);

module.exports = router;