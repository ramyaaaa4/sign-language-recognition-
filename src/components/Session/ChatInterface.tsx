import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Send, Bot, User, AlertTriangle } from 'lucide-react';

interface Message {
  id: string;
  type: 'text' | 'asl' | 'system';
  content: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
  confidence?: number;
  timestamp: number;
}

interface ChatInterfaceProps {
  sessionId: string;
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { socket, messages } = useSocket();
  const [inputMessage, setInputMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Combine socket messages with local messages
    const allMessages = [...messages, ...localMessages].sort((a, b) => a.timestamp - b.timestamp);
    setLocalMessages(allMessages);
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !socket) return;

    const message: Message = {
      id: `${Date.now()}_${Math.random()}`,
      type: 'text',
      content: inputMessage.trim(),
      sender: {
        id: user?.id || '',
        name: user?.name || '',
        role: user?.role || ''
      },
      timestamp: Date.now()
    };

    // Add to local messages immediately
    setLocalMessages(prev => [...prev, message]);

    // Send via socket
    socket.emit('send_message', {
      sessionId,
      message: inputMessage.trim()
    });

    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = (message: Message) => {
    if (message.type === 'asl') {
      return <Bot className="h-4 w-4 text-blue-600" />;
    } else if (message.type === 'system') {
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    } else {
      return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMessageBgColor = (message: Message) => {
    if (message.sender.id === user?.id) {
      return message.type === 'asl' ? 'bg-blue-100' : 'bg-blue-600 text-white';
    }
    return 'bg-gray-100';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {localMessages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <Bot className="h-8 w-8 mx-auto mb-2" />
            </div>
            <p className="text-gray-500 text-sm">
              Communication session started
            </p>
            <p className="text-gray-400 text-xs">
              {user?.role === 'patient' 
                ? 'Use sign language or type messages to communicate'
                : 'Patient messages will appear here'
              }
            </p>
          </div>
        )}

        {localMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender.id === user?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                getMessageBgColor(message)
              }`}
            >
              {/* Sender Info */}
              {message.sender.id !== user?.id && (
                <div className="flex items-center gap-2 mb-1">
                  {getMessageIcon(message)}
                  <span className="text-xs font-medium text-gray-600">
                    {message.sender.name}
                    {message.type === 'asl' && ' (ASL)'}
                  </span>
                </div>
              )}

              {/* Message Content */}
              <div className="space-y-1">
                <p className={`text-sm ${
                  message.sender.id === user?.id && message.type !== 'asl'
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  {message.content}
                </p>

                {/* ASL Confidence */}
                {message.type === 'asl' && message.confidence && (
                  <div className="text-xs text-gray-600">
                    Confidence: {(message.confidence * 100).toFixed(1)}%
                  </div>
                )}

                {/* Timestamp */}
                <div className={`text-xs ${
                  message.sender.id === user?.id && message.type !== 'asl'
                    ? 'text-blue-200' 
                    : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {user?.role === 'doctor' && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            Patient uses sign language, you respond with text
          </div>
        </div>
      )}

      {/* Patient Instructions */}
      {user?.role === 'patient' && (
        <div className="border-t border-gray-200 p-4 bg-blue-50">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Communication Guide:</p>
            <ul className="text-xs space-y-1">
              <li>• Use sign language in the video area</li>
              <li>• Your signs are automatically converted to text</li>
              <li>• Doctor will respond with text messages</li>
              <li>• Emergency emotions trigger automatic alerts</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}