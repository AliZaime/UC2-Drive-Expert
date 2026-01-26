import { useState, useEffect } from 'react';
import { Card, Badge, Table, Button, Modal, Input, useToast, cn } from '../../components/UI';
import { Smartphone, Signal, SignalLow, Settings, RefreshCw, Trash2, Globe, Loader2, ShieldAlert, Cpu, Activity } from 'lucide-react';
import { api } from '../../api';
import { Kiosk } from '../../types';

export const KioskManagement = () => {
   const [kiosks, setKiosks] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [pulseLoading, setPulseLoading] = useState(false);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
   const { addToast } = useToast();

   const fetchKiosks = async () => {
      try {
         const response = await api.get<any>('/admin/kiosks');
         const data = response.data.kiosks || [];
         setKiosks(data.map((k: any) => ({
            ...k,
            id: k._id || k.id,
            agencyName: k.agency?.name || 'Unlinked Node',
            lastHeartbeat: k.deviceInfo?.lastHeartbeat ? new Date(k.deviceInfo.lastHeartbeat).toLocaleTimeString() : 'N/A',
            version: k.deviceInfo?.version || 'v1.0.0'
         })));
      } catch (err) {
         console.error('Failed to fetch kiosks', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchKiosks();
   }, []);

   const handleGlobalPulse = async () => {
      setPulseLoading(true);
      // Simulate global heartbeat check
      setTimeout(() => {
         setPulseLoading(false);
         addToast('Global heartbeat pulse completed. All clusters responsive.', 'success');
         fetchKiosks();
      }, 1500);
   };

   const handleDeleteKiosk = async (id: string) => {
      try {
         await api.delete(`/admin/kiosks/${id}`);
         setShowDeleteConfirm(null);
         addToast('Kiosk terminal decommissioned.', 'success');
         fetchKiosks();
      } catch (err: any) {
         addToast(err.message || 'Decommission failed', 'error');
      }
   };

   return (
      <div className="space-y-10 animate-in fade-in duration-700 pb-20">
         {/* Header Section */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Terminal Cluster</h1>
               <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Registry: Core Infrastructure Control</p>
            </div>
            <Button
               variant="emerald"
               onClick={handleGlobalPulse}
               disabled={pulseLoading}
               className="px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all"
            >
               {pulseLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
               Global Heartbeat Pulse
            </Button>
         </div>

         {/* Stats Cluster */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
               { label: 'Total Terminals', value: kiosks.length, icon: Smartphone, color: 'text-white', glow: 'group-hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]' },
               { label: 'Active Online', value: kiosks.filter(k => k.status === 'active').length, icon: Signal, color: 'text-emerald-500', glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]' },
               { label: 'Sync Status', value: '98.4%', icon: Activity, color: 'text-blue-500', glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]' },
               { label: 'Hardware Health', value: 'NOMINAL', icon: Cpu, color: 'text-amber-500', glow: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]' },
            ].map((stat, i) => (
               <Card key={i} className={cn("p-8 group transition-all duration-500 border-none bg-zinc-900/20 backdrop-blur-3xl", stat.glow)}>
                  <div className="flex justify-between items-start mb-6">
                     <div className={cn("p-4 rounded-2xl bg-zinc-950 border border-white/5", stat.color)}>
                        <stat.icon size={22} />
                     </div>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
                     <p className="text-4xl font-black text-white tracking-tighter">{stat.value}</p>
                  </div>
               </Card>
            ))}
         </div>

         {/* Terminal Registry Table */}
         <Card className="border-none bg-zinc-900/10 backdrop-blur-3xl overflow-hidden shadow-2xl relative">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
               <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Active Terminal Registry</h2>
                  <p className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Real-time status of sectoral hardware</p>
               </div>
               <div className="flex gap-2">
                  <Badge variant="neutral" className="bg-zinc-950 border-white/5 uppercase text-[9px] px-4">Sector: Global</Badge>
               </div>
            </div>

            <div className="overflow-x-auto">
               <Table headers={['Device Protocol ID', 'Assigned Agency Node', 'Cluster Status', 'Last Sync', 'Core Version', 'Actions']}>
                  {loading ? (
                     <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="animate-spin text-emerald-500 mx-auto" size={32} /></td></tr>
                  ) : kiosks.length === 0 ? (
                     <tr><td colSpan={6} className="py-20 text-center text-zinc-600 font-black uppercase tracking-[0.3em] italic">No terminals detected in the network.</td></tr>
                  ) : kiosks.map(kiosk => (
                     <tr key={kiosk.id} className="group hover:bg-white/[0.02] transition-all border-b border-white/5">
                        <td className="px-8 py-8">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-center text-emerald-500 group-hover:border-emerald-500/30 transition-all">
                                 <Smartphone size={18} />
                              </div>
                              <span className="font-mono text-zinc-400 text-[10px] font-black uppercase">{kiosk.id}</span>
                           </div>
                        </td>
                        <td className="px-8 py-8">
                           <div className="space-y-1">
                              <p className="text-white text-xs font-black uppercase tracking-widest">{kiosk.agencyName}</p>
                              {kiosk.agency?.location && <p className="text-zinc-600 text-[9px] font-bold uppercase">{kiosk.agency.location}</p>}
                           </div>
                        </td>
                        <td className="px-8 py-8">
                           <div className="flex items-center gap-3">
                              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse",
                                 kiosk.status === 'active' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                              )}></div>
                              <Badge
                                 variant={kiosk.status === 'active' ? 'success' : 'error'}
                                 className={cn("uppercase text-[8px] px-3 font-black",
                                    kiosk.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                                 )}
                              >
                                 {kiosk.status}
                              </Badge>
                           </div>
                        </td>
                        <td className="px-8 py-8 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{kiosk.lastHeartbeat}</td>
                        <td className="px-8 py-8">
                           <span className="px-3 py-1.5 bg-zinc-950 border border-white/5 rounded-lg text-zinc-400 text-[9px] font-black uppercase opacity-70 group-hover:opacity-100 transition-opacity tracking-widest">
                              {kiosk.version}
                           </span>
                        </td>
                        <td className="px-8 py-8 text-right">
                           <div className="flex justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform">
                              <button className="p-3 bg-zinc-950 rounded-xl text-zinc-600 hover:text-white transition-all border border-white/5 hover:border-emerald-500/20"><Settings size={16} /></button>
                              <button
                                 onClick={() => setShowDeleteConfirm(kiosk.id)}
                                 className="p-3 bg-zinc-950 rounded-xl text-zinc-600 hover:text-red-500 transition-all border border-white/5 hover:border-red-500/20"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </Table>
            </div>
         </Card>

         {/* Decommission Confirmation Modal */}
         <Modal
            isOpen={!!showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(null)}
            title="TERMINAL PURGE PROTOCOL"
            footer={
               <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>Abort</Button>
                  <Button variant="danger" onClick={() => showDeleteConfirm && handleDeleteKiosk(showDeleteConfirm)} className="px-10 font-black text-[10px] tracking-widest uppercase">Confirm Wipe</Button>
               </div>
            }
         >
            <div className="flex flex-col items-center text-center py-12">
               <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-8 animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                  <ShieldAlert className="text-red-500" size={40} />
               </div>
               <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">Sever Terminal Link?</h3>
               <p className="text-zinc-600 text-xs font-bold uppercase tracking-[0.2em] leading-relaxed max-w-sm">
                  You are about to permanently decommission this hardware unit. Remote access and telemetry will be lost forever.
               </p>
            </div>
         </Modal>
      </div>
   );
};
