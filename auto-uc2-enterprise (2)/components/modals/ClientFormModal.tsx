
import React, { useState } from 'react';
import { Modal, Input, Button, useToast } from '../UI';
import { api } from '../../api';
import { Loader2, User, Mail, Phone, Tag } from 'lucide-react';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'Lead',
    tags: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        status: formData.status,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      };

      // Only add phone if provided
      if (formData.phone) {
        payload.phone = formData.phone;
      }

      await api.post('/clients', payload);
      addToast('Client créé avec succès', 'success');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        status: 'Lead',
        tags: '',
        notes: ''
      });
    } catch (err: any) {
      console.error(err);
      addToast(err.response?.data?.message || 'Erreur lors de la création du client', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau Client">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            name="firstName"
            label="Prénom"
            placeholder="Jean"
            value={formData.firstName}
            onChange={handleChange}
            required
            icon={User}
          />
          <Input
            name="lastName"
            label="Nom"
            placeholder="Dupont"
            value={formData.lastName}
            onChange={handleChange}
            required
            icon={User}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="jean.dupont@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            icon={Mail}
          />
          <Input
            name="phone"
            type="tel"
            label="Téléphone"
            placeholder="+33 6 12 34 56 78"
            value={formData.phone}
            onChange={handleChange}
            icon={Phone}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Statut</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/10 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all backdrop-blur-sm"
            >
              <option value="Lead">Lead</option>
              <option value="Prospect">Prospect</option>
              <option value="Active">Active</option>
              <option value="Customer">Customer</option>
            </select>
          </div>
          <Input
            name="tags"
            label="Tags (séparés par virgule)"
            placeholder="VIP, Urgent"
            value={formData.tags}
            onChange={handleChange}
            icon={Tag}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Création...
              </>
            ) : (
              'Créer le client'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
