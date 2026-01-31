
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
  vin?: string;
  make: string; // Changed from brand to make to match sample data if needed, or map it. Sample has "make".
  // Types.ts had "brand". I should check if frontend uses "brand" or "make". 
  // Models/Vehicle.js has "make". Import script mapped from "make".
  // I should align frontend to "make".
  model: string;
  year: number;
  price: number;
  costPrice?: number; // New
  status: 'Available' | 'Sold' | 'Reserved' | 'Maintenance' | 'Incoming' | 'Disponible'; // Add French 'Disponible' from sample
  condition?: string; // Relaxed to string
  
  marketValue?: number;
  images: string[]; // Array of strings
  image?: string; // Keep for backward compat if needed (mapped to images[0])
  
  mileage: number;
  fuelType?: string; // Optional root
  transmission?: string; // Optional root
  
  specifications?: {
    fuelType: string;
    transmission: string;
    color: string;
    doors: number;
    seats: number;
    engineSize: string;
    horsePower: number;
  };
  
  inventory?: {
    location: string;
    daysInStock: number;
  };
  
  features?: string[];

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
