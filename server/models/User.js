const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['patient', 'doctor'],
    required: true
  },
  licenseNumber: {
    type: String,
    required: function() { return this.role === 'doctor'; }
  },
  specialization: {
    type: String,
    required: function() { return this.role === 'doctor'; }
  },
  medicalCertificates: [{
    filename: String,
    originalName: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    fileSize: Number,
    mimeType: String
  }],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);