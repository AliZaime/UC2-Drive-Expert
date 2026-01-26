
import React, { useState, useEffect } from 'react';
import { Card, Badge, cn, Button, Modal, Input, useToast } from '../../components/UI';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'user', password: 'password123', confirmPassword: 'password123' });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeOnly, setActiveOnly] = useState(false);
  const { addToast } = useToast();

  const fetchUsers = async () => {
    try {
      const response = await api.get<any>('/admin/users');
      const data = response.data.users || [];
      // Filter strictly for Global Core identities (no agency-linked personnel)
      const normalized = data
        .filter((u: any) => u.role === UserRole.SUPERADMIN || u.role === UserRole.ADMIN)
        .map((u: any) => ({
          ...u,
          id: u._id || u.id,
          initials: u.name?.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2) || '??',
          status: u.active === false ? 'suspended' : 'active',
          lastLogin: '1/25/2026'
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.id?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesActive = !activeOnly || u.status === 'active';
    return matchesSearch && matchesRole && matchesActive;
  });

  const handleCreateUser = async () => {
    try {
      // Ensure confirmPassword matches password for validation
      const dataToSubmit = { ...form, confirmPassword: form.password };
      await api.post('/admin/users', dataToSubmit);
      setIsProvisioning(false);
      addToast('Identity provisioned successfully.', 'success');
      fetchUsers();
    } catch (err: any) {
      addToast(err.message || 'Provisioning failed', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setShowDeleteConfirm(null);
      addToast('Identity purged from registry.', 'success');
      fetchUsers();
    } catch (err: any) {
      addToast(err.message || 'Deletion failed', 'error');
    }
  };

  const handleImpersonate = async (id: string) => {
    try {
      const response = await api.post<any>(`/admin/users/${id}/impersonate`);
      localStorage.setItem('auto_uc2_token', response.token);
      localStorage.setItem('auto_uc2_user', JSON.stringify(response.data.user));
      addToast(`Initializing impersonation for ${response.data.user.name}...`, 'success');
      setTimeout(() => window.location.href = '/dashboard', 1000);
    } catch (err: any) {
      addToast(err.message || 'Impersonation failed', 'error');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">User Registry</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Managing {filteredUsers.length} authenticated identities</p>
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
            className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
          >
            <UserPlus size={18} /> Provision Identity
          </Button>
        </div>
      </div>

      <Card className="p-0 border-none bg-zinc-900/20 backdrop-blur-2xl">
        <div className="p-10 border-b border-white/5 flex flex-col lg:flex-row gap-8 items-center justify-between">
          <div className="relative w-full lg:w-[450px] group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="FILTER BY NAME, ID OR EMAIL..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-zinc-950/40 border border-white/5 rounded-2xl outline-none focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all text-[11px] font-black uppercase tracking-[0.2em] text-white placeholder:text-zinc-700"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-zinc-950/60 border border-white/5 rounded-2xl px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 outline-none focus:border-emerald-500/20 transition-all cursor-pointer hover:text-white"
            >
              <option value="all">All Roles</option>
              {Object.values(UserRole).map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <button
              onClick={() => setActiveOnly(!activeOnly)}
              className={cn(
                "px-8 py-5 border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                activeOnly ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-zinc-950/60 border-white/5 text-zinc-500 hover:text-white"
              )}
            >
              Active Status
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="px-10 py-10 text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Identity</th>
                <th className="px-10 py-10 text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Role</th>
                <th className="px-10 py-10 text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Security</th>
                <th className="px-10 py-10 text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Status</th>
                <th className="px-10 py-10 text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center"><Loader2 className="animate-spin text-emerald-500 mx-auto" size={40} /></td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-zinc-600 italic uppercase text-[10px] font-black tracking-widest">No identities detected in the matrix.</td>
                </tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} className="group hover:bg-white/[0.01] transition-all">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-6">
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <span className="text-emerald-500 font-black text-lg tracking-tighter">{u.initials}</span>
                        </div>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-zinc-950 flex items-center justify-center shadow-lg",
                          u.status === 'active' ? "bg-emerald-500" : "bg-red-500"
                        )}>
                          <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                        </div>
                      </div>
                      <div className="max-w-[200px] lg:max-w-none">
                        <p className="font-black text-white text-sm tracking-tight truncate group-hover:text-emerald-400 transition-colors uppercase">{u.name}</p>
                        <p className="text-[10px] font-bold text-zinc-600 tracking-[0.1em] lowercase truncate mt-1">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-zinc-950/40 border border-white/5 rounded-2xl w-fit group-hover:border-emerald-500/10 transition-all">
                      <Users size={14} className="text-zinc-500" />
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{u.role}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3 group/mfa">
                        <Key size={14} className={u.mfaEnabled ? "text-emerald-500" : "text-zinc-700"} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{u.mfaEnabled ? 'MFA ACTIVE' : 'NO MFA'}</span>
                      </div>
                      <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em]">LAST: {u.lastLogin}</p>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentColor]", u.status === 'active' ? "bg-emerald-500 text-emerald-500" : "bg-red-500 text-red-500")} />
                      <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", u.status === 'active' ? "text-emerald-500" : "text-zinc-600")}>{u.status}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <button
                        onClick={() => handleImpersonate(u.id)}
                        className="px-6 py-2.5 bg-zinc-950 border border-emerald-500/30 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                      >
                        IMPERSONATE
                      </button>
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="p-3 text-zinc-600 hover:text-white transition-all bg-zinc-950 rounded-xl border border-white/5 hover:border-emerald-500/20"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(u.id)}
                        className="p-3 text-zinc-600 hover:text-red-500 transition-all bg-zinc-950 rounded-xl border border-white/5 hover:border-red-500/20"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Provisioning Modal */}
      <Modal
        isOpen={isProvisioning}
        onClose={() => setIsProvisioning(false)}
        title="Provision Identity Protocol"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsProvisioning(false)}>Abort Mission</Button>
            <Button variant="emerald" onClick={handleCreateUser} className="px-10">Initialize Identity</Button>
          </>
        }
      >
        <div className="space-y-6 py-4">
          <Input label="Identity Name" placeholder="e.g. MARCUS AURELIUS" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="Authentication Email" placeholder="user@auto-uc2.io" icon={Mail} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Registry Role</label>
              <select
                className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white outline-none focus:border-emerald-500/30 transition-all"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value={UserRole.SUPERADMIN}>SUPERADMIN (Network Core)</option>
                <option value={UserRole.ADMIN}>ADMIN (Security Ops)</option>
              </select>
            </div>
            <Input label="Access Key (Password)" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="p-6 bg-emerald-500/5 rounded-[1.5rem] border border-emerald-500/10 flex items-center gap-5">
            <ShieldAlert className="text-emerald-500" size={24} />
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
              New identity will require biometric validation upon initial entry.
            </p>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Identity Detailed Protocol"
        footer={<Button variant="ghost" onClick={() => setSelectedUser(null)}>Close Profile</Button>}
      >
        {selectedUser && (
          <div className="space-y-8 py-4">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center relative">
                <span className="text-4xl font-black text-emerald-500 uppercase">{selectedUser.initials}</span>
                <div className="absolute -bottom-1 -right-1 p-2 bg-zinc-950 rounded-2xl border border-white/5">
                  <ShieldCheck className="text-emerald-500" size={16} />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedUser.name}</h3>
                <p className="text-xs font-bold text-zinc-500 tracking-widest mt-1 lowercase">{selectedUser.email}</p>
                <Badge variant="success" className="mt-4">TRUST SCORE: 99.8%</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-6 bg-zinc-950 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Role Permissions</p>
                <p className="text-sm font-black text-emerald-500 uppercase tracking-widest">{selectedUser.role}</p>
              </div>
              <div className="p-6 bg-zinc-950 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Matrix ID</p>
                <p className="text-[10px] font-black text-white uppercase tracking-widest font-mono truncate">{selectedUser.id}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="IDENTITY PURGE PROTOCOL"
        footer={
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>Abort Mission</Button>
            <Button variant="danger" onClick={() => showDeleteConfirm && handleDeleteUser(showDeleteConfirm)} className="px-10">Confirm Purge</Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center py-10">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-6">
            <Trash2 className="text-red-500" size={32} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Purge Auth Node?</h3>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-xs">
            Deleting this identity will permanently sever all access to the UC2 neural network. This action is terminal.
          </p>
        </div>
      </Modal>
    </div>
  );
};
