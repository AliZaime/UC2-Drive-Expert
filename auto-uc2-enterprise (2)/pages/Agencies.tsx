
import React from 'react';
import { Card, Badge, Button } from '../components/UI';
import { MOCK_AGENCIES } from '../constants';
import { Building2, MapPin, ShieldCheck } from 'lucide-react';

export const Agencies: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Agency Network</h1>
          <p className="text-zinc-500 font-medium">Global oversight of franchise performance and compliance.</p>
        </div>
        <Button className="shadow-lg shadow-zinc-800/20">
          <Building2 size={18} /> Provision Agency
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_AGENCIES.map(agency => (
          <Card key={agency.id} className="relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-2 transition-all" />
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="font-black text-xl text-zinc-900 leading-tight">{agency.name}</h3>
                <ShieldCheck size={20} className="text-green-500" />
              </div>
              <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
                <MapPin size={16} /> {agency.location}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                <div>
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Revenue</p>
                  <p className="text-lg font-black text-blue-600">{agency.revenue}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Fleet Size</p>
                  {/* Fixed property name from fleet to fleetCount */}
                  <p className="text-lg font-black text-zinc-900">{agency.fleetCount} Units</p>
                </div>
              </div>
              <div className="pt-2">
                <div className="text-xs text-zinc-500 flex items-center justify-between">
                  {/* Fixed property name from manager to managerId */}
                  <span>Manager: <span className="font-bold text-zinc-900">{agency.managerId}</span></span>
                  <Badge variant="info">Active</Badge>
                </div>
              </div>
              <Button variant="ghost" className="w-full mt-2 border border-zinc-100 py-2.5 text-xs">
                View Agency Dashboard
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
