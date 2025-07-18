import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Camera, Square, Zap, AlertTriangle, Activity } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export default function VideoCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { socket } = useSocket();
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [prediction, setPrediction] = useState<{text: string, confidence: number} | null>(null);
  const [emotion, setEmotion] = useState<{emotion: string, confidence: number} | null>(null);
  const [fps, setFps] = useState(0);
  const [lastPredictionTime, setLastPredictionTime] = useState(0);

  // Vocabulary mapping (same as in your Python model)
  const vocabulary = {
    0: 'HELLO', 1: 'THANK', 2: 'PLEASE', 3: 'YES', 4: 'NO', 5: 'HELP',
    6: 'PAIN', 7: 'HURT', 8: 'SICK', 9: 'DOCTOR', 10: 'NURSE', 11: 'MEDICINE',
    12: 'EMERGENCY', 13: 'WATER', 14: 'FOOD', 15: 'BATHROOM', 16: 'HOT', 17: 'COLD',
    18: 'MORE', 19: 'STOP', 20: 'GOOD', 21: 'BAD', 22: 'TIRED', 23: 'SLEEP'
  };

  const loadModel = async () => {
    try {
      // For demo purposes, create a mock model
      // In production, you would load your trained TensorFlow.js model
      console.log('Loading ASL model...');
      
      // Mock model loading - replace with actual model loading
      const mockModel = tf.sequential({
        layers: [
          tf.layers.conv2d({inputShape: [64, 64, 1], filters: 32, kernelSize: 3, activation: 'relu'}),
          tf.layers.maxPooling2d({poolSize: [2, 2]}),
          tf.layers.flatten(),
          tf.layers.dense({units: 64, activation: 'relu'}),
          tf.layers.dense({units: Object.keys(vocabulary).length, activation: 'softmax'})
        ]
      });

      setModel(mockModel);
      console.log('✅ ASL model loaded successfully');
    } catch (error) {
      console.error('❌ Error loading ASL model:', error);
    }
  };

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('❌ Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCapture = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const preprocessImage = (imageData: ImageData): tf.Tensor => {
    // Convert to grayscale and resize to 64x64
    const tensor = tf.browser.fromPixels(imageData, 1)
      .resizeNearestNeighbor([64, 64])
      .toFloat()
      .div(255.0)
      .expandDims(0);
    
    return tensor;
  };

  const detectEmotion = (imageData: ImageData): {emotion: string, confidence: number} => {
    // Mock emotion detection - replace with actual FER model
    const emotions = ['neutral', 'happy', 'sad', 'angry', 'fear', 'surprise'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const confidence = Math.random() * 100;
    
    return { emotion: randomEmotion, confidence };
  };

  const predictSign = useCallback(async () => {
    if (!model || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = 640;
    canvas.height = 480;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data from detection box area (center 300x300)
    const boxSize = 300;
    const startX = (canvas.width - boxSize) / 2;
    const startY = (canvas.height - boxSize) / 2;
    
    const imageData = ctx.getImageData(startX, startY, boxSize, boxSize);
    
    try {
      // Preprocess image for ASL model
      const tensor = preprocessImage(imageData);
      
      // Make prediction (mock for demo)
      // In production, use: const predictions = await model.predict(tensor).data();
      const mockPredictions = new Float32Array(Object.keys(vocabulary).length);
      mockPredictions[Math.floor(Math.random() * mockPredictions.length)] = Math.random();
      
      const maxIndex = mockPredictions.indexOf(Math.max(...mockPredictions));
      const confidence = mockPredictions[maxIndex];
      const predictedSign = vocabulary[maxIndex as keyof typeof vocabulary] || 'UNKNOWN';
      
      // Only update if confidence is above threshold
      if (confidence > 0.3) {
        const newPrediction = { text: predictedSign, confidence };
        setPrediction(newPrediction);
        
        // Send to socket for real-time communication
        if (socket && confidence > 0.6) {
          socket.emit('asl_recognition', newPrediction);
        }
      }
      
      // Emotion detection
      const emotionResult = detectEmotion(imageData);
      setEmotion(emotionResult);
      
      // Check for emergency emotions
      const criticalEmotions = ['angry', 'fear', 'sad'];
      if (criticalEmotions.includes(emotionResult.emotion) && emotionResult.confidence > 70) {
        const alertData = {
          type: 'emotion',
          emotion: emotionResult.emotion,
          confidence: emotionResult.confidence,
          message: `Patient showing signs of ${emotionResult.emotion}`
        };
        
        socket?.emit('emergency_alert', alertData);
      }
      
      tensor.dispose();
      
    } catch (error) {
      console.error('❌ Prediction error:', error);
    }
  }, [model, socket]);

  const drawDetectionBox = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw detection box
    const boxSize = 300;
    const startX = (canvas.width - boxSize) / 2;
    const startY = (canvas.height - boxSize) / 2;
    
    ctx.strokeStyle = prediction?.confidence > 0.6 ? '#10B981' : '#3B82F6';
    ctx.lineWidth = 3;
    ctx.strokeRect(startX, startY, boxSize, boxSize);
    
    // Draw corner markers
    const cornerSize = 20;
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(startX, startY + cornerSize);
    ctx.lineTo(startX, startY);
    ctx.lineTo(startX + cornerSize, startY);
    ctx.stroke();
    
    // Top-right
    ctx.beginPath();
    ctx.moveTo(startX + boxSize - cornerSize, startY);
    ctx.lineTo(startX + boxSize, startY);
    ctx.lineTo(startX + boxSize, startY + cornerSize);
    ctx.stroke();
    
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(startX, startY + boxSize - cornerSize);
    ctx.lineTo(startX, startY + boxSize);
    ctx.lineTo(startX + cornerSize, startY + boxSize);
    ctx.stroke();
    
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(startX + boxSize - cornerSize, startY + boxSize);
    ctx.lineTo(startX + boxSize, startY + boxSize);
    ctx.lineTo(startX + boxSize, startY + boxSize - cornerSize);
    ctx.stroke();
    
    // Draw instruction text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Place hand in detection area', canvas.width / 2, startY - 10);
  }, [prediction]);

  // Animation loop
  useEffect(() => {
    let animationId: number;
    let frameCount = 0;
    let lastTime = Date.now();
    
    const animate = () => {
      if (isCapturing) {
        const currentTime = Date.now();
        
        // Update FPS
        frameCount++;
        if (currentTime - lastTime >= 1000) {
          setFps(frameCount);
          frameCount = 0;
          lastTime = currentTime;
        }
        
        // Draw detection box
        drawDetectionBox();
        
        // Make prediction every 500ms
        if (currentTime - lastPredictionTime > 500) {
          predictSign();
          setLastPredictionTime(currentTime);
        }
        
        animationId = requestAnimationFrame(animate);
      }
    };
    
    if (isCapturing) {
      animate();
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isCapturing, drawDetectionBox, predictSign, lastPredictionTime]);

  // Load model on component mount
  useEffect(() => {
    loadModel();
    
    return () => {
      stopCapture();
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">ASL Recognition</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Activity className="h-4 w-4" />
            <span>{fps} FPS</span>
          </div>
          
          <button
            onClick={isCapturing ? stopCapture : startCapture}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isCapturing
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isCapturing ? (
              <>
                <Square className="h-4 w-4" />
                Stop Camera
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Start Camera
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Feed */}
        <div className="lg:col-span-2">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto"
              style={{ transform: 'scaleX(-1)' }} // Mirror effect
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ transform: 'scaleX(-1)' }} // Mirror effect
            />
            
            {!isCapturing && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                <div className="text-center">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-white text-lg">Camera not active</p>
                  <p className="text-gray-300 text-sm">Click "Start Camera" to begin</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prediction Results */}
        <div className="space-y-4">
          {/* Current Prediction */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              Current Sign
            </h4>
            {prediction ? (
              <div>
                <p className="text-2xl font-bold text-blue-900">{prediction.text}</p>
                <p className="text-sm text-blue-700">
                  Confidence: {(prediction.confidence * 100).toFixed(1)}%
                </p>
                <div className="mt-2 bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${prediction.confidence * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No sign detected</p>
            )}
          </div>

          {/* Emotion Detection */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-green-600" />
              Emotion Status
            </h4>
            {emotion ? (
              <div>
                <p className="text-lg font-semibold text-green-900 capitalize">
                  {emotion.emotion}
                </p>
                <p className="text-sm text-green-700">
                  Confidence: {emotion.confidence.toFixed(1)}%
                </p>
                <div className="mt-2 bg-green-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${emotion.confidence}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Analyzing...</p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Instructions</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Place your hand in the blue detection box</li>
              <li>• Make clear, deliberate sign language gestures</li>
              <li>• Hold each sign for 2-3 seconds</li>
              <li>• Ensure good lighting for best results</li>
            </ul>
          </div>

          {/* Medical Vocabulary */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h4 className="font-semibold text-gray-900 mb-2">Medical Signs</h4>
            <div className="grid grid-cols-2 gap-1 text-xs text-gray-700">
              {Object.values(vocabulary).slice(0, 12).map((sign, index) => (
                <span key={index} className="bg-yellow-100 rounded px-2 py-1">
                  {sign}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}