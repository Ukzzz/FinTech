// routes/vendors.js
const express = require('express');
const { getVendors, addVendor, updateVendor, deleteVendor } = require('../controllers/vendorController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getVendors).post(protect, addVendor);
router.route('/:id').put(protect, updateVendor).delete(protect, deleteVendor);

module.exports = router;