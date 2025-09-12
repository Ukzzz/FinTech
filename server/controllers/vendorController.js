// backend/controllers/vendorController.js
const { body, validationResult } = require('express-validator');
const Vendor = require('../models/Vendor');

exports.validateVendor = [
  body('name').notEmpty().withMessage('Name is required'),
  body('type').isIn(['vendor', 'customer']).withMessage('Type must be vendor or customer'),
  body('outstanding').isFloat({ min: 0 }).withMessage('Outstanding must be a positive number'),
];

exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ user: req.user.id });
    res.json(vendors);
  } catch (error) {
    console.error('Get Vendors Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addVendor = [
  exports.validateVendor,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, type, outstanding } = req.body;
    try {
      const vendor = new Vendor({ name, type, outstanding, user: req.user.id });
      await vendor.save();
      res.status(201).json(vendor);
    } catch (error) {
      console.error('Add Vendor Error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

exports.updateVendor = [
  exports.validateVendor,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { name, type, outstanding } = req.body;
    try {
      const vendor = await Vendor.findById(id);
      if (!vendor || vendor.user.toString() !== req.user.id) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      vendor.name = name || vendor.name;
      vendor.type = type || vendor.type;
      vendor.outstanding = outstanding !== undefined ? outstanding : vendor.outstanding;
      await vendor.save();
      res.json(vendor);
    } catch (error) {
      console.error('Update Vendor Error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

exports.deleteVendor = async (req, res) => {
  const { id } = req.params;
  try {
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    // Only allow deletion if user is admin OR it's their own vendor
    if (req.user.role !== 'admin' && vendor.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this vendor' });
    }
    
    await vendor.deleteOne();
    res.json({ message: 'Vendor deleted' });
  } catch (error) {
    console.error('Delete Vendor Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};