import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Stethoscope, Bell, Users, Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import PatientRequests from './PatientRequests';
import AlertsPanel from './AlertsPanel';
import ActiveSessions from './ActiveSessions';

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const { connected, alerts } = useSocket();
  const [activeTab, setActiveTab] = useState('requests');
  const [stats, setStats] = useState({
    pendingRequests: 0,
    activeAlerts: 0,
    activeSessions: 0,
    patientsHelped: 0
  });

  const urgentAlerts = alerts.filter(alert => 
    alert.type === 'emergency' || 
    (alert.type === 'patient_request' && alert.data.urgency === 'emergency')
  ).length;

  const tabs = [
    { id: 'requests', label: 'Patient Requests', icon: Users, badge: stats.pendingRequests },
    { id: 'alerts', label: 'Emergency Alerts', icon: AlertTriangle, badge: urgentAlerts },
    { id: 'sessions', label: 'Active Sessions', icon: Activity, badge: stats.activeSessions },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Doctor Portal</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {connected ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {/* Emergency Alerts Indicator */}
              {urgentAlerts > 0 && (
                <div className="relative">
                  <Bell className="h-5 w-5 text-red-600 animate-pulse" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {urgentAlerts}
                  </span>
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                Dr. {user?.name}
              </div>
              
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, Dr. {user?.name}
          </h2>
          <p className="text-gray-600">
            {user?.specialization} • License: {user?.licenseNumber}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingRequests}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Emergency Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">{urgentAlerts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeSessions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Patients Helped Today</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.patientsHelped}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Alerts Banner */}
        {urgentAlerts > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">
                  {urgentAlerts} Emergency Alert{urgentAlerts !== 1 ? 's' : ''} Require Immediate Attention
                </h3>
                <p className="text-red-700 text-sm">
                  Patients are experiencing emotional distress or have sent emergency requests.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('alerts')}
                className="ml-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                View Alerts
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Patient Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Patient Communication Requests
                </h3>
                <PatientRequests />
              </div>
            )}

            {/* Emergency Alerts Tab */}
            {activeTab === 'alerts' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Emergency Alerts & Notifications
                </h3>
                <AlertsPanel />
              </div>
            )}

            {/* Active Sessions Tab */}
            {activeTab === 'sessions' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Active Communication Sessions
                </h3>
                <ActiveSessions />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}