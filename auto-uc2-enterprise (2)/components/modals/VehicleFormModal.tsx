
import React, { useState, useEffect } from 'react';
import { Modal, Input, Button } from '../UI';
import { api } from '../../api';
import { Upload, X, Loader2, Check, AlertCircle } from 'lucide-react';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any; // If present, we are in EDIT mode
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const isEditMode = !!initialData;
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    vin: '',
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    price: '',
    costPrice: '',
    marketValue: '',
    mileage: '',
    
    // Specs
    fuelType: 'Essence',
    transmission: 'Manuelle',
    color: '',
    doors: '5',
    seats: '5',
    engineSize: '',
    horsePower: '',
    
    // Inventory
    location: '',
    daysInStock: '0',
    
    status: 'Disponible',
    agency: '659c23a7e4b0a1d4f8e5c321', 
    description: ''
  });

  const [files, setFiles] = useState<File[]>([]);

  // Effect to reset or populate form
  useEffect(() => {
      if(isOpen) {
          if (initialData) {
              setFormData({
                  vin: initialData.vin || '',
                  make: initialData.make || initialData.brand || '',
                  model: initialData.model || '',
                  year: initialData.year?.toString() || new Date().getFullYear().toString(),
                  price: initialData.price?.toString() || '',
                  costPrice: initialData.costPrice?.toString() || '',
                  marketValue: initialData.marketValue?.toString() || '',
                  mileage: initialData.mileage?.toString() || '',
                  
                  // Specs (nested or fallback)
                  fuelType: initialData.specifications?.fuelType || initialData.fuelType || 'Essence',
                  transmission: initialData.specifications?.transmission || initialData.transmission || 'Manuelle',
                  color: initialData.specifications?.color || '',
                  doors: initialData.specifications?.doors?.toString() || '5',
                  seats: initialData.specifications?.seats?.toString() || '5',
                  engineSize: initialData.specifications?.engineSize || '',
                  horsePower: initialData.specifications?.horsePower?.toString() || '',
                  
                  // Inventory
                  location: initialData.inventory?.location || '',
                  daysInStock: initialData.inventory?.daysInStock?.toString() || '0',
                  
                  status: initialData.status || 'Disponible',
                  agency: initialData.agencyId || '659c23a7e4b0a1d4f8e5c321',
                  description: initialData.description || ''
              });
              setVehicleId(initialData.id || initialData._id);
              setStep(1); 
          } else {
              reset();
          }
          setError(null);
      }
  }, [isOpen, initialData]);

  const reset = () => {
      setStep(1);
      setVehicleId(null);
      setFiles([]);
      setFormData({
        vin: '',
        make: '',
        model: '',
        year: new Date().getFullYear().toString(),
        price: '',
        costPrice: '',
        marketValue: '',
        mileage: '',
        fuelType: 'Essence',
        transmission: 'Manuelle',
        color: '',
        doors: '5',
        seats: '5',
        engineSize: '',
        horsePower: '',
        location: '',
        daysInStock: '0',
        status: 'Disponible',
        agency: '659c23a7e4b0a1d4f8e5c321',
        description: ''
      });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmitDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        vin: formData.vin,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice) || 0,
        marketValue: parseFloat(formData.marketValue) || 0,
        mileage: parseInt(formData.mileage) || 0,
        
        specifications: {
            fuelType: formData.fuelType,
            transmission: formData.transmission,
            color: formData.color,
            doors: parseInt(formData.doors),
            seats: parseInt(formData.seats),
            engineSize: formData.engineSize,
            horsePower: parseInt(formData.horsePower) || 0
        },
        
        inventory: {
            location: formData.location,
            daysInStock: parseInt(formData.daysInStock) || 0
        },
        
        status: formData.status,
        agency: formData.agency
      };

      let response;
      if (isEditMode && vehicleId) {
          response = await api.put<any>(`/vehicles/${vehicleId}`, payload);
      } else {
          response = await api.post<any>('/vehicles', payload);
          setVehicleId(response.data._id || response.data.vehicle._id);
      }
      
      // If editing, we might be done unless user wants to update photos
      // If creating, we MUST go to step 2/optional step 2
      // Let's allow step 2 for both
      setStep(2);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPhotos = async () => {
    if (!vehicleId || files.length === 0) {
        onSuccess();
        onClose();
        return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('photos', file);
      });

      const token = localStorage.getItem('auto_uc2_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/vehicles/${vehicleId}/photos`, {
         method: 'POST',
         headers: {
             'Authorization': `Bearer ${token}`
         },
         body: formData
      });

      if (!response.ok) {
          throw new Error('Erreur upload photos');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Sauvegarde effectuée, mais l'upload des photos a échoué.");
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = formData.vin && formData.make && formData.model && formData.price;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Modifier Véhicule" : "Nouveau Véhicule"}>
      <div className="space-y-6">
        {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <AlertCircle size={16} />
                {error}
            </div>
        )}

        {/* Status Steps */}
        <div className="flex items-center gap-2 mb-8">
            <div className={`flex-1 h-1 rounded-full transition-all ${step >= 1 ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
            <div className={`flex-1 h-1 rounded-full transition-all ${step >= 2 ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
        </div>

        {step === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="vin" label="Numéro VIN" placeholder="VIN..." value={formData.vin} onChange={handleChange} disabled={isEditMode} />
                <div className="grid grid-cols-2 gap-4">
                     <Input name="make" label="Marque" placeholder="Ex: Audi" value={formData.make} onChange={handleChange} />
                     <Input name="model" label="Modèle" placeholder="Ex: Q8" value={formData.model} onChange={handleChange} />
                </div>
                
                <Input name="year" type="number" label="Année" placeholder="2024" value={formData.year} onChange={handleChange} />
                <Input name="mileage" type="number" label="Kilométrage" placeholder="0" value={formData.mileage} onChange={handleChange} />
                
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <Input name="price" type="number" label="Prix de vente (MAD)" placeholder="0.00" value={formData.price} onChange={handleChange} />
                    <Input name="costPrice" type="number" label="Coût d'achat (MAD)" placeholder="0.00" value={formData.costPrice} onChange={handleChange} />
                </div>
                
                 <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <Input name="marketValue" type="number" label="Valeur Marché (MAD)" placeholder="Est. 0.00" value={formData.marketValue} onChange={handleChange} />
                </div>
                
                <h3 className="text-white font-bold md:col-span-2 mt-2">Spécifications</h3>
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                     <Input name="color" label="Couleur" placeholder="Ex: Noir" value={formData.color} onChange={handleChange} />
                     <Input name="engineSize" label="Moteur" placeholder="Ex: 2.0L TDI" value={formData.engineSize} onChange={handleChange} />
                     <Input name="horsePower" type="number" label="Chevaux (ch)" placeholder="150" value={formData.horsePower} onChange={handleChange} />
                     <div className="grid grid-cols-2 gap-2">
                        <Input name="doors" type="number" label="Portes" value={formData.doors} onChange={handleChange} />
                        <Input name="seats" type="number" label="Sièges" value={formData.seats} onChange={handleChange} />
                     </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Carburant</label>
                    <div className="flex gap-2">
                        {[
                          { val: 'Essence', label: 'Essence' },
                          { val: 'Diesel', label: 'Diesel' },
                          { val: 'Hybride', label: 'Hybride' },
                          { val: 'Électrique', label: 'Électrique' }
                        ].map(fuel => (
                            <button
                                key={fuel.val}
                                onClick={() => setFormData(prev => ({ ...prev, fuelType: fuel.val }))}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex-1 ${formData.fuelType === fuel.val ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}
                            >
                                {fuel.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Boîte de Vitesse</label>
                    <div className="flex gap-2">
                        {[
                          { val: 'Automatique', label: 'Automatique' },
                          { val: 'Manuelle', label: 'Manuelle' }
                        ].map(trans => (
                            <button
                                key={trans.val}
                                onClick={() => setFormData(prev => ({ ...prev, transmission: trans.val }))}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex-1 ${formData.transmission === trans.val ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}
                            >
                                {trans.label}
                            </button>
                        ))}
                    </div>
                </div>
                
                <h3 className="text-white font-bold md:col-span-2 mt-2">Inventaire</h3>
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                     <Input name="location" label="Emplacement" placeholder="Ex: Showroom A" value={formData.location} onChange={handleChange} />
                     <Input name="daysInStock" type="number" label="Jours en stock" value={formData.daysInStock} onChange={handleChange} />
                </div>
            </div>
        ) : (
            <div className="space-y-6 text-center py-10">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={40} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white">{isEditMode ? "Véhicule Mis à jour !" : "Véhicule Créé !"}</h3>
                    <p className="text-zinc-500 mt-2">ID: {vehicleId}</p>
                </div>
                
                <div className="border-2 border-dashed border-zinc-800 rounded-3xl p-8 hover:border-emerald-500/50 transition-colors bg-zinc-900/20 group relative">
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-zinc-900 rounded-full group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <Upload size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-white mb-1">{files.length > 0 ? `${files.length} fichier(s) sélectionné(s)` : "Mettre à jour les photos (Glissez ici)"}</p>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest">JPG, PNG, WEBP</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="pt-6 border-t border-white/5 flex gap-3">
             {step === 1 ? (
                 <>
                    <Button variant="ghost" onClick={onClose} className="flex-1">Annuler</Button>
                    <Button variant="emerald" onClick={handleSubmitDetails} isLoading={loading} disabled={!isStep1Valid} className="flex-1">
                        {isEditMode ? "Sauvegarder les modifications" : "Créer le véhicule"}
                    </Button>
                 </>
             ) : (
                 <>
                    <Button 
                        variant={files.length === 0 ? "emerald" : "ghost"} 
                        onClick={() => { onSuccess(); onClose(); }} 
                        className="flex-1"
                    >
                        {files.length === 0 ? "Terminer" : "Passer / Ne pas changer"}
                    </Button>
                    
                    {files.length > 0 && (
                        <Button variant="emerald" onClick={handleSubmitPhotos} isLoading={loading} className="flex-1">
                            Uploader & Terminer
                        </Button>
                    )}
                 </>
             )}
        </div>

      </div>
    </Modal>
  );
};
