const express = require('express');
const User = require('../models/User');
const { verifyToken } = require('./auth');

const router = express.Router();

// Get online doctors (for patients)
router.get('/doctors/online', verifyToken, async (req, res) => {
  try {
    const doctors = await User.find({
      role: 'doctor',
      isOnline: true
    }).select('name specialization licenseNumber lastSeen');

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, emergencyContact } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, emergencyContact },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;