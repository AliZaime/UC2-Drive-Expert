
import React from 'react';
import { Card, Badge, cn, Table } from '../../components/UI';
import { 
  ShieldAlert, Lock, Eye, Zap, ShieldCheck, 
  Terminal, Globe, AlertTriangle, Fingerprint
} from 'lucide-react';

export const SecurityAudit = () => {
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">War Room</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Real-time threat detection & access monitoring</p>
        </div>
        <div className="flex gap-4">
           <Badge variant="error">2 Critical Threats Blocked</Badge>
           <Badge variant="success">Firewall: active</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2" title="Access Vector Map" subtitle="Inbound traffic geographic origin">
           <div className="h-[300px] bg-zinc-950 rounded-[2rem] border border-white/5 flex items-center justify-center relative group">
              <Globe size={120} className="text-emerald-500/20 group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] animate-pulse">Global Map Syncing...</p>
              </div>
           </div>
        </Card>

        <div className="space-y-6">
           {[
             { label: 'Brute Force Attempts', value: '0', status: 'secure', icon: Lock, color: 'text-emerald-500' },
             { label: 'Unusual Geo-Logins', value: '12', status: 'investigating', icon: Globe, color: 'text-amber-500' },
             { label: 'MFA Success Rate', value: '99.8%', status: 'optimal', icon: Fingerprint, color: 'text-cyan-500' },
           ].map((stat, i) => (
             <Card key={i} className="p-8">
                <div className="flex justify-between items-start">
                   <div className={cn("p-3 rounded-2xl bg-white/5 border border-white/5", stat.color)}>
                      <stat.icon size={20} />
                   </div>
                   <Badge variant={stat.status === 'secure' || stat.status === 'optimal' ? 'success' : 'warning'}>{stat.status}</Badge>
                </div>
                <div className="mt-6">
                   <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{stat.label}</p>
                   <p className="text-3xl font-black text-white tracking-tighter">{stat.value}</p>
                </div>
             </Card>
           ))}
        </div>
      </div>

      <Card title="Recent Security Events" subtitle="Filtered logs of high-severity occurrences">
         <Table headers={['Timestamp', 'Event Type', 'Source IP', 'User Agent', 'Status']}>
            {[
              { time: '14:22:01', type: 'FAILED_LOGIN', ip: '45.122.3.1', agent: 'Chrome/Win', status: 'BLOCKED' },
              { time: '14:15:55', type: 'ADMIN_ACCESS', ip: '127.0.0.1', agent: 'System', status: 'VERIFIED' },
              { time: '13:50:12', type: 'GEO_ANOMALY', ip: '89.44.1.2', agent: 'Safari/iOS', status: 'MFA_REQ' },
            ].map((ev, i) => (
              <tr key={i} className="group hover:bg-white/5 transition-all">
                <td className="px-6 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">{ev.time}</td>
                <td className="px-6 py-6 font-bold text-white text-xs">{ev.type}</td>
                <td className="px-6 py-6 text-emerald-500 font-mono text-[10px]">{ev.ip}</td>
                <td className="px-6 py-6 text-zinc-600 text-[10px] font-bold uppercase">{ev.agent}</td>
                <td className="px-6 py-6">
                   <Badge variant={ev.status === 'VERIFIED' ? 'success' : ev.status === 'MFA_REQ' ? 'warning' : 'error'}>{ev.status}</Badge>
                </td>
              </tr>
            ))}
         </Table>
      </Card>
    </div>
  );
};
