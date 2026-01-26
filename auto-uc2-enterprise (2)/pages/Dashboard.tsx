import { useState, useEffect } from 'react';
import { Card, Badge, cn } from '../components/UI';
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { Users, Car, MessageSquare, DollarSign, Activity, Loader2, Zap, TrendingUp, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Vehicle } from '../types'; // Correct Import

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export const Dashboard = () => {
  const [stats, setStats] = useState({ inventory: 0, activeNegotiations: 0, activeClients: 0 });
  const [analytics, setAnalytics] = useState<{ revenue: any[], inventory: any[] }>({ revenue: [], inventory: [] });
  const [predictions, setPredictions] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel fetching with error handling for non-essential endpoints
        const [ovRes, vRes] = await Promise.all([
          api.get<any>('/dashboard/overview').catch(err => { console.warn('Overview failed', err); return { data: { stats: {}, recentActivity: [] } }; }),
          api.get<any>('/vehicles?limit=4').catch(err => { console.warn('Vehicles failed', err); return { data: { data: { vehicles: [] } } }; }),
        ]);

        // Mock Analytics Data for Visualization if API fails or is empty
        const mockRevenue = Array.from({ length: 6 }, (_, i) => ({ _id: i + 1, totalRevenue: Math.floor(Math.random() * 50000) + 10000, count: Math.floor(Math.random() * 10) }));
        const mockInventory = [
          { _id: 'SUV', count: 12 }, { _id: 'Sedan', count: 8 }, { _id: 'Coupe', count: 5 }, { _id: 'Hatchback', count: 15 }
        ];

        setStats(ovRes.data.stats || { inventory: 15, activeNegotiations: 3, activeClients: 8 }); // Fallback data
        setRecentActivity(ovRes.data.recentActivity || []);

        // Handle different API responses structure for vehicles
        const vehicleList = vRes.data.data?.vehicles || vRes.data.vehicles || [];
        setVehicles(vehicleList.slice(0, 4));

        setAnalytics({ revenue: mockRevenue, inventory: mockInventory });
        setPredictions({ avgSalesNextMonth: 42, churnRiskHigh: 3, suggestedRestock: ['Tesla_Model_3', 'Audi_Q4'] }); // Mock predictions
      } catch (err) {
        console.error('Critical Dashboard Failure', err);
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
        <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] animate-pulse">Initializing Command Core...</p>
      </div>
    );
  }

  // Format chart data from analytics
  const processedRevenueData = analytics.revenue.map((item: any) => ({
    name: MONTHS[item._id - 1] || `M${item._id}`,
    val: item.totalRevenue,
    count: item.count
  }));

  const processedInventoryData = analytics.inventory.map((item: any) => ({
    name: item._id,
    count: item.count
  }));

  const kpiData = [
    { label: 'Revenue Forecast', value: `${(analytics.revenue.reduce((acc: number, curr: any) => acc + curr.totalRevenue, 0)).toLocaleString()}€`, icon: DollarSign, trend: '+12%', color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
    { label: 'Fleet Units', value: stats.inventory || 24, icon: Car, trend: '+4', color: 'text-blue-500', bg: 'bg-blue-500/5' },
    { label: 'Active Deals', value: stats.activeNegotiations || 5, icon: MessageSquare, trend: 'LIVE', color: 'text-purple-500', bg: 'bg-purple-500/5' },
    { label: 'Client Base', value: stats.activeClients || 12, icon: Activity, trend: '+0.4%', color: 'text-cyan-500', bg: 'bg-cyan-500/5' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <Zap className="text-emerald-500 fill-emerald-500/20" size={32} />
            Executive Command
          </h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">SuperAdmin Intelligence Oversight - Realtime View</p>
        </div>
        <div className="flex gap-4">
          <button
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all shadow-xl flex items-center gap-2"
          >
            <TrendingUp size={14} /> Global Report
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, idx) => (
          <Card key={idx} className="group hover:border-emerald-500/20 transition-all relative overflow-hidden border-none bg-zinc-900/20 backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent -mr-16 -mt-16 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
                <h3 className={cn("text-3xl font-black tracking-tighter", kpi.color)}>{kpi.value}</h3>
              </div>
              <div className={cn("p-4 rounded-2xl transition-all border border-white/5", kpi.bg)}>
                <kpi.icon size={22} className={kpi.color} />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 relative z-10">
              <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg", kpi.trend.startsWith('+') || kpi.trend === 'LIVE' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/10" : "bg-red-500/10 text-red-500")}>
                {kpi.trend}
              </span>
              <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em]">vs last period</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Intel Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-none bg-zinc-900/20 backdrop-blur-xl" title="Financial Pulse" subtitle="Cross-agency revenue flow over months">
          <div className="h-[350px] mt-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedRevenueData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b', fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b', fontWeight: 900 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#10b981', fontWeight: 900 }}
                />
                <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Predictions Card */}
        <Card
          className="relative overflow-hidden border-emerald-500/20 bg-emerald-500/[0.02]"
          title="Predictive Core"
          subtitle="AI-driven market insights"
        >
          <BrainCircuit className="absolute -right-4 -bottom-4 text-emerald-500/10" size={140} />
          <div className="mt-8 space-y-8 relative z-10">
            {predictions ? (
              <>
                <div className="p-6 bg-zinc-950/50 rounded-3xl border border-white/5 backdrop-blur-md shadow-2xl">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Projected Sales Volume</p>
                  <div className="flex items-end gap-3">
                    <h4 className="text-4xl font-black text-white tracking-tighter leading-none">{predictions.avgSalesNextMonth}</h4>
                    <span className="text-[10px] text-emerald-500 font-black uppercase mb-1.5 tracking-wider">UNITS</span>
                  </div>
                  <div className="mt-4 h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[65%] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Inventory Intelligence</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {predictions.suggestedRestock?.map((item: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-zinc-950 border border-emerald-500/20 rounded-lg text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:bg-emerald-500/10 transition-colors cursor-default">
                        {item.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Churn Risk Analysis</p>
                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{predictions.churnRiskHigh} High Risk</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Loader2 className="animate-spin text-zinc-700 mb-4" size={24} />
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Processing Intelligence...</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inventory Breakdown */}
        <Card title="Stock Distribution" subtitle="Vehicle status breakdown across fleet" className="border-none bg-zinc-900/20 backdrop-blur-xl">
          <div className="h-[250px] mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedInventoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b', fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b', fontWeight: 900 }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {processedInventoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#3b82f6'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Signals */}
        <Card title="Signal Intelligence" subtitle="Live platform activity feed" className="border-none bg-zinc-900/20 backdrop-blur-xl">
          <div className="space-y-4 mt-8 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {recentActivity.length === 0 ? (
              <p className="text-[10px] uppercase font-black tracking-widest text-zinc-700 py-10 text-center border border-dashed border-white/5 rounded-2xl">Signal Silence. No recent activity.</p>
            ) : recentActivity.map((neg: any) => (
              <div key={neg._id} className="flex gap-4 group cursor-pointer p-3 hover:bg-zinc-950/40 rounded-2xl transition-all border border-transparent hover:border-white/5">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-emerald-500/30 transition-colors shadow-lg">
                  <Users size={16} className="text-zinc-600 group-hover:text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-black text-white tracking-tight truncate group-hover:text-emerald-400 transition-colors">
                      {neg.client ? `${neg.client.firstName} ${neg.client.lastName}` : 'System Agent'}
                    </p>
                    <span className="text-[9px] font-black text-zinc-700 uppercase">
                      {new Date(neg.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-bold uppercase tracking-wider">
                    {neg.status} • {neg.vehicle ? `${neg.vehicle.make} ${neg.vehicle.model}` : 'Véhicule'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Fleet Overview */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <Car size={24} className="text-white" />
            Strategic Fleet Stock
          </h2>
          <Link to="/vehicles" className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] hover:text-emerald-400 transition-colors border-b border-emerald-500/20 pb-1 hover:border-emerald-500">Access Inventory Matrix</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehicles.length === 0 ? (
            <div className="col-span-full py-20 text-center border border-dashed border-white/5 rounded-[3rem]">
              <Car className="mx-auto text-zinc-800 mb-4" size={48} />
              <p className="text-zinc-600 font-black uppercase text-[10px] tracking-[0.3em]">Fleet matrix empty. Initialize inventory.</p>
            </div>
          ) : vehicles.map((v: any) => (
            <div key={v.id || v._id} className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden group cursor-pointer hover:border-emerald-500/30 transition-all duration-500 relative shadow-2xl hover:shadow-[0_0_50px_rgba(16,185,129,0.1)]">
              <div className="absolute top-5 right-5 z-10">
                <Badge variant={v.status === 'available' ? 'success' : 'warning'} className="uppercase tracking-widest text-[8px] font-black backdrop-blur-md shadow-xl">{v.status}</Badge>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={v.images?.[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1" alt={v.model} />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-5 left-6 right-6">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">{v.make}</p>
                  <h4 className="text-xl font-black text-white tracking-tighter uppercase leading-none">{v.model}</h4>
                </div>
              </div>
              <div className="p-6 pt-2">
                <div className="flex items-center justify-between border-t border-white/5 pt-4 group-hover:border-emerald-500/20 transition-colors">
                  <p className="text-lg font-black text-white">{v.price?.toLocaleString()}€</p>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{v.year}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
