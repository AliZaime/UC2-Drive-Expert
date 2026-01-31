import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Button, Badge, cn } from '../components/UI';
import { Send, Phone, Video, MoreVertical, Paperclip, Smile, CheckCheck, User, DollarSign, Loader2, MessageSquare, Activity, Trash2, X } from 'lucide-react';
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

  // AI Metrics State
  const [metrics, setMetrics] = useState({
    sentiment: 0, // -1 to 1
    emotion: 'neutral',
    keyPoints: [] as string[],
    logs: [] as string[]
  });

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
        // Skip AI messages - they're already added via REST response
        const isAIMessage = data.message?.sender?.email === 'ai-bot@uc2.ma' || 
                           data.message?.sender?._id === process.env.NEXT_PUBLIC_AI_BOT_ID;
        
        if (isAIMessage) {
          console.log('⏭️ Skipping AI message from Socket.IO (already added via REST)');
          return;
        }
        
        // Prevent duplicates: check if message already exists
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === data.message._id);
          if (exists) {
            return prev; // Skip duplicate
          }
          return [...prev, data.message];
        });
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

    // Listen for AI Metrics
    socket.on('ai_metrics_update', (data) => {
        if (data.conversationId === selectedConversation._id) {
            setMetrics(prev => ({
                ...prev,
                sentiment: data.metrics.sentiment ?? prev.sentiment,
                emotion: data.metrics.emotion ?? prev.emotion,
                keyPoints: [...new Set([...prev.keyPoints, ...(data.metrics.keyPoints || [])])],
                logs: [...prev.logs, ...(data.metrics.analysis || [])].slice(-5) // Keep last 5 logs
            }));
        }
    });

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('messages_read');
      socket.off('ai_metrics_update');
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
      const response = await api.get<any>('/conversations');
      console.log('📡 API Response:', response);
      const convs = response.conversations || [];
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
    setMessages([]); // Clear messages immediately
    
    // Fetch messages
    try {
      const response = await api.get(`/conversations/${conversation._id}/messages`);
      // Handle both response formats: {messages} and {data: {messages}}
      const msgs = response.data?.messages || response.data?.data?.messages || [];
      console.log(`📝 Loaded ${msgs.length} messages for conversation ${conversation._id}`);
      setMessages(msgs);
      
      // Mark as read
      if (socket) {
        socket.emit('mark_read', { conversationId: conversation._id });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedConversation) return;

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
      
      // Send via REST API instead of Socket for better reliability
      const response = await api.post(`/conversations/${selectedConversation._id}/messages`, {
        content: messageInput.trim() || '📎 Fichier joint',
        fileUrl
      });

      // Add user message to local state immediately
      if (response.data?.message) {
        setMessages(prev => [...prev, response.data.message]);
      }
      
      // Add AI message if present (for AI conversations)
      if (response.data?.aiMessage) {
        setMessages(prev => [...prev, response.data.aiMessage]);
      }
      
      scrollToBottom();

      setMessageInput('');
      setSelectedFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
      setUploading(false);
      
      // Stop typing indicator
      if (socket && typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        socket.emit('stop_typing', { conversationId: selectedConversation._id });
      }
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

  const handleDeleteConversation = async (conversationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent selecting the conversation when clicking delete
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.')) {
      return;
    }

    try {
      await api.delete(`/conversations/${conversationId}`);
      toast.success('Conversation supprimée');
      
      // Remove from local state
      setConversations(prev => prev.filter(c => c._id !== conversationId));
      
      // If deleted conversation was selected, clear selection
      if (selectedConversation?._id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const currentUserId = JSON.parse(localStorage.getItem('auto_uc2_user') || '{}').id;

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6 animate-in fade-in duration-500">
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
            // Show the name of the other person in the conversation
            const isMe = (id: string) => id === currentUserId;
            const otherPerson = isMe(conv.client?._id) ? conv.agent : conv.client;
            const displayName = otherPerson?.name || 'Contact';
            
            return (
              <div
                key={conv._id}
                onClick={() => handleSelectConversation(conv)}
                className={cn(
                  "w-full p-4 rounded-xl flex gap-3 text-left transition-all border-2 cursor-pointer",
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
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate">{displayName}</h4>
                      {conv.subject && (
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest truncate">{conv.subject}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase shrink-0 ml-2">
                      {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate line-clamp-1 italic">"{conv.lastMessage || 'Nouvelle conversation'}"</p>
                  {conv.unreadCount?.agent > 0 && (
                    <Badge variant="error" className="mt-1">{conv.unreadCount.agent}</Badge>
                  )}
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(conv._id, e)}
                  className="shrink-0 w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-all group"
                  title="Supprimer la conversation"
                >
                  <Trash2 className="text-red-400 group-hover:text-red-300" size={16} />
                </button>
              </div>
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
        <>
            <Card noPadding className="flex-1 overflow-hidden relative shadow-xl bg-zinc-900/40 backdrop-blur-xl border-white/10 h-full flex flex-col">
              {/* Chat Header - Fixed at top */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/20 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-4">
                  {/* Determine who is the other person in the conversation */}
                  {(() => {
                    const isMe = (id: string) => id === currentUserId;
                    const otherPerson = isMe(selectedConversation.client?._id) ? selectedConversation.agent : selectedConversation.client;
                    const otherName = otherPerson?.name || 'Contact';
                    const otherInitial = otherName?.charAt(0) || 'C';
                    
                    return (
                      <>
                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-black text-emerald-500 border border-white/10 shadow-sm">
                          {otherInitial}
                        </div>
                        <div>
                          <h3 className="font-black text-white leading-tight">
                            {otherName}
                          </h3>
                          {selectedConversation?.subject && (
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                              {selectedConversation.subject}
                            </p>
                          )}
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
                      </>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-zinc-400 hover:bg-white/5 hover:text-emerald-500 rounded-lg transition-all border border-transparent hover:border-white/10"><Phone size={18} /></button>
                  <button className="p-2 text-zinc-400 hover:bg-white/5 hover:text-emerald-500 rounded-lg transition-all border border-transparent hover:border-white/10"><Video size={18} /></button>
                  <button className="p-2 text-zinc-400 hover:bg-white/5 hover:text-white rounded-lg transition-all border border-transparent hover:border-white/10"><MoreVertical size={18} /></button>
                </div>
              </div>

              {/* Messages - Scrollable middle section */}
              <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/20 scroll-smooth space-y-6">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-white/10">
                      <MessageSquare className="text-emerald-500" size={40} />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">Nouvelle conversation</h3>
                    <p className="text-sm text-zinc-500 max-w-md">
                      {(() => {
                        const isMe = (id: string) => id === currentUserId;
                        const otherPerson = isMe(selectedConversation.client?._id) ? selectedConversation.agent : selectedConversation.client;
                        const otherName = otherPerson?.name || 'votre contact';
                        return `Commencez la conversation avec ${otherName}. Vos messages apparaîtront ici.`;
                      })()}
                    </p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-white/10 bg-zinc-900/60">
                {/* Conversation Status Badge */}
                {selectedConversation?.status === 'closed' && (
                  <div className="mb-3 p-3 bg-gradient-to-r from-emerald-900/40 to-blue-900/40 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-bold text-emerald-400">
                        {selectedConversation?.negotiationStatus === 'accepted' ? '✅ Négociation conclue' : '❌ Négociation terminée'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">Cette conversation est en lecture seule. Vous pouvez consulter l'historique mais ne pouvez plus envoyer de messages.</p>
                  </div>
                )}
                
                {selectedFile && (
                  <div className="mb-3 p-3 bg-zinc-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip size={16} className="text-emerald-500" />
                      <span className="text-sm text-white">{selectedFile.name}</span>
                    </div>
                    <button onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-400">
                      <X size={16} />
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
                    disabled={selectedConversation?.status === 'closed'}
                    className="p-2.5 text-zinc-400 hover:text-emerald-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={selectedConversation?.status === 'closed' ? 'Conversation fermée' : 'Joindre un fichier'}
                  >
                    <Paperclip size={20} />
                  </button>
                  <input
                    type="text"
                    placeholder={selectedConversation?.status === 'closed' ? 'Conversation terminée - Lecture seule' : 'Écrivez votre message...'}
                    className="flex-1 bg-transparent outline-none text-sm p-1 text-white placeholder:text-zinc-600 disabled:cursor-not-allowed"
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && !selectedConversation?.status && handleSendMessage()}
                    disabled={selectedConversation?.status === 'closed'}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={sending || uploading || (!messageInput.trim() && !selectedFile) || selectedConversation?.status === 'closed'}
                    className="bg-emerald-500 text-white p-3 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={selectedConversation?.status === 'closed' ? 'Conversation fermée' : 'Envoyer'}
                  >
                    {sending || uploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
              </div>
            </Card>
            
            {/* Live Metrics Panel - Right */}
            <div className="w-80 shrink-0 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-xl flex flex-col">
                 <div className="p-4 border-b border-white/10 bg-purple-900/20">
                    <h2 className="font-black text-lg text-white tracking-tighter uppercase flex items-center gap-2">
                        <Activity size={18} className="text-purple-400" />
                        Live Metrics
                    </h2>
                    <p className="text-[10px] text-purple-300 font-bold uppercase tracking-widest mt-1">Analyse Agentique Temps Réel</p>
                 </div>
                 
                 <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                    {/* Sentiment Analysis */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sentiment Client</label>
                        <div className="p-4 bg-zinc-950/50 rounded-2xl border border-white/5 relative overflow-hidden">
                             <div className="flex justify-between items-end mb-2 relative z-10">
                                 <span className={cn(
                                     "text-3xl font-black",
                                     metrics.sentiment > 0.3 ? "text-emerald-500" : metrics.sentiment < -0.3 ? "text-red-500" : "text-yellow-500"
                                 )}>
                                    {Math.round((metrics.sentiment + 1) * 50)}%
                                 </span>
                                 <Smile className={cn(
                                     metrics.sentiment > 0.3 ? "text-emerald-500" : metrics.sentiment < -0.3 ? "text-red-500" : "text-yellow-500"
                                 )} size={24} />
                             </div>
                             <p className="text-xs text-zinc-400 relative z-10">
                                 Emotion: <span className="text-white font-bold capitalize">{metrics.emotion}</span>
                             </p>
                             <div 
                                className={cn("absolute bottom-0 left-0 h-1 transition-all duration-500", 
                                    metrics.sentiment > 0.3 ? "bg-emerald-500" : metrics.sentiment < -0.3 ? "bg-red-500" : "bg-yellow-500"
                                )} 
                                style={{ width: `${(metrics.sentiment + 1) * 50}%` }}
                             ></div>
                        </div>
                    </div>

                    {/* Deal Probability */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Probabilité de vente</label>
                        <div className="h-24 rounded-2xl bg-zinc-950/50 border border-white/5 flex items-center justify-center relative">
                             {/* Mock Gauge - Dynamic based on sentiment for now */}
                             <div className="w-20 h-10 border-t-4 border-l-4 border-r-4 border-blue-500 rounded-t-full relative">
                                  <div 
                                    className="absolute bottom-0 left-1/2 w-1 h-8 bg-white origin-bottom transition-all duration-700"
                                    style={{ transform: `translateX(-50%) rotate(${metrics.sentiment * 45}deg)` }}
                                  ></div>
                             </div>
                             <div className="absolute bottom-2 text-xs font-bold text-white">
                                 {metrics.sentiment > 0.5 ? 'Très Élevée' : metrics.sentiment > 0 ? 'Moyenne' : 'Faible'}
                             </div>
                        </div>
                    </div>

                    {/* Key Points */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Points Clés Détectés</label>
                        <div className="flex flex-wrap gap-2">
                            {metrics.keyPoints.length === 0 ? (
                                <span className="text-zinc-600 text-xs italic">En attente d'analyse...</span>
                            ) : (
                                metrics.keyPoints.map((point, idx) => (
                                    <Badge key={idx} variant="info">{point}</Badge>
                                ))
                            )}
                        </div>
                    </div>
                    
                    {/* System Logs */}
                    <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 font-mono text-[10px] text-zinc-500 space-y-1">
                        {metrics.logs.length === 0 ? (
                             <p className="text-zinc-700 italic">&gt; En attente de messages...</p>
                        ) : (
                            metrics.logs.map((log, idx) => (
                                <p key={idx}>{log}</p>
                            ))
                        )}
                    </div>
                 </div>
            </div>
        </>
      )}
    </div>
  );
};
