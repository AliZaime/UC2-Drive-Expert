
import React, { useState, useEffect } from 'react';
import { 
  Plus, Filter, Search, Edit2, Trash2, Eye, 
  Sparkles, Globe, ExternalLink, Loader2, Camera, 
  Wrench, Zap, TrendingUp, Info 
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useNavigate } from 'react-router-dom';

import { api } from '../api';
import { Vehicle, UserRole } from '../types';
import { Protect } from '../components/Protect';
import { Button, Card, Table, Badge, useToast } from '../components/UI';
import { VehicleFormModal } from '../components/modals/VehicleFormModal';
import { ServiceModal } from '../components/modals/ServiceModal';
import { StartNegotiationModal } from '../components/modals/StartNegotiationModal';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';
import { MOCK_VEHICLES } from '../constants';
export const Vehicles = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [savedVehicles, setSavedVehicles] = useState<string[]>(() => {
    const saved = localStorage.getItem('saved_vehicles');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ text: string, links: any[] } | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [servicingVehicle, setServicingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicleForNeg, setSelectedVehicleForNeg] = useState<any>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, vehicleId: string | null }>({
    isOpen: false,
    vehicleId: null
  });

  // Debounce timer for search
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await api.get<any>('/vehicles');
      const data = response.data.data ? response.data.data.vehicles : (response.data.vehicles || []);

      const normalized = data.map((v: any) => ({
        ...v,
        id: v._id || v.id,
        brand: v.make || v.brand,
        image: v.images?.[0] || v.image || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
        agencyId: v.agency?._id || v.agency?.id || v.agencyId,
        agency: typeof v.agency === 'object' ? {
          id: v.agency._id || v.agency.id,
          name: v.agency.name,
          address: v.agency.address,
          phone: v.agency.phone,
          email: v.agency.email
        } : v.agency
      }));
      setVehicles(normalized);
      setFilteredVehicles(normalized);
    } catch (err) {
      console.error('Failed to fetch vehicles', err);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // If query is empty, show all vehicles
    if (!query || !query.trim()) {
      setFilteredVehicles(vehicles);
      setSearchLoading(false);
      return;
    }

    // Debounce search API call
    setSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
          setFilteredVehicles(vehicles);
          setSearchLoading(false);
          return;
        }

        const response = await api.get<any>('/vehicles/search', {
          params: { query: trimmedQuery }
        });
        const data = response.data.data ? response.data.data.vehicles : (response.data.vehicles || []);

        const normalized = data.map((v: any) => ({
          ...v,
          id: v._id || v.id,
          brand: v.make || v.brand,
          image: v.images?.[0] || v.image || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
          agencyId: v.agency?._id || v.agency?.id || v.agencyId,
          agency: typeof v.agency === 'object' ? {
            id: v.agency._id || v.agency.id,
            name: v.agency.name,
            address: v.agency.address,
            phone: v.agency.phone,
            email: v.agency.email
          } : v.agency
        }));
        setFilteredVehicles(normalized);
      } catch (err) {
        console.error('Search failed', err);
        addToast('Erreur lors de la recherche', 'error');
      } finally {
        setSearchLoading(false);
      }
    }, 300); // Wait 300ms after user stops typing
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    localStorage.setItem('saved_vehicles', JSON.stringify(savedVehicles));
  }, [savedVehicles]);

  const performMarketAnalysis = async (vehicle: any) => {
    setAnalyzing(vehicle.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyse la valeur de marché pour une ${vehicle.brand} ${vehicle.model} de ${vehicle.year}. Notre prix est de ${vehicle.price}€. Est-ce compétitif ? Donne 3 points clés.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });

      setAnalysisResult({
        text: response.text || "Analyse indisponible.",
        links: (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
      });
    } catch (error) {
      setAnalysisResult({ text: "Erreur de connexion aux serveurs IA.", links: [] });
    } finally {
      setAnalyzing(null);
    }
  };

  const toggleSaveVehicle = (vehicleId: string) => {
    if (savedVehicles.includes(vehicleId)) {
      setSavedVehicles(savedVehicles.filter(id => id !== vehicleId));
      addToast('Véhicule retiré de sauvegardé', 'success');
    } else {
      setSavedVehicles([...savedVehicles, vehicleId]);
      addToast('Véhicule ajouté à sauvegardé', 'success');
    }
    
    // Dispatch custom event to notify other components (e.g., ClientSpace)
    window.dispatchEvent(new Event('vehicleSaveChanged'));
  };

  const requestDelete = (id: string) => {
      setDeleteConfirmation({ isOpen: true, vehicleId: id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirmation.vehicleId;
    if (!id) return;

    // Optimistic update
    const previousVehicles = [...vehicles];
    setVehicles(prev => prev.filter(v => v.id !== id));

    try {
      await api.delete(`/vehicles/${id}`);
      addToast("Véhicule supprimé du stock", 'success');
    } catch (err) {
      console.error('Delete failed', err);
      // Revert
      setVehicles(previousVehicles);
      addToast("Erreur: Suppression impossible", 'error');
    }
    setDeleteConfirmation({ isOpen: false, vehicleId: null }); // Close modal after action
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Global Fleet Matrix</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Gestion centralisée des actifs automobiles</p>
        </div>
        <Protect roles={[UserRole.MANAGER, UserRole.ADMIN, UserRole.USER]}>
          <Button variant="emerald" className="px-8 shadow-2xl shadow-emerald-500/20" onClick={() => { setEditingVehicle(null); setIsFormModalOpen(true); }}>
            <Plus size={18} /> Intégrer un véhicule
          </Button>
        </Protect>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-emerald-500/10 bg-emerald-500/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-500"><TrendingUp size={20} /></div>
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Valeur Stock</p>
              <p className="text-xl font-black text-white">4.2M €</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-500"><Zap size={20} /></div>
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Rotation Moyenne</p>
              <p className="text-xl font-black text-white">18 Jours</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col lg:flex-row gap-6 bg-zinc-950/20">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => performSearch(e.target.value)}
              placeholder="Rechercher par VIN, Marque ou Modèle..."
              className="w-full pl-14 pr-6 py-4 bg-zinc-900/40 border border-white/5 rounded-2xl outline-none focus:border-emerald-500/30 text-xs font-bold uppercase tracking-widest text-white transition-all"
            />
          </div>
        </div>

        <Table headers={['Unité', 'Audit IA', 'Technique', 'Prix', 'Statut', 'Actions']}>
          {loading ? (
            <tr>
              <td colSpan={6} className="py-20 text-center">
                <Loader2 size={40} className="animate-spin text-emerald-500 mx-auto opacity-50" />
                <p className="mt-4 text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Synchronisation avec la Matrice...</p>
              </td>
            </tr>
          ) : filteredVehicles.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-20 text-center text-zinc-500 italic">
                {searchQuery ? 'Aucun véhicule trouvé pour votre recherche.' : 'Aucun véhicule disponible dans la base.'}
              </td>
            </tr>
          ) : filteredVehicles.map(v => (
            <tr key={v.id} className="group hover:bg-white/[0.02] transition-all">
              <td className="px-8 py-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-14 rounded-xl overflow-hidden border border-white/10 group-hover:border-emerald-500/30 transition-all">
                    <img src={v.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={v.model} />
                  </div>
                  <div>
                    <p className="font-black text-white text-sm tracking-tight">{v.brand} {v.model}</p>
                    <p className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase">{v.year} • ID: {v.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6">
                <button
                  onClick={() => performMarketAnalysis(v)}
                  disabled={analyzing === v.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
                >
                  {analyzing === v.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  Check Marché
                </button>
              </td>
              <td className="px-8 py-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-400">{v.mileage.toLocaleString()} KM</p>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{v.fuelType}</p>
                  <p className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest mt-2">
                    🏢 {v.agency?.name || 'Non assignée'}
                  </p>
                </div>
              </td>
              <td className="px-8 py-6">
                <p className="text-lg font-black text-white tracking-tighter">{v.price.toLocaleString()}€</p>
              </td>
              <td className="px-8 py-6">
                <Badge variant={v.status === 'available' ? 'success' : 'warning'}>{v.status}</Badge>
              </td>
              <td className="px-8 py-6 text-right">
                <Protect roles={[UserRole.CLIENT]}>
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setSelectedVehicleForNeg(v)}
                      className="px-4 py-2 text-emerald-400 hover:text-white bg-emerald-500/10 rounded-xl border border-emerald-500/20 hover:bg-emerald-500 transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                        Contacter
                    </button>
                    <button 
                      onClick={() => toggleSaveVehicle(v.id)}
                      className={`p-3 rounded-xl border transition-all ${
                        savedVehicles.includes(v.id)
                          ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                          : 'bg-zinc-950 text-zinc-600 border-white/5 hover:text-amber-400'
                      }`}
                      title={savedVehicles.includes(v.id) ? 'Retirer de ma sélection' : 'Ajouter à ma sélection'}
                    >
                        {savedVehicles.includes(v.id) ? <Trash2 size={16} /> : <Zap size={16} />}
                    </button>
                  </div>
                </Protect>
                <Protect roles={[UserRole.MANAGER, UserRole.ADMIN, UserRole.USER]}>
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => navigate(`/vehicles/${v.id}`)}
                      className="p-3 text-zinc-600 hover:text-white bg-zinc-950 rounded-xl border border-white/5"
                    >
                        <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => { setEditingVehicle(v); setIsFormModalOpen(true); }}
                      className="p-3 text-zinc-600 hover:text-white bg-zinc-950 rounded-xl border border-white/5 disabled:opacity-50"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => setServicingVehicle(v)}
                      className="p-3 text-zinc-600 hover:text-blue-400 bg-zinc-950 rounded-xl border border-white/5"
                    >
                        <Wrench size={16} />
                    </button>
                    <button 
                      onClick={() => requestDelete(v.id)}
                      className="p-3 text-zinc-600 hover:text-red-500 bg-zinc-950 rounded-xl border border-white/5 hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </Protect>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* Create/Edit Vehicle Modal */}
      <VehicleFormModal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditingVehicle(null); }}
        initialData={editingVehicle}
        onSuccess={() => {
            fetchVehicles();
            addToast(editingVehicle ? "Véhicule mis à jour" : "Véhicule créé", 'success');
        }}
      />
      
      {/* Service Modal */}
      {servicingVehicle && (
        <ServiceModal
            isOpen={!!servicingVehicle}
            onClose={() => setServicingVehicle(null)}
            vehicle={servicingVehicle}
            onSuccess={() => {
                fetchVehicles();
                addToast("Statut mis à jour", 'success');
            }}
        />
      )}

      {/* Start Negotiation Modal */}
      {selectedVehicleForNeg && (
          <StartNegotiationModal
            isOpen={!!selectedVehicleForNeg}
            onClose={() => setSelectedVehicleForNeg(null)}
            vehicleId={selectedVehicleForNeg.id}
            vehicleName={`${selectedVehicleForNeg.brand} ${selectedVehicleForNeg.model}`}
            agencyId={selectedVehicleForNeg.agency?.id || selectedVehicleForNeg.agencyId || '659c23a7e4b0a1d4f8e5c321'}
          />
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, vehicleId: null })}
        onConfirm={confirmDelete}
        title="Supprimer le véhicule ?"
        message="Cette action est irréversible. Le véhicule sera définitivement retiré du stock."
        confirmLabel="Supprimer"
      />
    </div>
  );
};
