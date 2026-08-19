import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { MessageSquare, Send, Radio } from 'lucide-react';

export const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { user } = useAuth();
  const chatEndRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/chat/messages?limit=100');
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load chat history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (msg) => {
      setMessages(prev => {
        // Prevent duplicate append if message already exists
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('chat_message', handleIncomingMessage);

    return () => {
      socket.off('chat_message', handleIncomingMessage);
    };
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      if (socket && socket.connected) {
        socket.emit('send_message', {
          senderId: user.id,
          message: msgText
        });
      } else {
        const res = await api.post('/chat/messages', { message: msgText });
        setMessages(prev => {
          if (prev.some(m => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            <span>Real-Time Staff & Admin Communications</span>
          </h1>
          <p className="text-sm text-slate-400">WebSocket powered messaging room (Socket.IO)</p>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <Radio className={`w-3.5 h-3.5 ${socket?.connected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
          <span className="text-slate-300 font-mono">
            {socket?.connected ? 'WebSocket Connected' : 'Connecting WebSocket...'}
          </span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl h-[550px] flex flex-col shadow-xl overflow-hidden">
        {/* Chat History Messages Container */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            const senderName = msg.sender?.name || `User #${msg.senderId}`;
            const senderRole = msg.sender?.role || 'STAFF';

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 mb-1 px-1">
                  <span className="font-semibold text-slate-200">{senderName}</span>
                  <span className="bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded text-[10px] border border-slate-700 font-bold">{senderRole}</span>
                  <span>•</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  isMe ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20' : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                }`}>
                  {msg.message}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950 flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message to staff/managers..."
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-xs transition flex items-center space-x-2 shadow-lg shadow-blue-600/20"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
