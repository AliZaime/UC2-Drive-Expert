
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Modal, Input, useToast, cn } from '../../components/UI';
import { Building2, MapPin, ShieldCheck, Plus, Search, Globe, MoreVertical, Settings, Loader2, Trash2, ShieldAlert, Eye } from 'lucide-react';
import { Agency } from '../../types';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';

export const AgencyManagement = () => {
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', city: '', country: '', email: '' });
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const { addToast } = useToast();

  const fetchAgencies = async () => {
    try {
      const response = await api.get<any>('/admin/agencies');
      const data = response.data.agencies || [];
      const normalized = data.map((a: any) => ({
        ...a,
        id: a._id || a.id,
        location: `${a.address?.city || 'Unspecified'}, ${a.address?.country || ''}`,
        managerId: a.manager?.name || 'Unassigned',
        status: a.status || 'active'
      }));
      setAgencies(normalized);
    } catch (err) {
      console.error('Failed to fetch agencies', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const filteredAgencies = agencies.filter(a => {
    const matchesSearch = a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.location?.toLowerCase().includes(search.toLowerCase());
    const matchesActive = !activeOnly || a.status === 'active';
    return matchesSearch && matchesActive;
  });

  const handleCreateAgency = async () => {
    try {
      await api.post('/admin/agencies', {
        name: form.name,
        address: { city: form.city, country: form.country },
        email: form.email
      });
      setIsProvisioning(false);
      setForm({ name: '', city: '', country: '', email: '' });
      addToast('Agency provisioned successfully.', 'success');
      fetchAgencies();
    } catch (err: any) {
      addToast(err.message || 'Agency creation failed', 'error');
    }
  };

  const handleUpdateAgency = async () => {
    if (!editingAgency) return;
    try {
      await api.put(`/admin/agencies/${editingAgency.id}`, {
        name: form.name,
        address: { city: form.city, country: form.country },
        email: form.email
      });
      setEditingAgency(null);
      setForm({ name: '', city: '', country: '', email: '' });
      addToast('Agency parameters updated.', 'success');
      fetchAgencies();
    } catch (err: any) {
      addToast(err.message || 'Update failed', 'error');
    }
  };

  const handleDeleteAgency = async (id: string) => {
    try {
      await api.delete(`/admin/agencies/${id}`);
      setShowDeleteConfirm(null);
      addToast('Agency node decommissioned.', 'success');
      fetchAgencies();
    } catch (err: any) {
      addToast(err.message || 'Decommissioning failed', 'error');
    }
  };

  const openEditModal = (agency: Agency) => {
    setEditingAgency(agency);
    setForm({
      name: agency.name,
      city: agency.address?.city || '',
      country: agency.address?.country || '',
      email: agency.email || ''
    });
    setActiveMenu(null);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Agency Network</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Global franchise infrastructure oversight</p>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden lg:flex flex-col items-end">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              Protocol: Active <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </p>
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mt-1">Load: 0.12ms</p>
          </div>
          <Button
            variant="emerald"
            onClick={() => setIsProvisioning(true)}
            className="px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all"
          >
            <Plus size={18} /> Provision New Agency
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-6">
        <div className="relative group w-full max-w-md">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="FILTER NODES..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-16 pr-8 py-4 bg-zinc-950/40 border border-white/5 rounded-2xl outline-none focus:border-emerald-500/20 transition-all text-[11px] font-black uppercase tracking-[0.2em] text-white placeholder:text-zinc-700"
          />
        </div>
        <button
          onClick={() => setActiveOnly(!activeOnly)}
          className={cn(
            "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border",
            activeOnly ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-zinc-950/40 border-white/5 text-zinc-600 hover:text-white"
          )}
        >
          Active Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-24 text-center"><Loader2 className="animate-spin text-emerald-500 mx-auto" size={48} /></div>
        ) : filteredAgencies.length === 0 ? (
          <div className="col-span-full py-32 text-center text-zinc-700 italic text-[11px] font-black uppercase tracking-[0.3em] border border-white/5 rounded-[2rem] bg-zinc-950/20">No agency nodes detected in the matrix.</div>
        ) : filteredAgencies.map(agency => (
          <Card key={agency.id} className="relative group overflow-visible border-none bg-zinc-900/20 backdrop-blur-3xl p-10 hover:shadow-[0_0_50px_rgba(0,0,0,0.4)] transition-all duration-700">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-[100px] group-hover:bg-emerald-500/10 transition-all duration-1000" />

            <div className="space-y-10 relative z-10">
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 bg-zinc-950/60 rounded-[1.5rem] border border-white/5 flex items-center justify-center text-emerald-500 group-hover:border-emerald-500/20 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500">
                  <Building2 size={32} />
                </div>
                <div className="flex items-center gap-3 relative">
                  <Badge variant={agency.status === 'active' ? 'success' : 'warning'} className="uppercase font-black tracking-widest text-[8px] py-1 px-3">
                    {agency.status}
                  </Badge>
                  <button
                    onClick={() => setActiveMenu(activeMenu === agency.id ? null : agency.id)}
                    className="p-2 text-zinc-700 hover:text-white transition-colors bg-zinc-950/40 rounded-xl border border-white/5"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Context Menu */}
                  {activeMenu === agency.id && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                      <button
                        onClick={() => navigate(`/admin/agencies/${agency.id}`)}
                        className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3"
                      >
                        <Eye size={14} className="text-emerald-500" /> Node Details
                      </button>
                      <button
                        onClick={() => openEditModal(agency)}
                        className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3 border-t border-white/5"
                      >
                        <Settings size={14} className="text-blue-500" /> Edit Parameters
                      </button>
                      <button
                        onClick={() => { setShowDeleteConfirm(agency.id); setActiveMenu(null); }}
                        className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-3 border-t border-white/5"
                      >
                        <Trash2 size={14} /> Decommission
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight group-hover:text-emerald-400 transition-colors truncate">{agency.name}</h3>
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                  <MapPin size={12} className="text-emerald-500/60" />
                  {agency.location}
                </div>
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center justify-center text-[11px] font-black text-emerald-500">
                    {agency.managerId[0]}
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest leading-none mb-1">Controller</p>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest truncate max-w-[120px]">{agency.managerId}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/admin/agencies/${agency.id}`)}
                  className="text-[9px] font-black tracking-widest py-3 px-6 rounded-xl border-white/5 hover:border-emerald-500/20 uppercase shadow-lg shadow-black/20"
                >
                  Configure Node
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Provisioning / Edit Modal */}
      <Modal
        isOpen={isProvisioning || !!editingAgency}
        onClose={() => { setIsProvisioning(false); setEditingAgency(null); }}
        title={editingAgency ? "Update Node Parameters" : "Provision Agency Identity"}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setIsProvisioning(false); setEditingAgency(null); }}>Abort Mission</Button>
            <Button variant="emerald" onClick={editingAgency ? handleUpdateAgency : handleCreateAgency} className="px-10">
              {editingAgency ? "Push Updates" : "Initialize Node"}
            </Button>
          </>
        }
      >
        <div className="space-y-6 py-4">
          <Input label="Agency Commercial Name" placeholder="e.g. TOKYO NEURAL DISTRICT" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-6">
            <Input label="Jurisdiction City" placeholder="Tokyo" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <Input label="Registry Country" placeholder="Japan" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
          </div>
          <Input label="Secure Node Email" placeholder="tokyo@auto-uc2.io" icon={Globe} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <div className="p-6 bg-emerald-500/5 rounded-[1.5rem] border border-emerald-500/10 flex items-center gap-5">
            <ShieldCheck className="text-emerald-500" size={24} />
            <p className="text-[10px] font-bold text-zinc-500 leading-relaxed uppercase tracking-widest">
              Identity parameters will be synchronized across the neural backbone.
            </p>
          </div>
        </div>
      </Modal>

      {/* Decommission Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="NODE DECOMMISSION PROTOCOL"
        footer={
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>Cancel Protocol</Button>
            <Button variant="danger" onClick={() => showDeleteConfirm && handleDeleteAgency(showDeleteConfirm)} className="px-10">Confirm Purge</Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center py-10">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-6">
            <ShieldAlert className="text-red-500" size={32} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Purge Agency Node?</h3>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-xs">
            Decommissioning this node will permanently sever all commercial data streams. This action is irreversible.
          </p>
        </div>
      </Modal>
    </div>
  );
};
