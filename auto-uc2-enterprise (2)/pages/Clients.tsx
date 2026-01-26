import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Badge, Button, Input } from '../components/UI';
import { UserPlus, Search, Filter, Mail, Phone, MessageSquare, MoreHorizontal, Loader2, Edit, Trash2, Eye } from 'lucide-react';
import { api } from '../api';
import { Client, UserRole } from '../types';
import { Protect } from '../components/Protect';
import { ClientFormModal } from '../components/modals/ClientFormModal';

export const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [creatingConversation, setCreatingConversation] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const statusSelectRef = useRef<HTMLSelectElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get<any>('/clients');
        const data = response.data.data ? response.data.data.clients : (response.data.clients || []);
        const normalized = data.map((c: any) => ({
          ...c,
          id: c._id || c.id,
          name: `${c.firstName} ${c.lastName}`,
          lastActivity: new Date(c.updatedAt || Date.now()).toLocaleDateString(),
          status: c.status || 'Lead',
        }));
        setClients(normalized);
        setSearchResults(normalized);
        setFilteredClients(normalized);
      } catch (err) {
        console.error('Failed to fetch clients', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const applyFilters = (list: any[], status: string) => {
    if (!status) return list;
    return list.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());
  };

  // Search clients by name/email/phone
  const performSearch = async (query: string) => {
    setSearchQuery(query);

    // Clear debounce timer
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Empty query -> reset list
    if (!query || !query.trim()) {
      setSearchResults(clients);
      setFilteredClients(applyFilters(clients, statusFilter));
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        setFilteredClients(clients);
        setSearchLoading(false);
        return;
      }

      try {
        const response = await api.get<any>('/clients/search', { params: { query: trimmed } });
        const data = response.data.data ? response.data.data.clients : (response.data.clients || []);
        const normalized = data.map((c: any) => ({
          ...c,
          id: c._id || c.id,
          name: `${c.firstName} ${c.lastName}`,
          lastActivity: new Date(c.updatedAt || Date.now()).toLocaleDateString(),
          status: c.status || 'Lead',
        }));
        setSearchResults(normalized);
        setFilteredClients(applyFilters(normalized, statusFilter));
      } catch (err) {
        console.error('Client search failed', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setShowStatusDropdown(false);
    const base = searchQuery ? searchResults : clients;
    setFilteredClients(applyFilters(base, value));
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenConversation = async (clientId: string) => {
    try {
      setCreatingConversation(clientId);
      
      // Create or get existing conversation
      const response = await api.post('/conversations', { clientId });
      console.log('API Response:', response);
      
      // API returns { status: 'success', data: { conversation: {...} } }
      const conversation = response.data.conversation;
      
      if (!conversation) {
        throw new Error('Invalid response structure');
      }
      
      // Navigate to negotiations page with conversation selected
      navigate('/negotiations', { state: { conversationId: conversation._id } });
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to open conversation');
    } finally {
      setCreatingConversation(null);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;
    try {
      await api.delete(`/clients/${clientId}`);
      setClients(clients.filter(c => c.id !== clientId));
    } catch (err) {
      console.error('Failed to delete client', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Répertoire Clients</h1>
          <p className="text-zinc-500 font-medium">Gérez vos prospects et votre base de clients fidèles.</p>
        </div>
        <Protect roles={[UserRole.USER, UserRole.MANAGER, UserRole.ADMIN]}>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus size={18} /> Nouveau client
          </Button>
        </Protect>
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <Input
            icon={Search}
            placeholder="Rechercher un client..."
            className="flex-1"
            value={searchQuery}
            onChange={(e) => performSearch(e.target.value)}
            rightElement={searchLoading ? <Loader2 size={16} className="animate-spin text-emerald-500" /> : null}
          />
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowStatusDropdown((v) => !v)}
              className="flex items-center gap-2"
            >
              <Filter size={18} />
              {statusFilter ? statusFilter : 'Statut'}
            </Button>

            {showStatusDropdown && (
              <div className="absolute right-0 mt-2 w-44 bg-zinc-950/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden">
                {[
                  { label: 'Tous les statuts', value: '' },
                  { label: 'Lead', value: 'Lead' },
                  { label: 'Prospect', value: 'Prospect' },
                  { label: 'Active', value: 'Active' },
                  { label: 'Customer', value: 'Customer' },
                ].map((opt) => (
                  <button
                    key={opt.value || 'all'}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      statusFilter === opt.value
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'text-zinc-200 hover:bg-white/5'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Table headers={['Client', 'Contact', 'Engagement', 'Statut', 'Actions']}>
          {loading ? (
            <tr>
              <td colSpan={5} className="py-20 text-center">
                <Loader2 size={40} className="animate-spin text-emerald-500 mx-auto opacity-50" />
                <p className="mt-4 text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Chargement des clients...</p>
              </td>
            </tr>
          ) : filteredClients.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-20 text-center text-zinc-500 italic">
                {searchQuery ? 'Aucun client trouvé pour votre recherche.' : 'Aucun client trouvé.'}
              </td>
            </tr>
          ) : filteredClients.map(c => (
            <tr key={c.id} className="group hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center font-black text-zinc-500 border border-white/10">
                    {c.name.charAt(0)}
                  </div>
                  <p className="font-bold text-white">{c.name}</p>
                </div>
              </td>
              <td className="px-4 py-4 text-sm">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-zinc-600" /> 
                    <span style={{ color: '#d4d4d8' }}>{c.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-zinc-600" /> 
                    <span style={{ color: '#d4d4d8' }}>{c.phone || 'N/A'}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="text-xs font-medium text-zinc-500">
                  Dernière activité : <span style={{ color: '#d4d4d8', fontWeight: 'bold' }}>{c.lastActivity}</span>
                </p>
              </td>
              <td className="px-4 py-4">
                <Badge variant={
                  c.status === 'Customer' ? 'success' : 
                  c.status === 'Active' ? 'warning' : 
                  c.status === 'Prospect' ? 'info' : 'neutral'
                }>
                  {c.status}
                </Badge>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => handleOpenConversation(c.id)}
                    disabled={creatingConversation === c.id}
                    className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors disabled:opacity-50"
                    title="Ouvrir la conversation"
                  >
                    {creatingConversation === c.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <MessageSquare size={18} />
                    )}
                  </button>
                  <div className="relative" ref={openMenuId === c.id ? menuRef : null}>
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                      className="p-2 text-zinc-400 hover:text-white transition-colors"
                      title="Plus d'options"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {openMenuId === c.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <button
                          onClick={() => {
                            alert(`Éditer ${c.name}`);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
                        >
                          <Edit size={16} />
                          Éditer le client
                        </button>
                        <button
                          onClick={() => {
                            alert(`Voir détails de ${c.name}`);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
                        >
                          <Eye size={16} />
                          Voir les détails
                        </button>
                        <div className="border-t border-white/10" />
                        <button
                          onClick={() => {
                            handleDeleteClient(c.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-3"
                        >
                          <Trash2 size={16} />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <ClientFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Refresh client list
          const fetchClients = async () => {
            try {
              const response = await api.get<any>('/clients');
              const data = response.data.data ? response.data.data.clients : (response.data.clients || []);
              const normalized = data.map((c: any) => ({
                ...c,
                id: c._id || c.id,
                name: `${c.firstName} ${c.lastName}`,
                lastActivity: new Date(c.updatedAt || Date.now()).toLocaleDateString(),
                status: c.status || 'Lead',
              }));
              setClients(normalized);
            } catch (err) {
              console.error('Failed to refresh clients', err);
            }
          };
          fetchClients();
        }}
      />
    </div>
  );
};
