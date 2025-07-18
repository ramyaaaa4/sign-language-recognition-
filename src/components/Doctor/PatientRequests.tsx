import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Clock, User, MessageCircle, CheckCircle, AlertTriangle, Phone } from 'lucide-react';

interface PatientRequest {
  patientSocketId: string;
  name: string;
  timestamp: number;
  urgency: 'normal' | 'urgent' | 'emergency';
  message?: string;
}

export default function PatientRequests() {
  const { socket, alerts } = useSocket();
  const [requests, setRequests] = useState<PatientRequest[]>([]);

  useEffect(() => {
    // Filter patient requests from alerts
    const patientRequests = alerts
      .filter(alert => alert.type === 'patient_request')
      .map(alert => ({
        patientSocketId: alert.data.socketId,
        name: alert.data.name,
        timestamp: alert.data.timestamp,
        urgency: alert.data.urgency || 'normal',
        message: alert.data.message
      }));

    setRequests(patientRequests);
  }, [alerts]);

  const acceptRequest = (request: PatientRequest) => {
    if (socket) {
      socket.emit('accept_patient', {
        patientSocketId: request.patientSocketId
      });
      
      // Remove from requests list
      setRequests(prev => prev.filter(r => r.patientSocketId !== request.patientSocketId));
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'urgent':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Patient Requests</h3>
        <p className="text-gray-600 mb-4">
          You're all caught up! Patient requests will appear here when they need assistance.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">
            💡 Tip: Keep this dashboard open to receive real-time patient requests and emergency alerts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {requests.filter(r => r.urgency === 'normal').length} Normal Requests
            </span>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-orange-900">
              {requests.filter(r => r.urgency === 'urgent').length} Urgent Requests
            </span>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-900">
              {requests.filter(r => r.urgency === 'emergency').length} Emergency Requests
            </span>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {requests
          .sort((a, b) => {
            // Sort by urgency first (emergency > urgent > normal), then by timestamp
            const urgencyWeight = { emergency: 3, urgent: 2, normal: 1 };
            const urgencyDiff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
            return urgencyDiff !== 0 ? urgencyDiff : b.timestamp - a.timestamp;
          })
          .map((request, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl border transition-all hover:shadow-md ${
                request.urgency === 'emergency'
                  ? 'bg-red-50 border-red-200'
                  : request.urgency === 'urgent'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Patient Avatar */}
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  
                  {/* Patient Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-gray-900">{request.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getUrgencyColor(request.urgency)}`}>
                        {getUrgencyIcon(request.urgency)}
                        <span className="ml-1 capitalize">{request.urgency}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>{formatTimeAgo(request.timestamp)}</span>
                      {request.message && (
                        <>
                          <span>•</span>
                          <span className="italic">"{request.message}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => acceptRequest(request)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      request.urgency === 'emergency'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : request.urgency === 'urgent'
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Phone className="h-4 w-4" />
                    Accept Request
                  </button>
                </div>
              </div>

              {/* Additional Info for Emergency */}
              {request.urgency === 'emergency' && (
                <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium text-sm">
                      Emergency Request - Immediate attention required
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-gray-900 mb-2">How to Handle Requests</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Emergency requests</strong> should be handled immediately</li>
          <li>• <strong>Urgent requests</strong> should be addressed within 5 minutes</li>
          <li>• <strong>Normal requests</strong> can be handled based on availability</li>
          <li>• Accepting a request will start a video communication session</li>
        </ul>
      </div>
    </div>
  );
}