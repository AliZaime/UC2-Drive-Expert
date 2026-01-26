import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Table, Modal } from '../components/UI';
import { api } from '../api';
import { 
  Star, Zap, FileText, Calendar, PenTool, 
  Download, Clock, CheckCircle2, MapPin, 
  MessageSquare, ChevronRight, Plus, Trash2, Loader2
} from 'lucide-react';
import { StartNegotiationModal } from '../components/modals/StartNegotiationModal';

// ===========================
// ClientSaved Component
// ===========================
export const ClientSaved = () => {
  const [savedVehicles, setSavedVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleForNeg, setSelectedVehicleForNeg] = useState<any>(null);
  const fetchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchSavedVehicles();

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'saved_vehicles') {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = setTimeout(() => {
          fetchSavedVehicles();
        }, 500);
      }
    };

    // Listen for custom events from Vehicles component (same tab)
    const handleVehicleSaveChanged = () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(() => {
        fetchSavedVehicles();
      }, 500);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('vehicleSaveChanged', handleVehicleSaveChanged);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('vehicleSaveChanged', handleVehicleSaveChanged);
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, []);

  const fetchSavedVehicles = async () => {
    setLoading(true);
    try {
      const savedIds = JSON.parse(localStorage.getItem('saved_vehicles') || '[]');
      
      const response = await api.get<any>('/vehicles');
      const allVehicles = response.data.data?.vehicles || response.data.vehicles || [];
      
      const saved = allVehicles
        .filter((v: any) => {
          const vehicleId = String(v._id || v.id);
          return savedIds.some((savedId: any) => String(savedId) === vehicleId);
        })
        .map((v: any) => ({
          ...v,
          id: v._id || v.id,
          brand: v.make || v.brand,
          model: v.model || 'Modèle inconnu',
          year: v.year || new Date().getFullYear(),
          price: v.price || 0,
          agencyId: v.agency?._id || v.agency?.id || v.agencyId,
          image: v.images?.[0] || v.image || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
        }));
      
      setSavedVehicles(saved);
    } catch (err) {
      console.error('Failed to fetch saved vehicles', err);
      setSavedVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const removeSaved = (vehicleId: string) => {
    const savedIds = JSON.parse(localStorage.getItem('saved_vehicles') || '[]');
    const updated = savedIds.filter((id: any) => String(id) !== String(vehicleId));
    localStorage.setItem('saved_vehicles', JSON.stringify(updated));
    window.dispatchEvent(new Event('vehicleSaveChanged'));
    fetchSavedVehicles();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Véhicules Sauvegardés</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Retrouvez vos favoris</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-500">
          <Loader2 className="inline animate-spin" size={24} />
        </div>
      ) : savedVehicles.length === 0 ? (
        <Card className="py-16 text-center">
          <Star className="mx-auto mb-4 text-zinc-700" size={48} />
          <p className="text-zinc-500">Aucun véhicule sauvegardé.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="group hover:border-emerald-500/20 transition-all overflow-hidden">
              <div className="aspect-video bg-zinc-900 overflow-hidden">
                <img src={vehicle.image} alt={vehicle.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{vehicle.brand} {vehicle.model}</h3>
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">{vehicle.year}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-black text-emerald-500">{vehicle.price?.toLocaleString('fr-FR')} €</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="emerald" 
                    className="flex-1"
                    onClick={() => setSelectedVehicleForNeg(vehicle)}
                  >
                    <MessageSquare size={16} /> Négocier
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => removeSaved(vehicle.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedVehicleForNeg && (
        <StartNegotiationModal
          vehicle={selectedVehicleForNeg}
          onClose={() => setSelectedVehicleForNeg(null)}
        />
      )}
    </div>
  );
};

// ===========================
// ClientContracts Component
// ===========================
export const ClientContracts = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/my/contracts');
      const list = res.data?.data?.contracts || res.data?.contracts || [];
      const normalized = list.map((c: any) => ({
        id: c._id,
        vehicleName: c.vehicle?.model ? `${c.vehicle.brand || c.vehicle.make} ${c.vehicle.model}` : 'Véhicule',
        agencyName: c.agency?.name,
        status: c.status,
        price: c.finalPrice || c.price,
        signedAt: c.signedAt,
        deliveryDate: c.deliveryDate,
        terms: c.terms
      }));
      setContracts(normalized);
    } catch (err) {
      console.error('Failed to load contracts', err);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'signed': return { text: 'Signé', variant: 'success' };
      case 'pending': return { text: 'En attente', variant: 'warning' };
      case 'cancelled': return { text: 'Annulé', variant: 'error' };
      case 'completed': return { text: 'Terminé', variant: 'info' };
      default: return { text: status || 'En attente', variant: 'warning' };
    }
  };

  const formatDate = (value: string) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Mes Contrats</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Documents et accords</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-500">
          <Loader2 className="inline animate-spin" size={24} />
        </div>
      ) : contracts.length === 0 ? (
        <Card className="py-16 text-center">
          <FileText className="mx-auto mb-4 text-zinc-700" size={48} />
          <p className="text-zinc-500">Aucun contrat pour le moment.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {contracts.map((contract) => {
            const status = statusLabel(contract.status);
            return (
              <Card key={contract.id} className="p-8 group hover:border-emerald-500/20 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <FileText className="text-emerald-500" size={24} />
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">{contract.vehicleName}</h3>
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">{contract.agencyName || 'Agence'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      {contract.price && (
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Prix:</span>
                          <span className="text-emerald-500 font-black">{contract.price.toLocaleString('fr-FR')} €</span>
                        </div>
                      )}
                      {contract.signedAt && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span className="text-zinc-400 text-xs">Signé le {formatDate(contract.signedAt)}</span>
                        </div>
                      )}
                      {contract.deliveryDate && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-emerald-500" />
                          <span className="text-zinc-400 text-xs">Livraison prévue: {formatDate(contract.deliveryDate)}</span>
                        </div>
                      )}
                    </div>
                    {contract.terms && (
                      <p className="text-sm text-zinc-500 line-clamp-2">{contract.terms}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={status.variant as any}>{status.text}</Badge>
                    <Button variant="outline" size="sm">
                      <Download size={16} /> Télécharger
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ===========================
// ClientAppointments Component
// ===========================
export const ClientAppointments = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    vehicleId: '',
    type: 'test_drive',
    date: '',
    time: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchAppointments(), fetchVehicles()]);
    setLoading(false);
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/my/appointments');
      const list = res.data?.data?.appointments || res.data?.appointments || [];
      const normalized = list.map((a: any) => ({
        id: a._id,
        title: a.vehicle?.model ? `Essai ${a.vehicle.model}` : 'Rendez-vous',
        vehicleName: a.vehicle?.model,
        agencyName: a.agency?.name,
        vehicleId: a.vehicle?._id || a.vehicle?.id,
        agencyId: a.agency?._id || a.agency?.id,
        date: a.date,
        type: a.type,
        status: a.status,
        notes: a.notes
      }));
      setAppointments(normalized);
    } catch (err) {
      console.error('Failed to load appointments', err);
      setAppointments([]);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get<any>('/vehicles');
      const data = res.data?.data?.vehicles || res.data?.vehicles || [];
      const normalized = data.map((v: any) => ({
        id: v._id || v.id,
        label: `${v.brand || v.make || ''} ${v.model || ''}`.trim(),
        agencyId: v.agency?._id || v.agency?.id || v.agencyId,
      }));
      setVehicles(normalized);
      if (!form.vehicleId && normalized.length > 0) {
        setForm(prev => ({ ...prev, vehicleId: normalized[0].id }));
      }
    } catch (err) {
      console.error('Failed to load vehicles', err);
      setVehicles([]);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return { text: 'Confirmé', variant: 'success' };
      case 'pending': return { text: 'En attente', variant: 'warning' };
      case 'cancelled': return { text: 'Annulé', variant: 'error' };
      case 'completed': return { text: 'Terminé', variant: 'info' };
      default: return { text: status || 'En attente', variant: 'warning' };
    }
  };

  const formatDate = (value: string) => {
    const d = new Date(value);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (value: string) => {
    const d = new Date(value);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const toDateInputValue = (value: string) => {
    const d = new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const toTimeInputValue = (value: string) => {
    const d = new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const resetFormFields = () => {
    setForm({
      vehicleId: vehicles[0]?.id || '',
      type: 'test_drive',
      date: '',
      time: '',
      notes: ''
    });
  };

  const closeForm = () => {
    setEditingAppointmentId(null);
    setFormError('');
    resetFormFields();
    setFormOpen(false);
  };

  const openCreateForm = () => {
    setEditingAppointmentId(null);
    setFormError('');
    resetFormFields();
    setFormOpen(true);
  };

  const startReschedule = (apt: any) => {
    setEditingAppointmentId(apt.id);
    setForm({
      vehicleId: apt.vehicleId || vehicles[0]?.id || '',
      type: apt.type || 'test_drive',
      date: apt.date ? toDateInputValue(apt.date) : '',
      time: apt.date ? toTimeInputValue(apt.date) : '',
      notes: apt.notes || ''
    });
    setFormError('');
    setFormOpen(true);
  };

  const cancelAppointment = async (appointmentId: string) => {
    setActionLoadingId(appointmentId);
    try {
      await api.patch(`/my/appointments/${appointmentId}`, { status: 'cancelled' });
      await fetchAppointments();
    } catch (err) {
      console.error('Failed to cancel appointment', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmit = async () => {
    setFormError('');
    const isEditing = Boolean(editingAppointmentId);

    if (!form.date || !form.time) {
      setFormError('Choisissez une date et une heure.');
      return;
    }

    const vehicle = vehicles.find(v => v.id === form.vehicleId);
    if (!isEditing) {
      if (!form.vehicleId || !vehicle) {
        setFormError('Choisissez un véhicule.');
        return;
      }
      if (!vehicle.agencyId) {
        setFormError('Agence introuvable pour ce véhicule.');
        return;
      }
    }

    const isoDate = new Date(`${form.date}T${form.time}`);
    setSubmitting(true);
    try {
      if (isEditing && editingAppointmentId) {
        await api.patch(`/my/appointments/${editingAppointmentId}`, {
          date: isoDate,
          type: form.type,
          notes: form.notes,
        });
      } else if (vehicle) {
        await api.post('/my/appointments', {
          vehicle: vehicle.id,
          agency: vehicle.agencyId,
          date: isoDate,
          type: form.type,
          notes: form.notes,
        });
      }
      await fetchAppointments();
      closeForm();
    } catch (err) {
      console.error('Failed to book appointment', err);
      setFormError(isEditing ? 'Impossible de reprogrammer le rendez-vous.' : 'Impossible de créer le rendez-vous.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Mon Agenda</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Suivi des essais et livraisons</p>
        </div>
        <Button variant="outline" onClick={openCreateForm} className="border-dashed border-2 hover:border-emerald-500/50 text-zinc-400 hover:text-white">
          <Plus size={16} /> Programmer un rendez-vous
        </Button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-500">Chargement...</div>
      ) : appointments.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-zinc-500">Aucun rendez-vous pour le moment.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {appointments.map((apt) => {
            const status = statusLabel(apt.status);
            const canModify = apt.status === 'pending';
            return (
              <Card key={apt.id} className="p-8 group hover:border-emerald-500/20 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-8 flex-1">
                    <div className="flex flex-col items-center p-4 bg-zinc-950 border border-white/5 rounded-[2rem] min-w-[100px]">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{formatDate(apt.date).split(' ')[1]}</p>
                      <p className="text-3xl font-black text-white tracking-tighter">{formatDate(apt.date).split(' ')[0]}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-white tracking-tight uppercase">{apt.title}</h3>
                      <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">{apt.vehicleName || 'Véhicule'}</p>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                          <Clock size={14} className="text-emerald-500"/> {formatTime(apt.date)}
                        </div>
                        {apt.agencyName && (
                          <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            <MapPin size={14} className="text-emerald-500"/> {apt.agencyName}
                          </div>
                        )}
                      </div>
                      {apt.notes && <p className="text-sm text-zinc-400">{apt.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <Badge variant={status.variant as any}>{status.text}</Badge>
                     {canModify && (
                       <>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => startReschedule(apt)}
                           isLoading={submitting && editingAppointmentId === apt.id}
                         >
                           Reprogrammer
                         </Button>
                         <Button
                           variant="ghost"
                           size="sm"
                           className="text-red-400"
                           onClick={() => cancelAppointment(apt.id)}
                           isLoading={actionLoadingId === apt.id}
                         >
                           Annuler
                         </Button>
                       </>
                     )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={formOpen} onClose={closeForm} title={editingAppointmentId ? 'Reprogrammer un rendez-vous' : 'Programmer un rendez-vous'}>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-2">Véhicule</p>
            <select
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              value={form.vehicleId}
              disabled={Boolean(editingAppointmentId)}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
              {vehicles.length === 0 && <option>Aucun véhicule disponible</option>}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-2">Date</p>
              <input
                type="date"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-2">Heure</p>
              <input
                type="time"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-2">Type</p>
            <select
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="test_drive">Essai routier</option>
              <option value="meeting">Rendez-vous agence</option>
              <option value="delivery">Livraison</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-2">Notes (optionnel)</p>
            <textarea
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white min-h-[80px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closeForm}>Annuler</Button>
            <Button variant="emerald" isLoading={submitting} onClick={handleSubmit}>Confirmer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};