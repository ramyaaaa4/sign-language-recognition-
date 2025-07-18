const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { verifyToken } = require('./auth');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadsDir, req.user.userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'medical-cert-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common medical document formats
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only medical document formats are allowed (JPEG, PNG, PDF, DOC, DOCX)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Upload medical certificate
router.post('/medical-certificate', verifyToken, upload.single('certificate'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add certificate to user's records
    const certificate = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      uploadDate: new Date(),
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    };

    user.medicalCertificates.push(certificate);
    await user.save();

    res.json({
      message: 'Medical certificate uploaded successfully',
      certificate: certificate
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// Get user's medical certificates
router.get('/medical-certificates', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('medicalCertificates');
    res.json(user.medicalCertificates || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Download medical certificate
router.get('/medical-certificate/:filename', verifyToken, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, req.user.userId, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Verify user owns this file
    const user = await User.findById(req.user.userId);
    const certificate = user.medicalCertificates.find(cert => cert.filename === filename);
    
    if (!certificate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.download(filePath, certificate.originalName);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete medical certificate
router.delete('/medical-certificate/:filename', verifyToken, async (req, res) => {
  try {
    const filename = req.params.filename;
    const user = await User.findById(req.user.userId);

    // Remove from user records
    user.medicalCertificates = user.medicalCertificates.filter(
      cert => cert.filename !== filename
    );
    await user.save();

    // Delete physical file
    const filePath = path.join(uploadsDir, req.user.userId, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Medical certificate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during deletion' });
  }
});

module.exports = router;