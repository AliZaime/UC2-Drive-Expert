import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Badge, Button, Modal, Input, useToast, cn } from '../../components/UI';
import {
    Building2, Users, MapPin, ShieldCheck, Mail, Key,
    Trash2, Eye, ChevronLeft, UserPlus, Globe, Loader2, ShieldAlert, MoreVertical, Fingerprint
} from 'lucide-react';
import { api } from '../../api';
import { User, UserRole, Agency } from '../../types';

export const AgencyDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [agency, setAgency] = useState<Agency | null>(null);
    const [staff, setStaff] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [impersonating, setImpersonating] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        email: '',
        role: UserRole.MANAGER,
        password: 'password123',
        confirmPassword: 'password123'
    });

    const fetchData = async () => {
        try {
            const [agencyRes, usersRes] = await Promise.all([
                api.get<any>(`/admin/agencies/${id}`),
                api.get<any>(`/admin/users?agency=${id}&_ts=${Date.now()}`)
            ]);

            setAgency(agencyRes.data.agency);

            const data = usersRes.data.users || [];
            const normalized = data
                .filter((u: any) => {
                    const isOperational = u.role === UserRole.MANAGER || u.role === UserRole.USER;
                    const belongsToNode = u.agency === id || (u.agency?._id === id);
                    return isOperational && belongsToNode;
                })
                .map((u: any) => ({
                    ...u,
                    id: u._id || u.id,
                    initials: u.name?.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2) || '??',
                    status: u.active === false ? 'suspended' : 'active',
                    lastLogin: '1/25/2026'
                }));
            setStaff(normalized);
        } catch (err) {
            addToast('Failed to sync node data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleCreateStaff = async () => {
        try {
            const dataToSubmit = { ...form, confirmPassword: form.password, agency: id };
            await api.post('/admin/users', dataToSubmit);
            setIsProvisioning(false);
            setForm({ name: '', email: '', role: UserRole.MANAGER, password: 'password123', confirmPassword: 'password123' });
            addToast(`${form.role} provisioned for this node.`, 'success');
            fetchData();
        } catch (err: any) {
            addToast(err.message || 'Provisioning failed', 'error');
        }
    };

    const handleDeleteStaff = async (userId: string) => {
        try {
            await api.delete(`/admin/users/${userId}`);
            setShowDeleteConfirm(null);
            addToast('Personnel purged from network node.', 'success');
            fetchData();
        } catch (err: any) {
            addToast(err.message || 'Purge failed', 'error');
        }
    };

    const handleImpersonate = async (userId: string) => {
        setImpersonating(userId);
        try {
            const response = await api.post<any>(`/admin/users/${userId}/impersonate`);
            localStorage.setItem('auto_uc2_token', response.token);
            localStorage.setItem('auto_uc2_user', JSON.stringify(response.data.user));
            addToast(`Initializing neural link as ${response.data.user.name}...`, 'success');
            setTimeout(() => window.location.href = '/dashboard', 1000);
        } catch (err: any) {
            addToast(err.message || 'Neural link failed', 'error');
            setImpersonating(null);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={40} />
            </div>
        );
    }

    if (!agency) {
        return (
            <div className="text-center py-20 animate-in fade-in">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 mb-6">
                    <ShieldAlert className="text-red-500" size={32} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Node Desynchronized</h2>
                <Button onClick={() => navigate('/admin/agencies')} className="mt-8 px-10 py-4">Return to Registry</Button>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Upper Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/admin/agencies')}
                    className="flex items-center gap-4 text-zinc-500 hover:text-white transition-all group"
                >
                    <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:border-emerald-500/30 group-hover:scale-105 transition-all">
                        <ChevronLeft size={20} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.4em]">Back to Cloud Network</span>
                </button>

                <div className="flex items-center gap-10">
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            Node Status: Active <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </p>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em] mt-1.5">Uptime: 99.99%</p>
                    </div>
                    <Button
                        variant="emerald"
                        onClick={() => setIsProvisioning(true)}
                        className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:shadow-[0_0_50px_rgba(16,185,129,0.25)] transition-all"
                    >
                        <UserPlus size={18} /> Add Node Personnel
                    </Button>
                </div>
            </div>

            {/* Modern Node Header */}
            <Card className="p-16 border-none bg-zinc-900/10 backdrop-blur-3xl overflow-hidden relative border border-white/5 group">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[130px] rounded-full -mr-64 -mt-64 group-hover:opacity-100 opacity-50 transition-opacity duration-1000" />

                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-16 relative z-10">
                    <div className="w-36 h-36 rounded-[35%] bg-zinc-950/80 border-2 border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-2xl group-hover:border-emerald-500/40 transition-all duration-700 scale-95 hover:scale-100">
                        <Building2 size={70} className="drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                    </div>
                    <div className="flex-1 space-y-6">
                        <div className="flex flex-wrap items-center gap-5">
                            <Badge variant="success" className="px-5 py-2 uppercase font-black tracking-widest text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Verified Network Node</Badge>
                            <span className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.3em] bg-zinc-950/40 px-4 py-2 rounded-xl border border-white/5">ID: {agency.id}</span>
                        </div>
                        <h1 className="text-7xl font-black text-white uppercase tracking-tighter leading-none">{agency.name}</h1>
                        <div className="flex flex-wrap items-center gap-8 text-zinc-400 text-xs font-bold uppercase tracking-[0.25em]">
                            <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity"><MapPin size={16} className="text-emerald-500" /> {agency.address?.city}, {agency.address?.country}</div>
                            <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity"><Globe size={16} className="text-emerald-500" /> {agency.email}</div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Personnel Registry */}
            <div className="space-y-8">
                <div className="flex items-center justify-between px-4">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                        Node Personnel
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    </h2>
                    <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em]">Authorized identities: {staff.length}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
                    {staff.length === 0 ? (
                        <div className="col-span-full py-28 text-center border border-dashed border-white/10 rounded-[3rem] bg-zinc-950/10 transition-all">
                            <Fingerprint className="mx-auto text-zinc-800 mb-6" size={48} />
                            <p className="text-zinc-600 font-black uppercase text-xs tracking-[0.4em] italic">No personnel detected in this node's sector.</p>
                        </div>
                    ) : staff.map(u => (
                        <Card key={u.id} className="p-10 border-none bg-zinc-900/20 hover:bg-zinc-900/40 transition-all group backdrop-blur-2xl relative overflow-visible shadow-lg hover:shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                            <div className="flex items-start justify-between mb-10">
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="w-18 h-18 rounded-[1.2rem] bg-zinc-950 border border-emerald-500/10 flex items-center justify-center group-hover:scale-105 group-hover:border-emerald-500/30 transition-all duration-500 min-w-16 min-h-16">
                                            <span className="text-2xl font-black text-emerald-500 uppercase">{u.initials}</span>
                                        </div>
                                        <div className={cn(
                                            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-zinc-950 flex items-center justify-center shadow-lg",
                                            u.status === 'active' ? "bg-emerald-500" : "bg-red-500"
                                        )}>
                                            <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-black text-white uppercase text-[15px] tracking-tight group-hover:text-emerald-400 transition-colors">{u.name}</p>
                                        <p className="text-[10px] font-bold text-zinc-600 tracking-wider lowercase mt-1.5 opacity-70">{u.email}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <Badge
                                        variant={u.role === UserRole.MANAGER ? 'warning' : 'neutral'}
                                        className={cn(
                                            "text-[8px] font-black uppercase tracking-widest px-3 py-1",
                                            u.role === UserRole.MANAGER ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-zinc-800 text-zinc-500 border-white/5"
                                        )}
                                    >
                                        {u.role}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "px-3 py-1.5 rounded-lg border flex items-center gap-2",
                                        u.mfaEnabled ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-950/40 border-white/5"
                                    )}>
                                        <Key size={12} className={u.mfaEnabled ? "text-emerald-500" : "text-zinc-800"} />
                                        <span className={cn("text-[8px] font-black tracking-widest uppercase", u.mfaEnabled ? "text-emerald-500" : "text-zinc-800")}>
                                            {u.mfaEnabled ? 'MFA READY' : 'NO MFA'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 relative">
                                    <button
                                        onClick={() => setActiveMenu(activeMenu === u.id ? null : u.id)}
                                        className="p-3 bg-zinc-950/60 rounded-xl border border-white/5 text-zinc-700 hover:text-white transition-all hover:bg-zinc-900"
                                    >
                                        <MoreVertical size={18} />
                                    </button>

                                    {activeMenu === u.id && (
                                        <div className="absolute bottom-full right-0 mb-3 w-48 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                            <button
                                                onClick={() => handleImpersonate(u.id)}
                                                disabled={!!impersonating}
                                                className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all flex items-center gap-3 disabled:opacity-50"
                                            >
                                                {impersonating === u.id ? <Loader2 size={14} className="animate-spin" /> : <Fingerprint size={14} />}
                                                Impersonate
                                            </button>
                                            <button
                                                onClick={() => { setActiveMenu(null); setShowDeleteConfirm(u.id); }}
                                                className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-3 border-t border-white/5"
                                            >
                                                <Trash2 size={14} /> Purge Identity
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Provisioning Modal */}
            <Modal
                isOpen={isProvisioning}
                onClose={() => setIsProvisioning(false)}
                title="Provision Node Personnel"
                footer={
                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={() => setIsProvisioning(false)}>Abort Mission</Button>
                        <Button variant="emerald" onClick={handleCreateStaff} className="px-12 uppercase font-black text-[10px] tracking-widest">Initialize Person</Button>
                    </div>
                }
            >
                <div className="space-y-8 py-6">
                    <Input label="Identity Full Name" placeholder="e.g. MARCUS AURELIUS" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <Input label="Auth Protocol Email" placeholder="user@auto-uc2.io" icon={Mail} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Assigned Role</label>
                            <select
                                className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-emerald-500/30 transition-all appearance-none"
                                value={form.role}
                                onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
                            >
                                <option value={UserRole.MANAGER}>AGENCY MANAGER</option>
                                <option value={UserRole.USER}>COMMERCIAL AGENT</option>
                            </select>
                        </div>
                        <Input label="Neural Access Key" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    </div>
                    <div className="p-8 bg-zinc-900/40 rounded-[2.5rem] border border-emerald-500/10 flex items-center gap-6">
                        <ShieldCheck className="text-emerald-500 shrink-0" size={32} />
                        <p className="text-[10px] font-bold text-zinc-500 leading-relaxed uppercase tracking-[0.2em]">
                            This identity will be hardware-locked to Node sectoral ID: <span className="text-emerald-500">{id}</span>.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                title="IDENTITY PURGE PROTOCOL"
                footer={
                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>Abort</Button>
                        <Button variant="danger" onClick={() => showDeleteConfirm && handleDeleteStaff(showDeleteConfirm)} className="px-10 font-black text-[10px] tracking-widest uppercase">Confirm Wipe</Button>
                    </div>
                }
            >
                <div className="flex flex-col items-center text-center py-12">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-8 animate-pulse">
                        <ShieldAlert className="text-red-500" size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">Wipe Identity Cache?</h3>
                    <p className="text-zinc-600 text-xs font-bold uppercase tracking-[0.2em] leading-relaxed max-w-sm">
                        You are about to permanently sever this identity's neural link. This action is terminal and irreversible.
                    </p>
                </div>
            </Modal>
        </div>
    );
};
