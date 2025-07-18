import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Camera, Upload, FileText, Heart, Users, AlertTriangle, Video } from 'lucide-react';
import VideoCapture from '../ASL/VideoCapture';
import CertificateUpload from './CertificateUpload';
import DoctorRequest from './DoctorRequest';

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const { connected, onlineUsers, currentSession } = useSocket();
  const [activeTab, setActiveTab] = useState('communicate');
  const [showVideoCapture, setShowVideoCapture] = useState(false);

  const onlineDoctors = onlineUsers.filter(u => u.role === 'doctor');

  const tabs = [
    { id: 'communicate', label: 'Communicate', icon: Video },
    { id: 'documents', label: 'Medical Documents', icon: FileText },
    { id: 'profile', label: 'Profile', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Healthcare ASL</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{onlineDoctors.length} doctors online</span>
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
            Welcome back, {user?.name}
          </h2>
          <p className="text-gray-600">
            Connect with healthcare professionals using sign language interpretation
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Online Doctors</p>
                <p className="text-2xl font-semibold text-gray-900">{onlineDoctors.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Video className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Connection Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {currentSession ? 'In Session' : 'Ready'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Emergency Status</p>
                <p className="text-lg font-semibold text-green-600">Normal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Communicate Tab */}
            {activeTab === 'communicate' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Start Communication Session
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Request a doctor and begin sign language communication
                  </p>
                </div>

                {!showVideoCapture ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DoctorRequest />
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Quick Actions
                      </h4>
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowVideoCapture(true)}
                          className="w-full flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                        >
                          <Camera className="h-5 w-5 text-blue-600" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Test ASL Recognition</p>
                            <p className="text-sm text-gray-600">Practice sign language detection</p>
                          </div>
                        </button>
                        
                        <button className="w-full flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Emergency Alert</p>
                            <p className="text-sm text-gray-600">Send immediate help request</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        ASL Recognition Test
                      </h4>
                      <button
                        onClick={() => setShowVideoCapture(false)}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                      >
                        Close
                      </button>
                    </div>
                    <VideoCapture />
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Medical Documents
                </h3>
                <CertificateUpload />
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Profile Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <p className="text-gray-900">{user?.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <p className="text-gray-900 capitalize">{user?.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}