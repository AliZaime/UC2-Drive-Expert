
import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Input, cn, Modal, useToast } from '../../components/UI';
import {
   History, Search, Filter, Download,
   Trash2, Play, Pause, ChevronLeft, ChevronRight, Loader2, RefreshCw, Eye, ShieldAlert
} from 'lucide-react';
import { api } from '../../api';

export const SystemLogs = () => {
   const [logs, setLogs] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [isStreaming, setIsStreaming] = useState(true);
   const [search, setSearch] = useState('');
   const [levelFilter, setLevelFilter] = useState('all');
   const [selectedLog, setSelectedLog] = useState<any>(null);
   const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
   const { addToast } = useToast();

   const fetchLogs = async () => {
      try {
         const response = await api.get<any>('/admin/system/logs');
         if (response.data && response.data.logs) {
            const parsedLogs = response.data.logs.map((line: string, index: number) => {
               const match = line.match(/^\[(.*?)\]\s+(\w+)\s+(.*?):\s+(.*)$/);
               if (match) {
                  return {
                     id: `log-${index}`,
                     timestamp: match[1],
                     level: match[2].toLowerCase(),
                     source: match[3],
                     message: match[4]
                  };
               }
               return {
                  id: `log-${index}`,
                  timestamp: new Date().toISOString(),
                  level: 'info',
                  source: 'SYSTEM',
                  message: line
               };
            });
            setLogs(parsedLogs.reverse());
         }
      } catch (err) {
         console.error('Failed to fetch logs', err);
      } finally {
         setLoading(false);
      }
   };

   const handlePurge = async () => {
      try {
         setIsStreaming(false);

         await api.delete('/admin/system/logs/purge');

         setLogs([]);
         setShowPurgeConfirm(false);
         addToast('System logs have been permanently purged.', 'success');

         setTimeout(() => {
            setIsStreaming(true);
            fetchLogs();
         }, 2000);
      } catch (err: any) {
         const errorMsg = err.message || 'Critical error during log purge protocol.';
         addToast(errorMsg, 'error');
         setIsStreaming(true);
      }
   };

   useEffect(() => {
      fetchLogs();
      let interval: any;
      if (isStreaming) {
         interval = setInterval(fetchLogs, 5000);
      }
      return () => clearInterval(interval);
   }, [isStreaming]);

   const filteredLogs = logs.filter(log => {
      const matchesSearch = log.message?.toLowerCase().includes(search.toLowerCase()) ||
         log.source?.toLowerCase().includes(search.toLowerCase()) ||
         log.timestamp?.toLowerCase().includes(search.toLowerCase());
      const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
      return matchesSearch && matchesLevel;
   });

   if (loading) {
      return (
         <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-emerald-500" size={48} />
            <p className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em]">Synching with Audit Stream...</p>
         </div>
      );
   }

   return (
      <div className="space-y-10 animate-in fade-in duration-700 pb-20">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
               <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Audit Logs</h1>
               <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">immutable system activity & protocol history</p>
            </div>
            <div className="flex gap-4">
               <Button variant="outline" onClick={() => setIsStreaming(!isStreaming)} className="gap-2">
                  {isStreaming ? <Pause size={14} /> : <Play size={14} />}
                  {isStreaming ? 'Pause Stream' : 'Resume Stream'}
               </Button>
               <Button variant="outline" onClick={fetchLogs} className="gap-2"><RefreshCw size={14} /> Refresh</Button>
               <Button variant="danger" onClick={() => setShowPurgeConfirm(true)} className="gap-2"><Trash2 size={14} /> Purge Logs</Button>
            </div>
         </div>

         <Card className="p-0">
            <div className="p-8 border-b border-white/5 flex flex-col lg:flex-row gap-6 items-center justify-between">
               <div className="relative w-full lg:w-96 group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input
                     type="text"
                     placeholder="Search by ID, source or keywords..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="w-full pl-14 pr-6 py-4 bg-zinc-950/60 border border-white/5 rounded-2xl outline-none focus:border-emerald-500/30 transition-all text-[11px] font-bold uppercase tracking-widest text-white placeholder:text-zinc-700"
                  />
               </div>
               <div className="flex gap-4 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
                  <button
                     onClick={() => setLevelFilter('all')}
                     className={cn(
                        "px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                        levelFilter === 'all' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-zinc-950 border-white/5 text-zinc-600 hover:text-white"
                     )}
                  >
                     All Levels
                  </button>
                  <button
                     onClick={() => setLevelFilter('critical')}
                     className={cn(
                        "px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                        levelFilter === 'critical' ? "bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "bg-zinc-950 border-white/5 text-zinc-600 hover:text-white"
                     )}
                  >
                     Critical Only
                  </button>
               </div>
            </div>

            <Table headers={['Timestamp', 'Level', 'Source', 'Message', 'Protocol']}>
               {filteredLogs.length === 0 ? (
                  <tr>
                     <td colSpan={5} className="py-20 text-center text-zinc-500 italic uppercase text-[10px] font-black tracking-widest">No matching logs found.</td>
                  </tr>
               ) : filteredLogs.map(log => (
                  <tr key={log.id} className="group hover:bg-white/[0.02] transition-all">
                     <td className="px-6 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono shrink-0">{log.timestamp}</td>
                     <td className="px-6 py-6">
                        <div className={cn(
                           "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                           log.level === 'critical' || log.level === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
                              log.level === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                 'bg-zinc-800 text-zinc-400 border-white/5'
                        )}>
                           {log.level}
                        </div>
                     </td>
                     <td className="px-6 py-6 text-emerald-500 text-[10px] font-black uppercase tracking-widest">{log.source}</td>
                     <td className="px-6 py-6 text-zinc-300 text-xs font-bold leading-relaxed">{log.message}</td>
                     <td className="px-6 py-6 text-right">
                        <button
                           onClick={() => setSelectedLog(log)}
                           className="flex items-center gap-2 ml-auto text-[9px] font-black text-zinc-700 uppercase tracking-widest hover:text-white transition-all bg-zinc-950 hover:bg-zinc-900 border border-white/5 p-2 rounded-xl"
                        >
                           <Eye size={12} /> Details
                        </button>
                     </td>
                  </tr>
               ))}
            </Table>

            <div className="p-8 border-t border-white/5 flex items-center justify-between">
               <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">Monitoring {filteredLogs.length} live entries...</p>
               <div className="flex gap-2">
                  <button className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-zinc-600 hover:text-white transition-all"><ChevronLeft size={16} /></button>
                  <button className="p-3 bg-zinc-950 rounded-xl border border-white/5 text-zinc-600 hover:text-white transition-all"><ChevronRight size={16} /></button>
               </div>
            </div>
         </Card>

         {/* Detail Modal */}
         <Modal
            isOpen={!!selectedLog}
            onClose={() => setSelectedLog(null)}
            title="Protocol Log Detailed View"
            footer={<Button variant="ghost" onClick={() => setSelectedLog(null)}>Terminate View</Button>}
         >
            {selectedLog && (
               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Log Timestamp</p>
                        <p className="text-xs font-black text-white">{selectedLog.timestamp}</p>
                     </div>
                     <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Severity Rank</p>
                        <Badge variant={selectedLog.level === 'critical' || selectedLog.level === 'error' ? 'error' : selectedLog.level === 'warning' ? 'warning' : 'neutral'}>
                           {selectedLog.level}
                        </Badge>
                     </div>
                  </div>

                  <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5">
                     <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Origin Source</p>
                     <p className="text-xs font-black text-emerald-500 font-mono tracking-widest">{selectedLog.source}</p>
                  </div>

                  <div className="p-6 bg-zinc-950 rounded-2xl border border-white/5">
                     <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Event Metadata Payload</p>
                     <pre className="text-sm font-bold text-zinc-300 leading-relaxed font-mono bg-black/40 p-5 rounded-xl border border-white/5 overflow-x-auto whitespace-pre-wrap">
                        {selectedLog.message}
                     </pre>
                  </div>
               </div>
            )}
         </Modal>

         {/* Purge Confirmation Modal */}
         <Modal
            isOpen={showPurgeConfirm}
            onClose={() => setShowPurgeConfirm(false)}
            title="CRITICAL: Log Purge Protocol"
            footer={
               <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setShowPurgeConfirm(false)}>Abort Mission</Button>
                  <Button variant="danger" onClick={handlePurge} className="px-8 flex items-center gap-2">
                     <Trash2 size={14} /> Confirm Permanent Purge
                  </Button>
               </div>
            }
         >
            <div className="flex flex-col items-center text-center py-6">
               <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                  <ShieldAlert size={40} className="text-red-500" />
               </div>
               <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-2">Destructive Action Required</h3>
               <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed max-w-sm">
                  Warning: This operation will permanently wipe all audit stream records from the central server. This action cannot be reversed.
               </p>
               <div className="mt-8 p-4 bg-zinc-950 rounded-2xl border border-white/5 w-full">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600">
                     <span>Target Resource</span>
                     <span className="text-red-500">combined.log</span>
                  </div>
               </div>
            </div>
         </Modal>
      </div>
   );
};
