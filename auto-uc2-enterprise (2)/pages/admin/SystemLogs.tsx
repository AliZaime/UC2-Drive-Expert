
import React, { useState } from 'react';
import { Card, Table, Badge, Button, Input, cn } from '../../components/UI';
import { MOCK_LOGS } from '../../constants';
import { 
  History, Search, Filter, Download, 
  Trash2, Play, Pause, ChevronLeft, ChevronRight 
} from 'lucide-react';

export const SystemLogs = () => {
  const [isStreaming, setIsStreaming] = useState(true);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Audit Logs</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">immutable system activity & protocol history</p>
        </div>
        <div className="flex gap-4">
           <Button variant="ghost" onClick={() => setIsStreaming(!isStreaming)}>
             {isStreaming ? <Pause size={16} /> : <Play size={16} />}
             {isStreaming ? 'Pause Stream' : 'Resume Stream'}
           </Button>
           <Button variant="outline"><Download size={16} /> Export CSV</Button>
           <Button variant="danger"><Trash2 size={16} /> Purge Logs</Button>
        </div>
      </div>

      <Card className="p-0">
        <div className="p-8 border-b border-white/5 flex flex-col lg:flex-row gap-6 items-center justify-between">
           <div className="relative w-full lg:w-96 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input 
                 type="text" 
                 placeholder="Search by ID, source or keywords..." 
                 className="w-full pl-14 pr-6 py-4 bg-zinc-950/60 border border-white/5 rounded-2xl outline-none focus:border-emerald-500/30 transition-all text-[11px] font-bold uppercase tracking-widest text-white placeholder:text-zinc-700"
              />
           </div>
           <div className="flex gap-4 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
              <button className="px-6 py-4 bg-zinc-950 border border-emerald-500/30 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white whitespace-nowrap">All Levels</button>
              <button className="px-6 py-4 bg-zinc-950 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-all whitespace-nowrap">Critical Only</button>
              <button className="px-6 py-4 bg-zinc-950 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-all whitespace-nowrap">Security Events</button>
           </div>
        </div>

        <Table headers={['Timestamp', 'Level', 'Source Component', 'Event Message', 'Protocol']}>
           {MOCK_LOGS.map(log => (
             <tr key={log.id} className="group hover:bg-white/[0.02] transition-all">
                <td className="px-6 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">{log.timestamp}</td>
                <td className="px-6 py-6">
                   <div className={cn(
                     "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                     log.level === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
                     log.level === 'error' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                     log.level === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                     'bg-zinc-800 text-zinc-400 border-white/5'
                   )}>
                      {log.level}
                   </div>
                </td>
                <td className="px-6 py-6 text-emerald-500 text-[10px] font-black uppercase tracking-widest">{log.source}</td>
                <td className="px-6 py-6 text-zinc-300 text-xs font-bold leading-relaxed">{log.message}</td>
                <td className="px-6 py-6 text-right">
                   <button className="text-[9px] font-black text-zinc-700 uppercase tracking-widest hover:text-white transition-colors">Details</button>
                </td>
             </tr>
           ))}
        </Table>

        <div className="p-8 border-t border-white/5 flex items-center justify-between">
           <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">Streaming {MOCK_LOGS.length} records...</p>
           <div className="flex gap-2">
              <button className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-zinc-600 hover:text-white transition-all"><ChevronLeft size={16} /></button>
              <div className="flex items-center gap-4 px-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                 Page <span className="text-white">1</span> / 120
              </div>
              <button className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-zinc-600 hover:text-white transition-all"><ChevronRight size={16} /></button>
           </div>
        </div>
      </Card>
    </div>
  );
};
