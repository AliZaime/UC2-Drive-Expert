
import React from 'react';
import { Card, Badge, Button, Table, cn } from '../components/UI';
import { 
  BarChart3, Target, Zap, Users, Car, 
  DollarSign, Activity, Wrench, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Clock, MessageSquare, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Vehicle } from '../types';
import { 
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

const dummyData = [
  { name: 'Lun', val: 45 }, { name: 'Mar', val: 52 }, { name: 'Mer', val: 48 },
  { name: 'Jeu', val: 70 }, { name: 'Ven', val: 61 }, { name: 'Sam', val: 85 },
];

export const SalesPipeline = () => (
  <div className="space-y-10 animate-in fade-in duration-700">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Sales Pipeline</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Suivi du tunnel de conversion en temps réel</p>
      </div>
      <div className="flex gap-4">
        <Badge variant="success">Objectif: 85%</Badge>
        <Badge variant="info">Total: 1.2M€</Badge>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {[
        { label: 'Prospections', count: 42, value: '850k€', color: 'bg-zinc-800' },
        { label: 'Négociations', count: 18, value: '420k€', color: 'bg-blue-500/20' },
        { label: 'Financement', count: 8, value: '180k€', color: 'bg-amber-500/20' },
        { label: 'Clôture', count: 12, value: '290k€', color: 'bg-emerald-500/20' },
      ].map((step, i) => (
        <Card key={i} className="p-8 group hover:border-white/20 transition-all border-white/5">
           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{step.label}</p>
           <div className="flex justify-between items-end">
             <div>
                <h3 className="text-4xl font-black text-white tracking-tighter">{step.count}</h3>
                <p className="text-xs font-bold text-emerald-500 mt-1">{step.value}</p>
             </div>
             <div className={cn("w-1.5 h-12 rounded-full", step.color)} />
           </div>
        </Card>
      ))}
    </div>

    <Card title="Dernières Activités" className="p-0 overflow-hidden">
       <Table headers={['Lead', 'Véhicule', 'Probabilité', 'Dernière Action', 'Status']}>
          {[
            { lead: 'Jean Dupont', car: 'Tesla Model 3', prob: '85%', last: 'Appel hier', status: 'Chaud' },
            { lead: 'Marie Curie', car: 'BMW M4', prob: '45%', last: 'Email envoyé', status: 'Tiède' },
            { lead: 'Pierre Gasly', car: 'Audi RS6', prob: '95%', last: 'Offre acceptée', status: 'Gagné' },
          ].map((item, i) => (
            <tr key={i} className="group hover:bg-white/[0.02] transition-all">
              <td className="px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center font-black text-zinc-600 border border-white/5">{item.lead.charAt(0)}</div>
                  <p className="text-sm font-black text-white uppercase tracking-tight">{item.lead}</p>
                </div>
              </td>
              <td className="px-8 py-6 text-xs font-bold text-zinc-500">{item.car}</td>
              <td className="px-8 py-6">
                 <div className="w-full max-w-[100px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: item.prob }} />
                 </div>
              </td>
              <td className="px-8 py-6 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{item.last}</td>
              <td className="px-8 py-6"><Badge variant={item.status === 'Gagné' ? 'success' : item.status === 'Chaud' ? 'error' : 'warning'}>{item.status}</Badge></td>
            </tr>
          ))}
       </Table>
    </Card>
  </div>
);

export const FleetService = () => {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchMaintenanceVehicles = async () => {
      try {
        const res = await api.get('/vehicles');
        const allVehicles = res.data.data ? res.data.data.vehicles : (res.data.vehicles || []);
        // Filter for maintenance status
        const maintenance = allVehicles.filter((v: any) => v.status === 'maintenance');
        
        // Normalize
         const normalized = maintenance.map((v: any) => ({
          ...v,
          id: v._id || v.id,
          brand: v.make || v.brand,
        }));
        setVehicles(normalized);
      } catch (err) {
        console.error("Failed to fetch maintenance vehicles", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaintenanceVehicles();
  }, []);

  return (
  <div className="space-y-10 animate-in fade-in duration-700">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Service & Maintenance</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Gestion technique et préparation des stocks</p>
      </div>
      <Button variant="outline"><Wrench size={18}/> Nouvel Ordre</Button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2" title="Unités en Atelier" subtitle="Réparations et préparations actives">
        <div className="space-y-6 mt-8">
           {loading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-500" /></div>
           ) : vehicles.length === 0 ? (
             <div className="p-8 text-center text-zinc-500 border border-dashed border-white/5 rounded-2xl">
               Aucun véhicule en maintenance
             </div>
           ) : (
             vehicles.map((unit, i) => (
               <Link key={i} to={`/vehicles/${unit.id}`} className="block p-6 bg-zinc-950/40 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-emerald-500/20 transition-all">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 group-hover:text-emerald-500 transition-colors"><Activity size={24}/></div>
                     <div>
                        <h4 className="text-lg font-black text-white tracking-tight uppercase">{unit.brand} {unit.model}</h4>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Maintenance en cours • ID: {unit.id.slice(-6)}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-8">
                     <div className="hidden md:block w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 animate-pulse" style={{ width: `60%` }} />
                     </div>
                     <Badge variant="warning">En Cours</Badge>
                  </div>
               </Link>
             ))
           )}
        </div>
      </Card>


    </div>
  </div>
  );
};

export const SalesAnalytics = () => (
  <div className="space-y-10 animate-in fade-in duration-700">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Intelligence Center</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Deep analysis and performance forecasting</p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2" title="Performance Revenue" subtitle="Flux mensuel vs Objectifs">
         <div className="h-[350px] mt-8">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={dummyData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#52525b', fontWeight: 900}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#52525b', fontWeight: 900}} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }} />
                  <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </Card>

      <div className="space-y-8">
         {[
           { label: 'Commission Estimée', value: '12,450€', trend: '+15%', up: true },
           { label: 'Temps de Clôture', value: '14 Jours', trend: '-2 J', up: false },
           { label: 'Satisfaction Client', value: '4.9/5', trend: '+0.2', up: true },
         ].map((kpi, i) => (
           <Card key={i}>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{kpi.label}</p>
              <div className="flex justify-between items-baseline">
                 <h3 className="text-3xl font-black text-white tracking-tighter">{kpi.value}</h3>
                 <span className={cn("text-[10px] font-black uppercase tracking-widest", kpi.up ? "text-emerald-500" : "text-blue-400")}>{kpi.trend}</span>
              </div>
           </Card>
         ))}
      </div>
    </div>
  </div>
);
