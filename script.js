// Global variables
let currentUser = null;
let currentSession = null;
let localStream = null;
let aslModel = null;
let isASLActive = false;
let recognizedSigns = [];
let lastPrediction = null;

// Mock database of doctors
const mockDoctors = [
    { id: 1, name: "Dr. Sarah Johnson", specialization: "Cardiology", available: true },
    { id: 2, name: "Dr. Michael Chen", specialization: "Neurology", available: true },
    { id: 3, name: "Dr. Emily Rodriguez", specialization: "General Medicine", available: true },
    { id: 4, name: "Dr. David Kim", specialization: "Pediatrics", available: true }
];

// ASL vocabulary mapping
const aslVocabulary = {
    0: 'HELLO', 1: 'THANK', 2: 'PLEASE', 3: 'YES', 4: 'NO', 5: 'HELP',
    6: 'PAIN', 7: 'HURT', 8: 'SICK', 9: 'DOCTOR', 10: 'NURSE', 11: 'MEDICINE',
    12: 'EMERGENCY', 13: 'WATER', 14: 'FOOD', 15: 'BATHROOM', 16: 'HOT', 17: 'COLD',
    18: 'MORE', 19: 'STOP', 20: 'GOOD', 21: 'BAD', 22: 'TIRED', 23: 'SLEEP'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard(currentUser.role);
    } else {
        showPage('loginPage');
    }
    
    // Load TensorFlow.js model (mock for demo)
    loadASLModel();
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout buttons
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('doctorLogoutBtn').addEventListener('click', handleLogout);
    
    // Start session button
    document.getElementById('startSessionBtn').addEventListener('click', handleStartSession);
    
    // End session button
    document.getElementById('endSessionBtn').addEventListener('click', handleEndSession);
    
    // ASL toggle button
    document.getElementById('toggleASLBtn').addEventListener('click', toggleASLDetection);
    
    // Send sign button
    document.getElementById('sendSignBtn').addEventListener('click', sendRecognizedSign);
    
    // Chat input
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    
    // File upload
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.querySelector('.btn-secondary').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    // Drag and drop
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleFileDrop);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const role = formData.get('role');
    
    // Mock authentication
    if ((email === 'patient@demo.com' || email === 'doctor@demo.com') && password === 'demo123') {
        currentUser = {
            id: Date.now(),
            name: role === 'patient' ? 'John Patient' : 'Dr. Smith',
            email: email,
            role: role,
            specialization: role === 'doctor' ? 'General Medicine' : null
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showDashboard(role);
    } else {
        alert('Invalid credentials. Use demo accounts.');
    }
}

function handleLogout() {
    currentUser = null;
    currentSession = null;
    localStorage.removeItem('currentUser');
    
    // Stop any active streams
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    showPage('loginPage');
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showDashboard(role) {
    if (role === 'patient') {
        document.getElementById('patientName').textContent = currentUser.name;
        showPage('patientDashboard');
    } else {
        document.getElementById('doctorName').textContent = currentUser.name;
        showPage('doctorDashboard');
        loadPatientRequests();
    }
}

async function handleStartSession() {
    if (currentUser.role !== 'patient') return;
    
    showLoadingOverlay('Connecting to doctor...');
    
    // Simulate finding an available doctor
    setTimeout(() => {
        const availableDoctor = mockDoctors.find(doc => doc.available);
        if (availableDoctor) {
            currentSession = {
                id: 'session_' + Date.now(),
                patient: currentUser,
                doctor: availableDoctor,
                startTime: Date.now()
            };
            
            hideLoadingOverlay();
            startVideoSession();
        } else {
            hideLoadingOverlay();
            alert('No doctors available at the moment. Please try again later.');
        }
    }, 2000);
}

async function startVideoSession() {
    showPage('videoSession');
    
    // Update UI
    document.getElementById('remoteUserLabel').textContent = 
        currentUser.role === 'patient' ? currentSession.doctor.name : currentSession.patient.name;
    
    // Enable chat for doctors
    if (currentUser.role === 'doctor') {
        document.getElementById('messageInput').disabled = false;
        document.getElementById('sendMessageBtn').disabled = false;
    }
    
    // Start webcam for patients
    if (currentUser.role === 'patient') {
        await startWebcam();
        // Auto-enable ASL detection
        setTimeout(() => {
            toggleASLDetection();
        }, 1000);
    }
    
    // Add welcome message
    addChatMessage('system', 'Session started. You can now communicate.');
}

async function startWebcam() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: false
        });
        
        const video = document.getElementById('localVideo');
        video.srcObject = localStream;
        
        return true;
    } catch (error) {
        console.error('Error accessing webcam:', error);
        alert('Could not access webcam. Please check permissions.');
        return false;
    }
}

