
import React, { useState, useEffect, Suspense } from 'react';
import {
  LayoutDashboard, Car, Users, Building2, QrCode,
  ShieldAlert, RefreshCcw, UserCircle, LogOut, Menu, X,
  Bell, Search, Settings, ChevronDown, ChevronRight,
  BarChart3, History, Sliders, MessageSquare, Star,
  Calendar, FileText, PieChart, Activity, ShieldCheck,
  Target, Zap, Camera, MapPin, DollarSign, PenTool
} from 'lucide-react';
import Spline from '@splinetool/react-spline';
import { Link, useLocation } from 'react-router-dom';
import { UserRole, User } from '../types';
import { cn } from './UI';
import { GlobalSearch } from './GlobalSearch';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

interface NavItem {
  icon: any;
  label: string;
  path?: string;
  roles: UserRole[];
  children?: { label: string; path: string; icon?: any }[];
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const location = useLocation();

  // Fix: Move declaration of Plus before its usage in menuGroups
  const Plus = ({ size, className }: any) => <span className={cn("font-bold", className)}>+</span>;

  const menuGroups: { title: string; items: NavItem[] }[] = [
    {
      title: "Navigation",
      items: [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard', roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.USER, UserRole.CLIENT] },
        { icon: Star, label: 'Accueil Public', path: '/', roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.USER, UserRole.CLIENT] },
      ]
    },
    {
      title: "Espace Client",
      items: [
        {
          icon: Car,
          label: 'Mes Véhicules',
          roles: [UserRole.CLIENT],
          children: [
            { label: 'Sauvegardés', path: '/client/saved', icon: Star },
            { label: 'Recommandés', path: '/client/recommended', icon: Zap },
            { label: 'Parcourir tout', path: '/vehicles', icon: Search },
          ]
        },
        {
          icon: MessageSquare,
          label: 'Négociations',
          roles: [UserRole.CLIENT],
          children: [
            { label: 'En cours', path: '/negotiations', icon: Activity },
            { label: 'Acceptées', path: '/client/deals/won', icon: ShieldCheck },
            { label: 'Rejetées', path: '/client/deals/lost', icon: X },
          ]
        },
        { icon: Calendar, label: 'Rendez-vous', path: '/client/appointments', roles: [UserRole.CLIENT] },
        { icon: FileText, label: 'Contrats', path: '/client/contracts', roles: [UserRole.CLIENT] },
      ]
    },
    {
      title: "Opérations Ventes",
      items: [
        {
          icon: Car,
          label: 'Flotte UC2',
          roles: [UserRole.USER],
          children: [
            { label: 'Inventaire complet', path: '/vehicles' },
            { label: 'Maintenance', path: '/fleet/service', icon: Sliders },
          ]
        },
        {
          icon: Users,
          label: 'Clients CRM',
          roles: [UserRole.USER],
          children: [
            { label: 'Répertoire', path: '/clients' },
            { label: 'Notes & Suivi', path: '/clients/activity' },
            { label: 'Segmentation', path: '/clients/segments', icon: Target },
          ]
        },
        {
          icon: MessageSquare,
          label: 'Deals & Pipeline',
          roles: [UserRole.USER],
          children: [
            { label: 'Active Chats', path: '/negotiations' },
            { label: 'Offres en attente', path: '/deals/pending', icon: DollarSign },
            { label: 'Clôturés', path: '/deals/closed', icon: ShieldCheck },
          ]
        },
        { icon: PieChart, label: 'Analytics', path: '/analytics', roles: [UserRole.USER] },
      ]
    },
    {
      title: "Infrastructure",
      items: [
        {
          icon: Activity,
          label: 'Système',
          roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
          children: [
            { label: 'Santé (Health)', path: '/admin/health' },
            { label: 'Métriques', path: '/admin/metrics' },
            { label: 'Logs Audit', path: '/admin/logs' },
            { label: 'Configuration', path: '/admin/config' },
          ]
        },
        { icon: Users, label: 'Utilisateurs', path: '/admin/users', roles: [UserRole.SUPERADMIN, UserRole.ADMIN] },
        { icon: Building2, label: 'Réseau Agences', path: '/admin/agencies', roles: [UserRole.SUPERADMIN, UserRole.ADMIN] },
        { icon: QrCode, label: 'Bornes Kiosks', path: '/admin/kiosks', roles: [UserRole.SUPERADMIN, UserRole.ADMIN] },
      ]
    },
    {
      title: "Cybersécurité",
      items: [
        { icon: ShieldAlert, label: 'War Room', path: '/admin/security', roles: [UserRole.SUPERADMIN] },
        { icon: RefreshCcw, label: 'Data Recovery', path: '/admin/sync', roles: [UserRole.SUPERADMIN] },
      ]
    },
    {
      title: "Identité",
      items: [
        {
          icon: UserCircle,
          label: 'Mon Profil',
          roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.USER, UserRole.CLIENT],
          children: [
            { label: 'Gérer Profil', path: '/profile' },
            { label: 'Sécurité MFA', path: '/profile/security', icon: ShieldCheck },
            { label: 'Confidentialité', path: '/profile/gdpr', icon: FileText },
          ]
        },
      ]
    }
  ];

  const toggleMenu = (label: string) => {
    if (!isExpanded) return;
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="flex h-screen bg-[#020202] text-zinc-300 overflow-hidden font-inter no-scrollbar relative">
      {/* Spline Background with Error Safety */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <Suspense fallback={<div className="w-full h-full bg-[#020202]" />}>
          <Spline
            className="w-full h-full"
            scene="https://prod.spline.design/mYR8ILjQdVT1Cl9X/scene.splinecode"
            onError={(e) => console.error('Spline failed to load:', e)}
          />
        </Suspense>
      </div>

      {/* Sidebar - Dynamically Resizable on Hover */}
      <aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => {
          setIsExpanded(false);
          setOpenMenus({});
        }}
        className={cn(
          "bg-zinc-950/95 backdrop-blur-3xl border-r border-white/5 fixed inset-y-0 left-0 z-50 sidebar-transition flex flex-col group overflow-hidden shadow-[20px_0_50px_-20px_rgba(0,0,0,0.5)]",
          isExpanded ? "w-72" : "w-20"
        )}
      >
        {/* Header / Logo */}
        <div className="h-24 flex items-center px-5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 font-black text-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5 shrink-0">A</div>
            <span className={cn(
              "text-white font-black text-xl tracking-tighter uppercase text-fade whitespace-nowrap",
              !isExpanded ? "opacity-0 translate-x-4 pointer-events-none" : "opacity-100 translate-x-0"
            )}>AUTO-UC2</span>
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 px-3 py-4 space-y-10 overflow-y-auto no-scrollbar">
          {menuGroups.map((group, gIdx) => {
            const filteredItems = group.items.filter(item => item.roles.includes(user.role));
            if (filteredItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-2">
                <p className={cn(
                  "px-4 text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-4 text-fade whitespace-nowrap",
                  !isExpanded ? "opacity-0" : "opacity-100"
                )}>{group.title}</p>

                {filteredItems.map((item, iIdx) => {
                  const isActive = item.path === location.pathname || item.children?.some(c => c.path === location.pathname);
                  const hasChildren = item.children && item.children.length > 0;
                  const isOpen = openMenus[item.label];

                  return (
                    <div key={iIdx} className="space-y-1">
                      {hasChildren ? (
                        <button
                          onClick={() => toggleMenu(item.label)}
                          className={cn(
                            "w-full flex items-center px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
                            isActive ? "text-white" : "text-zinc-500 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <item.icon size={20} className={cn("shrink-0", isActive && "text-emerald-500")} />
                          <div className={cn(
                            "flex-1 flex items-center justify-between ml-4 text-fade whitespace-nowrap",
                            !isExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
                          )}>
                            {item.label}
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                        </button>
                      ) : (
                        <Link
                          to={item.path!}
                          className={cn(
                            "flex items-center px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
                            location.pathname === item.path
                              ? "bg-emerald-500/10 text-white border border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                              : "text-zinc-500 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <item.icon size={20} className={cn("shrink-0", location.pathname === item.path && "text-emerald-500")} />
                          <span className={cn(
                            "ml-4 text-fade whitespace-nowrap",
                            !isExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
                          )}>{item.label}</span>
                        </Link>
                      )}

                      {/* Sub-menus */}
                      {hasChildren && isOpen && isExpanded && (
                        <div className="ml-6 pl-4 border-l border-white/5 space-y-1 animate-in slide-in-from-top-2 duration-300">
                          {item.children!.map((child, cIdx) => (
                            <Link
                              key={cIdx}
                              to={child.path}
                              className={cn(
                                "block py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all",
                                location.pathname === child.path ? "text-emerald-500" : "text-zinc-600 hover:text-zinc-300"
                              )}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-white/5 bg-zinc-950/50 shrink-0">
          <div className={cn(
            "flex items-center p-2 rounded-2xl bg-zinc-900/40 border border-white/5 transition-all duration-500",
            !isExpanded ? "w-12 h-12 justify-center" : "w-full gap-4"
          )}>
            <img src={user.avatar} className="w-8 h-8 rounded-xl border border-emerald-500/20 shrink-0" alt="Avatar" />
            <div className={cn(
              "min-w-0 text-fade",
              !isExpanded ? "opacity-0 w-0" : "opacity-100"
            )}>
              <p className="text-xs font-black text-white truncate">{user.name}</p>
              <p className="text-[8px] uppercase font-black text-emerald-500 tracking-widest">{user.role}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className={cn(
              "flex items-center mt-4 w-full px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 transition-all",
              !isExpanded ? "justify-center" : "gap-4"
            )}
          >
            <LogOut size={20} className="shrink-0" />
            <span className={cn(
              "text-fade whitespace-nowrap",
              !isExpanded ? "opacity-0 w-0" : "opacity-100"
            )}>Quitter</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-500 no-scrollbar relative z-10",
        isExpanded ? "ml-72" : "ml-20"
      )}>
        <header className="h-24 bg-black/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-10 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <GlobalSearch user={user} />
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Protocol: Active</span>
              <span className="text-[8px] font-bold text-zinc-600 uppercase">Load: 0.12ms</span>
            </div>
            <div className="w-px h-8 bg-white/5 mx-2" />
            <button className="p-3 text-zinc-500 hover:text-white bg-zinc-900/60 rounded-xl border border-white/5 relative group transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#020202] animate-pulse"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.02),transparent_50%)] no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};
