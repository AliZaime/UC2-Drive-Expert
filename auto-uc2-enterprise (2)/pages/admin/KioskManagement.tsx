
import React from 'react';
// Added 'cn' to the imports from UI components
import { Card, Badge, Table, Button, cn } from '../../components/UI';
import { MOCK_KIOSKS } from '../../constants';
import { Smartphone, Signal, SignalLow, Settings, RefreshCw, Trash2, Globe } from 'lucide-react';

export const KioskManagement = () => {
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Terminal Cluster</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Managing {MOCK_KIOSKS.length} interactive kiosks across the network</p>
        </div>
        <Button variant="emerald" className="px-8 py-4 rounded-2xl flex items-center gap-3">
           <RefreshCw size={18} /> Global Heartbeat Pulse
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Terminals', value: MOCK_KIOSKS.length, icon: Smartphone, color: 'text-white' },
          { label: 'Active Online', value: MOCK_KIOSKS.filter(k => k.status === 'online').length, icon: Signal, color: 'text-emerald-500' },
          { label: 'Offline / Alert', value: MOCK_KIOSKS.filter(k => k.status === 'offline').length, icon: SignalLow, color: 'text-red-500' },
          { label: 'Avg. Load Time', value: '1.2s', icon: Globe, color: 'text-blue-500' },
        ].map((stat, i) => (
          <Card key={i} className="p-8 group hover:border-emerald-500/20 transition-all">
             <div className="flex justify-between items-start">
                <div className={cn("p-3 rounded-2xl bg-white/5 border border-white/5", stat.color)}>
                   <stat.icon size={20} />
                </div>
             </div>
             <div className="mt-6">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-white tracking-tighter">{stat.value}</p>
             </div>
          </Card>
        ))}
      </div>

      <Card title="Terminal Registry" subtitle="Detailed oversight of every connected device">
         <Table headers={['Device ID', 'Assigned Agency', 'Status', 'Last Heartbeat', 'Version', 'Protocol']}>
            {MOCK_KIOSKS.map(kiosk => (
              <tr key={kiosk.id} className="group hover:bg-white/5 transition-all">
                <td className="px-6 py-6 font-mono text-emerald-500 text-[10px] font-black">{kiosk.id}</td>
                <td className="px-6 py-6 text-zinc-300 text-xs font-bold uppercase tracking-widest">{kiosk.agencyId}</td>
                <td className="px-6 py-6">
                   <div className="flex items-center gap-3">
                      <div className={cn("w-1.5 h-1.5 rounded-full", kiosk.status === 'online' ? "bg-emerald-500" : "bg-red-500")}></div>
                      <Badge variant={kiosk.status === 'online' ? 'success' : 'error'}>{kiosk.status}</Badge>
                   </div>
                </td>
                <td className="px-6 py-6 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">{kiosk.lastHeartbeat}</td>
                <td className="px-6 py-6">
                   <span className="px-3 py-1 bg-zinc-950 border border-white/5 rounded-lg text-zinc-500 text-[9px] font-black uppercase">{kiosk.version}</span>
                </td>
                <td className="px-6 py-6 text-right">
                   <div className="flex justify-end gap-3">
                      <button className="p-2 bg-zinc-950 rounded-xl text-zinc-600 hover:text-white transition-colors border border-white/5"><Settings size={16} /></button>
                      <button className="p-2 bg-zinc-950 rounded-xl text-zinc-600 hover:text-red-500 transition-colors border border-white/5"><Trash2 size={16} /></button>
                   </div>
                </td>
              </tr>
            ))}
         </Table>
      </Card>
    </div>
  );
};