async function loadASLModel() {
    try {
        // Mock model loading - in production, load actual TensorFlow.js model
        console.log('Loading ASL model...');
        
        // Simulate model loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create mock model
        aslModel = {
            predict: (tensor) => {
                // Mock prediction - return random sign
                const randomIndex = Math.floor(Math.random() * Object.keys(aslVocabulary).length);
                const confidence = Math.random();
                return {
                    sign: aslVocabulary[randomIndex],
                    confidence: confidence
                };
            }
        };
        
        console.log('ASL model loaded successfully');
    } catch (error) {
        console.error('Error loading ASL model:', error);
    }
}

function toggleASLDetection() {
    const toggleBtn = document.getElementById('toggleASLBtn');
    const sendBtn = document.getElementById('sendSignBtn');
    
    if (!isASLActive) {
        isASLActive = true;
        toggleBtn.textContent = 'Stop ASL';
        toggleBtn.classList.add('active');
        sendBtn.disabled = false;
        startASLDetection();
    } else {
        isASLActive = false;
        toggleBtn.textContent = 'Start ASL';
        toggleBtn.classList.remove('active');
        sendBtn.disabled = true;
        stopASLDetection();
    }
}

function startASLDetection() {
    if (!localStream || !aslModel) return;
    
    const video = document.getElementById('localVideo');
    const canvas = document.getElementById('detectionCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    function detectSigns() {
        if (!isASLActive) return;
        
        // Draw detection box
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        
        const boxSize = 200;
        const x = (canvas.width - boxSize) / 2;
        const y = (canvas.height - boxSize) / 2;
        
        ctx.strokeRect(x, y, boxSize, boxSize);
        
        // Mock prediction every 2 seconds
        if (Math.random() > 0.7) { // 30% chance of detection
            const prediction = aslModel.predict();
            updateASLPrediction(prediction);
        }
        
        // Continue detection
        setTimeout(detectSigns, 500);
    }
    
    detectSigns();
}

