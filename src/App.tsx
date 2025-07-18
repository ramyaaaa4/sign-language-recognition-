import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import PatientDashboard from './components/Patient/PatientDashboard';
import DoctorDashboard from './components/Doctor/DoctorDashboard';
import VideoSession from './components/Session/VideoSession';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import LoadingSpinner from './components/UI/LoadingSpinner';
import ErrorBoundary from './components/UI/ErrorBoundary';
import './styles/globals.css';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to={`/${user.role}`} />} 
      />
      <Route 
        path="/register" 
        element={!user ? <Register /> : <Navigate to={`/${user.role}`} />} 
      />
      <Route 
        path="/patient" 
        element={user?.role === 'patient' ? <PatientDashboard /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/doctor" 
        element={user?.role === 'doctor' ? <DoctorDashboard /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/session/:sessionId" 
        element={user ? <VideoSession /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/" 
        element={
          user ? (
            <Navigate to={`/${user.role}`} />
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
              <AppRoutes />
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;