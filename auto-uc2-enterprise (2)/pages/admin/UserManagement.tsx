
import React, { useState, useEffect } from 'react';
import { Card, Badge, cn, Button, Modal, Input } from '../../components/UI';
import { MOCK_USERS } from '../../constants';
import {
  Users, UserPlus, Search, Shield, ShieldCheck,
  MoreVertical, Mail, Key, UserCheck, Trash2, Eye, ShieldAlert, Loader2
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { api } from '../../api';

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'user', password: 'password123', confirmPassword: 'password123' });

  const fetchUsers = async () => {
    try {
      const response = await api.get<any>('/admin/users');
      const data = response.data.users || [];
      const normalized = data.map((u: any) => ({
        ...u,
        id: u._id || u.id,
        avatar: u.photo || `https://ui-avatars.com/api/?name=${u.name}&background=random`,
        status: u.active === false ? 'suspended' : 'active',
        lastLogin: u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : 'Never'
      }));
      setUsers(normalized);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    try {
      await api.post('/admin/users', form);
      setIsProvisioning(false);
      fetchUsers();
    } catch (err) {
      alert('Creation failed');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Permanent deletion for this node?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Deletion failed');
    }
  };

  const handleImpersonate = async (id: string) => {
    try {
      const response = await api.post<any>(`/admin/users/${id}/impersonate`);
      localStorage.setItem('auto_uc2_token', response.token);
      localStorage.setItem('auto_uc2_user', JSON.stringify(response.data.user));
      window.location.href = '/';
    } catch (err) {
      alert('Impersonation failed');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">User Registry</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Managing {users.length} authenticated identities</p>
        </div>
        <Button
          variant="emerald"
          onClick={() => setIsProvisioning(true)}
          className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3"
        >
          <UserPlus size={18} /> Provision Identity
        </Button>
      </div>

      <Card className="p-0">
        <div className="p-10 border-b border-white/5 flex flex-col lg:flex-row gap-6 items-center justify-between">
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Filter by name, ID or email..."
              className="w-full pl-14 pr-6 py-4 bg-zinc-950/60 border border-white/5 rounded-2xl outline-none focus:border-emerald-500/30 transition-all text-xs font-bold uppercase tracking-widest text-white placeholder:text-zinc-700"
            />
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-4 bg-zinc-950 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">All Roles</button>
            <button className="px-6 py-4 bg-zinc-950 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">Active Status</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-left bg-zinc-950/20">
                <th className="px-10 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Identity</th>
                <th className="px-10 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Role</th>
                <th className="px-10 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Security</th>
                <th className="px-10 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin text-emerald-500 mx-auto" size={32} /></td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-zinc-500 italic">No identities found in system.</td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <img src={u.avatar} className="w-12 h-12 rounded-2xl border border-white/10 group-hover:border-emerald-500/50 transition-colors" alt={u.name} />
                        {u.status === 'active' && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-950 border-2 border-emerald-500 rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-black text-white text-sm tracking-tight">{u.name}</p>
                        <p className="text-[10px] font-bold text-zinc-600 tracking-widest lowercase">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      u.role === UserRole.SUPERADMIN ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        u.role === UserRole.ADMIN ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-zinc-800 text-zinc-400 border-white/5"
                    )}>
                      {u.role === UserRole.SUPERADMIN ? <Shield size={12} /> : <Users size={12} />}
                      {u.role}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <Key size={14} className={u.mfaEnabled ? "text-emerald-500" : "text-zinc-700"} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{u.mfaEnabled ? 'MFA ACTIVE' : 'NO MFA'}</span>
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-zinc-700">Last: {u.lastLogin}</div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className={cn("flex items-center gap-3", u.status === 'active' ? "text-emerald-500" : "text-red-500")}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", u.status === 'active' ? "bg-emerald-500" : "bg-red-500")}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{u.status}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleImpersonate(u.id)}
                        className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all">Impersonate</button>
                      <button className="p-3 text-zinc-600 hover:text-white transition-colors bg-zinc-950 rounded-xl border border-white/5"><Eye size={16} /></button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-3 text-zinc-600 hover:text-red-500 transition-colors bg-zinc-950 rounded-xl border border-white/5"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isProvisioning}
        onClose={() => setIsProvisioning(false)}
        title="Provision Identity Protocol"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsProvisioning(false)}>Abort</Button>
            <Button variant="emerald" onClick={handleCreateUser}>Initialize User</Button>
          </>
        }
      >
        <div className="space-y-6">
          <Input label="Full Identity Name" placeholder="e.g. Johnathan Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="Verified Email Domain" placeholder="john@autouc2.com" icon={Mail} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Assigned Role</label>
              <select
                className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-4 text-xs font-bold text-white outline-none focus:border-emerald-500/30"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <Input label="Initial Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="p-6 bg-zinc-950 rounded-2xl border border-amber-500/10 flex items-center gap-4">
            <ShieldAlert className="text-amber-500" size={24} />
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
              Initial access code will be transmitted via encrypted SMTP channel.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
