
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Button } from '../UI';
import { api } from '../../api';
import { Send, Check, AlertCircle, Loader2, Bot, Zap } from 'lucide-react';

interface StartAINegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
  agencyId: string;
}

export const StartAINegotiationModal: React.FC<StartAINegotiationModalProps> = ({ isOpen, onClose, vehicleId, vehicleName, agencyId }) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingConversation, setExistingConversation] = useState<any>(null);

  // Check for existing AI conversation
  useEffect(() => {
    if (isOpen) {
      checkExistingAiConversation();
    }
  }, [isOpen]);

  const checkExistingAiConversation = async () => {
    try {
      const conversationsRes = await api.get<any>('/conversations');
      let conversations = [];
      if (conversationsRes.data?.conversations) {
        conversations = conversationsRes.data.conversations;
      } else if (conversationsRes.data?.data?.conversations) {
        conversations = conversationsRes.data.data.conversations;
      } else if (Array.isArray(conversationsRes.data)) {
        conversations = conversationsRes.data;
      }
      
      // Look for existing conversation with this vehicle AND isAI=true (simulated for now by subject or metadata)
      const existing = conversations.find((conv: any) => {
        return String(conv.vehicleId) === String(vehicleId) && (conv.subject?.includes('IA') || conv.isAiNegotiation);
      });

      if (existing) {
        setExistingConversation(existing);
      }
    } catch (err: any) {
      console.error('Failed to check existing AI conversation:', err);
    }
  };

  const handleSubmit = async () => {
    if (existingConversation) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        navigate('/negotiations', { state: { conversationId: existingConversation._id } });
      }, 1000);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = JSON.parse(localStorage.getItem('auto_uc2_user') || '{}');
      
      // 1. Create Conversation with AI Flag
      // Note: The backend needs to support this. For now we use the same endpoint 
      // but we will mark it via subject or a specific flag if backend supported it.
      // We will assume the backend assigns a "Bot" agent or we just use a placeholder ID for now.
      // Ideally, the backend should handle "participantIds" where one is the System AI.
      
      // For this frontend-first step, we'll try to create a conversation subject starting with [IA]
      const conversationRes = await api.post<any>('/conversations', {
        participantIds: [user.id, agencyId], // Fallback to agency manager or similar if no specific bot ID
        vehicleId: vehicleId,
        subject: `[IA] Négociation pour ${vehicleName}`,
        isAiNegotiation: true // Custom flag to be handled by backend or ignored
      });
      
      const conversationId = conversationRes.data?.conversation?._id || conversationRes.data?._id;

      if (!conversationId) {
        throw new Error('Impossible de créer la session de négociation');
      }

      // 2. Add Initial Message
      if (message.trim()) {
        await api.post(`/conversations/${conversationId}/messages`, {
          content: message
        });
      } else {
         // Auto-start message
         await api.post(`/conversations/${conversationId}/messages`, {
          content: "Bonjour, je souhaite négocier le prix de ce véhicule avec l'IA."
        });
      }

      setSuccess(true);
      setTimeout(() => {
          onClose(); 
          setSuccess(false);
          setMessage('');
          navigate('/negotiations', { state: { conversationId } });
      }, 2000);
      
    } catch (err: any) {
      console.error(err);
      setError('Impossible de démarrer la négociation. L\'agence n\'a peut-être pas activé ce service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Négociation Intelligente">
      {success ? (
        <div className="flex flex-col items-center justify-center p-10 text-center animate-in zoom-in">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-purple-600/30">
            <Zap size={32} fill="currentColor" />
          </div>
          <h3 className="text-xl font-black text-white">
            {existingConversation ? 'Reprise de la négociation...' : 'Session IA Initialisée !'}
          </h3>
          <p className="text-zinc-500 mt-2">
            Notre agent virtuel analyse votre dossier...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shrink-0">
                 <Bot size={24} className="text-white" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">Mode Automatique</p>
                <p className="font-bold text-white text-sm">Négociation instantanée 24/7</p>
                <p className="text-xs text-zinc-400">Obtenez une offre en temps réel basée sur le marché.</p>
            </div>
          </div>

          <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Véhicule Cible</p>
            <p className="font-bold text-white">{vehicleName}</p>
          </div>

          {existingConversation ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">✓ Session Active</p>
              <p className="text-white text-sm">Une négociation est déjà en cours pour ce véhicule.</p>
            </div>
          ) : (
            <div>
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1 mb-2">Votre Offre / Message (Optionnel)</label>
                 <textarea
                    className="w-full px-5 py-3.5 bg-zinc-950/60 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/30 transition-all text-sm text-white placeholder:text-zinc-700 min-h-[100px] resize-none"
                    placeholder="Ex: Je propose 180,000 DH si l'achat se fait cette semaine..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                 />
            </div>
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
                isLoading={loading}
                className="bg-purple-600 hover:bg-purple-700 border-purple-600 text-white"
             >
                <Zap size={16} fill="currentColor" /> {existingConversation ? 'Continuer' : 'Lancer Négociation'}
             </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
