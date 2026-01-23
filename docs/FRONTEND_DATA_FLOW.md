# 🔄 Flux de Données & Dépendances Frontend

## 📊 CONTEXTES GLOBAUX (Context API / Redux)

### **AuthContext**
```javascript
{
  user: { id, email, role, name, photo },
  token: string,
  isAuthenticated: boolean,
  isMFAEnabled: boolean,
  login: (email, password) => Promise
  register: (data) => Promise
  logout: () => void
  refreshToken: () => Promise
  updateProfile: (data) => Promise
}
```

### **NotificationContext**
```javascript
{
  notifications: [ { id, message, type, read, createdAt } ],
  unreadCount: number,
  getNotifications: () => Promise
  markAsRead: (notificationId) => Promise
  markAllAsRead: () => Promise
  subscribeToSocket: () => void
}
```

### **AppContext** (Global)
```javascript
{
  darkMode: boolean
  language: 'fr' | 'en'
  sidebarOpen: boolean
  toggleDarkMode: () => void
  setLanguage: (lang) => void
  toggleSidebar: () => void
}
```

---

## 🔀 FLUX NAVIGATION PAR RÔLE

### **GUEST (Non-connecté)**
```
Home → Browse → Vehicle Detail → Booking Modal → Login/Register → Client Flow
```

### **CLIENT**
```
Login → Client Dashboard
  ├─ Mon Profil
  │  ├─ Infos personnelles
  │  ├─ Sécurité (MFA)
  │  └─ Confidentialité (GDPR)
  ├─ Mes Véhicules
  │  ├─ Sauvegardés
  │  ├─ Recommandés
  │  └─ Parcourir tous
  ├─ Négociations
  │  ├─ Liste
  │  └─ Détail (Chat + Offres)
  ├─ Rendez-vous
  │  ├─ Liste
  │  ├─ Nouveau
  │  └─ Détail/Modification
  └─ Contrats
     ├─ À signer
     ├─ Signés
     └─ Détail (E-signature)
```

### **COMMERCIAL**
```
Login → Commercial Dashboard
  ├─ Flotte
  │  ├─ Liste (CRUD)
  │  ├─ Formulaire Add/Edit
  │  ├─ Upload photos
  │  └─ Valuation
  ├─ Clients
  │  ├─ Liste
  │  ├─ Formulaire Add/Edit
  │  └─ Détail (Notes + Historique)
  ├─ Négociations
  │  ├─ Kanban Board
  │  └─ Negotiation Room (Chat)
  ├─ Rendez-vous
  │  └─ Agenda
  ├─ Contrats
  │  └─ Liste + Détail
  └─ Analytics
     ├─ Dashboard
     ├─ Funnel
     ├─ Prédictions
     └─ Rapports
```

### **ADMIN**
```
Login → Admin Dashboard
  ├─ Utilisateurs
  │  ├─ Liste + Search
  │  ├─ Formulaire Add/Edit
  │  ├─ Détail + Impersonation
  │  └─ Delete
  ├─ Agences
  │  ├─ Liste
  │  ├─ Formulaire Add/Edit
  │  └─ Détail + Kiosks
  ├─ Kiosks
  │  ├─ Liste
  │  ├─ Configuration
  │  └─ Monitoring
  ├─ Système
  │  ├─ Health
  │  ├─ Métriques
  │  ├─ Logs
  │  └─ Alertes
  └─ Audit/Security
     ├─ User Activity Logs
     └─ Suspicious Activity
```

---

## 📡 API CALLS MAPPING

### **Authentification**
| Page | Endpoint | Method | Auth |
|------|----------|--------|------|
| Login | `/auth/login` | POST | ❌ |
| Register | `/auth/register` | POST | ❌ |
| MFA Enable | `/auth/mfa/enable` | POST | ✅ |
| MFA Verify | `/auth/mfa/verify` | POST | ❌ (temp token) |
| Forgot Password | `/auth/forgot-password` | POST | ❌ |
| Reset Password | `/auth/reset-password/:token` | POST | ❌ |
| Update Password | `/auth/update-password` | POST | ✅ |
| Logout | `/auth/logout` | POST | ✅ |
| Refresh Token | `/auth/refresh` | POST | ✅ |

