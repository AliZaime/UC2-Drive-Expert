
import React from 'react';
import { Card, Button, Input, Badge } from '../../components/UI';
import { 
  Sliders, Globe, Lock, Bell, Database, 
  Cloud, Save, RotateCcw, ShieldCheck
} from 'lucide-react';

export const SystemConfig = () => {
  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">System Parameters</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Configuring global environment variables</p>
        </div>
        <div className="flex gap-4">
           <Button variant="ghost"><RotateCcw size={16} /> Restore Defaults</Button>
           <Button variant="emerald"><Save size={16} /> Deploy Manifest</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Engine Settings" subtitle="Platform core orchestration">
           <div className="space-y-6 mt-8">
              <Input label="Master API Gateway" placeholder="https://core.autouc2.com" icon={Globe} />
              <div className="grid grid-cols-2 gap-4">
                 <Input label="Concurrency Limit" placeholder="Unlimited" />
                 <Input label="Cache TTL (Sec)" placeholder="3600" />
              </div>
              <div className="p-6 bg-zinc-950/80 border border-white/5 rounded-[2rem] flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Maintenance Mode</p>
                    <p className="text-[8px] text-zinc-600 font-bold uppercase mt-1">Status: Restricted Access</p>
                 </div>
                 <div className="w-12 h-6 bg-zinc-800 rounded-full p-1 cursor-pointer">
                    <div className="w-4 h-4 bg-zinc-600 rounded-full"></div>
                 </div>
              </div>
           </div>
        </Card>

        <Card title="Security Protocols" subtitle="Encryption & Data Mesh">
           <div className="space-y-6 mt-8">
              <Input label="Security Salt Node" type="password" placeholder="••••••••••••••••" icon={Lock} />
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] flex items-center gap-4">
                 <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
                 <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                   Quantum-safe encryption is active across all database shards.
                 </p>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
};
