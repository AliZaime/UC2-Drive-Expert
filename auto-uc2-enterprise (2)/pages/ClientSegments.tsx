import React, { useState, useEffect } from 'react';
import { Card, Badge } from '../components/UI';
import { Users, TrendingUp, Target, Zap, DollarSign, Award } from 'lucide-react';
import { api } from '../api';

interface Segment {
  id: string;
  name: string;
  description: string;
  count: number;
  icon: any;
  color: string;
  criteria: string;
}

export const ClientSegments = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get<any>('/clients');
        const data = response.data.data ? response.data.data.clients : (response.data.clients || []);
        setClients(data);
      } catch (err) {
        console.error('Failed to fetch clients', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Calculate segments dynamically
  const segments: Segment[] = [
    {
      id: 'leads',
      name: 'Leads Froids',
      description: 'Nouveaux contacts à qualifier',
      count: clients.filter(c => c.status === 'Lead').length,
      icon: Users,
      color: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
      criteria: 'Status: Lead'
    },
    {
      id: 'prospects',
      name: 'Prospects Actifs',
      description: 'En phase de découverte',
      count: clients.filter(c => c.status === 'Prospect').length,
      icon: Target,
      color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      criteria: 'Status: Prospect'
    },
    {
      id: 'active',
      name: 'Négociations en Cours',
      description: 'Prêts à acheter',
      count: clients.filter(c => c.status === 'Active').length,
      icon: Zap,
      color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      criteria: 'Status: Active'
    },
    {
      id: 'customers',
      name: 'Clients Fidèles',
      description: 'Ont déjà acheté',
      count: clients.filter(c => c.status === 'Customer').length,
      icon: Award,
      color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      criteria: 'Status: Customer'
    },
    {
      id: 'vip',
      name: 'Segment VIP',
      description: 'Clients premium identifiés',
      count: clients.filter(c => c.tags?.includes('VIP')).length,
      icon: DollarSign,
      color: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      criteria: 'Tags: VIP'
    },
    {
      id: 'hot',
      name: 'Opportunités Chaudes',
      description: 'Conversion imminente',
      count: clients.filter(c => c.tags?.includes('Urgent') || c.tags?.includes('Hot')).length,
      icon: TrendingUp,
      color: 'bg-red-500/10 border-red-500/20 text-red-400',
      criteria: 'Tags: Urgent, Hot'
    }
  ];

  const totalClients = clients.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Segmentation Client</h1>
          <p className="text-zinc-500 font-medium">Analyse et catégorisation de votre base clients</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Total Clients</p>
            <p className="text-2xl font-black text-white">{totalClients}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((segment) => {
            const Icon = segment.icon;
            const percentage = totalClients > 0 ? Math.round((segment.count / totalClients) * 100) : 0;

            return (
              <Card
                key={segment.id}
                className={`p-6 border transition-all hover:border-white/20 cursor-pointer group ${segment.color}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <Badge variant="neutral">{percentage}%</Badge>
                </div>

                <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">
                  {segment.name}
                </h3>
                <p className="text-sm text-zinc-500 mb-4">{segment.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div>
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Contacts</p>
                    <p className="text-2xl font-black text-white">{segment.count}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Critère</p>
                    <p className="text-xs text-zinc-500 font-medium">{segment.criteria}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      <Card className="p-8">
        <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Répartition Globale</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Taux de Conversion', value: `${totalClients > 0 ? Math.round((segments[3].count / totalClients) * 100) : 0}%`, trend: '+12%' },
            { label: 'Leads Qualifiés', value: segments[1].count + segments[2].count, trend: '+8%' },
            { label: 'Clients VIP', value: segments[4].count, trend: '+3%' },
            { label: 'Opportunités', value: segments[5].count, trend: '+15%' }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-2">{stat.label}</p>
              <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
              <p className="text-xs font-bold text-emerald-500">{stat.trend}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
