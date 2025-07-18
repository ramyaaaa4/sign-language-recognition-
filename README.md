# Healthcare ASL Interpreter - Complete Web Application

A real-time sign language interpreter web application that connects patients and doctors for medical communication. Patients communicate through sign language, which gets converted to text and sent to doctors. Doctors respond in text format back to patients.

## 🏥 Features

### Patient Features
- **Real-time ASL Recognition**: CNN-based sign language detection using TensorFlow.js
- **Emotion Recognition**: Facial expression recognition for emergency detection
- **Doctor Request System**: Request communication with available doctors
- **Medical Certificate Upload**: Secure document management
- **Emergency Alerts**: Automatic alerts for critical emotions
- **Real-time Chat**: Converted sign language text sent to doctors

### Doctor Features
- **Patient Request Management**: Accept and manage patient requests
- **Emergency Alert System**: Immediate notifications for patient distress
- **Real-time Communication**: Receive ASL messages and respond in text
- **Medical Document Viewer**: Access patient certificates and reports
- **Session Management**: Track active sessions and patient status

### Technical Features
- **Real-time WebSocket Communication**: Instant messaging between users
- **AI/ML Integration**: TensorFlow.js for browser-based model inference
- **Secure Authentication**: JWT-based user authentication
- **File Upload System**: Secure medical document handling
- **Responsive Design**: Works on desktop and mobile devices
- **Production Ready**: Complete with error handling and security measures

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Modern web browser with camera access

### Installation

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd healthcare-asl-interpreter
npm install
```

2. **Set Up MongoDB**
- Install MongoDB locally or use MongoDB Atlas
- Default connection: `mongodb://localhost:27017/healthcare_asl`

3. **Start the Application**
```bash
npm run dev
```

This will start both the backend server (port 3001) and frontend (port 5173).

4. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 👥 User Accounts

### Demo Accounts (for testing)

**Patient Account:**
- Email: patient@demo.com
- Password: demo123

**Doctor Account:**
- Email: doctor@demo.com
- Password: demo123

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Authentication**: Context-based auth with JWT tokens
- **Real-time Communication**: Socket.IO client for WebSocket connections
- **AI/ML Processing**: TensorFlow.js for browser-based ASL recognition
- **UI Framework**: Tailwind CSS with custom healthcare-focused design
- **Routing**: React Router for navigation between dashboards

### Backend (Node.js + Express)
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Real-time Communication**: Socket.IO server for WebSocket handling
- **Database**: MongoDB with Mongoose ODM
- **File Upload**: Multer for medical certificate handling
- **Security**: Helmet, CORS, rate limiting, and input validation

### Database Schema
- **Users**: Patient and doctor profiles with authentication
- **Sessions**: Communication session tracking and message history
- **Alerts**: Emergency alert system with severity levels
- **Medical Documents**: Secure file storage and metadata

## 🤖 AI/ML Models

### ASL Recognition (TensorFlow.js)
- **Input**: Real-time webcam video frames (64x64 grayscale)
- **Architecture**: CNN with Conv2D, MaxPooling, and Dense layers
- **Vocabulary**: Medical terms (HELP, PAIN, DOCTOR, MEDICINE, etc.)
- **Performance**: Real-time processing with 1-2 second delay

### Emotion Recognition
- **Input**: Facial landmarks from video frames
- **Detection**: Happy, sad, angry, fear, surprise, disgust, neutral
- **Emergency Triggers**: Fear, pain, distress, anxiety (>70% confidence)
- **Alerts**: Automatic notifications to doctors for critical emotions

## 🔐 Security Features

- **HIPAA Compliance Considerations**: Secure data handling patterns
- **Encrypted Communication**: All WebSocket messages encrypted
- **Secure File Upload**: Medical certificate validation and storage
- **JWT Authentication**: Secure session management
- **Rate Limiting**: API protection against abuse
- **Input Validation**: All user inputs sanitized

## 📱 Responsive Design

- **Mobile First**: Touch-friendly interface for all devices
- **Tablet Optimized**: Medium screen layouts with proper spacing
- **Desktop Full-Featured**: Complete dashboard experience
- **Cross-browser Compatible**: Works on Chrome, Firefox, Safari, Edge

## 🔧 Development

### Environment Variables
Create a `.env` file in the server directory:

```env
JWT_SECRET=your_jwt_secret_key
MONGODB_URI=mongodb://localhost:27017/healthcare_asl
PORT=3001
NODE_ENV=development
```

### Project Structure
```
healthcare-asl-interpreter/
├── server/                 # Backend Node.js application
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── socket/            # WebSocket handlers
│   └── uploads/           # File storage
├── src/                   # Frontend React application
│   ├── components/        # React components
│   ├── context/           # React contexts
│   ├── hooks/             # Custom hooks
│   └── styles/            # CSS and styling
└── public/                # Static assets
```

### Available Scripts

```bash
# Development (runs both frontend and backend)
npm run dev

# Frontend only
npm run client

# Backend only
npm run server

# Build for production
npm run build

# Lint code
npm run lint
```

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy the 'dist' folder to your web server
```

### Backend Deployment
1. Set up MongoDB (Atlas recommended for production)
2. Configure environment variables
3. Deploy to your Node.js hosting platform
4. Ensure WebSocket support is enabled

### Production Considerations
- Use HTTPS for all communications
- Configure proper CORS settings
- Set up monitoring and logging
- Implement backup strategies
- Configure load balancing for scale

## 🏥 Medical Vocabulary

The system recognizes these medical signs:
- **Basic**: HELLO, THANK, PLEASE, YES, NO
- **Medical**: HELP, PAIN, HURT, SICK, DOCTOR, NURSE, MEDICINE
- **Emergency**: EMERGENCY, URGENT, CALL
- **Body Parts**: HEAD, CHEST, STOMACH, BACK, ARM, LEG
- **Actions**: EAT, DRINK, SLEEP, WALK, SIT

## 📊 Monitoring & Analytics

### Real-time Metrics
- Active users and sessions
- ASL recognition accuracy
- Emergency alert frequency
- Response times
- System performance

### Healthcare Insights
- Patient communication patterns
- Doctor response efficiency
- Emergency situation trends
- Technology usage statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions about implementation:
- Review the documentation in `/docs`
- Check the issues section
- Contact the development team

## 🎯 Future Enhancements

- [ ] Advanced AI models for better accuracy
- [ ] Multi-language sign language support
- [ ] Voice-to-text for doctors
- [ ] Mobile app versions
- [ ] Integration with EHR systems
- [ ] Telemedicine platform integration
- [ ] Advanced analytics dashboard

---

**Built for Healthcare Communication** 🏥 **Powered by AI** 🤖 **Accessible to All** ♿