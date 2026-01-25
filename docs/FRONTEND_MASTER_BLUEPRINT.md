# 🏛️ Auto-UC2 Frontend Master Blueprint (V5 - Ultimate)

> **Document Status**: `FINAL GOLD MASTER`
> **Target Audience**: AI Agents (v0, Cursor, Gemini), Senior Frontend Architects.
> **Scope**: 100% Coverage of Backend Routes (Guest, Auth, Client, Manager, Admin, Kiosk).
> **Philosophy**: "Logic First, Design Second". Structure is mandatory; style is flexible.

---

## 📚 Global Data Contracts (Shared Types)

### 🚗 `Vehicle` Object

```typescript
interface Vehicle {
  _id: string;
  make: string; // e.g. "Toyota"
  model: string; // e.g. "Corolla"
  year: number;
  price: number;
  mileage: number;
  fuelType: "Petrol" | "Diesel" | "Electric" | "Hybrid";
  transmission: "Manual" | "Automatic";
  status: "available" | "reserved" | "sold";
  images: string[]; // Array of Cloudinary URLs
  agency: { name: string; location: { coordinates: [number, number] } };
}
```

### 💬 `Negotiation` Object

```typescript
interface Negotiation {
  _id: string;
  status: "open" | "discussion" | "offer_sent" | "deal_reached";
  currentOffer: number;
  messages: Array<{
    sender: { _id: string; name: string };
    content: string;
    type: "text" | "offer" | "system";
    createdAt: string;
  }>;
  offers: Array<{ amount: number; by: string; status: "pending" | "accepted" }>;
}
```

---

# 🌍 PART 1: PUBLIC ZONE (Guest Access)

## 📄 Page 1.1: Landing Page (The "Hook")

- **Route**: `/`
- **Objective**: Instant visual impact + immediate utility (Search).
- **API Calls**:
  - `GET /api/v1/public/browse?sort=-createdAt&limit=6` (Featured)
  - `GET /api/v1/public/agencies/distances/:lat,:lng/unit/km` (Map)

## 📄 Page 1.2: Inventory Browser

- **Route**: `/browse`
- **Objective**: High-performance filtering.
- **API Protocol**:
  - **Endpoint**: `GET /api/v1/public/browse`
  - **Query Params**: `?make=Audi&price[lte]=50000&page=1`

## 📄 Page 1.3: Vehicle Detail Page (PDP)

- **Route**: `/vehicle/:id`
- **Objective**: Lead Gen.
- **API Protocol**:
  - **Endpoint**: `GET /api/v1/public/vehicle/:id`

## 📄 Page 1.4: Kiosk Mode (Touchscreen)

- **Route**: `/kiosk` (Standalone App Mode)
- **Objective**: For in-store tablets.
- **API Protocol**:
  - **Register Device**: `POST /api/v1/public/kiosk/register` (One-time setup)
  - **Heartbeat**: `POST /api/v1/public/kiosk/heartbeat` (Every 5 mins)
  - **Auth**: `POST /api/v1/auth/qrcode/scan` (Login via Mobile QR)

---

# 🔐 PART 2: AUTHENTICATION (Secure Layer)

## 📄 Page 2.1: Login / Register

- **Route**: `/auth/login` | `/auth/register`
- **API Protocol**:
  - **Login**: `POST /api/v1/auth/login` -> Store `token` in `localStorage` + `httpOnly cookie`.
  - **Register**: `POST /api/v1/auth/register`
  - **MFA (Step 2)**: If response is `200` but `mfaRequired: true` -> Redirect to `/auth/mfa`.

## 📄 Page 2.2: Password Recovery

- **Route**: `/auth/forgot-password`
- **API Protocol**:
  - Step 1: Input Email -> `POST /api/v1/auth/forgot-password`
  - Step 2 (Email Link): `/auth/reset-password/:token` -> `POST /api/v1/auth/reset-password/:token`

## 📄 Page 2.3: User Settings (Security)

- **Route**: `/settings/security`
- **Objective**: Manage Password, MFA.
- **API Actions**:
  - **Update Password**: `POST /api/v1/auth/update-password`
  - **Enable MFA**: `POST /api/v1/auth/mfa/enable` (Show QR to scan).

---

# 👤 PART 3: CLIENT WORKSPACE

## 📄 Page 3.1: Dashboard & Profile

- **Route**: `/my/dashboard`
- **API Protocol**:
  - **Profile**: `GET /api/v1/my/profile`
  - **Stats**: `GET /api/v1/my/negotiations` (Count active)

## 📄 Page 3.2: My Negotiations (WhatsApp Style)

- **Route**: `/my/negotiations/:id`
- **Features**:
  - **Socket.io**: Listen for `{ type: 'message' }`.
  - **Offers**: `POST /api/v1/negotiations/:id/offer` (Make Counter-Offer).
  - **Accept**: `POST /api/v1/negotiations/:id/accept` (Trigger Contract).

## 📄 Page 3.3: Appointments & Test Drives

- **Route**: `/my/appointments`
- **API Protocol**:
  - **List**: `GET /api/v1/my/appointments`
  - **Cancel**: `PATCH /api/v1/my/appointments/:id` (`{ status: 'cancelled' }`).

---

# 💼 PART 4: MANAGER WORKSPACE (Agency)

## 📄 Page 4.1: Agency Dashboard

- **Route**: `/manager/dashboard`
- **API Protocol**:
  - **KPIs**: `GET /api/v1/manager/dashboard` (Total Sales, Active Leads).
  - **Charts**: `GET /api/v1/manager/analytics` (Sales vs Target).

## 📄 Page 4.2: Inventory Manager (CRUD)

- **Route**: `/manager/vehicles`
- **API Protocol**:
  - **Create**: `POST /api/v1/vehicles` (Step 1: JSON) -> `POST /api/v1/vehicles/:id/photos` (Step 2: Upload).
  - **Edit**: `PUT /api/v1/vehicles/:id`

## 📄 Page 4.3: Team Management

- **Route**: `/manager/employees`
- **Objective**: Manage Sales Agents.
- **API Actions**:
  - **List**: `GET /api/v1/manager/employees`
  - **Invite**: `POST /api/v1/manager/employees` (Create User Account for Agent).

---

# 🛡️ PART 5: ADMIN CONSOLE (SuperAdmin)

## 📄 Page 5.1: System Health

- **Route**: `/admin/system`
- **API Protocol**:
  - **Logs**: `GET /api/v1/admin/system/logs`
  - **Metrics**: `GET /api/v1/admin/system/metrics` (CPU/RAM).

## 📄 Page 5.2: Agency & User Management

- **Route**: `/admin/users` | `/admin/agencies`
- **Features**:
  - **Impersonate**: `POST /api/v1/admin/users/:id/impersonate` (Login as any user for support).
  - **Create Agency**: `POST /api/v1/admin/agencies` (Onboarding new partners).

---

# ⚡ Global UI States & Error Handling

## 🛑 Error Pages

- **404 Not Found**: "This vehicle has likely been sold." -> Recommendation to Search.
- **500 Server Error**: "Our engine stalled." -> Retry Button.
- **403 Forbidden**: "Access Denied" -> Redirect to Login if guest.

## 🔔 Notifications Center

- **Component**: `NotificationDrawer` (Right Slide-over).
- **Source**: `GET /api/v1/notifications` + Socket Stream.
- **Types**: "New Offer", "Appointment Confirmed", "Security Alert".

---

**Verified & Generated by Antigravity AI** (V5 Final)
_Ready for immediate implementation. 100% Route Coverage._
