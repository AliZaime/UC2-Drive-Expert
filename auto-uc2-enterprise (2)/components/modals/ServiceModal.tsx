
import React, { useState } from 'react';
import { Modal, Button } from '../UI';
import { api } from '../../api';
import { Settings, Check, AlertCircle } from 'lucide-react';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: any;
  onSuccess: () => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, vehicle, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(vehicle ? vehicle.status : 'available');

  const statuses = [
      { val: 'available', label: 'Disponible', color: 'bg-emerald-500' },
      { val: 'maintenance', label: 'En Maintenance', color: 'bg-amber-500' },
      { val: 'reserved', label: 'Réservé', color: 'bg-blue-500' },
      { val: 'sold', label: 'Vendu', color: 'bg-zinc-500' },
      { val: 'incoming', label: 'Arrivage', color: 'bg-purple-500' }
  ];

  const handleUpdateStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/vehicles/${vehicle.id}`, { status });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Échec de la mise à jour du statut.");
    } finally {
      setLoading(false);
    }
  };

  if (!vehicle) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestion Service">
      <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
              <div className="w-16 h-12 rounded-lg bg-zinc-800 overflow-hidden">
                  <img src={vehicle.image} className="w-full h-full object-cover" />
              </div>
              <div>
                  <h3 className="font-bold text-white text-sm">{vehicle.brand} {vehicle.model}</h3>
                  <p className="text-xs text-zinc-500">VIN: {vehicle.vin || vehicle.id}</p>
              </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold uppercase">
                {error}
            </div>
          )}

          <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Statut du Véhicule</label>
              <div className="grid grid-cols-1 gap-2">
                  {statuses.map(s => (
                      <button
                        key={s.val}
                        onClick={() => setStatus(s.val)}
                        className={`p-4 rounded-xl border flex items-center justify-between transition-all ${status === s.val ? 'bg-zinc-800 border-white/20' : 'bg-transparent border-white/5 hover:bg-white/5'}`}
                      >
                          <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${s.color}`} />
                              <span className={`text-xs font-bold uppercase tracking-wider ${status === s.val ? 'text-white' : 'text-zinc-500'}`}>{s.label}</span>
                          </div>
                          {status === s.val && <Check size={16} className="text-white" />}
                      </button>
                  ))}
              </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1">Annuler</Button>
            <Button variant="primary" onClick={handleUpdateStatus} isLoading={loading} className="flex-1">
                Mettre à jour
            </Button>
          </div>
      </div>
    </Modal>
  );
};
