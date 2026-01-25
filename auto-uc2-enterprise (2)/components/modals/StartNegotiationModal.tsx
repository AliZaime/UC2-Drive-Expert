
import React, { useState } from 'react';
import { Modal, Input, Button } from '../UI';
import { api } from '../../api';
import { Send, Check, AlertCircle } from 'lucide-react';

interface StartNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
  agencyId: string;
}

export const StartNegotiationModal: React.FC<StartNegotiationModalProps> = ({ isOpen, onClose, vehicleId, vehicleName, agencyId }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = JSON.parse(localStorage.getItem('auto_uc2_user') || '{}');
      
      // 1. Create Negotiation
      const res = await api.post<any>('/negotiations', {
        vehicle: vehicleId,
        client: user.id,
        agency: agencyId 
      });
      
      const negotiationId = res.data._id || res.data.data.negotiation._id;

      // 2. Add Initial Message
      await api.post(`/negotiations/${negotiationId}/messages`, {
        content: message
      });

      setSuccess(true);
      setTimeout(() => {
          onClose(); 
          setSuccess(false);
          setMessage('');
      }, 2000);
      
    } catch (err: any) {
      console.error(err);
      setError("Impossible de démarrer la conversation. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Démarrer une négociation">
      {success ? (
        <div className="flex flex-col items-center justify-center p-10 text-center animate-in zoom-in">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-500/30">
            <Check size={32} />
          </div>
          <h3 className="text-xl font-black text-white">Message Envoyé !</h3>
          <p className="text-zinc-500 mt-2">Un agent vous répondra sous peu.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Véhicule concerné</p>
            <p className="font-bold text-white">{vehicleName}</p>
          </div>

          <div>
             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1 mb-2">Votre Message</label>
             <textarea
                className="w-full px-5 py-3.5 bg-zinc-950/60 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all text-sm text-white placeholder:text-zinc-700 min-h-[100px] resize-none"
                placeholder="Je suis intéressé par ce véhicule, est-il toujours disponible ?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
             />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest">
                <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
             <Button variant="ghost" onClick={onClose}>Annuler</Button>
             <Button variant="primary" onClick={handleSubmit} isLoading={loading} disabled={!message.trim()}>
                <Send size={16} /> Envoyer
             </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
