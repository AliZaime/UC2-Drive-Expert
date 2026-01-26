
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { VehicleDetails } from './pages/VehicleDetails';
import { Negotiations } from './pages/Negotiations';
import { Clients } from './pages/Clients';
import { Auth } from './pages/Auth';
import { Landing } from './pages/Landing';
import { AIAssistant } from './components/AIAssistant';
import { SystemHealth } from './pages/admin/SystemHealth';
import { SystemMetrics } from './pages/admin/SystemMetrics';
import { SystemLogs } from './pages/admin/SystemLogs';
import { SystemConfig } from './pages/admin/SystemConfig';
import { UserManagement } from './pages/admin/UserManagement';
import { AgencyManagement } from './pages/admin/AgencyManagement';
import { SecurityAudit } from './pages/admin/SecurityAudit';
import { SyncBackup } from './pages/admin/SyncBackup';
import { KioskManagement } from './pages/admin/KioskManagement';
import { UserProfile } from './pages/admin/UserProfile';
import { ClientSaved, ClientContracts, ClientAppointments } from './pages/ClientSpace';
import { SalesPipeline, FleetService, SalesAnalytics } from './pages/UserSpace';
import { ClientActivity } from './pages/ClientActivity';
import { ClientSegments } from './pages/ClientSegments';
import { User, UserRole } from './types';
import { ToastProvider, useToast } from './components/UI';
import { SocketProvider } from './contexts/SocketContext';

const AppContent: React.FC<{ user: User | null; onLogin: (u: User) => void; onLogout: () => void }> = ({ user, onLogin, onLogout }) => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Auth onLogin={onLogin} />} />

        <Route
          path="/*"
          element={
            user ? (
              <Layout user={user} onLogout={onLogout}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/vehicles" element={<Vehicles />} />
                  <Route path="/vehicles/:id" element={<VehicleDetails />} />
                  <Route path="/negotiations" element={<Negotiations />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/profile" element={<UserProfile user={user} />} />
                  <Route path="/profile/security" element={<UserProfile user={user} />} />
                  <Route path="/profile/gdpr" element={<UserProfile user={user} />} />

                  {/* Routes spécifiques Client */}
                  {user.role === UserRole.CLIENT && (
                    <>
                      <Route path="/client/saved" element={<ClientSaved />} />
                      <Route path="/client/appointments" element={<ClientAppointments />} />
                      <Route path="/client/contracts" element={<ClientContracts />} />
                      <Route path="/client/deals/won" element={<Negotiations />} />
                      <Route path="/client/deals/lost" element={<Negotiations />} />
                    </>
                  )}

                  {/* Routes spécifiques Agent/Commercial */}
                  {user.role === UserRole.USER && (
                    <>
                      <Route path="/vehicles/new" element={<Vehicles />} />
                      <Route path="/fleet/media" element={<Vehicles />} />
                      <Route path="/fleet/service" element={<FleetService />} />
                      <Route path="/clients/activity" element={<ClientActivity />} />
                      <Route path="/clients/segments" element={<ClientSegments />} />
                      <Route path="/deals/pending" element={<SalesPipeline />} />
                      <Route path="/deals/closed" element={<SalesPipeline />} />
                      <Route path="/analytics" element={<SalesAnalytics />} />
                    </>
                  )}

                  {/* Routes Admin */}
                  {(user.role === UserRole.SUPERADMIN || user.role === UserRole.ADMIN) && (
                    <>
                      <Route path="/admin/health" element={<SystemHealth />} />
                      <Route path="/admin/metrics" element={<SystemMetrics />} />
                      <Route path="/admin/logs" element={<SystemLogs />} />
                      <Route path="/admin/config" element={<SystemConfig />} />
                      <Route path="/admin/users" element={<UserManagement />} />
                      <Route path="/admin/agencies" element={<AgencyManagement />} />
                      <Route path="/admin/kiosks" element={<KioskManagement />} />
                    </>
                  )}

                  <Route path="/admin/security" element={<SecurityAudit />} />
                  <Route path="/admin/sync" element={<SyncBackup />} />

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
                <AIAssistant />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('auto_uc2_user');
      if (!saved || saved === 'undefined' || saved === 'null') return null;
      return JSON.parse(saved);
    } catch (error) {
      localStorage.removeItem('auto_uc2_user');
      return null;
    }
  });

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('auto_uc2_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('auto_uc2_user');
  };

  return (
    <ToastProvider>
      <SocketProvider>
        <AppContent user={user} onLogin={handleLogin} onLogout={handleLogout} />
      </SocketProvider>
    </ToastProvider>
  );
};

export default App;
