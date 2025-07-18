const express = require('express');
const Alert = require('../models/Alert');
const { verifyToken } = require('./auth');

const router = express.Router();

// Get alerts for doctors
router.get('/doctor', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const alerts = await Alert.find({ handled: false })
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get alerts for specific patient
router.get('/patient/:patientId', verifyToken, async (req, res) => {
  try {
    const alerts = await Alert.find({ patientId: req.params.patientId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark alert as handled
router.put('/:alertId/handle', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { notes } = req.body;
    
    const alert = await Alert.findByIdAndUpdate(
      req.params.alertId,
      {
        handled: true,
        handledBy: req.user.userId,
        handledAt: new Date(),
        notes: notes
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;