
import React, { useState, useEffect } from 'react';
import { Card, Badge, cn } from '../../components/UI';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
  Zap, ArrowUpRight, ArrowDownRight, Activity,
  Globe, Database, Server, Timer, Loader2
} from 'lucide-react';
import { MOCK_METRICS } from '../../constants';
import { api } from '../../api';

export const SystemMetrics = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.get<any>('/admin/system/metrics');
        setMetrics(response.data.metrics);
      } catch (err) {
        console.error('Failed to fetch metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em]">Extracting Platform Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Platform Metrics</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Real-time technical analytics core</p>
        </div>
        <div className="flex gap-4">
          <Badge variant="success">All nodes active</Badge>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
            <Activity size={14} className="animate-pulse" /> Live Stream
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'RSS Memory', value: (metrics.memoryUsage.rss / 1024 / 1024).toFixed(1), unit: 'MB', icon: Zap, trend: '+2%', up: true },
          { label: 'Heap Used', value: (metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(1), unit: 'MB', icon: Timer, trend: '-1%', up: false },
          { label: 'Node Version', value: metrics.nodeVersion, unit: 'v', icon: Server, trend: 'STABLE', up: true },
          { label: 'Platform Load', value: '0.04', unit: '%', icon: Activity, trend: '+0.01%', up: true },
        ].map((stat, i) => (
          <Card key={i} className="group hover:border-emerald-500/20 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-zinc-950 border border-white/5 rounded-2xl group-hover:border-emerald-500/30 transition-all">
                <stat.icon size={20} className="text-emerald-500" />
              </div>
              <div className={cn("flex items-center gap-1 text-[9px] font-black uppercase tracking-widest", stat.up ? "text-emerald-500" : "text-red-500")}>
                {stat.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {stat.trend}
              </div>
            </div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-white tracking-tighter">{stat.value}</h3>
              <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{stat.unit}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2" title="Request Distribution" subtitle="Traffic load per geographic region">
          <div className="h-[350px] mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_METRICS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b', fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b', fontWeight: 900 }} />
                <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} contentStyle={{ backgroundColor: '#09090b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} />
                <Bar dataKey="requests" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Resource Allocation" subtitle="Compute units vs. Active users">
          <div className="space-y-8 mt-10">
            {[
              { node: 'Node Alpha (EU)', load: 78, status: 'busy' },
              { node: 'Node Beta (US)', load: 45, status: 'optimal' },
              { node: 'Node Gamma (ASIA)', load: 12, status: 'idle' },
            ].map((node, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">{node.node}</p>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-0.5">{node.status}</p>
                  </div>
                  <p className="text-sm font-black text-emerald-500">{node.load}%</p>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000", node.load > 70 ? "bg-amber-500" : "bg-emerald-500")}
                    style={{ width: `${node.load}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 p-6 bg-zinc-950 rounded-[2rem] border border-white/5 flex flex-col items-center text-center">
            <Server size={32} className="text-zinc-700 mb-4" />
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Global Scaler</h4>
            <p className="text-[10px] text-zinc-600 font-bold leading-relaxed mt-2 italic">
              Cluster auto-scaling enabled. Next assessment in 45s.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
