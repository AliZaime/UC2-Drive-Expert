# 🎨 Guide d'Intégration Frontend (Drive Expert)

Ce document est destiné aux développeurs React/Mobile. Il détaille les **Pages/Écrans** à créer et les **API endpoints** à connecter pour chaque fonctionnalité.

---

## 🛠️ Pré-requis Techniques

- **Base URL** : `http://localhost:4000/api/v1`
- **Authentification** :
  - Le token JWT reçu au login doit être stocké (LocalStorage / SecureStore).
  - Il doit être envoyé dans le Header de **chaque requête** (sauf `/auth/login`, `/auth/register`, `/public/*`).
  - Format : `Authorization: Bearer <votre_token>`
- **Websockets** :
  - URL : `http://localhost:4000`
  - Event à écouter : `'notification'` (pour les toasts/popups).

---

## 📱 1. Module Authentification

### A. Écran de Connexion (Login)

- **Inputs** : Email, Mot de passe.
- **API** : `POST /auth/login`
  - Body : `{ "email": "...", "password": "..." }`
- **Comportement** :
  - Si `200` : Stocker `token` et rediriger vers Dashboard.
  - Si `200` + `mfaRequired: true` : Rediriger vers l'écran **MFA Verify**.

### B. Écran Inscription (Register)

- **Inputs** : Nom, Email, Password, Confirm Password.
- **API** : `POST /auth/register`
  - Body : `{ "name": "...", "email": "...", "password": "...", "confirmPassword": "..." }`

### C. Écran MFA (Double Facteur)

- **Contexte** : Apparaît après Login si MFA activé, ou dans "Mon Profil" pour l'activer.
- **Affichage** :
  - Si activation : Afficher le QR Code reçu (`api/v1/auth/mfa/enable`).
  - Si connexion : Juste un champ "Code 6 chiffres".
- **API** : `POST /auth/mfa/verify`
  - Body : `{ "code": "123456", "token": "temp_token_from_login" }`

---

## 🚗 2. Espace Public / Guest

### A. Catalogue Véhicules (Browse)

- **Composants** : Grille de cartes véhicules, Filtres (Marque, Prix), Recherche Geo.
- **API Liste** : `GET /public/browse?price[lte]=20000&make=Renault`
- **API Module Geo** :
  1.  Demander la pos GPS du user.
  2.  Appeler `GET /public/agencies-within/50/center/48.85,2.35/unit/km`
  3.  Afficher : "Agences à proximité".

### B. Détail Véhicule (Product Page)

- **Affichage** : Carrousel photos (Cloudinary), Specs, Prix.
- **Call-to-Action** :
  1.  **"Essayer ce véhicule"** -> Ouvre Modal Prise de RDV.
  2.  **"Négocier / Faire une offre"** -> Créer Négociation.

---

## 👤 3. Espace Client (Dashboard)

_Prefix URL : `/api/v1/my`_

### A. Mon Profil & Privacy

- **Sections** : Infos persos + **Gestion Consentements GDPR**.
- **API Get** : `GET /my/profile` (Renvoie user + `consents`).
- **API Update Privacy** : `PUT /my/consents`
  - Body : `{ "marketingCommunication": true, "personalDataProcessing": true }`
  - _UX : Des switchs (ON/OFF)._

### B. Mes Négociations (Active Deals)

- **Affichage** : Liste des voitures en cours de négo. Statut (Pending, Accepted).
- **Détail** : Chatbox de discussion.
- **API** : `GET /my/negotiations`

### C. Mes Rendez-vous (Agenda)

- **Affichage** : Liste cards "Essai prévu le...".
- **Action** : "Réserver un créneau".
- **API Création** : `POST /my/appointments`
  - Body :
    ```json
    {
      "date": "2024-12-25T14:00:00.000Z",
      "agency": "ID_AGENCE_FOUND_IN_VEHICLE",
      "vehicle": "ID_VEHICLE",
      "type": "test_drive"
    }
    ```

### D. Mes Contrats (E-Signature)

- **Important** : C'est l'étape finale.
- **Affichage** : Liste des contrats "Prêts à signer".
- **Action** : Bouton "Signer le contrat".
- **API** : `POST /my/contracts/{id}/sign`
  - Pas de body requis (le backend capture l'IP et la date).
  - _UX : Afficher un confetti 🎊 au succès._

---

## 🏢 4. Espace Commercial / Admin (Backoffice)

_Prefix URL : `/api/v1`_

### A. Gestion de Flotte (Fleet Mgr)

- **Page** : Table CRUD Véhicules.
- **Ajout Photo** : Dropzone d'images.
- **API Upload** : `POST /commercial/vehicles/{id}/photos`
  - Format : `multipart/form-data`
  - Key : `photos` (accepte multiples fichiers).

### B. Impersonation (Admin Only)

- **Usage** : Pour le support client.
- **UI** : Bouton "Se connecter en tant que..." sur la liste users.
- **API** : `POST /admin/users/{id}/impersonate`
  - Response : Renvoie un nouveau `token`.
  - _Action Front : Remplacer le token actuel par celui-ci et rafraîchir._

---

## 🔔 5. Notifications (Global)

- **Composant** : Cloche dans la Navbar.
- **Logique** :
  1.  Au chargement : `GET /notifications` (Récupérer l'historique non-lu).
  2.  En temps réel : Écouter le socket `socket.on('notification', (data) => toast(data.message))`.
  3.  Au clic : `PUT /notifications/{id}/read` (Marquer comme lu).

---

**Bon code !** 🚀
