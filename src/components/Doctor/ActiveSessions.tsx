import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Video, MessageCircle, User, Clock, FileText, Phone } from 'lucide-react';

export default function ActiveSessions() {
  const { currentSession } = useSocket();
  const [mockSessions] = useState([
    {
      id: 'session_1',
      patient: {
        name: 'Sarah Johnson',
        id: 'patient_1',
        emotion: 'neutral',
        lastSign: 'HELLO DOCTOR'
      },
      startTime: Date.now() - 900000, // 15 minutes ago
      messageCount: 12,
      status: 'active'
    }
  ]);

  const formatDuration = (startTime: number) => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'happy':
        return 'text-green-600 bg-green-100';
      case 'sad':
      case 'fear':
      case 'angry':
        return 'text-red-600 bg-red-100';
      case 'surprise':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (mockSessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Video className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Sessions</h3>
        <p className="text-gray-600 mb-4">
          No communication sessions are currently active. Accept a patient request to start a session.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">
            💡 Active sessions allow real-time ASL communication with patients including text conversion and emotion monitoring.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Active Sessions</p>
              <p className="text-lg font-semibold text-green-900">{mockSessions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600">Total Messages</p>
              <p className="text-lg font-semibold text-blue-900">
                {mockSessions.reduce((sum, session) => sum + session.messageCount, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600">Avg Duration</p>
              <p className="text-lg font-semibold text-purple-900">
                {mockSessions.length > 0 ? formatDuration(mockSessions[0].startTime) : '0:00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions List */}
      <div className="space-y-4">
        {mockSessions.map((session) => (
          <div key={session.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Patient Avatar */}
                <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                
                {/* Session Info */}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-gray-900">{session.patient.name}</h4>
                    <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-sm text-green-600 font-medium">Live</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(session.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{session.messageCount} messages</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Actions */}
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  <Video className="h-4 w-4" />
                  Join Session
                </button>
                
                <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Session Details */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Emotion */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 mb-2">Patient Status</h5>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEmotionColor(session.patient.emotion)}`}>
                    {session.patient.emotion.charAt(0).toUpperCase() + session.patient.emotion.slice(1)}
                  </span>
                </div>
              </div>

              {/* Last Sign */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 mb-2">Last Sign</h5>
                <p className="text-sm text-blue-600 font-mono">{session.patient.lastSign}</p>
              </div>

              {/* Session Controls */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 mb-2">Quick Actions</h5>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded font-medium transition-colors">
                    Notes
                  </button>
                  <button className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded font-medium transition-colors">
                    End
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Messages Preview */}
            <div className="mt-4 bg-blue-50 rounded-lg p-3">
              <h5 className="font-medium text-gray-900 mb-2">Recent Communication</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Patient: "HELLO DOCTOR"</span>
                  <span className="text-gray-500">2 min ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">You: "Hello! How can I help you?"</span>
                  <span className="text-gray-500">2 min ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Patient: "PAIN HEAD"</span>
                  <span className="text-gray-500">1 min ago</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Session Management Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Session Management Tips</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Monitor patient emotions continuously for signs of distress</li>
          <li>• ASL signs are automatically converted to text in real-time</li>
          <li>• Take notes during the session for medical records</li>
          <li>• Emergency alerts will appear if critical emotions are detected</li>
          <li>• End sessions properly to ensure proper documentation</li>
        </ul>
      </div>
    </div>
  );
}