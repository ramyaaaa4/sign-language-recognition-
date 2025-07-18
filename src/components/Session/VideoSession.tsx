import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Video, Mic, Phone, MessageCircle, Camera, Settings } from 'lucide-react';
import VideoCapture from '../ASL/VideoCapture';
import ChatInterface from './ChatInterface';

export default function VideoSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, currentSession, messages } = useSocket();
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [showASLCapture, setShowASLCapture] = useState(false);

  useEffect(() => {
    if (!sessionId || !user) {
      navigate('/');
      return;
    }

    // Join the session room
    if (socket) {
      socket.emit('join_session', sessionId);
    }
  }, [sessionId, user, socket, navigate]);

  const endSession = () => {
    if (socket) {
      socket.emit('end_session', sessionId);
    }
    navigate(`/${user?.role}`);
  };

  const toggleVideo = () => {
    setLocalVideoEnabled(!localVideoEnabled);
  };

  const toggleAudio = () => {
    setLocalAudioEnabled(!localAudioEnabled);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Video className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-white text-lg font-semibold">
              Healthcare Communication Session
            </h1>
            <span className="text-green-400 text-sm">● Live</span>
          </div>
          
          <button
            onClick={endSession}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Phone className="h-4 w-4" />
            End Session
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Local Video / ASL Capture */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="bg-gray-700 px-4 py-2 flex items-center justify-between">
                <span className="text-white text-sm font-medium">
                  {user?.role === 'patient' ? 'Your Video (ASL Detection)' : 'Your Video'}
                </span>
                <div className="flex items-center gap-2">
                  {user?.role === 'patient' && (
                    <button
                      onClick={() => setShowASLCapture(!showASLCapture)}
                      className={`px-3 py-1 text-xs rounded ${
                        showASLCapture 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      ASL Detection
                    </button>
                  )}
                  <Settings className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                {user?.role === 'patient' && showASLCapture ? (
                  <VideoCapture />
                ) : (
                  <div className="text-center">
                    <Camera className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Local video would appear here</p>
                    <p className="text-gray-500 text-sm">
                      In production, this would show live camera feed
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Remote Video */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="bg-gray-700 px-4 py-2 flex items-center justify-between">
                <span className="text-white text-sm font-medium">
                  {user?.role === 'patient' ? 'Doctor' : 'Patient'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-xs">Connected</span>
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                </div>
              </div>
              
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl font-semibold">
                      {user?.role === 'patient' ? 'Dr' : 'P'}
                    </span>
                  </div>
                  <p className="text-gray-400">
                    {user?.role === 'patient' ? 'Doctor' : 'Patient'} video
                  </p>
                  <p className="text-gray-500 text-sm">
                    Video call functionality would be here
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Video Controls */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors ${
                localVideoEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <Video className="h-5 w-5" />
            </button>
            
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full transition-colors ${
                localAudioEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <Mic className="h-5 w-5" />
            </button>
            
            <button className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Communication</h3>
            </div>
          </div>
          
          <ChatInterface sessionId={sessionId || ''} />
        </div>
      </div>
    </div>
  );
}