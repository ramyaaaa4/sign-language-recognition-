const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['emotion', 'sign', 'emergency'],
    required: true
  },
  emotion: {
    type: String,
    enum: ['angry', 'fear', 'sad', 'pain', 'distress']
  },
  recognizedSign: String,
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  message: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  handled: {
    type: Boolean,
    default: false
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  handledAt: Date,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Alert', alertSchema);