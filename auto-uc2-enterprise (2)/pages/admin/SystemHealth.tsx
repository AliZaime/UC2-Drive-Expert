
import React, { useState, useEffect } from 'react';
import { Card, Badge, cn } from '../../components/UI';
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Database, Server, Cpu, Globe, Zap, ShieldCheck,
  AlertCircle, Activity, HardDrive, Network, Loader2
} from 'lucide-react';
import { MOCK_METRICS, MOCK_LOGS } from '../../constants';
import { api } from '../../api';

export const SystemHealth = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await api.get<any>('/admin/system/health');
        setHealth(response);
      } catch (err) {
        console.error('Failed to fetch system health', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em]">Querying Core Service Health...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">System Health</h1>
          </div>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Real-time infrastructure monitoring - ID: UC2-ALPHA-01</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3">
            <Zap size={14} /> Purge Cache
          </button>
          <button className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/20 transition-all">
            Initialize Protocol
          </button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Uptime', status: `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`, icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
          { label: 'Core Engine', status: health.message, icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
          { label: 'Sync Status', status: 'Healthy', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
          { label: 'Security Firewall', status: 'Shielded', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
        ].map((item, idx) => (
          <div key={idx} className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 flex items-center gap-6 group hover:border-emerald-500/20 transition-all">
            <div className={cn("p-4 rounded-2xl transition-all", item.bg)}>
              <item.icon size={24} className={item.color} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">{item.label}</p>
              <h3 className="text-xl font-black text-white tracking-tight">{item.status}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-10 overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Infrastructure Load</h2>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">CPU & Memory Utilization (Last 24h)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">CPU</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Memory</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_METRICS}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b', fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b', fontWeight: 900 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" />
                <Area type="monotone" dataKey="memory" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorMem)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-10 flex flex-col">
          <div className="mb-10">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Traffic Pulse</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Request distribution per node</p>
          </div>
          <div className="flex-1 space-y-8">
            {[
              { label: 'Cluster Alpha (EU-WEST)', value: 85, color: 'bg-emerald-500' },
              { label: 'Cluster Beta (US-EAST)', value: 62, color: 'bg-blue-500' },
              { label: 'Cluster Gamma (ASIA-SE)', value: 24, color: 'bg-purple-500' },
              { label: 'Legacy Gateway', value: 12, color: 'bg-zinc-700' },
            ].map((node, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{node.label}</p>
                  <p className="text-sm font-black text-white">{node.value}%</p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-1000", node.color)} style={{ width: `${node.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 p-6 bg-zinc-950/40 rounded-3xl border border-white/5 flex items-center gap-4">
            <AlertCircle className="text-amber-500 shrink-0" size={24} />
            <p className="text-[10px] font-bold text-zinc-500 leading-relaxed italic">
              Minor latency spike detected on US-EAST cluster. Scaling active...
            </p>
          </div>
        </div>
      </div>

      {/* Audit Logs Preview */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Audit Stream</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Active security events and system changes</p>
          </div>
          <button className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors">View All Logs</button>
        </div>
        <div className="space-y-4">
          {MOCK_LOGS.map(log => (
            <div key={log.id} className="flex items-center gap-6 p-4 hover:bg-white/5 rounded-2xl transition-all group border border-transparent hover:border-white/5">
              <div className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                log.level === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  log.level === 'error' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                    log.level === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
              )}>
                {log.level}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600 w-40 shrink-0">{log.timestamp}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 w-32 shrink-0">{log.source}</div>
              <div className="text-xs font-bold text-zinc-300 flex-1 truncate">{log.message}</div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white">Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
