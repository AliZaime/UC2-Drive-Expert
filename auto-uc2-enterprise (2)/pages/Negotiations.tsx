import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Button, Badge, cn } from '../components/UI';
import { Send, Phone, Video, MoreVertical, Paperclip, Smile, CheckCheck, User, DollarSign, Loader2, MessageSquare } from 'lucide-react';
import { api } from '../api';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

export const Negotiations = () => {
  const location = useLocation();
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle conversation from navigation state
  useEffect(() => {
    if (location.state?.conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c._id === location.state.conversationId);
      if (conv) {
        handleSelectConversation(conv);
      }
    }
  }, [location.state, conversations]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    // Join conversation room
    socket.emit('join_conversation', { conversationId: selectedConversation._id });

    // Listen for new messages
    socket.on('new_message', (data) => {
      if (data.conversationId === selectedConversation._id) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    });

    // Listen for typing indicators
    socket.on('user_typing', (data) => {
      if (data.conversationId === selectedConversation._id) {
        setIsTyping(true);
      }
    });

    socket.on('user_stop_typing', (data) => {
      if (data.conversationId === selectedConversation._id) {
        setIsTyping(false);
      }
    });

    // Listen for read receipts
    socket.on('messages_read', (data) => {
      if (data.conversationId === selectedConversation._id) {
        setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('messages_read');
    };
  }, [socket, selectedConversation]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/conversations');
      const convs = response.data.conversations || [];
      setConversations(convs);
      
      if (convs.length > 0 && !selectedConversation) {
        handleSelectConversation(convs[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation: any) => {
    setSelectedConversation(conversation);
    
    // Fetch messages
    try {
      const response = await api.get(`/conversations/${conversation._id}/messages`);
      setMessages(response.data.messages || []);
      
      // Mark as read
      if (socket) {
        socket.emit('mark_read', { conversationId: conversation._id });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !socket || !selectedConversation) return;

    setSending(true);
    
    try {
      let fileUrl = null;
      
      // Upload file if selected
      if (selectedFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        try {
          const uploadResponse = await api.post<any>('/upload', formData);
          fileUrl = uploadResponse.url;
        } catch (uploadError: any) {
          const errorMsg = uploadError.message || 'Erreur lors de l\'upload du fichier';
          throw new Error(errorMsg);
        } finally {
          setUploading(false);
        }
      }
      
      // Send via WebSocket
      socket.emit('send_message', {
        conversationId: selectedConversation._id,
        content: messageInput.trim() || '📎 Fichier joint',
        fileUrl
      });

      setMessageInput('');
      setSelectedFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
      setUploading(false);
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit('stop_typing', { conversationId: selectedConversation._id });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 10MB)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleTyping = () => {
    if (!socket || !selectedConversation) return;

    // Emit typing event
    socket.emit('typing', { conversationId: selectedConversation._id });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { conversationId: selectedConversation._id });
    }, 2000);
  };

  const currentUserId = JSON.parse(localStorage.getItem('auto_uc2_user') || '{}').id;

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 animate-in fade-in duration-500">
      {/* Sidebar List */}
      <div className="w-80 lg:w-96 flex flex-col shrink-0 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/20">
          <h2 className="font-black text-xl text-white tracking-tighter uppercase">Conversations</h2>
          <Badge variant="info">{loading ? '...' : conversations.length}</Badge>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Chargement...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 italic text-sm">
              Aucune conversation active.
            </div>
          ) : conversations.map(conv => {
            const clientName = conv.client ? `${conv.client.firstName} ${conv.client.lastName}` : 'Client';
            
            return (
              <button
                key={conv._id}
                onClick={() => handleSelectConversation(conv)}
                className={cn(
                  "w-full p-4 rounded-xl flex gap-3 text-left transition-all border-2",
                  selectedConversation?._id === conv._id
                    ? "bg-white/5 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                    : "bg-transparent border-transparent hover:bg-white/5"
                )}
              >
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center shrink-0 border border-white/10">
                  <User className="text-zinc-500" size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-white truncate">{clientName}</h4>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase shrink-0">
                      {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate line-clamp-1 italic">"{conv.lastMessage || 'Nouvelle conversation'}"</p>
                  {conv.unreadCount?.agent > 0 && (
                    <Badge variant="error" className="mt-1">{conv.unreadCount.agent}</Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      {!selectedConversation ? (
        <Card className="flex-1 flex flex-col items-center justify-center bg-zinc-900/20 border-dashed border-2 border-white/10">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-zinc-900 rounded-3xl shadow-xl flex items-center justify-center mx-auto text-zinc-600 border border-white/10">
              <MessageSquare size={40} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Aucune sélection</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Sélectionnez une conversation</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card noPadding className="flex-1 overflow-hidden relative shadow-xl bg-zinc-900/40 backdrop-blur-xl border-white/10 h-full" style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
          {/* Chat Header - Fixed at top */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/20 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-black text-emerald-500 border border-white/10 shadow-sm">
                {selectedConversation.client?.firstName?.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="font-black text-white leading-tight">
                  {selectedConversation.client ? `${selectedConversation.client.firstName} ${selectedConversation.client.lastName}` : 'Client'}
                </h3>
                <p className="text-xs text-zinc-500 flex items-center gap-2">
                  {isTyping ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      En train d'écrire...
                    </>
                  ) : (
                    <>
                      <span className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-zinc-600")}></span>
                      {isConnected ? 'En ligne' : 'Hors ligne'}
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-zinc-400 hover:bg-white/5 hover:text-emerald-500 rounded-lg transition-all border border-transparent hover:border-white/10"><Phone size={18} /></button>
              <button className="p-2 text-zinc-400 hover:bg-white/5 hover:text-emerald-500 rounded-lg transition-all border border-transparent hover:border-white/10"><Video size={18} /></button>
              <button className="p-2 text-zinc-400 hover:bg-white/5 hover:text-white rounded-lg transition-all border border-transparent hover:border-white/10"><MoreVertical size={18} /></button>
            </div>
          </div>

          {/* Messages - Scrollable middle section */}
          <div className="overflow-y-auto p-6 bg-zinc-950/20 scroll-smooth" style={{ minHeight: 0, willChange: 'scroll-position', transform: 'translateZ(0)' }}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-white/10">
                  <MessageSquare className="text-emerald-500" size={40} />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Nouvelle conversation</h3>
                <p className="text-sm text-zinc-500 max-w-md">
                  Commencez la conversation avec {selectedConversation.client?.firstName || 'le client'}. 
                  Vos messages apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender?._id === currentUserId || msg.sender === currentUserId;
                  return (
                    <div key={idx} className={cn("flex flex-col max-w-[80%]", isMe ? "items-end self-end ml-auto" : "items-start mr-auto")}>
                      <div className={cn(
                        "p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                        isMe ? "bg-emerald-500 text-white rounded-tr-none shadow-emerald-500/20" : "bg-zinc-800 border border-white/10 text-zinc-100 rounded-tl-none"
                      )}>
                        {msg.content}
                        {msg.fileUrl && (
                          <a 
                            href={msg.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={cn(
                              "mt-2 flex items-center gap-2 p-2 rounded-lg transition-colors",
                              isMe ? "bg-emerald-600 hover:bg-emerald-700" : "bg-zinc-700 hover:bg-zinc-600"
                            )}
                          >
                            <Paperclip size={16} />
                            <span className="text-xs">Voir le fichier joint</span>
                          </a>
                        )}
                      </div>
                      <div className={cn("flex items-center gap-2 mt-2", isMe ? "mr-1" : "ml-1")}>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && msg.read && <CheckCheck size={14} className="text-emerald-400" />}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area - Fixed at bottom */}
          <div className="p-4 border-t border-white/10 bg-zinc-950/20 backdrop-blur-md">
            {selectedFile && (
              <div className="mb-2 p-2 bg-zinc-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip size={16} className="text-emerald-500" />
                  <span className="text-sm text-white">{selectedFile.name}</span>
                  <span className="text-xs text-zinc-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 bg-zinc-800 border border-white/10 rounded-2xl p-2 focus-within:bg-zinc-900 focus-within:border-emerald-500/50 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.webp"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-zinc-400 hover:text-emerald-500 transition-colors"
                title="Joindre un fichier"
              >
                <Paperclip size={20} />
              </button>
              <input
                type="text"
                placeholder="Écrivez votre message..."
                className="flex-1 bg-transparent outline-none text-sm p-1 text-white placeholder:text-zinc-600"
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                disabled={sending || uploading || (!messageInput.trim() && !selectedFile)}
                className="bg-emerald-500 text-white p-3 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 active:scale-90 disabled:opacity-50"
              >
                {sending || uploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
