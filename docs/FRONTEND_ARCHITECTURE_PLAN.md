# 🎨 Plan d'Architecture Frontend Complet - Auto-UC2

> **Date** : 23 Janvier 2026 | **Projet** : Drive Expert (Auto-UC2)  
> **Backend** : Node.js/Express | **Base de données** : MongoDB  
> **Frontend** : React/React Native (conseillé)

---

## 📊 ANALYSE COMPLÈTE DU BACKEND

### 🔐 Rôles & Permissions Utilisateurs

Le système supporte **6 rôles principaux** :

| Rôle | Accès | Fonction |
|------|-------|---------|
| **superadmin** | Tous les endpoints admin | Gestion système complète, logs, métriques |
| **admin** | Routes `/admin/*` | Gestion des agences, utilisateurs, impersonation |
| **manager** | Routes `/manager/*` | Gestion employés & analytics d'une agence |
| **user** | Routes commerciales | Agents/Commerciaux : gestion flottes, négociations |
| **client** | Routes `/my/*` et `/public/*` | Clients : profil, rendez-vous, négociations |
| **guest** | Routes `/public/*` | Visiteurs anonymes : browse véhicules, géoloc |

### 📦 Modèles de Données Principaux

```
User
├── Rôle (superadmin, admin, user, client, guest)
├── Email, Password, MFA
└── Consents (GDPR)

Client (Lié à User pour les clients enregistrés)
├── firstName, lastName, phone
├── assignedAgent (Référence User)
├── agency (Référence Agency)
├── status (Lead, Prospect, Active, Inactive, Customer)
├── preferences (budget, vehicleTypes)
└── notes (Historique des interactions)

Vehicle
├── make, model, year, price, mileage
├── status (available, reserved, sold, maintenance, incoming)
├── agency (Référence Agency)
├── condition (New, Excellent, Good, Fair, Poor)
├── images (Cloudinary URLs)
└── buyer (Référence Client si vendu)

Negotiation
├── vehicle, client, agency, agent
├── status (open, discussion, offer_sent, deal_reached, lost, cancelled)
├── messages (Chat en temps réel)
└── offers (Historique des offres)

Contract
├── negotiation, client, vehicle
├── type (Purchase, Trade-in, Lease, Subscription)
├── status (draft, sent, signed, completed, cancelled)
├── signatures (client, agency avec timestamps)
└── documentUrl (PDF généré)

Appointment
├── client, vehicle, agency
├── date, type (test_drive, delivery, consultation)
└── status (scheduled, confirmed, completed, cancelled)

Agency
├── name, location (GeoJSON), contact
├── manager (Référence User)
├── kiosks (Array de Kiosk)
└── config (timezone, currency)

Notification
├── user, message, type
└── read (boolean)
```

---

## 🏗️ PLAN D'ARCHITECTURE FRONTEND

### 📱 Structure de Dossiers Recommandée

```
src/
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── MFASetup.jsx
│   │   ├── MFAVerify.jsx
│   │   ├── ForgotPassword.jsx
│   │   └── ResetPassword.jsx
│   │
│   ├── public/
│   │   ├── HomePage.jsx
│   │   ├── BrowseVehicles.jsx
│   │   ├── VehicleDetail.jsx
│   │   ├── FindAgencies.jsx
│   │   └── KioskDisplay.jsx
│   │
│   ├── client/
│   │   ├── Dashboard.jsx
│   │   ├── Profile.jsx
│   │   ├── Negotiations.jsx
│   │   ├── NegotiationDetail.jsx
│   │   ├── Appointments.jsx
│   │   ├── Contracts.jsx
│   │   ├── ContractDetail.jsx
│   │   ├── SavedVehicles.jsx
│   │   └── Privacy.jsx
│   │
│   ├── commercial/
│   │   ├── Dashboard.jsx
│   │   ├── FleetManagement.jsx
│   │   ├── VehicleForm.jsx
│   │   ├── ClientManagement.jsx
│   │   ├── ClientDetail.jsx
│   │   ├── NegotiationBoard.jsx
│   │   ├── NegotiationRoom.jsx
│   │   ├── Analytics.jsx
│   │   └── ReportGeneration.jsx
│   │
│   ├── admin/
│   │   ├── Dashboard.jsx
│   │   ├── UserManagement.jsx
│   │   ├── UserForm.jsx
│   │   ├── AgencyManagement.jsx
│   │   ├── AgencyForm.jsx
│   │   ├── KioskManagement.jsx
│   │   ├── SystemHealth.jsx
│   │   ├── Logs.jsx
│   │   ├── Metrics.jsx
│   │   └── ImpersonationPanel.jsx
│   │
│   └── shared/
│       ├── NotFound.jsx
│       ├── Unauthorized.jsx
│       └── ServerError.jsx
│
├── components/
│   ├── Layout/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Footer.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── Common/
│   │   ├── VehicleCard.jsx
│   │   ├── AgencyCard.jsx
│   │   ├── NotificationBell.jsx
│   │   ├── Modal.jsx
│   │   ├── Loader.jsx
│   │   └── Toast.jsx
│   │
│   ├── Forms/
│   │   ├── VehicleForm.jsx
│   │   ├── AppointmentForm.jsx
│   │   ├── OfferForm.jsx
│   │   └── ContractForm.jsx
│   │
│   └── Charts/
│       ├── BarChart.jsx
│       ├── LineChart.jsx
│       ├── PieChart.jsx
│       └── ConversionFunnel.jsx
│
├── services/
│   ├── api.js (Configuration axios)
│   ├── auth.js (Endpoints auth)
│   ├── vehicles.js
│   ├── clients.js
│   ├── negotiations.js
│   ├── contracts.js
│   ├── appointments.js
│   ├── agencies.js
│   ├── notifications.js
│   ├── analytics.js
│   └── admin.js
│
├── hooks/
│   ├── useAuth.js
│   ├── useVehicles.js
│   ├── useClients.js
│   ├── useNegotiations.js
│   ├── useNotifications.js
│   └── useSocket.js
│
├── context/
│   ├── AuthContext.jsx
│   ├── NotificationContext.jsx
│   └── AppContext.jsx
│
├── utils/
│   ├── storage.js (LocalStorage wrapper)
│   ├── formatters.js (Dates, devises)
│   ├── validators.js
│   └── constants.js
│
├── socket/
│   └── socketManager.js (Socket.io client)
│
├── styles/
│   ├── global.css
│   ├── variables.css
│   └── responsive.css
│
└── App.jsx
```