### **Public (Guest)**
| Page | Endpoint | Method |
|------|----------|--------|
| Browse Vehicles | `/public/browse` | GET |
| Vehicle Detail | `/public/vehicle/:id` | GET |
| Find Agencies | `/public/agencies-within/:distance/center/:latlng/unit/:unit` | GET |
| Agencies Distances | `/public/agencies/distances/:latlng/unit/:unit` | GET |
| Kiosk Config | `/public/kiosk/:id/config` | GET |

### **Client**
| Page | Endpoint | Method |
|------|----------|--------|
| Get Profile | `/my/profile` | GET |
| Update Profile | `/my/profile` | PATCH |
| Update Consents | `/my/consents` | PUT |
| Saved Vehicles | `/my/vehicles/saved` | GET |
| Recommended | `/my/vehicles/recommended` | GET |
| Save Vehicle | `/my/vehicles/:id/save` | POST |
| My Negotiations | `/my/negotiations` | GET |
| Negotiation Detail | `/my/negotiations/:id` | GET |
| Send Message | `/my/negotiations/:id/messages` | POST |
| Make Offer | `/my/negotiations/:id/offer` | POST |
| My Appointments | `/my/appointments` | GET |
| Book Appointment | `/my/appointments` | POST |
| Update Appointment | `/my/appointments/:id` | PATCH |
| My Contracts | `/my/contracts` | GET |
| Contract Detail | `/my/contracts/:id` | GET |
| Sign Contract | `/my/contracts/:id/sign` | POST |

### **Commercial**
| Page | Endpoint | Method |
|------|----------|--------|
| Dashboard Overview | `/dashboard/overview` | GET |
| Dashboard KPIs | `/dashboard/kpis` | GET |
| Get Vehicles | `/vehicles` | GET |
| Get Vehicle | `/vehicles/:id` | GET |
| Create Vehicle | `/vehicles` | POST |
| Update Vehicle | `/vehicles/:id` | PUT |
| Delete Vehicle | `/vehicles/:id` | DELETE |
| Upload Photos | `/vehicles/:id/photos` | POST |
| Get Valuation | `/vehicles/:id/valuation` | GET |
| Get Clients | `/clients` | GET |
| Get Client | `/clients/:id` | GET |
| Create Client | `/clients` | POST |
| Update Client | `/clients/:id` | PUT |
| Add Client Note | `/clients/:id/notes` | POST |
| Get Negotiations | `/negotiations` | GET |
| Get Negotiation | `/negotiations/:id` | GET |
| Create Negotiation | `/negotiations` | POST |
| Add Message | `/negotiations/:id/messages` | POST |
| Make Offer | `/negotiations/:id/offer` | POST |
| Analytics Dashboard | `/analytics/dashboard` | GET |
| Funnel Data | `/analytics/funnel` | GET |
| Predictions | `/analytics/predictions` | GET |
| Generate Report | `/analytics/reports` | POST |

### **Admin**
| Page | Endpoint | Method |
|------|----------|--------|
| System Health | `/admin/system/health` | GET |
| System Logs | `/admin/system/logs` | GET |
| System Metrics | `/admin/system/metrics` | GET |
| Get Users | `/admin/users` | GET |
| Get User | `/admin/users/:id` | GET |
| Create User | `/admin/users` | POST |
| Update User | `/admin/users/:id` | PUT |
| Delete User | `/admin/users/:id` | DELETE |
| Impersonate User | `/admin/users/:id/impersonate` | POST |
| Get Agencies | `/admin/agencies` | GET |
| Get Agency | `/admin/agencies/:id` | GET |
| Create Agency | `/admin/agencies` | POST |
| Update Agency | `/admin/agencies/:id` | PUT |
| Delete Agency | `/admin/agencies/:id` | DELETE |
| Get Agency Kiosks | `/admin/agencies/:id/kiosks` | GET |
| Create Kiosk | `/admin/agencies/:id/kiosks` | POST |