function stopASLDetection() {
    const canvas = document.getElementById('detectionCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Clear current prediction
    document.getElementById('currentSign').textContent = 'No sign detected';
    document.getElementById('confidence').textContent = 'Confidence: 0%';
}

function updateASLPrediction(prediction) {
    lastPrediction = prediction;
    
    // Update UI
    document.getElementById('currentSign').textContent = prediction.sign;
    document.getElementById('confidence').textContent = 
        `Confidence: ${(prediction.confidence * 100).toFixed(1)}%`;
    
    // Add to recognized signs if confidence is high enough
    if (prediction.confidence > 0.6) {
        addRecognizedSign(prediction);
    }
}

function addRecognizedSign(prediction) {
    const container = document.getElementById('recognizedSigns');
    
    // Remove old signs (keep only last 5)
    while (container.children.length >= 5) {
        container.removeChild(container.firstChild);
    }
    
    const signElement = document.createElement('div');
    signElement.className = 'sign-item';
    signElement.innerHTML = `
        <span class="sign-text">${prediction.sign}</span>
        <span class="sign-confidence">${(prediction.confidence * 100).toFixed(1)}%</span>
    `;
    
    container.appendChild(signElement);
    recognizedSigns.push(prediction);
}

function sendRecognizedSign() {
    if (!lastPrediction || recognizedSigns.length === 0) return;
    
    const signText = recognizedSigns.map(sign => sign.sign).join(' ');
    addChatMessage('asl', signText);
    
    // Clear recognized signs
    document.getElementById('recognizedSigns').innerHTML = '';
    recognizedSigns = [];
    
    // Simulate doctor response
    setTimeout(() => {
        const responses = [
            "I understand. Can you tell me more about that?",
            "Thank you for letting me know. How long have you been experiencing this?",
            "I see. Are there any other symptoms?",
            "That's helpful information. Let me ask you a few more questions."
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addChatMessage('received', randomResponse);
    }, 2000);
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage('sent', message);
    input.value = '';
    
    // Simulate patient response for doctors
    if (currentUser.role === 'doctor') {
        setTimeout(() => {
            const responses = [
                "PAIN HEAD",
                "HELP PLEASE",
                "THANK YOU DOCTOR",
                "YES UNDERSTAND"
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            addChatMessage('asl', randomResponse);
        }, 1500);
    }
}

function addChatMessage(type, content) {
    const container = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    
    let className = 'message ';
    if (type === 'sent') {
        className += 'sent';
    } else if (type === 'asl') {
        className += 'received asl';
    } else if (type === 'system') {
        className += 'received';
    } else {
        className += 'received';
    }
    
    messageDiv.className = className;
    messageDiv.innerHTML = `
        <div class="message-bubble">${content}</div>
        <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function handleEndSession() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    isASLActive = false;
    currentSession = null;
    
    showDashboard(currentUser.role);
}

function loadPatientRequests() {
    // Mock patient requests for doctors
    const requestsContainer = document.getElementById('patientRequests');
    
    // Simulate some pending requests
    const mockRequests = [
        { id: 1, name: 'Sarah Johnson', time: '2 minutes ago', urgent: false },
        { id: 2, name: 'Michael Brown', time: '5 minutes ago', urgent: true },
        { id: 3, name: 'Emily Davis', time: '8 minutes ago', urgent: false }
    ];
    
    requestsContainer.innerHTML = '';
    
    if (mockRequests.length === 0) {
        requestsContainer.innerHTML = '<p>No pending patient requests</p>';
        return;
    }
    
    mockRequests.forEach(request => {
        const requestDiv = document.createElement('div');
        requestDiv.className = 'request-item';
        requestDiv.innerHTML = `
            <div class="request-info">
                <div class="request-avatar">👤</div>
                <div class="request-details">
                    <h4>${request.name} ${request.urgent ? '🚨' : ''}</h4>
                    <p>Requested ${request.time}</p>
                </div>
            </div>
            <button class="btn-accept" onclick="acceptPatientRequest(${request.id})">
                Accept Request
            </button>
        `;
        requestsContainer.appendChild(requestDiv);
    });
    
    // Update stats
    document.getElementById('pendingRequests').textContent = mockRequests.length;
    document.getElementById('emergencyAlerts').textContent = mockRequests.filter(r => r.urgent).length;
}

function acceptPatientRequest(requestId) {
    // Simulate accepting a patient request
    currentSession = {
        id: 'session_' + Date.now(),
        patient: { id: requestId, name: 'Patient ' + requestId },
        doctor: currentUser,
        startTime: Date.now()
    };
    
    startVideoSession();
}

function handleFileUpload(e) {
    const files = e.target.files;
    if (files.length > 0) {
        Array.from(files).forEach(file => {
            console.log('Uploaded file:', file.name);
            // In a real app, you would upload to server
            alert(`File "${file.name}" uploaded successfully!`);
        });
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#667eea';
}

function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#d1d5db';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        Array.from(files).forEach(file => {
            console.log('Dropped file:', file.name);
            alert(`File "${file.name}" uploaded successfully!`);
        });
    }
}

function showLoadingOverlay(text) {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// Utility functions
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
}

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Auto-connect patients to doctors when they request
function autoConnectToDoctor() {
    const availableDoctor = mockDoctors.find(doc => doc.available);
    if (availableDoctor) {
        return availableDoctor;
    }
    return null;
}

// Simulate real-time updates for doctors
setInterval(() => {
    if (currentUser && currentUser.role === 'doctor') {
        // Randomly add new patient requests
        if (Math.random() > 0.95) { // 5% chance every second
            loadPatientRequests();
        }
    }
}, 1000);

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && localStream) {
        // Pause video when tab is not visible
        localStream.getVideoTracks().forEach(track => {
            track.enabled = false;
        });
    } else if (!document.hidden && localStream) {
        // Resume video when tab becomes visible
        localStream.getVideoTracks().forEach(track => {
            track.enabled = true;
        });
    }
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    // In production, you might want to send errors to a logging service
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
});