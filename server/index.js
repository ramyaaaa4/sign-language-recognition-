const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();
// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const alertRoutes = require('./routes/alerts');

// Import socket handlers
//const socketHandlers = require('./socket/handlers');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      mediaSrc: ["'self'", "blob:"],
      connectSrc: ["'self'", "ws://localhost:*", "http://localhost:*"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect('mongodb://localhost:27017/healthcare_asl', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/alerts', alertRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
const activeUsers = new Map();
const activeSessions = new Map();

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Handle user registration
  socket.on('register_user', (userData) => {
    activeUsers.set(socket.id, {
      ...userData,
      socketId: socket.id,
      lastSeen: Date.now()
    });
    
    if (userData.role === 'doctor') {
      socket.join('doctors');
      // Notify all patients that a doctor is online
      socket.broadcast.emit('doctor_online', userData);
    } else {
      socket.join('patients');
    }
    
    console.log(`👨‍⚕️ ${userData.role} registered:`, userData.name);
  });

  // Handle patient request for doctor
  socket.on('request_doctor', (patientData) => {
    console.log('🔔 Patient requesting doctor:', patientData);
    // Send request to all online doctors
    socket.to('doctors').emit('patient_request', {
      ...patientData,
      socketId: socket.id,
      timestamp: Date.now()
    });
  });

  // Handle doctor accepting patient request
  socket.on('accept_patient', (data) => {
    const sessionId = `session_${Date.now()}`;
    
    // Get doctor and patient information from active users
    const doctorUser = activeUsers.get(socket.id);
    const patientUser = activeUsers.get(data.patientSocketId);
    
    if (!patientUser) {
      console.error('Cannot find patient with socket ID:', data.patientSocketId);
      socket.emit('error', { message: 'Patient is no longer connected' });
      return;
    }
    
    // Create and store session
    activeSessions.set(sessionId, {
      doctor: doctorUser,
      patient: patientUser,
      sessionId,
      startTime: Date.now()
    });

    // Update user data with current session
    if (doctorUser) {
      doctorUser.currentSession = sessionId;
      activeUsers.set(socket.id, doctorUser);
    }
    
    if (patientUser) {
      patientUser.currentSession = sessionId;
      activeUsers.set(data.patientSocketId, patientUser);
    }

    // Join both users to session room
    socket.join(sessionId);
    
    // Make patient join session room
    const patientSocket = io.sockets.sockets.get(data.patientSocketId);
    if (patientSocket) {
      patientSocket.join(sessionId);
    }
    
    // Notify patient that session started
    io.to(data.patientSocketId).emit('session_started', {
      sessionId,
      doctor: {
        id: doctorUser?.userId,
        name: doctorUser?.name,
        role: doctorUser?.role,
        specialization: doctorUser?.specialization
      }
    });
    
    // Notify doctor that session was created
    socket.emit('session_created', {
      sessionId,
      patient: {
        id: patientUser?.userId,
        name: patientUser?.name,
        role: patientUser?.role
      }
    });
    
    // Send system message to both users
    const systemMessage = {
      type: 'system',
      message: `Communication session started between Dr. ${doctorUser?.name} and ${patientUser?.name}`,
      timestamp: Date.now(),
      sessionId
    };
    
    io.to(sessionId).emit('system_message', systemMessage);
    
    console.log('🤝 Session started:', sessionId);
  });

  // Handle ASL recognition results
  socket.on('asl_recognition', (data) => {
    const user = activeUsers.get(socket.id);
    if (user && user.currentSession) {
      // Broadcast to session participants
      socket.to(user.currentSession).emit('asl_message', {
        type: 'asl',
        message: data.text,
        confidence: data.confidence,
        timestamp: Date.now(),
        sender: user
      });
    }
  });

  // Handle text messages
  socket.on('send_message', (data) => {
    const user = activeUsers.get(socket.id);
    if (user && data.sessionId) {
      socket.to(data.sessionId).emit('new_message', {
        type: 'text',
        message: data.message,
        timestamp: Date.now(),
        sender: user
      });
    }
  });

  // Handle emergency alerts
  socket.on('emergency_alert', (alertData) => {
    const user = activeUsers.get(socket.id);
    console.log('🚨 Emergency alert:', alertData);
    
    // Send to all doctors immediately
    socket.to('doctors').emit('emergency_alert', {
      ...alertData,
      patient: user,
      timestamp: Date.now()
    });

    // Store alert in database
    const Alert = require('./models/Alert');
    const alert = new Alert({
      patientId: user?.userId,
      type: alertData.type,
      emotion: alertData.emotion,
      confidence: alertData.confidence,
      message: alertData.message,
      timestamp: new Date()
    });
    alert.save().catch(err => console.error('Alert save error:', err));
  });

  // Handle session updates
  socket.on('join_session', (sessionId) => {
    socket.join(sessionId);
    const user = activeUsers.get(socket.id);
    
    if (user) {
      // Update user's current session
      user.currentSession = sessionId;
      activeUsers.set(socket.id, user);
      
      // Notify all session participants about this user
      socket.to(sessionId).emit('session_participant_info', {
        userId: user.userId,
        name: user.name,
        role: user.role,
        specialization: user.specialization,
        timestamp: Date.now()
      });
      
      // Get session info
      const session = activeSessions.get(sessionId);
      
      // If session exists, emit session info to the joining user
      if (session) {
        // Determine the remote user for this participant
        const remoteUser = user.role === 'doctor' ? session.patient : session.doctor;
        
        if (remoteUser) {
          socket.emit('session_participant_info', {
            userId: remoteUser.userId,
            name: remoteUser.name,
            role: remoteUser.role,
            specialization: remoteUser.specialization,
            timestamp: Date.now()
          });
        }
      }
      
      console.log(`👤 ${user.name} (${user.role}) joined session: ${sessionId}`);
    }
  });
  
  // Handle ending a session
  socket.on('end_session', (sessionId) => {
    const user = activeUsers.get(socket.id);
    const session = activeSessions.get(sessionId);
    
    if (user && session) {
      // Notify all participants that the session is ending
      io.to(sessionId).emit('session_ended', {
        endedBy: {
          userId: user.userId,
          name: user.name,
          role: user.role
        },
        timestamp: Date.now()
      });
      
      // Clear session data
      activeSessions.delete(sessionId);
      
      // Update user data
      if (user) {
        user.currentSession = null;
        activeUsers.set(socket.id, user);
      }
      
      // Update the other participant's session status
      const otherParticipantId = user.role === 'doctor' ? 
        session.patient?.socketId : 
        session.doctor?.socketId;
      
      if (otherParticipantId) {
        const otherUser = activeUsers.get(otherParticipantId);
        if (otherUser) {
          otherUser.currentSession = null;
          activeUsers.set(otherParticipantId, otherUser);
        }
      }
      
      console.log(`🔚 Session ended: ${sessionId} by ${user.name} (${user.role})`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      console.log(`👋 ${user.role} disconnected:`, user.name);
      
      // Notify session participants
      if (user.currentSession) {
        socket.to(user.currentSession).emit('user_disconnected', user);
        // Remove session if no participants
        activeSessions.delete(user.currentSession);
      }
      
      // Notify role group
      if (user.role === 'doctor') {
        socket.broadcast.emit('doctor_offline', user);
      }
    }
    
    activeUsers.delete(socket.id);
  });

  // Handle heartbeat
  socket.on('heartbeat', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      user.lastSeen = Date.now();
      activeUsers.set(socket.id, user);
    }
  });
});

// Cleanup inactive users periodically
setInterval(() => {
  const now = Date.now();
  for (const [socketId, user] of activeUsers.entries()) {
    if (now - user.lastSeen > 300000) { // 5 minutes
      activeUsers.delete(socketId);
    }
  }
}, 60000); // Check every minute

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Healthcare ASL Server running on port ${PORT}`);
});

module.exports = { app, io };