### **Notifications**
| Page | Endpoint | Method |
|------|----------|--------|
| Get Notifications | `/notifications` | GET |
| Mark as Read | `/notifications/:id/read` | PUT |
| Mark All as Read | `/notifications/mark-all-read` | PUT |

### **Sessions**
| Page | Endpoint | Method |
|------|----------|--------|
| Get Sessions | `/sessions` | GET |
| Get Session | `/sessions/:id` | GET |
| Delete Session | `/sessions/:id` | DELETE |
| Session Audit | `/sessions/audit` | POST |

---

## 🎣 CUSTOM HOOKS RECOMMANDÉS

```javascript
// useAuth.js
function useAuth() {
  const { user, login, register, logout, isAuthenticated }
  return { user, login, register, logout, isAuthenticated }
}

// useVehicles.js
function useVehicles() {
  const { vehicles, loading, error }
  const fetchVehicles = (filters) => {}
  const createVehicle = (data) => {}
  const updateVehicle = (id, data) => {}
  const deleteVehicle = (id) => {}
  const uploadPhotos = (id, files) => {}
  return { vehicles, loading, error, fetchVehicles, createVehicle, ... }
}

// useClients.js
function useClients() {
  const { clients, loading, error }
  const fetchClients = (filters) => {}
  const getClient = (id) => {}
  const createClient = (data) => {}
  const updateClient = (id, data) => {}
  const addNote = (id, note) => {}
  return { clients, loading, error, ... }
}

// useNegotiations.js
function useNegotiations() {
  const { negotiations, loading, error }
  const fetchNegotiations = (filters) => {}
  const getNegotiation = (id) => {}
  const sendMessage = (id, message) => {}
  const makeOffer = (id, amount, notes) => {}
  return { negotiations, loading, error, ... }
}

// useNotifications.js
function useNotifications() {
  const { notifications, unreadCount }
  const fetchNotifications = () => {}
  const markAsRead = (id) => {}
  const markAllAsRead = () => {}
  return { notifications, unreadCount, markAsRead, ... }
}

// useSocket.js
function useSocket() {
  const { socket, isConnected }
  const emit = (event, data) => {}
  const on = (event, callback) => {}
  return { socket, isConnected, emit, on }
}
```

---

## 🔐 PROTECTED ROUTE COMPONENT

```jsx
<ProtectedRoute
  requiredRoles={['client', 'user']}
  redirectTo="/login"
>
  <ClientDashboard />
</ProtectedRoute>
```

---

## 📱 RESPONSIVE BREAKPOINTS

```css
Mobile: < 768px
Tablet: 768px - 1024px
Desktop: > 1024px

/* Tailwind classes to use */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

## 🧪 TESTING STRATEGY

### **Unit Tests**
- Utility functions
- Hooks
- Context
- Reducers

### **Integration Tests**
- Forms with API calls
- Protected routes
- Auth flow
- Navigation

### **E2E Tests (Cypress/Playwright)**
- Full user journeys
- Complex workflows
- Cross-browser testing

### **Coverage Target**
- Critical paths: 100%
- Business logic: 90%
- Overall: 70%+

---

## 📦 BUILD & DEPLOYMENT

### **Development**
```bash
npm install
npm run dev       # Vite dev server
npm run lint      # ESLint
npm run format    # Prettier
npm test          # Vitest
```

### **Production Build**
```bash
npm run build     # Production bundle
npm run preview   # Local preview
npm run analyze   # Bundle size analysis
```

### **Deployment Checklist**
- [ ] Environment variables configured (.env.production)
- [ ] Build size optimized
- [ ] No console logs in production
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured
- [ ] PWA manifests ready
- [ ] Security headers configured

---

## 🚀 PERFORMANCE OPTIMIZATION

### **Code Splitting**
```javascript
const ClientDashboard = lazy(() => 
  import('./pages/client/Dashboard')
)
```

### **Image Optimization**
- WebP format for Cloudinary images
- Lazy loading for off-screen images
- Responsive images with srcset

### **Bundle Optimization**
- Tree shaking
- Dynamic imports
- CDN for large libraries
- Gzip compression

### **Caching Strategy**
- Browser cache headers
- Service Worker for offline support
- API response caching

---

**Documentation complète du plan frontend prête!** 🎉

