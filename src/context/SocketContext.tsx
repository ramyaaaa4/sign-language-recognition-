import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  onlineUsers: any[];
  currentSession: string | null;
  messages: any[];
  alerts: any[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (user && token) {
      const newSocket = io('http://localhost:3001', {
        auth: {
          token,
        },
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to server');
        setConnected(true);
        
        // Register user
        newSocket.emit('register_user', {
          userId: user.id,
          name: user.name,
          role: user.role,
          specialization: user.specialization,
        });
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        setConnected(false);
      });

      // Handle doctor online/offline status
      newSocket.on('doctor_online', (doctor) => {
        setOnlineUsers(prev => [...prev.filter(u => u.id !== doctor.userId), doctor]);
      });

      newSocket.on('doctor_offline', (doctor) => {
        setOnlineUsers(prev => prev.filter(u => u.id !== doctor.userId));
      });

      // Handle session events
      newSocket.on('session_started', (sessionData) => {
        setCurrentSession(sessionData.sessionId);
        setMessages([]);
      });

      newSocket.on('patient_request', (patientData) => {
        // Show notification for doctors
        if (user.role === 'doctor') {
          setAlerts(prev => [...prev, {
            type: 'patient_request',
            data: patientData,
            timestamp: Date.now(),
          }]);
        }
      });

      // Handle messages
      newSocket.on('new_message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      newSocket.on('asl_message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      // Handle emergency alerts
      newSocket.on('emergency_alert', (alert) => {
        if (user.role === 'doctor') {
          setAlerts(prev => [...prev, {
            type: 'emergency',
            data: alert,
            timestamp: Date.now(),
          }]);
          
          // Play alert sound
          const audio = new Audio('/alert-sound.mp3');
          audio.play().catch(console.error);
        }
      });

      // Heartbeat
      const heartbeat = setInterval(() => {
        if (newSocket.connected) {
          newSocket.emit('heartbeat');
        }
      }, 30000);

      setSocket(newSocket);

      return () => {
        clearInterval(heartbeat);
        newSocket.disconnect();
      };
    }
  }, [user, token]);

  const value = {
    socket,
    connected,
    onlineUsers,
    currentSession,
    messages,
    alerts,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}