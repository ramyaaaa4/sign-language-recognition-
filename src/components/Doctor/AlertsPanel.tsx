import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { AlertTriangle, User, Clock, CheckCircle, Volume2, Eye } from 'lucide-react';

interface EmergencyAlert {
  id: string;
  patient: {
    name: string;
    id: string;
  };
  type: 'emotion' | 'sign' | 'emergency';
  emotion?: string;
  recognizedSign?: string;
  confidence: number;
  message: string;
  timestamp: number;
  handled?: boolean;
}

export default function AlertsPanel() {
  const { alerts } = useSocket();
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unhandled' | 'handled'>('unhandled');

  useEffect(() => {
    // Filter emergency alerts from socket alerts
    const emergencyAlerts = alerts
      .filter(alert => alert.type === 'emergency')
      .map((alert, index) => ({
        id: `${alert.timestamp}_${index}`,
        patient: alert.data.patient || { name: 'Unknown Patient', id: 'unknown' },
        type: alert.data.type || 'emergency',
        emotion: alert.data.emotion,
        recognizedSign: alert.data.recognizedSign,
        confidence: alert.data.confidence || 0,
        message: alert.data.message || 'Emergency situation detected',
        timestamp: alert.data.timestamp || alert.timestamp,
        handled: false
      }));

    setEmergencyAlerts(emergencyAlerts);
  }, [alerts]);

  const playAlertSound = () => {
    // In a real app, you would play an actual alert sound
    console.log('🔊 Playing alert sound');
  };

  const markAsHandled = (alertId: string) => {
    setEmergencyAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, handled: true } : alert
      )
    );
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const getAlertSeverity = (alert: EmergencyAlert) => {
    if (alert.type === 'emergency') return 'critical';
    if (alert.emotion && ['angry', 'fear', 'sad'].includes(alert.emotion)) {
      return alert.confidence > 80 ? 'high' : 'medium';
    }
    return 'medium';
  };

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojiMap: { [key: string]: string } = {
      angry: '😠',
      fear: '😨',
      sad: '😢',
      pain: '🤕',
      distress: '😰'
    };
    return emojiMap[emotion] || '😐';
  };

  const filteredAlerts = emergencyAlerts.filter(alert => {
    if (filter === 'handled') return alert.handled;
    if (filter === 'unhandled') return !alert.handled;
    return true;
  });

  if (emergencyAlerts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Emergency Alerts</h3>
        <p className="text-gray-600 mb-4">
          All patients are stable. Emergency alerts will appear here when patients show signs of distress.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-green-800">
            ✅ The system continuously monitors patient emotions and will notify you immediately of any concerning signs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-red-600">Critical</p>
              <p className="text-lg font-semibold text-red-900">
                {emergencyAlerts.filter(a => getAlertSeverity(a) === 'critical').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-orange-600">High</p>
              <p className="text-lg font-semibold text-orange-900">
                {emergencyAlerts.filter(a => getAlertSeverity(a) === 'high').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-600">Medium</p>
              <p className="text-lg font-semibold text-yellow-900">
                {emergencyAlerts.filter(a => getAlertSeverity(a) === 'medium').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Handled</p>
              <p className="text-lg font-semibold text-green-900">
                {emergencyAlerts.filter(a => a.handled).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'unhandled', label: 'Unhandled', count: emergencyAlerts.filter(a => !a.handled).length },
          { id: 'all', label: 'All Alerts', count: emergencyAlerts.length },
          { id: 'handled', label: 'Handled', count: emergencyAlerts.filter(a => a.handled).length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts
          .sort((a, b) => {
            // Sort by handled status first (unhandled first), then by timestamp (newest first)
            if (a.handled !== b.handled) return a.handled ? 1 : -1;
            return b.timestamp - a.timestamp;
          })
          .map((alert) => {
            const severity = getAlertSeverity(alert);
            const severityColors = getSeverityColors(severity);
            
            return (
              <div
                key={alert.id}
                className={`p-6 rounded-xl border transition-all ${
                  alert.handled ? 'opacity-60' : 'shadow-lg'
                } ${severityColors}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Alert Icon */}
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      severity === 'critical' ? 'bg-red-200' :
                      severity === 'high' ? 'bg-orange-200' :
                      'bg-yellow-200'
                    }`}>
                      {alert.emotion ? (
                        <span className="text-2xl">{getEmotionEmoji(alert.emotion)}</span>
                      ) : (
                        <AlertTriangle className={`h-6 w-6 ${
                          severity === 'critical' ? 'text-red-600' :
                          severity === 'high' ? 'text-orange-600' :
                          'text-yellow-600'
                        }`} />
                      )}
                    </div>
                    
                    {/* Alert Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {alert.patient.name}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          severity === 'critical' ? 'bg-red-200 text-red-800' :
                          severity === 'high' ? 'bg-orange-200 text-orange-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-gray-800 mb-2">{alert.message}</p>
                      
                      {/* Alert Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {alert.emotion && (
                          <div>
                            <span className="font-medium">Detected Emotion:</span>
                            <span className="ml-2 capitalize">{alert.emotion}</span>
                          </div>
                        )}
                        {alert.confidence > 0 && (
                          <div>
                            <span className="font-medium">Confidence:</span>
                            <span className="ml-2">{alert.confidence.toFixed(1)}%</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Alert Type:</span>
                          <span className="ml-2 capitalize">{alert.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={playAlertSound}
                      className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                      title="Play alert sound"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    
                    <button
                      className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                      title="View patient details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {!alert.handled && (
                      <button
                        onClick={() => markAsHandled(alert.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Mark Handled
                      </button>
                    )}
                  </div>
                </div>

                {alert.handled && (
                  <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Alert has been handled</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No alerts found for the selected filter.</p>
        </div>
      )}
    </div>
  );
}