
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Button } from '../UI';
import { api } from '../../api';
import { Send, Check, AlertCircle, Loader2, User } from 'lucide-react';

interface AgencyUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

interface StartNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
  agencyId: string;
}

export const StartNegotiationModal: React.FC<StartNegotiationModalProps> = ({ isOpen, onClose, vehicleId, vehicleName, agencyId }) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AgencyUser | null>(null);
  const [existingConversation, setExistingConversation] = useState<any>(null);

  // Check for existing conversation and fetch assigned user
  useEffect(() => {
    if (isOpen && agencyId) {
      checkExistingConversation();
    }
  }, [isOpen, agencyId]);

  const checkExistingConversation = async () => {
    setLoadingUsers(true);
    try {
      const user = JSON.parse(localStorage.getItem('auto_uc2_user') || '{}');
      
      // Get all conversations for this user
      const conversationsRes = await api.get<any>('/conversations');
      
      // Handle response structure: {status, results, data: {conversations}}
      let conversations = [];
      if (conversationsRes.data?.conversations) {
        conversations = conversationsRes.data.conversations;
      } else if (conversationsRes.data?.data?.conversations) {
        conversations = conversationsRes.data.data.conversations;
      } else if (Array.isArray(conversationsRes.data)) {
        conversations = conversationsRes.data;
      }
      
      console.log('🔍 Checking conversations:', conversations.length);
      console.log('🔍 Looking for vehicleId:', vehicleId);
      
      // Look for existing conversation with this vehicle
      const existing = conversations.find((conv: any) => {
        console.log('   Conv vehicleId:', conv.vehicleId, 'Match:', String(conv.vehicleId) === String(vehicleId));
        return String(conv.vehicleId) === String(vehicleId);
      });

      if (existing) {
        console.log('✅ Found existing conversation:', existing._id);
        setExistingConversation(existing);
      } else {
        console.log('❌ No existing conversation, fetching assigned user');
        // No existing conversation, fetch the assigned user
        await fetchAssignedUser();
      }
    } catch (err: any) {
      console.error('Failed to check existing conversation:', err);
      // If check fails, try to fetch assigned user anyway
      await fetchAssignedUser();
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAssignedUser = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get<any>(`/public/agencies/${agencyId}/available-users`);
      // Response structure: {status: 'success', data: [...]}
      const users = response.data || [];
      if (users.length > 0) {
        setSelectedUser(users[0]);
      } else {
        setError('Aucun agent disponible dans cette agence');
      }
    } catch (err: any) {
      console.error('Failed to fetch assigned user:', err);
      setError('Impossible de charger l\'agent');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async () => {
    // If conversation already exists, just redirect to it
    if (existingConversation) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        navigate('/negotiations', { state: { conversationId: existingConversation._id } });
      }, 1000);
      return;
    }

    if (!selectedUser) {
      setError('Aucun agent assigné');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = JSON.parse(localStorage.getItem('auto_uc2_user') || '{}');
      
      // 1. Create Conversation
      const conversationRes = await api.post<any>('/conversations', {
        participantIds: [user.id, selectedUser.id],
        vehicleId: vehicleId,
        subject: `Intéressé par ${vehicleName}`
      });
      
      // Response structure: {status: 'success', data: { conversation: {...} }}
      const conversationId = conversationRes.data?.conversation?._id || conversationRes.data?._id;

      if (!conversationId) {
        throw new Error('Impossible de créer la conversation');
      }

      // 2. Add Initial Message
      if (message.trim()) {
        await api.post(`/conversations/${conversationId}/messages`, {
          content: message
        });
      }

      setSuccess(true);
      setTimeout(() => {
          onClose(); 
          setSuccess(false);
          setMessage('');
          setSelectedUser(null);
          // Redirect to conversations page
          navigate('/negotiations', { state: { conversationId } });
      }, 2000);
      
    } catch (err: any) {
      console.error(err);
      setError('Impossible de démarrer la conversation. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contacter l'agence">
      {success ? (
        <div className="flex flex-col items-center justify-center p-10 text-center animate-in zoom-in">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-500/30">
            <Check size={32} />
          </div>
          <h3 className="text-xl font-black text-white">
            {existingConversation ? 'Vous allez être redirigé...' : 'Conversation Démarrée !'}
          </h3>
          <p className="text-zinc-500 mt-2">
            {existingConversation ? 'Ouverture de la discussion existante...' : 'Vous allez être redirigé vers vos messages...'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Véhicule concerné</p>
            <p className="font-bold text-white">{vehicleName}</p>
          </div>

          {existingConversation ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">✓ Conversation existante</p>
              <p className="text-white text-sm">Vous avez déjà une discussion avec cette agence à propos de ce véhicule.</p>
            </div>
          ) : (
            <>
              {/* Agent Assignment */}
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1 mb-3">Agent assigné</label>
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-emerald-500" />
                  </div>
                ) : selectedUser ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                        <User size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-sm">{selectedUser.firstName} {selectedUser.lastName}</p>
                        <p className="text-[10px] text-zinc-400">{selectedUser.email}</p>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                        ✓ Assigné
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Aucun agent disponible</p>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1 mb-2">Votre Message</label>
                 <textarea
                    className="w-full px-5 py-3.5 bg-zinc-950/60 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all text-sm text-white placeholder:text-zinc-700 min-h-[100px] resize-none"
                    placeholder="Je suis intéressé par ce véhicule, est-il toujours disponible ?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                 />
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest">
                <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
             <Button variant="ghost" onClick={onClose}>Annuler</Button>
             <Button 
                variant="primary" 
                onClick={handleSubmit} 
                isLoading={loading || loadingUsers}
                disabled={(existingConversation ? false : !selectedUser) || (existingConversation ? false : loadingUsers)}
             >
                <Send size={16} /> {existingConversation ? 'Aller à la discussion' : 'Contacter'}
             </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
