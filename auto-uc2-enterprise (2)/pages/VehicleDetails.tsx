
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Button, Card, Badge, useToast, Modal } from '../components/UI';
import { ArrowLeft, MapPin, Calendar, Fuel, Gauge, PenTool, Trash2, ShieldCheck, Activity, Share2, Printer, Camera, Sliders, AlertTriangle } from 'lucide-react';
import { Vehicle } from '../types';
import { VehicleFormModal } from '../components/modals/VehicleFormModal';
import { ServiceModal } from '../components/modals/ServiceModal';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';

export const VehicleDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string>('');
    const [analysisText, setAnalysisText] = useState("");
    const isDeletingRef = React.useRef(false); // Track deletion status
    
    // Action States
    
    // Action States
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isServiceOpen, setIsServiceOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; vehicleId: string | null }>({
        isOpen: false,
        vehicleId: null
    });

    const handleDelete = async () => {
        if (!vehicle) return;
        isDeletingRef.current = true; // Set flag prevents re-fetch errors
        try {
            await api.delete(`/vehicles/${vehicle.id}`);
            addToast("Véhicule supprimé avec succès", 'success');
            navigate('/vehicles');
        } catch (err) {
            isDeletingRef.current = false; // Reset if failed
            console.error(err);
            addToast("Erreur lors de la suppression", 'error');
        }
    };

    const generateAIAnalysis = (v: Vehicle) => {
        const mv = v.marketValue || v.price;
        const diff = mv - v.price;
        const isGoodDeal = diff > 0;
        
        return `Le modèle ${v.brand} ${v.model} (${v.year}) présente une dynamique de marché ${isGoodDeal ? 'favorable' : 'stable'}. ` +
               `Notre algorithme estime sa valorisation réelle à environ ${mv.toLocaleString()}€, ` +
               `${isGoodDeal ? `ce qui représente une opportunité immédiate de +${diff.toLocaleString()}€.` : 'alignée avec les standards actuels.'} ` +
               `La courbe de dépréciation est ${v.year > 2022 ? 'faible' : 'modérée'} sur ce segment ${v.fuelType}.`;
    };

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const res = await api.get<any>(`/vehicles/${id}`);
                const data = res.data.data ? res.data.data.vehicle : res.data.vehicle;
                setVehicle({
                     ...data,
                     id: data._id || data.id,
                     brand: data.make || data.brand,
                     image: data.images?.[0] || data.image || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
                     images: data.images?.length ? data.images : [data.image || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70']
                });
                setActiveImage(data.images?.[0] || data.image || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70');
                setAnalysisText(generateAIAnalysis({ ...data, marketValue: data.marketValue || data.price })); // Generate text on load
            } catch (err) {
                if (isDeletingRef.current) return; // Ignore errors if we are deleting
                console.error(err);
                addToast("Impossible de charger le véhicule", 'error');
                navigate('/vehicles');
            } finally {
                setLoading(false);
            }
        };
        fetchVehicle();
    }, [id, navigate, addToast]);

    if (loading) return <div className="flex items-center justify-center h-screen text-white">Chargement du dossier véhicule...</div>;
    if (!vehicle) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/vehicles')} className="!p-3 rounded-full border border-white/10">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{vehicle.brand} {vehicle.model}</h1>
                            <Badge variant={vehicle.status === 'available' ? 'success' : 'warning'}>{vehicle.status}</Badge>
                        </div>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
                             VIN: {vehicle.id} • Ref: REF-{vehicle.year}
                        </p>
                    </div>
                    </div>

                <div className="flex gap-3">
                    <Button variant="emerald">Contacter Client</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Media */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group">
                        <img src={activeImage} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                             <Button variant="ghost" className="bg-black/50 backdrop-blur-md text-white border-white/20"><Camera size={16} /> Gérer les photos</Button>
                        </div>
                    </div>
                    
                    {vehicle.images && (vehicle.images as string[]).length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {(vehicle.images as string[]).map((img, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => setActiveImage(img)}
                                    className={`relative w-32 h-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === img ? 'border-emerald-500 scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    <Card title="Rapport IA & Analyse Marché" className="bg-zinc-900/40">
                        <div className="flex items-start gap-4 text-zinc-400 text-sm leading-relaxed">
                            <Activity className="shrink-0 text-emerald-500" />
                            <p>
                                {analysisText}
                                <br/><br/>
                                <span className="text-emerald-400 font-bold uppercase text-xs">Recommandation:</span> {vehicle.marketValue && vehicle.marketValue > vehicle.price ? "Potentiel de revente élevé." : "Prix conforme au marché."}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Specs & Actions */}
                <div className="space-y-6">
                    <Card className="p-6 space-y-6 bg-zinc-900/60">
                        <div className="flex justify-between items-end border-b border-white/5 pb-6">
                            <div>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Prix de vente</p>
                                <p className="text-4xl font-black text-white tracking-tighter">{vehicle.price.toLocaleString()}€</p>
                            </div>
                            <Badge variant="info">TVA Incluse</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                                <Calendar size={18} className="text-zinc-500 mb-2" />
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Année</p>
                                <p className="text-base font-bold text-white">{vehicle.year}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                                <Gauge size={18} className="text-zinc-500 mb-2" />
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Kilométrage</p>
                                <p className="text-base font-bold text-white">{vehicle.mileage.toLocaleString()} km</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                                <Fuel size={18} className="text-zinc-500 mb-2" />
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Énergie</p>
                                <p className="text-base font-bold text-white">{vehicle.fuelType}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1">
                                <div className="text-zinc-500 mb-2 text-xs font-black">€</div>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Val. Marché</p>
                                <p className="text-base font-bold text-white">{(vehicle.marketValue || vehicle.price).toLocaleString()}€</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-3">
                             <Button className="w-full" variant="secondary" onClick={() => setIsEditOpen(true)}>
                                <PenTool size={16} /> Éditer les informations
                             </Button>
                             
                             <Button className="w-full" variant="outline" onClick={() => setIsServiceOpen(true)}>
                                <Sliders size={16} /> Gérer Statut
                             </Button>
                             
                             <Button 
                                className="w-full hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50" 
                                variant="ghost"
                                onClick={() => setDeleteConfirmation({ isOpen: true, vehicleId: vehicle.id })}
                             >
                                <Trash2 size={16} /> Supprimer du stock
                             </Button>
                        </div>
                    </Card>

                    <Card title="Caractéristiques" className="p-0">
                        <div className="divide-y divide-white/5">
                            <div className="flex justify-between p-4 text-xs">
                                <span className="text-zinc-500 font-bold uppercase">Transmission</span>
                                <span className="text-white font-medium">{vehicle.transmission || 'N/A'}</span>
                            </div>
                            {vehicle.color && (
                                <div className="flex justify-between p-4 text-xs">
                                    <span className="text-zinc-500 font-bold uppercase">Couleur</span>
                                    <span className="text-white font-medium">{vehicle.color}</span>
                                </div>
                            )}
                            {vehicle.agencyId && (
                                <div className="flex justify-between p-4 text-xs">
                                    <span className="text-zinc-500 font-bold uppercase">Agence (ID)</span>
                                    <span className="text-white font-medium">{vehicle.agencyId}</span>
                                </div>
                            )}
                            {vehicle.createdAt && (
                                <div className="flex justify-between p-4 text-xs">
                                    <span className="text-zinc-500 font-bold uppercase">Date Ajout</span>
                                    <span className="text-white font-medium">{new Date(vehicle.createdAt).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            {vehicle && (
                <>
                    <VehicleFormModal 
                        isOpen={isEditOpen} 
                        onClose={() => setIsEditOpen(false)}
                        initialData={vehicle}
                        onSuccess={() => {
                            // Reload vehicle data
                            api.get(`/vehicles/${id}`).then(res => {
                                const data = res.data.data ? res.data.data.vehicle : res.data.vehicle;
                                setVehicle({ ...data, id: data._id || data.id, image: data.images?.[0] || data.image });
                                setActiveImage(data.images?.[0] || data.image);
                            });
                            addToast("Véhicule mis à jour", 'success');
                        }}
                    />
                    
                    <ServiceModal 
                        isOpen={isServiceOpen}
                        onClose={() => setIsServiceOpen(false)}
                        vehicle={vehicle}
                        onSuccess={() => {
                             api.get(`/vehicles/${id}`).then(res => {
                                const data = res.data.data ? res.data.data.vehicle : res.data.vehicle;
                                setVehicle({ ...data, id: data._id || data.id });
                            });
                            addToast("Statut mis à jour", 'success');
                        }}
                    />

                    <ConfirmationModal
                        isOpen={deleteConfirmation.isOpen}
                        onClose={() => setDeleteConfirmation({ isOpen: false, vehicleId: null })}
                        onConfirm={handleDelete}
                        title="Supprimer le véhicule ?"
                        message="Cette action est irréversible. Le véhicule sera définitivement retiré de l'inventaire."
                        confirmLabel="Supprimer définitivement"
                    />
                </>
            )}
        </div>
    );
};
