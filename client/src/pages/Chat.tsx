import React, { useState, useEffect, useRef, FormEvent } from 'react';
import api from '../services/api.ts';
import { useSocketContext } from '../context/SocketContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { MessageSquare, Send, Radio } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/index.ts';
import { fetchChatMessages, sendChatMessage, addMessage, ChatMessageItem } from '../store/slices/chatSlice.ts';

export const Chat: React.FC = () => {
  const dispatch = useAppDispatch();
  const { messages, loading, sending } = useAppSelector((state) => state.chat);
  const [newMessage, setNewMessage] = useState<string>('');
  const { socket, isConnected } = useSocketContext();
  const { user } = useAuth();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchChatMessages(100));
  }, [dispatch]);

  // Socket.IO: receive real-time messages from other users
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (msg: ChatMessageItem) => {
      dispatch(addMessage(msg));
    };

    socket.on('chat_message', handleIncoming);
    return () => { socket.off('chat_message', handleIncoming); };
  }, [socket, dispatch]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;

    setNewMessage('');
    dispatch(sendChatMessage(text));
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            <span>Real-Time Staff & Admin Communications</span>
          </h1>
          <p className="text-sm text-slate-400">Live synchronized messaging room with multi-user presence</p>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
          <span className="text-slate-300 font-mono">
            {isConnected ? 'Live WebSocket Active' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Message Window */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl h-[calc(100vh-240px)] max-h-[520px] min-h-[380px] flex flex-col shadow-xl overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-600" />
              <p className="text-sm">No messages yet. Be the first to say something!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              const name = msg.sender?.name || `User #${msg.senderId}`;
              const role = msg.sender?.role || 'STAFF';
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mb-1 px-1">
                    <span className="font-semibold text-slate-200">{name}</span>
                    <span className="bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded text-[10px] border border-slate-700 font-bold">{role}</span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20'
                      : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950 flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium text-xs transition flex items-center space-x-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            <span>{sending ? 'Sending...' : 'Send'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
