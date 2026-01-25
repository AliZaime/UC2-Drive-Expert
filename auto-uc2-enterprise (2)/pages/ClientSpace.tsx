
import React from 'react';
import { Card, Badge, Button, Table, Modal } from '../components/UI';
import { MOCK_VEHICLES } from '../constants';
import { 
  Star, Zap, FileText, Calendar, PenTool, 
  Download, Clock, CheckCircle2, MapPin, 
  MessageSquare, ChevronRight, Plus
} from 'lucide-react';

export const ClientSaved = () => (
  <div className="space-y-10 animate-in fade-in duration-700">
    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Ma Sélection</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Véhicules sauvegardés et recommandations IA</p>
      </div>
      <Badge variant="info">3 Véhicules Enregistrés</Badge>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {MOCK_VEHICLES.map(v => (
        <Card key={v.id} className="p-0 overflow-hidden group">
          <div className="relative aspect-video">
            <img src={v.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={v.model} />
            <div className="absolute top-4 right-4"><Badge variant="success">Disponible</Badge></div>
          </div>
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{v.model}</h3>
                <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">{v.brand} • {v.year}</p>
              </div>
              <p className="text-xl font-black text-emerald-500">{v.price.toLocaleString()}€</p>
            </div>
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl mb-8 flex items-center gap-4">
               <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-500"><Zap size={16}/></div>
               <p className="text-[10px] font-bold text-zinc-400 leading-tight uppercase tracking-widest">Score Matching IA: <span className="text-emerald-500">92%</span></p>
            </div>
            <div className="flex gap-4">
              <Button variant="emerald" className="flex-1">Négocier</Button>
              <button className="p-4 bg-zinc-950 border border-white/5 rounded-2xl text-zinc-600 hover:text-white transition-all"><Star size={20}/></button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export const ClientContracts = () => (
  <div className="space-y-10 animate-in fade-in duration-700">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Mes Contrats</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Documents légaux et historiques de vente</p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2 p-0">
        <Table headers={['Document', 'Date', 'Type', 'Statut', 'Actions']}>
          {[
            { id: 'CTR-942', name: 'Bon de Commande - Tesla Model 3', date: '20 Mai 2024', type: 'Vente', status: 'À signer' },
            { id: 'CTR-941', name: 'Contrat d\'Entretien Or', date: '15 Mai 2024', type: 'Service', status: 'Signé' },
            { id: 'CTR-880', name: 'Facture #F-2024-11', date: '10 Mai 2024', type: 'Finance', status: 'Archivé' },
          ].map((doc, i) => (
            <tr key={i} className="group hover:bg-white/[0.02] transition-all">
              <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-zinc-500 group-hover:text-emerald-500"><FileText size={20}/></div>
                   <p className="text-sm font-black text-white uppercase tracking-tight">{doc.name}</p>
                </div>
              </td>
              <td className="px-8 py-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{doc.date}</td>
              <td className="px-8 py-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">{doc.type}</td>
              <td className="px-8 py-6">
                <Badge variant={doc.status === 'Signé' ? 'success' : doc.status === 'À signer' ? 'warning' : 'neutral'}>{doc.status}</Badge>
              </td>
              <td className="px-8 py-6 text-right">
                <div className="flex justify-end gap-2">
                  {doc.status === 'À signer' ? (
                    <Button variant="emerald" className="py-2 px-4 text-[9px]"><PenTool size={14}/> Signer</Button>
                  ) : (
                    <button className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-zinc-600 hover:text-white"><Download size={16}/></button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Support Signature" subtitle="Protocole de sécurité DocuSign UC2">
        <div className="space-y-6">
           <div className="p-6 bg-zinc-950 rounded-2xl border border-white/5 space-y-4">
             <div className="flex items-center gap-4 text-emerald-500">
               <CheckCircle2 size={24}/>
               <p className="text-xs font-black uppercase tracking-widest">Identité Vérifiée</p>
             </div>
             <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Votre certificat de signature électronique est actif jusqu'en 2025.</p>
           </div>
           <div className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-white/5">
             <div className="p-3 bg-zinc-950 rounded-xl text-zinc-600"><MessageSquare size={18}/></div>
             <div>
               <p className="text-xs font-black text-white uppercase">Aide Juridique</p>
               <p className="text-[9px] text-zinc-600 uppercase font-black">Agent disponible</p>
             </div>
           </div>
        </div>
      </Card>
    </div>
  </div>
);

export const ClientAppointments = () => (
  <div className="space-y-10 animate-in fade-in duration-700">
    <div>
      <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Mon Agenda</h1>
      <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Suivi des essais et livraisons</p>
    </div>

    <div className="space-y-6">
      {[
        { title: 'Essai Routier - BMW M4', date: 'Samedi 25 Mai', time: '14:30', location: 'Auto-UC2 Paris Nord', status: 'Confirmé' },
        { title: 'Livraison Véhicule', date: 'Mercredi 29 Mai', time: '10:00', location: 'Domicile', status: 'En préparation' },
      ].map((apt, i) => (
        <Card key={i} className="p-8 group hover:border-emerald-500/20 transition-all">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-8 flex-1">
              <div className="flex flex-col items-center p-4 bg-zinc-950 border border-white/5 rounded-[2rem] min-w-[100px]">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Mai</p>
                <p className="text-3xl font-black text-white tracking-tighter">{apt.date.split(' ')[1]}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">{apt.title}</h3>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    <Clock size={14} className="text-emerald-500"/> {apt.time}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    <MapPin size={14} className="text-emerald-500"/> {apt.location}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
               <Badge variant={apt.status === 'Confirmé' ? 'success' : 'warning'}>{apt.status}</Badge>
               <button className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-zinc-600 hover:text-white"><ChevronRight size={20}/></button>
            </div>
          </div>
        </Card>
      ))}
      {/* Fix: Added 'Plus' icon import from lucide-react */}
      <Button variant="outline" className="w-full py-6 border-dashed border-2 hover:border-emerald-500/50 text-zinc-500 hover:text-white rounded-[2rem]">
         <Plus size={20}/> Programmer un nouveau rendez-vous
      </Button>
    </div>
  </div>
);
