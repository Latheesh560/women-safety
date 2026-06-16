import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Send,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  User,
  Clock,
  Hash,
  Loader2,
  Wifi,
  WifiOff,
  Reply,
  X
} from 'lucide-react';

const CommunitySupportPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch initial messages and set up Socket.IO
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const data = await api.get('/community/messages');
        setMessages(data || []);
      } catch (err) {
        console.error('Failed to fetch messages.', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Connect to Socket.IO for real-time messages
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to real-time chat');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from real-time chat');
      setConnected(false);
    });

    // Listen for new messages from other users
    socket.on('new_message', (newMessage) => {
      setMessages((prev) => {
        // Avoid duplicates (in case we also add it optimistically)
        if (prev.some(m => m._id === newMessage._id)) return prev;
        return [...prev, newMessage];
      });
    });

    return () => {
      socket.off('new_message');
      disconnectSocket();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setSending(true);
    try {
      const payload = { content: inputText };
      if (replyingTo) {
        payload.replyTo = {
          _id: replyingTo._id || replyingTo.id,
          username: replyingTo.username,
          content: replyingTo.content
        };
      }
      // Post to API — server will broadcast via Socket.IO to all clients
      await api.post('/community/message', payload);
      setInputText('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to post message.', err);
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="mb-2">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <Users className="w-6 h-6 text-[#7BC4A8]" /> Community Stories & Support
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          A safe haven to share your experiences, seek advice, and find strength in each other. Your voice matters here.
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-8 flex flex-col bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[20px] h-[580px] overflow-hidden">
          <div className="px-5 py-3.5 bg-white/60 backdrop-blur-md border-b border-pink-100/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary-dark" />
              <div>
                <span className="font-bold text-sm text-slate-800 block">#share-your-story</span>
                <span className="text-[10px] text-slate-500 font-semibold">A safe, judgment-free space to connect</span>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
              connected 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700' 
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-700'
            }`}>
              {connected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Live
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" /> Connecting...
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-thin">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Loader2 className="w-6 h-6 text-primary-dark animate-spin" />
                <span className="text-xs text-slate-500 font-bold">Loading messages...</span>
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg) => (
                <motion.div 
                  key={msg._id || msg.id}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={(e, info) => {
                    if (info.offset.x > 50) {
                      setReplyingTo(msg);
                    }
                  }}
                  className="relative group touch-pan-y"
                >
                  <div className="absolute left-[-35px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    <button onClick={() => setReplyingTo(msg)} className="p-1.5 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200">
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-3.5 items-start p-3 bg-white/70 hover:bg-white/95 border border-pink-100/30 hover:border-pink-200/50 rounded-2xl transition-colors duration-200 shadow-[0_2px_12px_rgba(255,182,193,0.02)]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-dark to-[#FFB6C1] flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm shadow-primary-dark/30">
                      {getInitials(msg.username)}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2.5">
                        <strong className="text-sm text-slate-800 font-bold">{msg.username}</strong>
                        <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-primary-dark" /> {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      {msg.replyTo && (
                        <div className="mt-1 mb-2 p-2 bg-pink-50/50 border-l-2 border-pink-300 rounded-r-lg text-xs">
                          <div className="font-bold text-pink-700 mb-0.5">{msg.replyTo.username}</div>
                          <div className="text-slate-600 truncate">{msg.replyTo.content}</div>
                        </div>
                      )}
                      <p className="text-xs sm:text-sm text-slate-750 leading-relaxed break-words font-medium">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                <MessageSquare className="w-10 h-10 text-slate-400 mb-3" />
                <h3 className="font-bold text-slate-800 mb-1">Your Story Matters</h3>
                <p className="text-xs max-w-xs text-slate-500">Share your experience, ask for advice, or simply say hello. You are not alone.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white/60 border-t border-pink-100/30 backdrop-blur-md flex flex-col gap-2">
            <AnimatePresence>
              {replyingTo && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  className="flex items-center justify-between bg-pink-50/80 px-3 py-2 rounded-lg border border-pink-100"
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-bold text-pink-600 flex items-center gap-1"><Reply className="w-3 h-3" /> Replying to {replyingTo.username}</span>
                    <span className="text-xs text-slate-500 truncate mt-0.5">{replyingTo.content}</span>
                  </div>
                  <button type="button" onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-white/50">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                required
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Share your story, ask for advice, or offer support..."
                className="input-field flex-1 bg-white/80 border-slate-200/80 focus:border-primary/60 text-slate-800"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="py-2.5 px-4 bg-gradient-to-r from-primary-dark to-primary hover:from-primary hover:to-accent text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(255,141,161,0.2)] hover:shadow-[0_6px_20px_rgba(255,141,161,0.3)] transition-all duration-200 flex items-center justify-center disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-4 space-y-5">
          <div className="bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(255,182,193,0.08)] rounded-[20px] p-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Safe Space Guidelines
            </h3>
            <div className="space-y-4">
              {[
                { num: '1', title: 'Empathy & Respect First', desc: 'Treat every story with kindness and without judgment. We are here to listen.' },
                { num: '2', title: 'Your Privacy Matters', desc: 'Share only what you are comfortable with. Avoid posting personal contact information.' },
                { num: '3', title: 'Trigger Warnings', desc: 'If your story contains sensitive content, please consider adding a [TW] at the beginning.' },
                { num: '4', title: 'Unconditional Support', desc: 'Uplift and empower one another. Together, we build a stronger community.' },
              ].map((rule) => (
                <div key={rule.num} className="flex gap-3.5 items-start text-xs text-slate-600 font-medium">
                  <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-700 font-extrabold text-xs shrink-0 flex items-center justify-center mt-0.5 border border-emerald-500/20">
                    {rule.num}
                  </div>
                  <div>
                    <strong className="text-slate-800 font-bold">{rule.title}</strong>
                    <p className="mt-0.5 leading-relaxed text-[11px] text-slate-600">{rule.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-[#FFF5F6] to-[#EEF2FF]/40 border border-pink-100/40 rounded-2xl flex gap-2.5 items-start shadow-sm shadow-pink-500/5">
            <AlertCircle className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 leading-normal">
              <strong className="text-primary-dark font-bold">Real-Time Powered:</strong> Messages are delivered instantly via WebSocket connection. No polling delays.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CommunitySupportPage;