---

## 👥 SIDEBARS PAR TYPE D'UTILISATEUR

### 1️⃣ **GUEST (Non-Authentifié)**

```
┌─────────────────────────────────────────┐
│ 🚗 Auto-UC2                             │
├─────────────────────────────────────────┤
│ 🏠 Accueil                              │
│ 🚗 Parcourir les véhicules              │
│ 📍 Agences à proximité                  │
│ 🔐 Connexion                            │
│ 📝 Inscription                          │
└─────────────────────────────────────────┘
```

---

### 2️⃣ **CLIENT (Utilisateur - role: "client")**

```
┌─────────────────────────────────────────┐
│ 👤 Profil Client                        │
├─────────────────────────────────────────┤
│ 📊 DASHBOARD                            │
│   └─ 📈 Vue d'ensemble                  │
│                                         │
│ 🚗 MES VÉHICULES                        │
│   ├─ 💾 Véhicules sauvegardés           │
│   ├─ ⭐ Recommandés                     │
│   └─ 🔍 Parcourir tous                  │
│                                         │
│ 💬 NÉGOCIATIONS                         │
│   ├─ 📋 En cours                        │
│   ├─ ✅ Acceptées                       │
│   └─ ❌ Rejetées                        │
│                                         │
│ 📅 RENDEZ-VOUS                          │
│   ├─ 📅 Mes rendez-vous                 │
│   └─ ➕ Nouveau rendez-vous              │
│                                         │
│ 📄 CONTRATS                             │
│   ├─ 📄 À signer                        │
│   ├─ ✍️ Signés                          │
│   └─ 📋 Historique                      │
│                                         │
│ 👤 MON COMPTE                           │
│   ├─ 📝 Mon profil                      │
│   ├─ 🔒 Sécurité (MFA)                  │
│   ├─ 🔐 Confidentialité (GDPR)          │
│   └─ 🚪 Déconnexion                     │
└─────────────────────────────────────────┘
```

---

### 3️⃣ **COMMERCIAL/USER (Agent Ventes - role: "user")**

```
┌─────────────────────────────────────────┐
│ 👨‍💼 Commercial                           │
├─────────────────────────────────────────┤
│ 📊 DASHBOARD                            │
│   ├─ 📈 KPIs temps réel                 │
│   ├─ 📊 Performance                     │
│   └─ 🎯 Objectifs                       │
│                                         │
│ 🚗 FLOTTE                               │
│   ├─ 📋 Tous les véhicules              │
│   ├─ ➕ Ajouter un véhicule              │
│   ├─ 📸 Gérer les photos                │
│   ├─ 📊 Évaluation des prix             │
│   └─ 🔧 Maintenance                     │
│                                         │
│ 👥 CLIENTS                              │
│   ├─ 📋 Liste complète                  │
│   ├─ ➕ Ajouter un client                │
│   ├─ 📝 Notes & Historique              │
│   └─ 📊 Segmentation                    │
│                                         │
│ 💬 NÉGOCIATIONS                         │
│   ├─ 📊 Tableau de bord                 │
│   ├─ 🔄 En discussion                   │
│   ├─ 💰 Offres envoyées                 │
│   ├─ ✅ Deals conclus                   │
│   └─ ❌ Perdus                          │
│                                         │
│ 📄 CONTRATS                             │
│   ├─ 📋 À traiter                       │
│   ├─ ✍️ Signés récemment                │
│   └─ 📊 Historique                      │
│                                         │
│ 📅 RENDEZ-VOUS                          │
│   ├─ 📅 Agenda                          │
│   ├─ 👥 Mes clients en attente          │
│   └─ ⏰ Confirmés                        │
│                                         │
│ 📊 ANALYTICS                            │
│   ├─ 📈 Tableau de bord                 │
│   ├─ 🔀 Funnel conversions              │
│   ├─ 🤖 Prédictions IA                  │
│   └─ 📋 Rapports                        │
│                                         │
│ 👤 MON COMPTE                           │
│   ├─ 📝 Mon profil                      │
│   ├─ 🔒 Sécurité (MFA)                  │
│   └─ 🚪 Déconnexion                     │
└─────────────────────────────────────────┘
```

---

### 4️⃣ **ADMIN (Administrateur - role: "admin")**

