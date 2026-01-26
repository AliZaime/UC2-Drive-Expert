
export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  CLIENT = 'client',
  GUEST = 'guest'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  mfaEnabled: boolean;
  createdAt?: string;
  consents?: {
    personalDataProcessing?: boolean;
    registrationDataUsage?: boolean;
    conversationDataUsage?: boolean;
    updatedAt?: string;
  };
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  status: 'available' | 'sold' | 'reserved' | 'pending' | 'maintenance' | 'incoming';
  marketValue?: number;
  image: string;
  mileage: number;
  fuelType: string;
  agencyId: string;
  agency?: {
    id: string;
    name: string;
    address?: {
      street?: string;
      city?: string;
      zip?: string;
      country?: string;
    };
    phone?: string;
    email?: string;
  };
}

export interface Agency {
  id: string;
  name: string;
  location: string;
  address?: {
    street?: string;
    city?: string;
    zip?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  revenue: string;
  fleetCount: number;
  managerId: string;
  status: 'active' | 'inactive' | 'maintenance';
}

export interface SystemMetric {
  timestamp: string;
  cpu: number;
  memory: number;
  requests: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
}

export interface Kiosk {
  id: string;
  agencyId: string;
  status: 'online' | 'offline';
  lastHeartbeat: string;
  version: string;
}

// Interface for vehicle negotiation tracking
export interface Negotiation {
  id: string;
  clientName: string;
  vehicle: string;
  lastMessage: string;
  updatedAt: string;
  unread: number;
}

// Interface for client directory management
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastActivity: string;
  status: 'hot' | 'warm' | 'cold';
}
