import React, { useState, useEffect } from 'react';
import { Card, Badge, cn } from '../components/UI';
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { Users, Car, MessageSquare, ArrowUpRight, DollarSign, Activity, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_VEHICLES, MOCK_NEGOTIATIONS } from '../constants';
import { api } from '../api';

const chartData = [
  { name: 'Jan', val: 4000 }, { name: 'Fév', val: 3000 }, { name: 'Mar', val: 5000 },
  { name: 'Avr', val: 2780 }, { name: 'Mai', val: 1890 }, { name: 'Juin', val: 2390 },
];

export const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ovRes, vRes] = await Promise.all([
          api.get<any>('/dashboard/overview'),
          api.get<any>('/vehicles?limit=4')
        ]);

        setStats(ovRes.data.stats);
        setRecentActivity(ovRes.data.recentActivity || []);
        setVehicles(vRes.data.data ? vRes.data.data.vehicles.slice(0, 4) : (vRes.data.vehicles?.slice(0, 4) || []));
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em]">Initialisation de la Matrice...</p>
      </div>
    );
  }

  const kpiData = [
    { label: 'Revenue YTD', value: '154,000€', icon: DollarSign, trend: '+12%', color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
    { label: 'Unités en Stock', value: stats?.inventory || '0', icon: Car, trend: '+4', color: 'text-blue-500', bg: 'bg-blue-500/5' },
    { label: 'Négos Actives', value: stats?.activeNegotiations || '0', icon: MessageSquare, trend: 'LIVE', color: 'text-purple-500', bg: 'bg-purple-500/5' },
    { label: 'Clients Actifs', value: stats?.activeClients || '0', icon: Activity, trend: '+0.4%', color: 'text-cyan-500', bg: 'bg-cyan-500/5' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Executive Dashboard</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Global Intelligence Oversight - Realtime View</p>
        </div>
        <div className="flex gap-4">
          <button
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all shadow-xl"
          >
            Export Global Report
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, idx) => (
          <Card key={idx} className="group hover:border-emerald-500/20 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
                <h3 className={cn("text-3xl font-black tracking-tighter", kpi.color)}>{kpi.value}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl transition-all border border-white/5", kpi.bg)}>
                <kpi.icon size={20} className={kpi.color} />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", kpi.trend.startsWith('+') ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                {kpi.trend}
              </span>
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">vs baseline</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2" title="Global Sales Performance" subtitle="Cross-agency revenue flow over 6 months">
          <div className="h-[350px] mt-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b', fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b', fontWeight: 900 }} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} />
                <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Signal Intelligence" subtitle="Live platform activity feed">
          <div className="space-y-6 mt-8">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-zinc-600 italic py-10 text-center">Aucune activité récente.</p>
            ) : recentActivity.map((neg: any) => (
              <div key={neg._id} className="flex gap-4 group cursor-pointer p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5">
                <div className="w-10 h-10 rounded-full bg-zinc-950 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-emerald-500/30 transition-colors">
                  <Users size={16} className="text-zinc-600 group-hover:text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-white tracking-tight truncate">
                    {neg.client ? `${neg.client.firstName} ${neg.client.lastName}` : 'System'}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {neg.messages?.length > 0 ? neg.messages[neg.messages.length - 1].content : 'Discussion ouverte'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                      {new Date(neg.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                      {neg.vehicle ? `${neg.vehicle.make} ${neg.vehicle.model}` : 'Véhicule'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Fleet Overview */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Strategic Fleet Stock</h2>
          <Link to="/vehicles" className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] hover:text-emerald-400 transition-colors">Access Inventory Matrix</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehicles.length === 0 ? (
            <div className="col-span-full py-10 text-center text-zinc-500 italic">Aucun véhicule en stock.</div>
          ) : vehicles.map((v: any) => (
            <div key={v._id} className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden group cursor-pointer hover:border-emerald-500/20 transition-all duration-500 relative">
              <div className="absolute top-4 right-4 z-10">
                <Badge variant={v.status === 'available' ? 'success' : 'warning'}>{v.status}</Badge>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={v.images?.[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1" alt={v.model} />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-6">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-1">{v.make}</p>
                <h4 className="text-lg font-black text-white tracking-tight group-hover:text-emerald-500 transition-colors uppercase">{v.model}</h4>
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                  <p className="text-xl font-black text-emerald-500">{v.price?.toLocaleString()}€</p>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{v.year}</p>
                    <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mt-0.5">{v.mileage} KM</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
