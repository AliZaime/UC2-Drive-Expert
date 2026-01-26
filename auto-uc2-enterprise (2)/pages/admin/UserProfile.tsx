
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, cn, useToast, Modal } from '../../components/UI';
import {
   Lock, Mail, Save, Loader2
} from 'lucide-react';
import { User } from '../../types';
import { api } from '../../api';

export const UserProfile = ({ user }: { user: User }) => {
   const { addToast } = useToast();
   const [profileLoading, setProfileLoading] = useState(true);
   const [profileUser, setProfileUser] = useState<User | null>(user);
   const [clientProfile, setClientProfile] = useState<any | null>(null);
   const [savingProfile, setSavingProfile] = useState(false);
   const [savingConsents, setSavingConsents] = useState(false);
   const [profileForm, setProfileForm] = useState({
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      secondaryEmail: '',
      department: ''
   });
   const [consents, setConsents] = useState({
      personalDataProcessing: user?.consents?.personalDataProcessing ?? false,
      registrationDataUsage: user?.consents?.registrationDataUsage ?? false,
      conversationDataUsage: user?.consents?.conversationDataUsage ?? false
   });
   const [meta, setMeta] = useState({
      accountId: user?.id,
      joinDate: user?.createdAt || user?.lastLogin
   });
   const [passwordModalOpen, setPasswordModalOpen] = useState(false);
   const [changingPassword, setChangingPassword] = useState(false);
   const [passwordForm, setPasswordForm] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
   });
   const [mfaModalOpen, setMfaModalOpen] = useState(false);
   const [mfaLoading, setMfaLoading] = useState(false);
   const [mfaQRCode, setMfaQRCode] = useState<string | null>(null);
   const [mfaSecret, setMfaSecret] = useState<string | null>(null);
   const [mfaVerifyCode, setMfaVerifyCode] = useState('');
   const [consentsModalOpen, setConsentsModalOpen] = useState(false);
   const [uploadingPhoto, setUploadingPhoto] = useState(false);
   const photoInputRef = React.useRef<HTMLInputElement>(null);

   const normalizeUser = (u: any): User => ({
      ...user,
      ...u,
      id: u?._id || u?.id || user.id,
      avatar: u?.photo || u?.avatar || user.avatar,
      role: u?.role || user.role,
      lastLogin: u?.lastLogin || user.lastLogin,
      createdAt: u?.createdAt || user.createdAt,
      consents: u?.consents || user.consents
   });

   const displayUser = profileUser || user;

   const formatAccountId = (id?: string) => {
      if (!id) return 'N/A';
      return `UC2-${String(id).slice(-8).toUpperCase()}`;
   };

   const formatDate = (date?: string) => {
      if (!date) return 'Non défini';
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) return 'Non défini';
      return parsed.toLocaleDateString();
   };

   const hasValue = (val: any): boolean => {
      return val !== null && val !== undefined && val !== '';
   };

   const renderFieldIfExists = (value: any, fallback: string = 'Non renseigné'): string => {
      return hasValue(value) ? String(value) : fallback;
   };

   const getInitials = (name: string): string => {
      if (!name) return 'U';
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
   };

   const getAvatarUrl = (user: User): string => {
      if (user?.photo || user?.avatar) return user.photo || user.avatar;
      // Générer un avatar avec initiales
      const initials = getInitials(user?.name || '');
      const colors = ['10b981', '3b82f6', '8b5cf6', 'ef4444', 'f59e0b', 'ec4899'];
      const colorIndex = (user?.name?.charCodeAt(0) || 0) % colors.length;
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${colors[colorIndex]}&color=fff&size=256&bold=true&font-size=0.4`;
   };

   const fetchProfile = async () => {
      setProfileLoading(true);
      try {
         const response = await api.get<any>('/my/profile');
         const data = response.data?.data || response.data || {};
         const fetchedUser = data.user ? normalizeUser(data.user) : normalizeUser(displayUser);
         const fetchedClient = data.client || null;

         setProfileUser(fetchedUser);
         setClientProfile(fetchedClient);
         setProfileForm({
            name: fetchedUser.name || '',
            email: fetchedUser.email || '',
            phone: fetchedClient?.phone || '',
            secondaryEmail: fetchedClient?.email && fetchedClient.email !== fetchedUser.email ? fetchedClient.email : '',
            department: (fetchedClient?.agency && typeof fetchedClient.agency === 'string') ? fetchedClient.agency : ''
         });
         setConsents({
            personalDataProcessing: fetchedUser.consents?.personalDataProcessing ?? false,
            registrationDataUsage: fetchedUser.consents?.registrationDataUsage ?? false,
            conversationDataUsage: fetchedUser.consents?.conversationDataUsage ?? false
         });
         setMeta({
            accountId: fetchedUser.id,
            joinDate: fetchedUser.createdAt || fetchedUser.lastLogin
         });
      } catch (err) {
         console.error('Failed to fetch profile', err);
         addToast('Impossible de charger le profil', 'error');
      } finally {
         setProfileLoading(false);
      }
   };

   const fetchSessions = async () => {
      setLoadingSessions(true);
      try {
         const response = await api.get<any>('/sessions');
         setSessions(response.data.data ? response.data.data.sessions : (response.data.sessions || []));
      } catch (err) {
         console.error('Failed to fetch sessions', err);
      } finally {
         setLoadingSessions(false);
      }
   };

   useEffect(() => {
      fetchProfile();
      fetchSessions();
   }, []);

   const updateProfileField = (field: string, value: string) => {
      setProfileForm(prev => ({ ...prev, [field]: value }));
   };

   const handleUpdateProfile = async () => {
      setSavingProfile(true);
      try {
         const payload: any = {
            name: profileForm.name,
            email: profileForm.email
         };
         if (profileForm.phone) payload.phone = profileForm.phone;

         const response = await api.patch<any>('/my/profile', payload);
         const updatedUser = response.data?.data?.user ? normalizeUser(response.data.data.user) : null;
         if (updatedUser) {
            setProfileUser(updatedUser);
            localStorage.setItem('auto_uc2_user', JSON.stringify(updatedUser));
         }
         addToast('Profil mis à jour', 'success');
      } catch (err: any) {
         console.error('Profile update failed', err);
         addToast(err.message || 'Mise à jour impossible', 'error');
      } finally {
         setSavingProfile(false);
      }
   };

   const handleSaveConsents = async () => {
      setSavingConsents(true);
      try {
         const response = await api.put<any>('/my/consents', consents);
         const updatedUser = response.data?.data?.user ? normalizeUser(response.data.data.user) : null;
         if (updatedUser) {
            setProfileUser(updatedUser);
            localStorage.setItem('auto_uc2_user', JSON.stringify(updatedUser));
         }
         addToast('Consentements mis à jour', 'success');
      } catch (err: any) {
         console.error('Consents update failed', err);
         addToast(err.message || 'Sauvegarde des consentements impossible', 'error');
      } finally {
         setSavingConsents(false);
      }
   };

   const handleSetupMFA = async () => {
      setMfaLoading(true);
      try {
         const response = await api.post<any>('/auth/mfa/enable', {});
         setMfaQRCode(response.qrCode || null);
         setMfaSecret(response.secret || null);
         addToast('QR code générée. Scannez-la avec Google Authenticator', 'info');
      } catch (err: any) {
         console.error('MFA setup failed', err);
         addToast(err.message || 'Erreur lors de la configuration du 2FA', 'error');
      } finally {
         setMfaLoading(false);
      }
   };

   const handleVerifyMFA = async () => {
      if (!mfaVerifyCode || mfaVerifyCode.length !== 6) {
         addToast('Code invalide (6 chiffres requis)', 'error');
         return;
      }
      setMfaLoading(true);
      try {
         const response = await api.post<any>('/auth/mfa/verify', { code: mfaVerifyCode });
         const updatedUser = { ...profileUser!, mfaEnabled: true };
         setProfileUser(updatedUser);
         localStorage.setItem('user', JSON.stringify(updatedUser));
         addToast('2FA activé avec succès', 'success');
         setMfaModalOpen(false);
         setMfaQRCode(null);
         setMfaSecret(null);
         setMfaVerifyCode('');
      } catch (err: any) {
         console.error('MFA verify failed', err);
         addToast(err.message || 'Code invalide', 'error');
      } finally {
         setMfaLoading(false);
      }
   };

   const handleDisableMFA = async () => {
      if (!window.confirm('Êtes-vous sûr de vouloir désactiver le 2FA?')) return;
      setMfaLoading(true);
      try {
         await api.post<any>('/auth/mfa/disable', {});
         const updatedUser = { ...profileUser!, mfaEnabled: false };
         setProfileUser(updatedUser);
         localStorage.setItem('user', JSON.stringify(updatedUser));
         addToast('2FA désactivé', 'success');
      } catch (err: any) {
         console.error('MFA disable failed', err);
         addToast(err.message || 'Erreur lors de la désactivation', 'error');
      } finally {
         setMfaLoading(false);
      }
   };

   const handleChangePassword = async () => {
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
         addToast('Tous les champs sont requis', 'error');
         return;
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
         addToast('Les nouveaux mots de passe ne correspondent pas', 'error');
         return;
      }
      if (passwordForm.newPassword.length < 8) {
         addToast('Le nouveau mot de passe doit contenir au moins 8 caractères', 'error');
         return;
      }

      setChangingPassword(true);
      try {
         const response = await api.post<any>('/auth/update-password', {
            passwordCurrent: passwordForm.currentPassword,
            password: passwordForm.newPassword,
            passwordConfirm: passwordForm.confirmPassword
         });
         addToast('Mot de passe changé avec succès', 'success');
         setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
         setPasswordModalOpen(false);
      } catch (err: any) {
         console.error('Password change failed', err);
         addToast(err.message || 'Changement du mot de passe impossible', 'error');
      } finally {
         setChangingPassword(false);
      }
   };

   const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
         addToast('Veuillez sélectionner une image', 'error');
         return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
         addToast('L\'image ne doit pas dépasser 5MB', 'error');
         return;
      }

      setUploadingPhoto(true);
      try {
         const formData = new FormData();
         formData.append('photo', file);

         const response = await api.patch<any>('/my/profile/photo', formData);
         
         const updatedUser = { ...profileUser!, photo: response.photo, avatar: response.photo };
         setProfileUser(updatedUser);
         localStorage.setItem('user', JSON.stringify(updatedUser));
         
         addToast('Photo mise à jour avec succès', 'success');
      } catch (err: any) {
         console.error('Photo upload failed', err);
         addToast(err.message || 'Erreur lors de l\'upload de la photo', 'error');
      } finally {
         setUploadingPhoto(false);
         if (photoInputRef.current) photoInputRef.current.value = '';
      }
   };

   const ConsentRow = ({ field, label, description }: { field: keyof typeof consents; label: string; description: string; }) => (
      <div className="flex items-center justify-between p-5 bg-zinc-950/40 border border-white/5 rounded-[1.5rem]">
         <div>
            <p className="text-[11px] font-black text-white uppercase tracking-widest">{label}</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{description}</p>
         </div>
         <button
            type="button"
            onClick={() => setConsents(prev => ({ ...prev, [field]: !prev[field] }))}
            className={cn(
               "w-14 h-8 rounded-full border border-white/10 flex items-center px-1 transition-all",
               consents[field] ? "bg-emerald-600/40" : "bg-zinc-900"
            )}
            aria-pressed={consents[field]}
         >
            <span
               className={cn(
                  "w-6 h-6 rounded-full bg-white shadow-lg transition-transform",
                  consents[field] ? "translate-x-6" : "translate-x-0"
               )}
            />
         </button>
      </div>
   );

   return (
      <div className="space-y-10 animate-in fade-in duration-700 pb-20">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
               <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">My Profile</h1>
               <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Manage your identity and security protocols</p>
            </div>
            <Button
              variant="emerald"
              className="px-8"
              onClick={handleUpdateProfile}
              isLoading={savingProfile || profileLoading}
            >
              <Save size={16} /> Mettre à jour
            </Button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="flex flex-col items-center text-center p-12 lg:col-span-1">
               <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
               />
               <div className="relative group">
                  <img 
                     src={getAvatarUrl(displayUser)} 
                     className="w-32 h-32 rounded-[2.5rem] border-2 border-emerald-500/30 group-hover:border-emerald-500 transition-all object-cover" 
                     alt="Avatar" 
                  />
                  <div 
                     onClick={() => !uploadingPhoto && photoInputRef.current?.click()}
                     className="absolute inset-0 bg-black/60 rounded-[2.5rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                  >
                     {uploadingPhoto ? (
                        <Loader2 className="animate-spin text-emerald-500" size={24} />
                     ) : (
                        <p className="text-[9px] font-black text-white uppercase tracking-widest">Change Photo</p>
                     )}
                  </div>
               </div>
               <div className="mt-8 space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase">{renderFieldIfExists(profileForm.name || displayUser.name)}</h3>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{renderFieldIfExists(displayUser.role, 'Sans rôle')}</p>
                  {clientProfile?.status && (
                     <Badge variant="info">{clientProfile.status}</Badge>
                  )}
               </div>
               <div className="w-full mt-10 pt-10 border-t border-white/5 space-y-4">
                  {hasValue(meta.accountId) && (
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-zinc-600">Account ID</span>
                        <span className="text-zinc-400 font-mono">{formatAccountId(meta.accountId)}</span>
                     </div>
                  )}
                  {hasValue(meta.joinDate) && (
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-zinc-600">Join Date</span>
                        <span className="text-zinc-400">{formatDate(meta.joinDate)}</span>
                     </div>
                  )}
               </div>
            </Card>

            <div className="lg:col-span-2 space-y-8">
               <Card title="Identity Configuration" subtitle="Primary account credentials">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                     <Input
                        label="Full Display Name"
                        value={profileForm.name}
                        onChange={(e: any) => updateProfileField('name', e.target.value)}
                        disabled={profileLoading}
                     />
                     <Input
                        label="Verified Email"
                        value={profileForm.email}
                        onChange={(e: any) => updateProfileField('email', e.target.value)}
                        icon={Mail}
                        disabled={profileLoading}
                     />
                     {hasValue(profileForm.phone) && (
                        <Input
                           label="Phone"
                           value={profileForm.phone}
                           onChange={(e: any) => updateProfileField('phone', e.target.value)}
                           icon={Smartphone}
                           placeholder="06 12 34 56 78"
                           disabled={profileLoading}
                        />
                     )}
                     {hasValue(profileForm.department) && (
                        <Input
                           label="Department"
                           value={profileForm.department}
                           onChange={(e: any) => updateProfileField('department', e.target.value)}
                           placeholder="Operations Intelligence"
                           disabled={profileLoading}
                        />
                     )}
                     {hasValue(profileForm.secondaryEmail) && (
                        <Input
                           label="Secondary Email"
                           value={profileForm.secondaryEmail}
                           onChange={(e: any) => updateProfileField('secondaryEmail', e.target.value)}
                           placeholder="backup@gmail.com"
                           disabled={profileLoading}
                        />
                     )}
                  </div>
               </Card>

               <Card title="Security Protocols" subtitle="Multi-factor authentication & Passwords">
                  <div className="space-y-6 mt-8">
                     <div className="flex items-center justify-between p-6 bg-zinc-950 border border-white/5 rounded-[2rem]">
                        <div className="flex items-center gap-5">
                           <div className={cn("p-3 rounded-2xl", displayUser.mfaEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800/40 text-zinc-500")}>
                              <Lock size={20} />
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-white uppercase tracking-widest">Two-Factor Authentication (2FA)</p>
                              <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-1", displayUser.mfaEnabled ? "text-emerald-500" : "text-zinc-500")}>
                                Status: {displayUser.mfaEnabled ? 'Active & Secure' : 'Inactive'}
                              </p>
                              {hasValue(displayUser.lastLogin) && (
                                 <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Dernière connexion: {formatDate(displayUser.lastLogin)}</p>
                              )}
                           </div>
                        </div>
                        <Button variant="outline" className="text-[9px]" disabled={mfaLoading} onClick={() => {
                           if (displayUser.mfaEnabled) {
                              handleDisableMFA();
                           } else {
                              setMfaModalOpen(true);
                              handleSetupMFA();
                           }
                        }}>
                           {displayUser.mfaEnabled ? 'Désactiver' : 'Activer'}
                        </Button>
                     </div>
                     <div className="flex justify-center">
                        <Button variant="secondary" className="py-4 rounded-2xl w-full max-w-md" onClick={() => setPasswordModalOpen(true)}>Change Password</Button>
                     </div>
                  </div>
               </Card>
            </div>
         </div>

         <Card title="Privacy & Consents" subtitle="Contrôlez vos préférences RGPD">
            <div className="flex items-center justify-between p-6 bg-zinc-950/40 border border-white/5 rounded-2xl mt-8">
               <div>
                  <p className="text-sm font-black text-white uppercase tracking-wider mb-1">Préférences de confidentialité</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Gérer vos consentements RGPD</p>
               </div>
               <Button
                  variant="outline"
                  onClick={() => setConsentsModalOpen(true)}
                  disabled={profileLoading}
               >
                  Gérer les consentements
               </Button>
            </div>
         </Card>

         {/* Password Change Modal */}
         <Modal
            isOpen={passwordModalOpen}
            onClose={() => {
               setPasswordModalOpen(false);
               setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }}
            title="Changer le mot de passe"
            footer={
               <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>Annuler</Button>
                  <Button variant="emerald" onClick={handleChangePassword} isLoading={changingPassword}>Changer</Button>
               </div>
            }
         >
            <div className="space-y-4">
               <Input
                  label="Mot de passe actuel"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e: any) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Entrez votre mot de passe actuel"
                  icon={Lock}
               />
               <Input
                  label="Nouveau mot de passe"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e: any) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Au moins 8 caractères"
                  icon={Lock}
               />
               <Input
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e: any) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirmez le nouveau mot de passe"
                  icon={Lock}
               />
            </div>
         </Modal>

         {/* MFA Setup Modal */}
         <Modal
            isOpen={mfaModalOpen}
            onClose={() => {
               setMfaModalOpen(false);
               setMfaQRCode(null);
               setMfaSecret(null);
               setMfaVerifyCode('');
            }}
            title="Configurer l'authentification 2FA"
            footer={
               mfaQRCode && !displayUser.mfaEnabled ? (
                  <div className="flex gap-3">
                     <Button variant="outline" onClick={() => setMfaModalOpen(false)}>Annuler</Button>
                     <Button variant="emerald" onClick={handleVerifyMFA} isLoading={mfaLoading}>Vérifier et Activer</Button>
                  </div>
               ) : null
            }
         >
            {!mfaQRCode && displayUser.mfaEnabled ? (
               <div className="text-center py-6">
                  <p className="text-sm text-zinc-400 mb-4">Votre 2FA est actuellement activée.</p>
                  <Button variant="danger" onClick={handleDisableMFA} isLoading={mfaLoading} className="w-full">
                     Désactiver le 2FA
                  </Button>
               </div>
            ) : mfaQRCode ? (
               <div className="space-y-6">
                  <div>
                     <p className="text-sm text-zinc-400 mb-4">1. Scannez ce code QR avec Google Authenticator ou Authy</p>
                     <div className="bg-white p-4 rounded-xl flex justify-center">
                        <img src={mfaQRCode} alt="QR Code" className="w-48 h-48" />
                     </div>
                  </div>
                  {mfaSecret && (
                     <div>
                        <p className="text-sm text-zinc-400 mb-2">Ou entrez manuellement ce code:</p>
                        <div className="bg-zinc-900/60 p-3 rounded-xl border border-white/10 font-mono text-center text-emerald-500">
                           {mfaSecret}
                        </div>
                     </div>
                  )}
                  <div>
                     <p className="text-sm text-zinc-400 mb-2">2. Entrez le code à 6 chiffres généré par l'application</p>
                     <input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={mfaVerifyCode}
                        onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 bg-zinc-950/60 border border-white/10 rounded-xl text-center text-2xl tracking-widest font-bold text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500/30"
                     />
                  </div>
               </div>
            ) : (
               <div className="text-center py-6">
                  <Loader2 className="animate-spin mx-auto text-emerald-500 mb-3" size={32} />
                  <p className="text-sm text-zinc-400">Génération du QR code...</p>
               </div>
            )}
         </Modal>

         {/* Consents Modal */}
         <Modal
            isOpen={consentsModalOpen}
            onClose={() => setConsentsModalOpen(false)}
            title="PRIVACY & CONSENTS"
            subtitle="CONTRÔLEZ VOS PRÉFÉRENCES RGPD"
         >
            <div className="space-y-4 mt-6">
               <div className="flex items-center justify-between p-6 bg-zinc-950/40 border border-white/10 rounded-2xl hover:border-emerald-500/30 transition-all">
                  <div className="flex-1">
                     <p className="text-sm font-black text-white uppercase tracking-wider mb-1">TRAITEMENT DES DONNÉES PERSONNELLES</p>
                     <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Autoriser le traitement nécessaire à la gestion du compte</p>
                  </div>
                  <button
                     type="button"
                     onClick={() => setConsents(prev => ({ ...prev, personalDataProcessing: !prev.personalDataProcessing }))}
                     className={cn(
                        "ml-6 w-16 h-9 rounded-full border-2 flex items-center px-1 transition-all shrink-0",
                        consents.personalDataProcessing ? "bg-emerald-500 border-emerald-500" : "bg-zinc-800 border-zinc-700"
                     )}
                     aria-pressed={consents.personalDataProcessing}
                  >
                     <span
                        className={cn(
                           "w-7 h-7 rounded-full bg-white shadow-lg transition-transform",
                           consents.personalDataProcessing ? "translate-x-7" : "translate-x-0"
                        )}
                     />
                  </button>
               </div>

               <div className="flex items-center justify-between p-6 bg-zinc-950/40 border border-white/10 rounded-2xl hover:border-emerald-500/30 transition-all">
                  <div className="flex-1">
                     <p className="text-sm font-black text-white uppercase tracking-wider mb-1">UTILISATION DES DONNÉES D'INSCRIPTION</p>
                     <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Autoriser l'utilisation des informations fournies lors de votre inscription</p>
                  </div>
                  <button
                     type="button"
                     onClick={() => setConsents(prev => ({ ...prev, registrationDataUsage: !prev.registrationDataUsage }))}
                     className={cn(
                        "ml-6 w-16 h-9 rounded-full border-2 flex items-center px-1 transition-all shrink-0",
                        consents.registrationDataUsage ? "bg-emerald-500 border-emerald-500" : "bg-zinc-800 border-zinc-700"
                     )}
                     aria-pressed={consents.registrationDataUsage}
                  >
                     <span
                        className={cn(
                           "w-7 h-7 rounded-full bg-white shadow-lg transition-transform",
                           consents.registrationDataUsage ? "translate-x-7" : "translate-x-0"
                        )}
                     />
                  </button>
               </div>

               <div className="flex items-center justify-between p-6 bg-zinc-950/40 border border-white/10 rounded-2xl hover:border-emerald-500/30 transition-all">
                  <div className="flex-1">
                     <p className="text-sm font-black text-white uppercase tracking-wider mb-1">UTILISATION DES DONNÉES DE CONVERSATION</p>
                     <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Autoriser l'analyse des conversations chat (socket & négociation IA)</p>
                  </div>
                  <button
                     type="button"
                     onClick={() => setConsents(prev => ({ ...prev, conversationDataUsage: !prev.conversationDataUsage }))}
                     className={cn(
                        "ml-6 w-16 h-9 rounded-full border-2 flex items-center px-1 transition-all shrink-0",
                        consents.conversationDataUsage ? "bg-emerald-500 border-emerald-500" : "bg-zinc-800 border-zinc-700"
                     )}
                     aria-pressed={consents.conversationDataUsage}
                  >
                     <span
                        className={cn(
                           "w-7 h-7 rounded-full bg-white shadow-lg transition-transform",
                           consents.conversationDataUsage ? "translate-x-7" : "translate-x-0"
                        )}
                     />
                  </button>
               </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
               <Button
                  variant="outline"
                  onClick={() => setConsentsModalOpen(false)}
               >
                  Annuler
               </Button>
               <Button
                  variant="emerald"
                  onClick={async () => {
                     await handleSaveConsents();
                     setConsentsModalOpen(false);
                  }}
                  isLoading={savingConsents}
                  className="px-8"
               >
                  SAUVEGARDER LES PRÉFÉRENCES
               </Button>
            </div>
         </Modal>
      </div>
   );
};
