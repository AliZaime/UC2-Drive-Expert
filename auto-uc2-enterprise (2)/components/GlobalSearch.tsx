
import React, { useState, useEffect, useRef } from 'react';
import { Search, Car, User, MessageSquare, ArrowRight, Loader2, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { UserRole } from '../types';

export const GlobalSearch = ({ user }: { user: any }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({ vehicles: [], clients: [], negotiations: [] });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults({ vehicles: [], clients: [], negotiations: [] });
        return;
      }

      setLoading(true);
      try {
        const promises = [];
        
        // 1. Search Vehicles (Everyone)
        promises.push(api.get(`/vehicles`)); 
        
        // 2. Search Clients (Staff Only)
        if ([UserRole.ADMIN, UserRole.MANAGER, UserRole.USER].includes(user.role)) {
            promises.push(api.get('/clients'));
        } else {
            promises.push(Promise.resolve({ data: { data: { clients: [] } } }));
        }

        // 3. Search Negotiations (Everyone - filtered by backend)
        promises.push(api.get('/negotiations'));

        const [vehRes, cliRes, negRes] = await Promise.all(promises);

        // Client-side filtering for demo (ideally backend search)
        const q = query.toLowerCase();

        const allVehicles = vehRes.data.data?.vehicles || vehRes.data.vehicles || [];
        const filteredVehicles = allVehicles.filter((v: any) => 
            v.make.toLowerCase().includes(q) || 
            v.model.toLowerCase().includes(q) || 
            v.vin.toLowerCase().includes(q)
        ).slice(0, 3);

        const allClients = cliRes.data.data?.clients || cliRes.data.clients || [];
        const filteredClients = allClients.filter((c: any) => 
            c.firstName.toLowerCase().includes(q) || 
            c.lastName.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q)
        ).slice(0, 3);

        const allNegs = negRes.data.data?.negotiations || negRes.data.negotiations || [];
        const filteredNegs = allNegs.filter((n: any) => 
            (n.vehicle && (n.vehicle.make.toLowerCase().includes(q) || n.vehicle.model.toLowerCase().includes(q))) ||
            (n.client && (n.client.firstName.toLowerCase().includes(q) || n.client.lastName.toLowerCase().includes(q)))
        ).slice(0, 3);

        setResults({ 
            vehicles: filteredVehicles, 
            clients: filteredClients, 
            negotiations: filteredNegs 
        });
        setIsOpen(true);

      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query, user.role]);

  const handleSelect = (path: string) => {
      setIsOpen(false);
      setQuery('');
      navigate(path);
  };

  return (
    <div ref={wrapperRef} className="relative hidden md:block group z-50">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
      <input
        type="text"
        placeholder="Recherche Matrice (Cmd+K)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        className="pl-12 pr-6 py-3 bg-zinc-900/60 border border-white/5 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none w-80 focus:w-96 transition-all focus:border-emerald-500/30 text-white placeholder:text-zinc-600"
      />

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-96 bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
            
            {loading ? (
                <div className="p-4 flex items-center justify-center text-zinc-500">
                    <Loader2 className="animate-spin mr-2" size={16} /> Recherche...
                </div>
            ) : (
                <>
                    {results.vehicles.length === 0 && results.clients.length === 0 && results.negotiations.length === 0 && (
                        <div className="p-4 text-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
                            Aucun résultat
                        </div>
                    )}

                    {results.vehicles.length > 0 && (
                        <div className="p-2">
                            <p className="px-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Véhicules</p>
                            {results.vehicles.map((v: any) => (
                                <button key={v.id} onClick={() => handleSelect('/vehicles')} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl text-left transition-colors group/item">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">
                                        <Car size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white">{v.make} {v.model}</p>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{v.vin}</p>
                                    </div>
                                    <ArrowRight size={14} className="text-zinc-600 opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all" />
                                </button>
                            ))}
                        </div>
                    )}

                    {results.clients.length > 0 && (
                        <div className="p-2 border-t border-white/5">
                            <p className="px-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Clients</p>
                            {results.clients.map((c: any) => (
                                <button key={c.id} onClick={() => handleSelect('/clients')} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl text-left transition-colors group/item">
                                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors">
                                        <User size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white">{c.firstName} {c.lastName}</p>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{c.email}</p>
                                    </div>
                                    <ArrowRight size={14} className="text-zinc-600 opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all" />
                                </button>
                            ))}
                        </div>
                    )}

                    {results.negotiations.length > 0 && (
                        <div className="p-2 border-t border-white/5">
                            <p className="px-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Négociations</p>
                            {results.negotiations.map((n: any) => (
                                <button key={n.id} onClick={() => handleSelect('/negotiations')} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl text-left transition-colors group/item">
                                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg group-hover/item:bg-amber-500 group-hover/item:text-white transition-colors">
                                        <MessageSquare size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white">{n.vehicle?.make} {n.vehicle?.model}</p>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Client: {n.client?.firstName}</p>
                                    </div>
                                    <ArrowRight size={14} className="text-zinc-600 opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all" />
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
      )}
    </div>
  );
};
