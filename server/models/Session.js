const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'asl', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  confidence: Number, // For ASL messages
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const sessionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  status: {
    type: String,
    enum: ['active', 'ended', 'interrupted'],
    default: 'active'
  },
  messages: [messageSchema],
  alerts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  }],
  notes: String,
  diagnosis: String,
  recommendations: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Session', sessionSchema);