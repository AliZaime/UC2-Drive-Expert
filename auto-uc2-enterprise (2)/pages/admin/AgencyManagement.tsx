
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Modal, Input } from '../../components/UI';
import { MOCK_AGENCIES } from '../../constants';
import { Building2, MapPin, ShieldCheck, Plus, Search, Globe, MoreVertical, Settings, Loader2 } from 'lucide-react';
import { Agency } from '../../types';
import { api } from '../../api';

export const AgencyManagement = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', country: '', email: '' });

  const fetchAgencies = async () => {
    try {
      const response = await api.get<any>('/admin/agencies');
      const data = response.data.agencies || [];
      const normalized = data.map((a: any) => ({
        ...a,
        id: a._id || a.id,
        location: `${a.address?.city || ''}, ${a.address?.country || ''}`,
        revenue: 'Calcul en cours...', // Placeholder as it's not in the model directly
        fleetCount: 0, // Needs aggregation or separate call
        managerId: a.manager?.name || 'Unassigned'
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

  const handleCreateAgency = async () => {
    try {
      await api.post('/admin/agencies', {
        name: form.name,
        address: { city: form.city, country: form.country },
        email: form.email
      });
      setIsProvisioning(false);
      fetchAgencies();
    } catch (err) {
      alert('Agency creation failed');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Agency Network</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Global franchise infrastructure oversight</p>
        </div>
        <Button
          variant="emerald"
          onClick={() => setIsProvisioning(true)}
          className="px-8 py-4 rounded-2xl flex items-center gap-3"
        >
          <Plus size={18} /> Provision New Agency
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-emerald-500 mx-auto" size={48} /></div>
        ) : agencies.length === 0 ? (
          <div className="col-span-full py-20 text-center text-zinc-500 italic text-sm font-bold uppercase tracking-widest">No agency protocols active.</div>
        ) : agencies.map(agency => (
          <Card key={agency.id} className="relative group overflow-hidden hover:border-emerald-500/20 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] group-hover:bg-emerald-500/10 transition-all" />

            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-zinc-950 rounded-2xl border border-white/5 flex items-center justify-center text-emerald-500 group-hover:border-emerald-500/30 transition-all">
                  <Building2 size={24} />
                </div>
                <div className="flex gap-2">
                  <Badge variant={agency.status === 'active' ? 'success' : 'warning'}>{agency.status}</Badge>
                  <button className="p-2 text-zinc-700 hover:text-white transition-colors"><MoreVertical size={16} /></button>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none">{agency.name}</h3>
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-3">
                  <MapPin size={12} className="text-emerald-500" />
                  {agency.location}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/5">
                <div>
                  <p className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-1">Fiscal Revenue</p>
                  <p className="text-xl font-black text-white tracking-tighter">{agency.revenue}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-1">Fleet Stock</p>
                  <p className="text-xl font-black text-emerald-500 tracking-tighter">{agency.fleetCount} Units</p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-[8px] font-black text-zinc-500 uppercase">M</div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Mgr: {agency.managerId}</span>
                </div>
                <Button variant="outline" className="text-[8px] py-1.5 px-4">Network Node Config</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isProvisioning}
        onClose={() => setIsProvisioning(false)}
        title="Agency Identity Provisioning"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsProvisioning(false)}>Abort</Button>
            <Button variant="emerald" onClick={handleCreateAgency}>Initialize Agency</Button>
          </>
        }
      >
        <div className="space-y-6">
          <Input label="Agency Commercial Name" placeholder="e.g. AUTO-UC2 Tokyo Central" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" placeholder="e.g. Tokyo" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <Input label="Country" placeholder="e.g. Japan" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
          </div>
          <Input label="Agency Email" placeholder="tokyo@autouc2.com" icon={Globe} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <div className="p-6 bg-zinc-950 rounded-2xl border border-emerald-500/10 flex items-center gap-4">
            <ShieldCheck className="text-emerald-500" size={24} />
            <p className="text-[10px] font-bold text-zinc-500 leading-relaxed uppercase tracking-widest">
              Identity will be provisioned onto the blockchain ledger upon initialization.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