```
┌─────────────────────────────────────────┐
│ 👨‍⚙️ Administration                       │
├─────────────────────────────────────────┤
│ 📊 SYSTÈME                              │
│   ├─ 💚 Santé système                   │
│   ├─ 📊 Métriques                       │
│   ├─ 📋 Logs                            │
│   └─ ⚙️ Configuration                   │
│                                         │
│ 👥 UTILISATEURS                         │
│   ├─ 📋 Tous les utilisateurs           │
│   ├─ ➕ Ajouter utilisateur              │
│   ├─ ✏️ Éditer                          │
│   ├─ 🗑️ Supprimer                       │
│   └─ 👤 Se connecter en tant que...     │
│                                         │
│ 🏢 AGENCES                              │
│   ├─ 📍 Liste des agences               │
│   ├─ ➕ Créer agence                     │
│   ├─ ✏️ Éditer                          │
│   ├─ 📍 Localisation (GeoJSON)          │
│   └─ 🗑️ Supprimer                       │
│                                         │
│ 🖥️ KIOSKS                               │
│   ├─ 📡 Appareils connectés             │
│   ├─ 🔧 Configuration                   │
│   ├─ 📊 Heartbeat/Monitoring            │
│   └─ 🗑️ Supprimer                       │
│                                         │
│ 👤 MON COMPTE                           │
│   ├─ 📝 Mon profil                      │
│   ├─ 🔒 Sécurité (MFA)                  │
│   └─ 🚪 Déconnexion                     │
└─────────────────────────────────────────┘
```

---

### 5️⃣ **SUPERADMIN (Administrateur Système - role: "superadmin")**

Même que **ADMIN** + Accès à :

```
│ 🔓 SÉCURITÉ                             │
│   ├─ 🔐 Audit de sécurité               │
│   ├─ 🚨 Alertes                         │
│   └─ 📊 Historique des accès            │
│                                         │
│ 🔄 SYNC/BACKUP                          │
│   ├─ 💾 Backups                         │
│   ├─ 🔄 Restauration                    │
│   └─ 📊 Logs de synchronisation         │
```

---

## 📄 PAGES À DÉVELOPPER (Détail Complet)

### **SECTION AUTHENTIFICATION**

#### 1. **Login (Connexion)**
- **URL** : `/auth/login` ou `/`
- **Composants** :
  - Input Email
  - Input Password (avec toggle show/hide)
  - Checkbox "Se souvenir de moi"
  - Bouton "Connexion"
  - Lien "Inscription" 
  - Lien "Mot de passe oublié?"
- **API** : `POST /auth/login`
- **Logique** :
  - Si MFA activé dans le profil → Redirection vers MFA Verify
  - Sinon → Dashboard selon le rôle
  - Stocker token en localStorage/secureStore
- **Erreurs** : Email invalide, mot de passe incorrect, compte inactif

#### 2. **Register (Inscription)**
- **URL** : `/auth/register`
- **Composants** :
  - Input Nom complet
  - Input Email
  - Input Password (validation: min 8 caractères)
  - Input Confirm Password
  - Checkbox "J'accepte les conditions"
  - Bouton "S'inscrire"
- **API** : `POST /auth/register`
- **Logique** :
  - Validation front-end (email format, passwords match)
  - Créer compte avec rôle "client" par défaut
  - Redirection vers Login
- **Succès** : Toast "Inscription réussie. Veuillez vous connecter."

#### 3. **MFA Setup (Configuration 2FA)**
- **URL** : `/auth/mfa/setup`
- **Composants** :
  - Afficher QR Code (généré par API)
  - Bouton "Copier la clé"
  - Input pour vérifier le code (6 chiffres)
  - Bouton "Confirmer MFA"
  - Recovery codes (à télécharger)
- **API** : 
  - `POST /auth/mfa/enable` → Récupère QR
  - `POST /auth/mfa/verify` → Valide le code
- **Logique** :
  - Générer QR à l'affichage
  - Vérifier le code en temps réel
  - Afficher success message et récupération codes

#### 4. **MFA Verify (Vérification 2FA au login)**
- **URL** : `/auth/mfa/verify`
- **Composants** :
  - Input 6 chiffres (avec séparation auto)
  - Bouton "Vérifier"
  - Lien "Je n'ai pas de code" → Afficher recovery codes form
- **API** : `POST /auth/mfa/verify`
- **Logique** :
  - Vérifier le code 2FA
  - Rediriger vers Dashboard si valide
  - Afficher erreur si invalide

#### 5. **Forgot Password**
- **URL** : `/auth/forgot-password`
- **Composants** :
  - Input Email
  - Bouton "Envoyer le lien"
- **API** : `POST /auth/forgot-password`
- **Logique** :
  - Envoyer un email avec lien reset
  - Afficher message "Vérifiez votre email"

#### 6. **Reset Password**
- **URL** : `/auth/reset-password/:token`
- **Composants** :
  - Input New Password
  - Input Confirm Password
  - Bouton "Réinitialiser"
- **API** : `POST /auth/reset-password/:token`
- **Logique** :
  - Valider le token
  - Reset password
  - Redirection vers Login

---

### **SECTION PUBLIC (Guest)**

