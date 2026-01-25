
import React from 'react';
import { Card, Badge, Button, Table } from '../../components/UI';
import { Database, RefreshCw, HardDrive, Cloud, Download, History } from 'lucide-react';

export const SyncBackup = () => {
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Data Operations</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Cloud synchronization & disaster recovery control</p>
        </div>
        <Button variant="emerald" className="px-8 py-4 rounded-2xl flex items-center gap-3">
          <RefreshCw size={18} className="animate-spin-slow" /> Trigger Manual Sync
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="flex flex-col items-center text-center p-12">
           <Database size={48} className="text-emerald-500 mb-6" />
           <h3 className="text-xl font-black text-white uppercase tracking-tighter">Cluster Health</h3>
           <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2">Relational & Document Mesh</p>
           <div className="mt-8 px-6 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-[0.3em]">
             99.99% Uptime
           </div>
        </Card>

        <Card className="flex flex-col items-center text-center p-12">
           <Cloud size={48} className="text-blue-500 mb-6" />
           <h3 className="text-xl font-black text-white uppercase tracking-tighter">Cloud Sync</h3>
           <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2">Azure-AWS Dual Mesh</p>
           <div className="mt-8 px-6 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-500 text-[9px] font-black uppercase tracking-[0.3em]">
             Synced: 2m ago
           </div>
        </Card>

        <Card className="flex flex-col items-center text-center p-12">
           <HardDrive size={48} className="text-purple-500 mb-6" />
           <h3 className="text-xl font-black text-white uppercase tracking-tighter">Local Backup</h3>
           <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2">Physical Server redundancy</p>
           <div className="mt-8 px-6 py-2 bg-purple-500/10 rounded-full border border-purple-500/20 text-purple-500 text-[9px] font-black uppercase tracking-[0.3em]">
             Retention: 30 days
           </div>
        </Card>
      </div>

      <Card title="Maintenance Logs" subtitle="History of system snapshots and restorations">
         <Table headers={['Snapshot ID', 'Timestamp', 'Size', 'Type', 'Status', 'Actions']}>
            {[
              { id: 'UC2-DB-7742', time: '2024-05-20 04:00', size: '12.4 GB', type: 'FULL', status: 'VERIFIED' },
              { id: 'UC2-DB-7741', time: '2024-05-19 04:00', size: '12.1 GB', type: 'INCR', status: 'VERIFIED' },
              { id: 'UC2-DB-7740', time: '2024-05-18 04:00', size: '12.2 GB', type: 'FULL', status: 'ARCHIVED' },
            ].map((bk, i) => (
              <tr key={i} className="group hover:bg-white/5 transition-all">
                <td className="px-6 py-6 font-mono text-emerald-500 text-[10px]">{bk.id}</td>
                <td className="px-6 py-6 text-zinc-500 font-bold text-[10px] uppercase tracking-widest">{bk.time}</td>
                <td className="px-6 py-6 text-white text-xs font-black">{bk.size}</td>
                <td className="px-6 py-6 text-zinc-600 text-[10px] font-black uppercase tracking-widest">{bk.type}</td>
                <td className="px-6 py-6">
                   <Badge variant={bk.status === 'VERIFIED' ? 'success' : 'neutral'}>{bk.status}</Badge>
                </td>
                <td className="px-6 py-6 text-right">
                   <div className="flex justify-end gap-3">
                      <button className="p-2 bg-zinc-950 rounded-xl text-zinc-600 hover:text-white transition-colors border border-white/5"><Download size={16} /></button>
                      <button className="p-2 bg-zinc-950 rounded-xl text-zinc-600 hover:text-white transition-colors border border-white/5"><History size={16} /></button>
                   </div>
                </td>
              </tr>
            ))}
         </Table>
      </Card>
    </div>
  );
};
