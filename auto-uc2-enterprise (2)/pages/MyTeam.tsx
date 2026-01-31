import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Button, Card, Input, Modal, useToast } from '../components/UI';
import { User, Plus, Search, ShieldCheck, Trash2, Mail, UserPlus, FileText } from 'lucide-react';

interface Agent {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export const MyTeam = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { addToast } = useToast();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    const fetchAgents = async () => {
      try {
        const res = await api.get<any>('/my/team');
        const data = res.data.data ? res.data.data.agents : res.data.agents;
        setAgents(data || []);
      } catch (err) {
        console.error(err);
        addToast("Impossible de charger l'équipe", 'error');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const handleCreate = async () => {
      try {
        await api.post('/my/team', formData);
        addToast("Agent créé avec succès", 'success');
        setIsCreateOpen(false);
        setFormData({ name: '', email: '', password: '' });
        fetchAgents();
      } catch (err: any) {
        console.error(err);
        addToast(err.response?.data?.message || "Erreur création agent", 'error');
      }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                   <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Mon Équipe</h1>
                   <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-2">Gestion des agents de l'agence</p>
                </div>
                <Button variant="emerald" onClick={() => setIsCreateOpen(true)}>
                    <Plus size={18} /> Ajouter un Agent
                </Button>
            </div>

            {/* List */}
             {loading ? (
                <div className="text-center py-20 text-zinc-500">Chargement...</div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map((agent) => (
                        <Card key={agent._id} className="bg-zinc-900/40 border-white/5 hover:border-emerald-500/30 transition-all group">
                             <div className="flex items-start justify-between">
                                 <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                         <User size={24} />
                                     </div>
                                     <div>
                                         <h3 className="font-bold text-white">{agent.name}</h3>
                                         <div className="flex items-center gap-2 text-zinc-500 text-xs mt-1">
                                             <Mail size={12} /> {agent.email}
                                         </div>
                                     </div>
                                 </div>
                             </div>
                             
                             <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                                     <ShieldCheck size={12} /> Agent
                                 </span>
                                 <Button variant="ghost" className="text-zinc-500 hover:text-white h-auto p-2">
                                     <FileText size={16} /> Détails
                                 </Button>
                             </div>
                        </Card>
                    ))}
                    {agents.length === 0 && (
                        <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-3xl">
                            <UserPlus size={48} className="mx-auto text-zinc-700 mb-4" />
                            <p className="text-zinc-500 font-bold">Aucun agent dans votre équipe</p>
                        </div>
                    )}
                </div>
             )}

             {/* Create Modal */}
             <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Ajouter un Agent">
                 <div className="space-y-4">
                     <Input 
                        label="Nom Complet" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        placeholder="Ex: Sophie Martin"
                     />
                     <Input 
                        label="Email Professionnel" 
                        type="email"
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        placeholder="agent@autouc2.com"
                     />
                     <Input 
                        label="Mot de passe provisoire" 
                        type="password"
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        placeholder="••••••••"
                     />
                     <div className="pt-4 flex justify-end gap-3">
                         <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                         <Button variant="primary" onClick={handleCreate}>Créer Compte</Button>
                     </div>
                 </div>
             </Modal>
        </div>
    );
};
