// routes/income.js
const express = require('express');
const { getIncomes, addIncome, updateIncome, deleteIncome, importIncomes, exportIncomes } = require('../controllers/incomeController');
const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').get(protect, getIncomes).post(protect, addIncome);
router.route('/:id').put(protect, updateIncome).delete(protect, deleteIncome);
router.post('/import', protect, upload.single('file'), importIncomes);
router.get('/export', protect, exportIncomes);

module.exports = router;