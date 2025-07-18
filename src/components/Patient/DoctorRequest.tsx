import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Users, Clock, CheckCircle, AlertCircle, Phone } from 'lucide-react';

export default function DoctorRequest() {
  const { socket, connected, onlineUsers } = useSocket();
  const [requestSent, setRequestSent] = useState(false);
  const [waitingTime, setWaitingTime] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);

  const onlineDoctors = onlineUsers.filter(u => u.role === 'doctor');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (requestSent && !sessionStarted) {
      interval = setInterval(() => {
        setWaitingTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [requestSent, sessionStarted]);

  useEffect(() => {
    if (socket) {
      socket.on('session_started', (sessionData) => {
        setSessionStarted(true);
        setRequestSent(false);
        setWaitingTime(0);
        // You can navigate to session page here
        console.log('Session started:', sessionData);
      });
    }

    return () => {
      if (socket) {
        socket.off('session_started');
      }
    };
  }, [socket]);

  const requestDoctor = () => {
    if (!socket || !connected) {
      alert('Not connected to server. Please try again.');
      return;
    }

    setRequestSent(true);
    setWaitingTime(0);
    
    socket.emit('request_doctor', {
      timestamp: Date.now(),
      urgency: 'normal', // Could be 'normal', 'urgent', 'emergency'
      message: 'Patient requesting doctor consultation'
    });
  };

  const cancelRequest = () => {
    setRequestSent(false);
    setWaitingTime(0);
    // Emit cancel request to socket if needed
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (sessionStarted) {
    return (
      <div className="bg-green-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">Session Active</h3>
        </div>
        <p className="text-green-700 mb-4">
          You are now connected with a doctor. You can start communicating using sign language.
        </p>
        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors">
          Go to Video Session
        </button>
      </div>
    );
  }

  if (requestSent) {
    return (
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
          <h3 className="text-lg font-semibold text-blue-900">Waiting for Doctor</h3>
        </div>
        <p className="text-blue-700 mb-4">
          Your request has been sent to available doctors. Please wait for a response.
        </p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-blue-600">Waiting time:</span>
          <span className="text-lg font-mono text-blue-800">{formatTime(waitingTime)}</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={cancelRequest}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium border border-gray-300 transition-colors"
          >
            Cancel Request
          </button>
          <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
            Mark as Urgent
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <Phone className="h-6 w-6 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Request Doctor</h3>
      </div>

      {/* Online Doctors Status */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Available Doctors: {onlineDoctors.length}
          </span>
        </div>
        
        {onlineDoctors.length > 0 ? (
          <div className="space-y-2">
            {onlineDoctors.slice(0, 3).map((doctor, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-green-900">{doctor.name}</p>
                  <p className="text-sm text-green-700">{doctor.specialization}</p>
                </div>
              </div>
            ))}
            {onlineDoctors.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{onlineDoctors.length - 3} more doctors available
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              No doctors currently online. Your request will be queued.
            </p>
          </div>
        )}
      </div>

      {/* Request Button */}
      <div className="space-y-3">
        <button
          onClick={requestDoctor}
          disabled={!connected}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          {connected ? 'Request Doctor Now' : 'Connecting...'}
        </button>
        
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
            Urgent Request
          </button>
          <button className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
            Emergency
          </button>
        </div>
      </div>

      {/* Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Your request is sent to all available doctors</li>
          <li>• A doctor will accept your request and start a session</li>
          <li>• You'll be notified when the session begins</li>
          <li>• Use sign language to communicate with the doctor</li>
        </ul>
      </div>
    </div>
  );
}