#### 7. **Home Page**
- **URL** : `/`
- **Composants** :
  - Hero section avec CTA
  - Carousel de véhicules populaires
  - Statistiques (nombre d'agences, véhicules, etc.)
  - Section "Comment ça marche?"
  - Localisation des agences (Mini Map)
  - CTA "Parcourir" et "S'inscrire"

#### 8. **Browse Vehicles**
- **URL** : `/browse` ou `/vehicles`
- **Composants** :
  - **Filtres latéraux** :
    - Prix (Range Slider)
    - Marque (Multi-select)
    - Modèle (Multi-select)
    - Année (Range Slider)
    - Kilométrage (Range Slider)
    - Carburant (Checkbox)
    - État (Dropdown)
  - **Grille de cartes** : Chaque carte affiche :
    - Image du véhicule
    - Marque, modèle, année
    - Prix
    - Kilométrage
    - Condition
    - Bouton "Voir détails"
  - **Pagination** ou **Infinite Scroll**
  - **Sort** : Prix (croissant/décroissant), Date d'ajout
- **API** : `GET /public/browse?price[lte]=20000&make=Renault&skip=0&limit=20`
- **Responsive** : Grid 1 colonne mobile, 2-3 desktop

#### 9. **Vehicle Detail**
- **URL** : `/vehicles/:id`
- **Composants** :
  - **Galerie photos** (Carousel avec thumbnails)
  - **Infos principales** :
    - Marque, Modèle, Année
    - Prix en gros
    - État général
    - Kilométrage
  - **Specs détaillées** :
    - Moteur (puissance, cylindrée)
    - Transmission
    - Carburant
    - Couleur
    - Intérieur/Extérieur
  - **Description complète**
  - **CTA Buttons** :
    - 🚗 "Essayer ce véhicule" → Modal Appointment
    - 💰 "Négocier / Faire une offre" → Créer Negotiation
    - ❤️ "Ajouter aux favoris" (si connecté)
  - **Section "Agence"** : Carte + Contact + Bouton "Voir d'autres véhicules"
  - **Agences à proximité** (Via Geoloc)
- **API** : `GET /public/vehicle/:id`

#### 10. **Find Agencies**
- **URL** : `/agencies`
- **Composants** :
  - Input "Entrez votre localisation" (Geoloc ou texte)
  - Range Slider "Rayon de recherche" (km)
  - **Résultats** :
    - Carte (Leaflet/MapBox) avec pins
    - Liste des agences avec :
      - Nom
      - Adresse
      - Distance
      - Téléphone
      - Email
      - Bouton "Voir tous les véhicules"
- **API** : 
  - `GET /public/agencies-within/:distance/center/:latlng/unit/:unit`
  - Géolocalisation via navigator.geolocation
- **Responsive** : Carte en haut mobile, côté à côte desktop

#### 11. **Kiosk Display** (Interface Kiosk Public)
- **URL** : `/kiosk` ou `/kiosk/:deviceId`
- **Mode** : Full-screen, Auto-scrolling carousel
- **Composants** :
  - Carousel de véhicules (Auto-rotate toutes les 5s)
  - Infos agence
  - Bouton "Prendre un RDV"
  - Bouton "Calculer ma géoloc"
  - Code QR pour accès Frontend
- **API** : `GET /public/kiosk/:id/config`

---

### **SECTION CLIENT**

#### 12. **Client Dashboard**
- **URL** : `/my/dashboard`
- **Composants** :
  - Welcome card "Bienvenue, [Prénom]"
  - **Quick Stats** :
    - Rendez-vous à venir
    - Négociations en cours
    - Contrats en attente
    - Notifications non-lues
  - **Recent Activity** :
    - Derniers véhicules consultés
    - Dernières négociations
  - **CTA Cards** :
    - "Parcourir les véhicules"
    - "Voir mes rendez-vous"
    - "Mes négociations"
- **API** : `GET /my/profile`, `GET /my/negotiations`, `GET /my/appointments`

#### 13. **Client Profile**
- **URL** : `/my/profile`
- **Composants** :
  - Avatar (Upload ou Placeholder)
  - Infos personnelles (Nom, Email, Téléphone) - Éditables
  - Adresse de livraison (Éditable)
  - Préférences (Budget min/max, Types de véhicules)
  - Historique des achats
  - Bouton "Modifier"
  - Bouton "Sauvegarder"
- **API** : 
  - `GET /my/profile`
  - `PATCH /my/profile`

#### 14. **Privacy & Consents (GDPR)**
- **URL** : `/my/privacy`
- **Composants** :
  - **Section Consentements** :
    - ✓ Traitement des données personnelles (Toggle)
    - ✓ Communications marketing (Toggle)
    - ✓ Partage avec tiers (Toggle)
  - **Historique des consentements** :
    - Date d'acceptation
    - Version de la politique
  - **Données exportables** :
    - Bouton "Télécharger mes données" (GDPR)
  - **Suppression** :
    - Bouton "Supprimer mon compte" (avec confirmation)
- **API** :
  - `PUT /my/consents`
  - `GET /my/profile` (pour afficher consents actuels)

#### 15. **My Saved Vehicles**
- **URL** : `/my/vehicles/saved`
- **Composants** :
  - Grille de véhicules sauvegardés
  - Chaque carte affiche :
    - Image
    - Marque, modèle, année
    - Prix
    - Date d'ajout
    - Bouton ❌ "Retirer des favoris"
    - Bouton "Voir détails"
  - Message si vide : "Aucun véhicule sauvegardé"
  - Bouton "Parcourir les véhicules"
- **API** : `GET /my/vehicles/saved`

#### 16. **Recommended Vehicles**
- **URL** : `/my/vehicles/recommended`
- **Composants** :
  - Grille de véhicules recommandés (Basés sur préférences)
  - Cartes similaires à "Saved Vehicles"
  - Bouton "Sauvegarder" sur chaque carte
  - Section "Pourquoi ces recommandations?" (Explications IA)
- **API** : `GET /my/vehicles/recommended`

#### 17. **My Negotiations**
- **URL** : `/my/negotiations`
- **Composants** :
  - **Filtres** :
    - Statut (All, Open, Discussion, Offer Sent, Deal Reached, Lost)
  - **Liste de cartes** :
    - Photo du véhicule (thumbnail)
    - Véhicule (Make/Model/Year)
    - Statut avec couleur
    - Meilleure offre actuellement
    - Date de dernière activité
    - Bouton "Voir détails"
  - Pagination
  - Message si vide
- **API** : `GET /my/negotiations`

#### 18. **Negotiation Detail / Chat Room**
- **URL** : `/my/negotiations/:id`
- **Composants** :
  - **Header** :
    - Véhicule (photo + infos)
    - Statut de négociation
    - Agent assigné (nom + photo)
  - **Main Chat** :
    - Message history scrollable
    - Chaque message affiche :
      - Sender name/avatar
      - Content
      - Timestamp
      - ✓✓ Read status
    - Input message (Multiline textarea)
    - Bouton "Envoyer"
    - Bouton "Attacher un fichier"
  - **Right Panel (Offers)** :
    - Historique des offres :
      - Prix
      - Proposé par (Client/Agent)
      - Date
      - Statut (Pending, Accepted, Rejected, Countered)
    - Bouton "Faire une contre-offre"
  - **Action Buttons** :
    - Prendre RDV
    - Revoir la négociation
    - Annuler
- **API** :
  - `GET /my/negotiations/:id`
  - `POST /my/negotiations/:id/messages` (Send message)
  - `POST /my/negotiations/:id/offer` (Make offer)
- **Real-time** : Socket.io pour messages en temps réel

#### 19. **My Appointments**
- **URL** : `/my/appointments`
- **Composants** :
  - **Calendar view** ou **List view** (Toggle)
  - Chaque RDV affiche :
    - Véhicule
    - Date/Heure
    - Lieu (Agence)
    - Type (Test Drive, Delivery, etc.)
    - Statut (Scheduled, Confirmed, Completed, Cancelled)
    - Bouton "Modifier"
    - Bouton "Annuler"
  - **Floating action button** : ➕ "Nouveau RDV"
  - Onglets : À venir, Passés
- **API** : `GET /my/appointments`

#### 20. **Appointment Booking / Form**
- **URL** : `/my/appointments/new` ou Modal
- **Composants** :
  - Dropdown/Search "Choisir un véhicule"
  - Dropdown "Agence"
  - Date Picker
  - Time Picker (Créneaux dispos)
  - Type de RDV (Test Drive, Consultation, etc.)
  - Notes (Optional)
  - Bouton "Confirmer"
  - Bouton "Annuler"
- **API** : 
  - `POST /my/appointments`
  - `GET /available-slots` (hypothétique, voir API)

#### 21. **My Contracts**
- **URL** : `/my/contracts`
- **Composants** :
  - **Filtres** :
    - Statut (Draft, Sent, Signed, Completed, Cancelled)
  - **Liste de cartes** :
    - Type de contrat (Purchase, Lease, etc.)
    - Véhicule
    - Date de création
    - Statut
    - Signatures (Client ✓, Agency ✓)
    - Bouton "Voir détails" / "Signer"
  - Pagination
- **API** : `GET /my/contracts`

#### 22. **Contract Detail & Signature**
- **URL** : `/my/contracts/:id`
- **Composants** :
  - **Document Preview** :
    - PDF embeddé ou HTML rendu
    - Scroller pour voir tout
  - **Contract Info** :
    - Type
    - Véhicule
    - Montant
    - Durée (si applicable)
    - Conditions générales
  - **Signature Section** :
    - Si non signé par client :
      - Checkbox "J'accepte les termes"
      - Signature pad (Canvas-based) OU
      - "Signer avec e-signature (DocuSign, etc.)"
      - Bouton "Signer ce contrat"
    - Si signé :
      - ✅ "Signé le [DATE] à [HEURE]"
      - IP de signature
  - **Download** : Bouton "Télécharger PDF"
- **API** : 
  - `GET /my/contracts/:id`
  - `POST /my/contracts/:id/sign`
- **Toast au succès** : "Contrat signé avec succès! 🎉"

---

### **SECTION COMMERCIAL**

#### 23. **Commercial Dashboard**
- **URL** : `/dashboard` (Commercial)
- **Composants** :
  - **KPIs Cards** :
    - 🚗 Véhicules en stock
    - 💰 Chiffre d'affaires (Mois/Année)
    - 📊 Taux de conversion
    - 👥 Nouveaux clients (Mois)
  - **Charts** :
    - Graphique ventes par mois (Line chart)
    - Répartition par type de véhicule (Pie chart)
    - Top clients (Bar chart)
  - **Recent Activity** :
    - Dernières négociations
    - Derniers contrats signés
  - **Buttons** :
    - ➕ Ajouter un véhicule
    - ➕ Ajouter un client
    - 📊 Voir analytics complets
- **API** : `GET /dashboard/overview`, `GET /dashboard/kpis`

#### 24. **Fleet Management**
- **URL** : `/vehicles` (Commercial)
- **Composants** :
  - **Filtres** :
    - Statut (Available, Reserved, Sold, Maintenance, Incoming)
    - Marque
    - Prix
    - Agence
  - **Table/Grid View** :
    - Checkbox pour multi-select
    - Colonnes : Photo, Marque/Modèle, Prix, Statut, Kilométrage, Actions
    - Actions : Éditer, Supprimer, Gérer photos, Voir détails
  - **Bulk Actions** (si sélection) :
    - Changer statut
    - Supprimer
  - **Floating action button** : ➕ "Ajouter un véhicule"
  - Pagination
- **API** : 
  - `GET /vehicles?status=available&sort=-price`
  - `GET /vehicles/:id`
  - `DELETE /vehicles/:id`
  - `PUT /vehicles/:id`

#### 25. **Vehicle Form (Add/Edit)**
- **URL** : `/vehicles/new` ou `/vehicles/:id/edit`
- **Composants** :
  - **Infos Principales** :
    - VIN (Unique)
    - Make, Model, Year
    - Trim (Optional)
  - **Specs** :
    - Mileage
    - Fuel Type (Petrol, Diesel, Electric, Hybrid, Plugin Hybrid)
    - Transmission (Manual, Automatic)
    - Color
    - Condition (New, Excellent, Good, Fair, Poor)
  - **Pricing** :
    - Purchase Price
    - Selling Price
    - Market Value (Auto-calculate via IA)
  - **Status** :
    - Dropdown (Available, Reserved, Sold, Maintenance, Incoming)
  - **Agency** :
    - Dropdown (Select agency)
  - **Description** :
    - Rich Text Editor
  - **Features** :
    - Multi-select checkboxes (AC, GPS, Sunroof, etc.)
  - **Photos** :
    - Dropzone pour upload multiple (Max 10)
    - Gallery pour afficher uploaded photos
    - Bouton "Supprimer" par photo
  - **Buttons** :
    - "Sauvegarder"
    - "Sauvegarder & Continuer"
    - "Annuler"
- **API** :
  - `POST /vehicles` (Create)
  - `PUT /vehicles/:id` (Update)
  - `POST /vehicles/:id/photos` (Upload photos - multipart/form-data)

#### 26. **Vehicle Valuation**
- **URL** : `/vehicles/:id/valuation` ou Modal
- **Composants** :
  - Afficher les specs du véhicule
  - **Valuation Results** :
    - Min Price (Range)
    - Max Price (Range)
    - Confidence Score (%)
    - Comparables (Véhicules similaires vendus)
    - Facteurs impactant (Condition, Kilométrage, etc.)
  - Bouton "Appliquer la valuation"
- **API** : `GET /vehicles/:id/valuation`

#### 27. **Client Management**
- **URL** : `/clients` (Commercial)
- **Composants** :
  - **Filtres** :
    - Status (Lead, Prospect, Active, Inactive, Customer)
    - Agence
    - Tag
  - **Table/Grid** :
    - Nom, Email, Téléphone
    - Status (Badge avec couleur)
    - Assigned Agent
    - Date d'ajout
    - Actions : Voir détails, Éditer, Supprimer
  - **Search** : Par nom, email, phone
  - **Floating action button** : ➕ "Ajouter un client"
  - Pagination
- **API** : `GET /clients?status=Lead&skip=0&limit=20`

#### 28. **Client Detail View**
- **URL** : `/clients/:id`
- **Composants** :
  - **Infos Client** :
    - Nom, Email, Téléphone
    - Adresse
    - Status (Dropdown éditable)
    - Agent assigné (Dropdown éditable)
    - Agence (Dropdown éditable)
    - Date d'ajout
    - Budget (Min/Max)
    - Types de véhicules préférés
  - **Historique & Notes** :
    - Onglet "Historique" : Toutes les interactions
    - Onglet "Notes" :
      - Afficher notes existantes
      - Champ pour ajouter nouvelle note
      - Chaque note affiche : Date, Auteur, Contenu
  - **Historique de négociations** :
    - Lister les négociations (Lien vers détail)
  - **Historique de rendez-vous** :
    - Lister les RDV passés/futurs
  - **Buttons** :
    - "Éditer"
    - "Ajouter une note"
    - "Créer une négociation"
    - "Créer un RDV"
    - "Supprimer"
- **API** :
  - `GET /clients/:id`
  - `PUT /clients/:id`
  - `POST /clients/:id/notes`

#### 29. **Negotiation Board (Kanban)**
- **URL** : `/negotiations` (Commercial)
- **Composants** :
  - **Colonnes Kanban** :
    1. Open (Ouvertes)
    2. Discussion (En discussion)
    3. Offer Sent (Offres envoyées)
    4. Deal Reached (Deals conclus)
    5. Lost (Perdues)
    6. Cancelled (Annulées)
  - **Chaque carte** affiche :
    - Véhicule
    - Client
    - Meilleure offre
    - Agent
    - Couleur par urgence
  - **Drag & drop** entre colonnes
  - Click sur card → Ouvre Negotiation Room
  - Filtres : Agent, Agence, Date range
- **API** : `GET /negotiations?status=open,discussion`

#### 30. **Negotiation Room (Chat + Offers)**
- **URL** : `/negotiations/:id` (Commercial view)
- **Composants** :
  - **Left Panel** :
    - Infos négociation
    - Véhicule
    - Client
  - **Main Chat** :
    - Message history
    - Input + Send
  - **Right Panel (Offres)** :
    - Historique des offres
    - Formulaire "Faire une offre" :
      - Input Price
      - Notes (Optional)
      - Bouton "Envoyer l'offre"
  - **Action Buttons** :
    - "Générer contrat"
    - "Clore négociation"
    - "Archiver"
- **API** :
  - `GET /negotiations/:id`
  - `POST /negotiations/:id/messages`
  - `POST /negotiations/:id/offer`

#### 31. **Analytics Dashboard**
- **URL** : `/analytics` (Commercial)
- **Composants** :
  - **Date Range Picker** (Month, Quarter, Year)
  - **KPIs Cards** :
    - Total Sales (€)
    - Average Deal Value
    - Conversion Rate (%)
    - Customer Acquisition Cost
  - **Charts** :
    - Sales over time (Line chart)
    - Sales by vehicle type (Bar chart)
    - Top clients (Table)
    - Sales funnel (Conversion visualization)
  - **Predictions (IA)** :
    - Forecasted sales next month
    - Churn risk clients
    - Best selling models
  - **Export** :
    - Bouton "Télécharger rapport PDF"
    - Bouton "Export Excel"
- **API** :
  - `GET /analytics/dashboard?period=month`
  - `GET /analytics/funnel`
  - `GET /analytics/predictions`

#### 32. **Report Generation**
- **URL** : `/analytics/reports` ou Modal
- **Composants** :
  - **Report Type** :
    - Dropdown : Ventes, Clients, Négociations, Performance
  - **Filters** :
    - Date range
    - Agent
    - Agence
  - **Format** :
    - Radio buttons : PDF, Excel, Email
  - **Preview** :
    - Afficher un aperçu
  - **Boutons** :
    - "Générer"
    - "Annuler"
- **API** : `POST /analytics/reports`

---

### **SECTION ADMIN**

#### 33. **Admin Dashboard**
- **URL** : `/admin/dashboard`
- **Composants** :
  - **System Health** :
    - ✅ Database Connection
    - ✅ API Status
    - ✅ Disk Space
    - ✅ Memory Usage
  - **Stats Cards** :
    - Total Users
    - Total Vehicles
    - Total Agencies
    - Active Sessions
  - **Recent Activity** :
    - Latest user registrations
    - Latest transactions
  - **Alerts** :
    - Warnings (Disk space, API errors, etc.)
- **API** : `GET /admin/system/health`

#### 34. **User Management**
- **URL** : `/admin/users`
- **Composants** :
  - **Filtres** :
    - Role (Superadmin, Admin, User, Client, Guest)
    - Status (Active, Inactive)
    - Agence
  - **Table** :
    - Nom, Email, Rôle, Status
    - Date de création
    - Dernier login
    - Actions : Voir détails, Éditer, Supprimer, Se connecter en tant que
  - **Search** : Par nom, email
  - **Floating action button** : ➕ "Ajouter utilisateur"
  - Pagination
- **API** : `GET /admin/users`

#### 35. **User Form (Add/Edit)**
- **URL** : `/admin/users/new` ou `/admin/users/:id/edit`
- **Composants** :
  - Name
  - Email
  - Role (Dropdown)
  - Agency (Dropdown si role = User/Admin)
  - Password (New user) ou Password reset checkbox
  - Status (Active/Inactive)
  - Buttons : Save, Save & Continue, Cancel
- **API** :
  - `POST /admin/users` (Create)
  - `PUT /admin/users/:id` (Update)

#### 36. **Impersonation Panel**
- **URL** : `/admin/impersonate` ou Via User detail
- **Composants** :
  - Affichage utilisateur actuellement impersonné
  - Navigation complète comme l'utilisateur impersonné
  - **Top bar** : "Vous êtes connecté en tant que [User]"
  - Bouton "Revenir à l'admin"
- **API** : `POST /admin/users/:id/impersonate`
- **Logique** :
  - Remplacer le token JWT
  - Garder une référence de l'admin original

#### 37. **Agency Management**
- **URL** : `/admin/agencies`
- **Composants** :
  - **Filtres** :
    - Status (Active, Inactive, Maintenance)
  - **Table/Grid** :
    - Nom, Ville, Manager
    - Status (Badge)
    - Nombre de véhicules
    - Nombre de kiosks
    - Actions : Voir détails, Éditer, Supprimer
  - **Search** : Par nom
  - **Floating action button** : ➕ "Créer agence"
  - Pagination
- **API** : `GET /admin/agencies`

#### 38. **Agency Form (Add/Edit)**
- **URL** : `/admin/agencies/new` ou `/admin/agencies/:id/edit`
- **Composants** :
  - Name
  - Adresse (Street, City, ZIP, Country)
  - Location (Lat/Lon Map picker ou Geolocation)
  - Phone
  - Email
  - Manager (Dropdown User avec role Admin/User)
  - Status (Active/Inactive/Maintenance)
  - Config :
    - Timezone (Dropdown)
    - Currency (Dropdown)
  - Buttons : Save, Cancel
- **API** :
  - `POST /admin/agencies`
  - `PUT /admin/agencies/:id`

#### 39. **Agency Detail View**
- **URL** : `/admin/agencies/:id`
- **Composants** :
  - Agency info (voir form)
  - **Kiosks List** :
    - Table des kiosks assignés
    - Infos : ID, Location, Status, Last Heartbeat
    - Actions : Éditer, Supprimer, Test Heartbeat
  - **Vehicles Count** : Afficher par statut
  - **Employees** : Liste des users assignés
  - **Buttons** :
    - "Éditer"
    - ➕ "Ajouter Kiosk"
    - "Supprimer"
- **API** :
  - `GET /admin/agencies/:id`
  - `GET /admin/agencies/:id/kiosks`

#### 40. **Kiosk Management**
- **URL** : `/admin/kiosks`
- **Composants** :
  - **Filtres** :
    - Agence
    - Status (Online, Offline)
  - **Table** :
    - Device ID
    - Agence
    - Location
    - Status (✅ Online / ❌ Offline)
    - Last Heartbeat
    - Configuration Version
    - Actions : Éditer, Test, Supprimer
  - **Search** : Par Device ID, Agence
- **API** : `GET /admin/kiosks`

#### 41. **Kiosk Configuration**
- **URL** : `/admin/kiosks/:id/config`
- **Composants** :
  - Device Info (ID, AgencyID, etc.)
  - Display Settings :
    - Rotation speed
    - Brightness
    - Resolution
  - Content Settings :
    - Featured vehicles (Multi-select)
    - Rotation interval
  - Network Info :
    - IP Address
    - Last connection
    - Uptime
  - Test Buttons :
    - "Send Heartbeat"
    - "Restart Device"
  - Buttons : Save, Test, Reset to Default, Delete
- **API** :
  - `GET /admin/kiosks/:id/config`
  - `PUT /admin/kiosks/:id/config`

#### 42. **System Health & Metrics**
- **URL** : `/admin/system`
- **Composants** :
  - **Health Status Cards** :
    - ✅ Database
    - ✅ API Server
    - ✅ Redis (Cache)
    - ✅ Email Service
    - ✅ File Storage (Cloudinary)
  - **Metrics Charts** :
    - CPU Usage (%)
    - Memory Usage (%)
    - Disk Space (%)
    - Request/Sec
    - API Response Time (ms)
  - **Logs** :
    - Real-time log viewer
    - Filter by level (Error, Warning, Info, Debug)
    - Search
- **API** :
  - `GET /admin/system/health`
  - `GET /admin/system/metrics`
  - `GET /admin/system/logs`

#### 43. **System Logs**
- **URL** : `/admin/logs`
- **Composants** :
  - **Filters** :
    - Date range
    - Level (Error, Warning, Info, Debug)
    - Source (Module)
  - **Log Viewer** :
    - Table avec : Timestamp, Level (couleur), Message, Source
    - Search bar
    - Auto-refresh checkbox
  - **Pagination** ou Infinite scroll
- **API** : `GET /admin/system/logs?level=error&limit=100`

---

### **SECTION SHARED**

#### 44. **Navbar/Header**
- **Components** :
  - Logo (Clickable → Home)
  - Search bar (Global search)
  - Notification Bell :
    - Badge count
    - Dropdown list
    - Click on notification → Mark as read
  - User Menu Dropdown :
    - Profile
    - Settings
    - Help
    - Logout
  - Dark mode toggle (Optional)
- **Responsive** : Hamburger menu on mobile

#### 45. **Sidebar**
- **Dynamic** : Affiche les items selon le rôle (Voir sections plus haut)
- **Features** :
  - Collapse/Expand toggle
  - Active route highlighting
  - Icons + Labels
  - Responsive : Drawer on mobile
  - Smooth animations

#### 46. **Protected Route**
- **Logic** :
  - Check if token exists
  - Validate token expiry
  - Check user role against required roles
  - Redirect to login if unauthorized
  - Show 403 if insufficient permissions

#### 47. **NotFound (404)**
- **URL** : `/404`
- **Composants** :
  - 404 Message
  - Illustration
  - Buttons : Go Home, Go Back

#### 48. **Unauthorized (403)**
- **URL** : `/403`
- **Composants** :
  - 403 Message
  - Explanation
  - Buttons : Go Home, Contact Admin

#### 49. **Server Error (500)**
- **URL** : `/500`
- **Composants** :
  - 500 Message
  - Error code
  - Buttons : Go Home, Report Issue

#### 50. **Notifications System**
- **Global Toast notifications** (Top right):
  - Success (Green)
  - Error (Red)
  - Warning (Orange)
  - Info (Blue)
  - Auto-dismiss after 5s
- **Notification Bell** (Navbar):
  - Real-time updates via Socket.io
  - Unread count badge
  - Dropdown showing recent 5
  - Link to notification center
- **Notification Center** (For clients/commercial):
  - Full history
  - Mark as read/unread
  - Filters
  - Delete option

---

## 🔌 SOCKET.IO EVENTS

### **Real-time Features**

```javascript
// Client connects
socket.on('connect', () => { /* ... */ })

// Message notifications
socket.on('notification', (data) => {
  // Toast: data.message
})

// Negotiation updates
socket.on('negotiation:message', (data) => {
  // New message in chat
})

socket.on('negotiation:offer', (data) => {
  // New offer received
})

// Appointment confirmations
socket.on('appointment:confirmed', (data) => {
  // RDV confirmed
})

// Contract signed
socket.on('contract:signed', (data) => {
  // Contract signature notification
})
```

---

## 🎯 PRIORITIES POUR DÉVELOPPEMENT

### **Phase 1 (MVP)** - 2-3 semaines
- [ ] Auth (Login, Register, Basic)
- [ ] Public Browse Vehicles
- [ ] Vehicle Detail
- [ ] Client Dashboard
- [ ] Client Profile
- [ ] Appointment Booking
- [ ] Notifications

### **Phase 2** - 2-3 semaines
- [ ] MFA Setup/Verify
- [ ] Client Negotiations
- [ ] Contract Signing (E-signature)
- [ ] Commercial Dashboard
- [ ] Fleet Management (CRUD)
- [ ] Commercial Analytics

### **Phase 3** - 2-3 semaines
- [ ] Admin Panel
- [ ] Advanced Analytics
- [ ] Kiosk Management
- [ ] Real-time features (Socket.io)
- [ ] Report generation
- [ ] GDPR/Privacy features

### **Phase 4** - Optimisations & Polish
- [ ] Performance optimization
- [ ] Mobile responsive refinement
- [ ] Accessibility (A11y)
- [ ] i18n (Internationalization)
- [ ] Testing (Unit, Integration, E2E)

---

## 🔧 STACK RECOMMANDÉ

```json
{
  "frontend": {
    "framework": "React 18+",
    "state-management": "Redux Toolkit ou Zustand",
    "styling": "Tailwind CSS + Shadcn/ui",
    "forms": "React Hook Form + Zod",
    "HTTP": "Axios avec interceptors",
    "Real-time": "Socket.io-client",
    "Maps": "Leaflet ou MapBox",
    "Charts": "Chart.js ou Recharts",
    "E-signature": "SignaturePad ou Docusign API",
    "File upload": "Dropzone.js",
    "Testing": "Vitest + React Testing Library"
  }
}
```

---

## 📋 CHECKLIST AVANT LIVRAISON

- [ ] Toutes les routes protégées implémentées
- [ ] Authentification JWT complète
- [ ] Gestion des erreurs robuste
- [ ] Responsive design (Mobile, Tablet, Desktop)
- [ ] Accessibilité (WCAG 2.1 AA minimum)
- [ ] Performance (Lighthouse score > 80)
- [ ] SEO basique (Open Graph, Meta tags)
- [ ] Tests unitaires (>70% couverture)
- [ ] Documentation complète
- [ ] Deployment ready (CI/CD pipeline)

---

**Prêt à développer!** 🚀

