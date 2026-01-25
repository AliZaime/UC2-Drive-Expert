
import { User, Vehicle, UserRole, Agency, SystemMetric, LogEntry, Kiosk, Negotiation, Client } from './types';

export const MOCK_USERS: User[] = [
  { id: "1", name: "Alex Rivers", email: "super@autouc2.com", role: UserRole.SUPERADMIN, avatar: "https://i.pravatar.cc/150?u=1", status: 'active', lastLogin: 'Just now', mfaEnabled: true },
  { id: "2", name: "Sarah Connor", email: "admin@autouc2.com", role: UserRole.ADMIN, avatar: "https://i.pravatar.cc/150?u=2", status: 'active', lastLogin: '2h ago', mfaEnabled: true },
  { id: "3", name: "John Smith", email: "john@client.com", role: UserRole.CLIENT, avatar: "https://i.pravatar.cc/150?u=3", status: 'active', lastLogin: '1d ago', mfaEnabled: false },
  { id: "4", name: "Mike Agent", email: "agent@autouc2.com", role: UserRole.USER, avatar: "https://i.pravatar.cc/150?u=4", status: 'active', lastLogin: '5m ago', mfaEnabled: true }
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: "1", brand: "Tesla", model: "Model 3", year: 2023, price: 45000, status: "available", mileage: 1200, fuelType: "Electric", image: "https://images.unsplash.com/photo-1536700503339-1e4b06520771?q=80&w=800&auto=format&fit=crop", agencyId: "a1" },
  { id: "2", brand: "BMW", model: "M4 Competition", year: 2022, price: 82000, status: "pending", mileage: 5400, fuelType: "Petrol", image: "https://images.unsplash.com/photo-1617814076367-b759c7d6274a?q=80&w=800&auto=format&fit=crop", agencyId: "a2" }
];

export const MOCK_AGENCIES: Agency[] = [
  { id: "a1", name: "Auto-UC2 Paris Nord", location: "Paris, FR", revenue: "1.2M€", fleetCount: 145, managerId: "2", status: 'active' },
  { id: "a2", name: "Auto-UC2 Lyon Est", location: "Lyon, FR", revenue: "850k€", fleetCount: 92, managerId: "4", status: 'active' },
  { id: "a3", name: "Auto-UC2 Berlin Center", location: "Berlin, DE", revenue: "2.1M€", fleetCount: 210, managerId: "1", status: 'maintenance' }
];

export const MOCK_METRICS: SystemMetric[] = [
  { timestamp: '00:00', cpu: 12, memory: 45, requests: 120 },
  { timestamp: '04:00', cpu: 8, memory: 42, requests: 45 },
  { timestamp: '08:00', cpu: 35, memory: 58, requests: 890 },
  { timestamp: '12:00', cpu: 65, memory: 72, requests: 1540 },
  { timestamp: '16:00', cpu: 45, memory: 65, requests: 1100 },
  { timestamp: '20:00', cpu: 22, memory: 50, requests: 400 },
  { timestamp: '23:59', cpu: 15, memory: 48, requests: 150 },
];

export const MOCK_LOGS: LogEntry[] = [
  { id: "l1", timestamp: "2024-05-20 14:20:01", level: 'critical', source: 'AUTH_SERVICE', message: 'Failed brute force attempt from 192.168.1.1' },
  { id: "l2", timestamp: "2024-05-20 14:25:44", level: 'info', source: 'DB_SYNC', message: 'Database backup completed successfully' },
  { id: "l3", timestamp: "2024-05-20 14:30:12", level: 'warning', source: 'KIOSK_942', message: 'Heartbeat latency above threshold (450ms)' },
  { id: "l4", timestamp: "2024-05-20 14:35:00", level: 'error', source: 'API_GATEWAY', message: '404 error spike detected in /v1/negotiations' }
];

export const MOCK_KIOSKS: Kiosk[] = [
  { id: "K-101", agencyId: "a1", status: 'online', lastHeartbeat: '2s ago', version: 'v2.4.1' },
  { id: "K-102", agencyId: "a1", status: 'offline', lastHeartbeat: '45m ago', version: 'v2.4.0' },
  { id: "K-201", agencyId: "a2", status: 'online', lastHeartbeat: 'Just now', version: 'v2.4.1' }
];

// Added missing MOCK_NEGOTIATIONS
export const MOCK_NEGOTIATIONS: Negotiation[] = [
  { id: "n1", clientName: "Jean Dupont", vehicle: "Tesla Model 3", lastMessage: "Est-ce que le prix est négociable ?", updatedAt: "10:45", unread: 2 },
  { id: "n2", clientName: "Marie Curie", vehicle: "BMW M4 Competition", lastMessage: "Je souhaiterais voir le véhicule demain.", updatedAt: "14:20", unread: 0 },
  { id: "n3", clientName: "Pierre Gasly", vehicle: "Audi RS6 Avant", lastMessage: "Merci pour les photos supplémentaires.", updatedAt: "Hier", unread: 1 }
];

// Added missing MOCK_CLIENTS
export const MOCK_CLIENTS: Client[] = [
  { id: "c1", name: "Jean Dupont", email: "jean@gmail.com", phone: "+33 6 12 34 56 78", lastActivity: "Aujourd'hui", status: 'hot' },
  { id: "c2", name: "Marie Curie", email: "marie@radium.fr", phone: "+33 7 89 01 23 45", lastActivity: "Hier", status: 'warm' },
  { id: "c3", name: "Pierre Gasly", email: "pierre@f1.fr", phone: "+33 6 00 00 00 00", lastActivity: "Il y a 2 jours", status: 'cold' }
];
