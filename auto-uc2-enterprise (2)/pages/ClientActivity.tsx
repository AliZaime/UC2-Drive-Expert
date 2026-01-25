import React, { useState, useEffect } from 'react';
import { Card, Badge, Input } from '../components/UI';
import { Search, Filter, Calendar, Phone, Mail, MessageSquare, FileText, User, Clock } from 'lucide-react';
import { api } from '../api';

interface Activity {
  id: string;
  clientId: string;
  clientName: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'system';
  content: string;
  author: string;
  createdAt: string;
}

export const ClientActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Fetch clients with their notes
        const response = await api.get<any>('/clients');
        const clients = response.data.data ? response.data.data.clients : (response.data.clients || []);
        
        // Transform notes into activity timeline
        const allActivities: Activity[] = [];
        clients.forEach((client: any) => {
          if (client.notes && client.notes.length > 0) {
            client.notes.forEach((note: any) => {
              allActivities.push({
                id: note._id || Math.random().toString(),
                clientId: client._id || client.id,
                clientName: `${client.firstName} ${client.lastName}`,
                type: 'note',
                content: note.text,
                author: note.author?.name || 'Agent',
                createdAt: note.createdAt || new Date().toISOString()
              });
            });
          }
        });

        // Sort by date (most recent first)
        allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivities(allActivities);
      } catch (err) {
        console.error('Failed to fetch activities', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone size={18} className="text-blue-500" />;
      case 'email': return <Mail size={18} className="text-purple-500" />;
      case 'meeting': return <Calendar size={18} className="text-emerald-500" />;
      case 'note': return <FileText size={18} className="text-amber-500" />;
      default: return <MessageSquare size={18} className="text-zinc-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call': return 'border-blue-500/20 bg-blue-500/5';
      case 'email': return 'border-purple-500/20 bg-purple-500/5';
      case 'meeting': return 'border-emerald-500/20 bg-emerald-500/5';
      case 'note': return 'border-amber-500/20 bg-amber-500/5';
      default: return 'border-white/10 bg-white/5';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Notes & Suivi</h1>
          <p className="text-zinc-500 font-medium">Timeline complète des interactions clients</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              filter === 'all' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            Tout
          </button>
          <button
            onClick={() => setFilter('note')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              filter === 'note' ? 'bg-amber-500 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            Notes
          </button>
        </div>
      </div>

      <Card>
        <div className="flex gap-4 mb-8">
          <Input icon={Search} placeholder="Rechercher dans l'historique..." className="flex-1" />
          <button className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 transition-all flex items-center gap-2">
            <Filter size={18} /> Filtrer
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-zinc-500">Chargement...</div>
        ) : activities.length === 0 ? (
          <div className="py-20 text-center">
            <MessageSquare size={48} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-medium">Aucune activité enregistrée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities
              .filter(a => filter === 'all' || a.type === filter)
              .map((activity) => (
                <div
                  key={activity.id}
                  className={`p-6 rounded-2xl border transition-all hover:border-white/20 ${getActivityColor(activity.type)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-black text-white uppercase text-sm tracking-tight">
                            {activity.clientName}
                          </h3>
                          <Badge variant="neutral">{activity.type}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-600">
                          <Clock size={12} />
                          {formatDate(activity.createdAt)}
                        </div>
                      </div>
                      <p className="text-zinc-400 text-sm leading-relaxed">{activity.content}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
                        <User size={12} />
                        <span>Par {activity.author}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
};
