
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, cn } from '../../components/UI';
import {
   UserCircle, Lock, Mail, Shield, History,
   Smartphone, Monitor, Globe, Save, Loader2
} from 'lucide-react';
import { MOCK_USERS } from '../../constants';

import { User, UserRole } from '../../types';
import { api } from '../../api';

export const UserProfile = ({ user }: { user: User }) => {
   const [sessions, setSessions] = useState<any[]>([]);
   const [loadingSessions, setLoadingSessions] = useState(true);

   useEffect(() => {
      const fetchSessions = async () => {
         try {
            const response = await api.get<any>('/sessions');
            setSessions(response.data.data ? response.data.data.sessions : (response.data.sessions || []));
         } catch (err) {
            console.error('Failed to fetch sessions', err);
         } finally {
            setLoadingSessions(false);
         }
      };
      fetchSessions();
   }, []);

   const currentUser = user;

   return (
      <div className="space-y-10 animate-in fade-in duration-700 pb-20">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
               <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">My Profile</h1>
               <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Manage your identity and security protocols</p>
            </div>
            <Button variant="emerald" className="px-8"><Save size={16} /> Update Protocol</Button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="flex flex-col items-center text-center p-12 lg:col-span-1">
               <div className="relative group">
                  <img src={currentUser.avatar} className="w-32 h-32 rounded-[2.5rem] border-2 border-emerald-500/30 group-hover:border-emerald-500 transition-all" alt="Avatar" />
                  <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                     <p className="text-[9px] font-black text-white uppercase tracking-widest">Change Photo</p>
                  </div>
               </div>
               <div className="mt-8 space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase">{currentUser.name}</h3>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{currentUser.role}</p>
               </div>
               <div className="w-full mt-10 pt-10 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                     <span className="text-zinc-600">Account ID</span>
                     <span className="text-zinc-400 font-mono">UC2-USR-9942</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                     <span className="text-zinc-600">Join Date</span>
                     <span className="text-zinc-400">Jan 20, 2024</span>
                  </div>
               </div>
            </Card>

            <div className="lg:col-span-2 space-y-8">
               <Card title="Identity Configuration" subtitle="Primary account credentials">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                     <Input label="Full Display Name" defaultValue={currentUser.name} />
                     <Input label="Verified Email" defaultValue={currentUser.email} icon={Mail} readOnly />
                     <Input label="Secondary Email" placeholder="backup@gmail.com" />
                     <Input label="Department" defaultValue="Operations Intelligence" />
                  </div>
               </Card>

               <Card title="Security Protocols" subtitle="Multi-factor authentication & Passwords">
                  <div className="space-y-6 mt-8">
                     <div className="flex items-center justify-between p-6 bg-zinc-950 border border-white/5 rounded-[2rem]">
                        <div className="flex items-center gap-5">
                           <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                              <Lock size={20} />
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-white uppercase tracking-widest">Two-Factor Authentication (2FA)</p>
                              <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Status: Active & Secure</p>
                           </div>
                        </div>
                        <Button variant="outline" className="text-[9px]">Reconfigure</Button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="secondary" className="py-4 rounded-2xl">Change Password</Button>
                        <Button variant="secondary" className="py-4 rounded-2xl">Download Security Keys</Button>
                     </div>
                  </div>
               </Card>
            </div>
         </div>

         <Card title="Active Session Matrix" subtitle="Connected devices & geographic activity">
            <div className="space-y-4 mt-8">
               {loadingSessions ? (
                  <div className="flex justify-center p-10"><Loader2 className="animate-spin text-zinc-500" /></div>
               ) : sessions.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic text-center py-4">Aucune session active trouvée.</p>
               ) : sessions.map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-zinc-900/60 rounded-[1.5rem] border border-white/5">
                     <div className="flex items-center gap-6">
                        <div className="p-3 bg-zinc-950 border border-white/5 rounded-xl text-zinc-500">
                           {session.userAgent?.toLowerCase().includes('mobi') ? <Smartphone size={20} /> : <Monitor size={20} />}
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-white uppercase tracking-widest">{session.userAgent || 'Common Browser'}</p>
                           <div className="flex items-center gap-3 mt-1">
                              <span className="text-[9px] font-mono text-zinc-600">{session.ipAddress}</span>
                              <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{new Date(session.createdAt).toLocaleDateString()}</span>
                           </div>
                        </div>
                     </div>
                     {session.isValid ? (
                        <Badge variant="success">Active</Badge>
                     ) : (
                        <button className="text-[9px] font-black text-zinc-600 hover:text-red-500 uppercase tracking-widest transition-colors">Revoke Access</button>
                     )}
                  </div>
               ))}
            </div>
         </Card>
      </div>
   );
};
