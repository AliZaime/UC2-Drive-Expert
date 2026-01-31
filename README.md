# 🚗 UC2: Autonomous Agentic Negotiation Platform

> **Revolutionizing Car Trade-in & Sales through Multi-Agent AI Orchestration**
> Built for the **Capgemini GenAI & Agentic AI Hackathon 2025** 🇲🇦

---

## 🌟 Executive Summary

**UC2 (Used Car 2.0)** is an enterprise-grade autonomous negotiation orchestrator designed to transform the friction-heavy automotive trade-in and sales process into a seamless, 24/7 AI-driven experience.

By leveraging **Multi-Agent Systems (MAS)**, **Emotional Intelligence**, and **Explainable AI (XAI)**, UC2 provides a transparent, empathetic, and highly efficient negotiation layer that protects dealer margins while maximizing customer trust.

### 🏆 Key Value Propositions

- **70% Reduction** in manual pre-sales qualification workload.
- **15% Projected Increase** in lead-to-sale conversion through instant responsiveness.
- **24/7 Operational Scale** without incremental headcount.
- **Trust-by-Design** via real-time price justification (XAI).

---

## 🏗️ Architecture & Stack Technologique

Le projet suit une architecture **MVC (Model-View-Controller)** stricte et modulaire.

- **Runtime** : Node.js (v18+)
- **Framework** : Express.js
- **Database** : MongoDB Atlas (Mongoose ODM)
- **Real-Time** : Socket.io (Websockets)
- **Storage** : Cloudinary (Images & PDFs)
- **Security** : JWT, Helmet, RateLimit, HPP, xss-clean
- **Documentation** : Swagger UI (`/api-docs`)

---

## 👥 Hiérarchie des Rôles & Permissions

Le système implémente **6 niveaux de rôles** avec des permissions granulaires :

```
┌─────────────────────────────────────────┐
│         SUPERADMIN (Système)            │
│  ✓ Tous les endpoints                   │
│  ✓ Backups & Restauration               │
│  ✓ Audit de sécurité                    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      ADMIN (Multi-Agences)              │
│  ✓ Gestion des agences                  │
│  ✓ Gestion des utilisateurs             │
│  ✓ Impersonation                        │
│  ✓ Métriques système                    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     MANAGER (Une Agence)                │
│  ✓ Gestion employés de son agence       │
│  ✓ Analytics agence                     │
│  ✓ Vue véhicules/clients agence         │
│  ✗ Pas d'accès autres agences           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   USER/COMMERCIAL (Employé Agence)      │
│  ✓ Gestion véhicules                    │
│  ✓ Négociations                         │
│  ✓ Gestion clients assignés             │
│  ✗ Limité à son périmètre               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          CLIENT (End-User)              │
│  ✓ Profil & préférences                │
│  ✓ Rendez-vous                          │
│  ✓ Négociations personnelles            │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         GUEST (Non-Authentifié)         │
│  ✓ Browse véhicules                     │
│  ✓ Géolocalisation agences              │
│  ✗ Pas d'actions sensibles              │
└─────────────────────────────────────────┘
```

**📖 Documentation complète** : Voir [MANAGER_API.md](./docs/MANAGER_API.md)

---

## 📦 Catalogue des Services

L'application est divisée en micro-modules logiques :

### 1. 🛡️ Authentification & Security Core

- **MFA (2FA)** : Protection via Google Authenticator.
- **Impersonation** : Support client via connexion "as user".
- **GDPR Compliance** : Gestion fine des consentements data.

### 2. 🚛 Commercial & Fleet Management

- **Smart Inventory** : CRUD avec upload Cloudinary.
- **AI-Managed Negotiations** : Interface de suivi des agents.
- **Real-Time KPIs** : Dashboard de pilotage agence.

### 3. 👤 Client Experience

- **Dynamic Appointments** : Prise de RDV simplifiée.
- **Geo-Search** : Recherche d'agences par rayon (GeoJSON).
- **Hybrid Notifications** : Système WebSocket + Persistence.

---

---

## 📽️ Démonstration Vidéo

> [!IMPORTANT]
> **[Regarder la vidéo de démonstration sur Google Drive](https://drive.google.com/file/d/10WszXMgOoAOt4T7f_KPnEjlyE4EoNEgI/view?usp=sharing)**

---

## 🧠 Architecture Agentique (Multi-Agent System)

UC2 n'est pas un simple chatbot, c'est un **système de 6 agents coordonnés** par un orchestrateur d'état (**LangGraph**) pour garantir une autonomie contrôlée et une expertise métier.

### ⛓️ L'Orchestrateur (The Brain)

Basé sur **LangGraph**, l'orchestrateur gère le flux de décision complexe :

1.  **Profilage** -> Analyse des besoins et psychographie du client.
2.  **Valuation** -> Évaluation dynamique de la reprise du véhicule.
3.  **Inventory Matching** -> Sélection intelligente dans le catalogue.
4.  **Deal Structuring** -> Création d'offres de financement optimisées.
5.  **Negotiation Loop** -> Dialogue interactif avec boucles de feedback.

### 🤖 Les 6 Agents Spécialisés

| Agent               | Rôle & Expertise                                        | Technologies                   |
| :------------------ | :------------------------------------------------------ | :----------------------------- |
| **Profilage**       | Détermine les besoins réels et le segment du client.    | LLM Analysis + Psychometrics   |
| **Valuation**       | Évaluation précise (XAI) basée sur l'état et le marché. | Market Pricing Service + XAI   |
| **Inventory**       | Match le stock réel avec les contraintes budgétaires.   | Vector Search / Filter Logic   |
| **Deal Agent**      | Structure le crédit, la LLD et les mensualités.         | Financial Amortization Logic   |
| **Negotiation**     | Le cerveau conversationnel (Darija, Émotion, Tactique). | Strategic Concession Engine    |
| **Ethics Guardian** | Protège contre les injections et garantit les marges.   | Prompt Shielding + Margin Caps |

---

## 🇲🇦 Innovation : Support Local & Darija

L'un des piliers de UC2 est sa capacité à comprendre et interagir naturellement avec le marché marocain :

- **Reasoning-Based Language Detection** : Détecte le pattern linguistique marocain (Darija, Arabizi) sans passer par une traduction lourde.
- **Empathie Contextuelle** : L'IA ajuste son ton si le client exprime des contraintes budgétaires liées à la famille ou au travail.

---

---

## 🤖 Intégration Agentique (Pour l'équipe Python/GROQ)

Ce backend est "Agent-Ready". Vos scripts Python peuvent interagir avec l'API pour automatiser la négociation.

### 🧠 Workflow de l'Agent

L'agent doit suivre le flux logique suivant pour mener une négociation à bien :

![Agent Flow Process](./docs/agent_flow.png)

1.  **Profilage** : Récupérer les données du client (`GET /api/v1/clients/:id`).
2.  **Trade-In (Reprise)** :
    - Si OUI : Lancer une valuation (`GET /vehicles/:id/valuation`).
    - Si NON : Passer au matching.
3.  **Match Inventory** : Chercher un véhicule dans le catalogue (`GET /public/browse`).
4.  **Structure Deal** : Créer une nouvelle négociation formelle (`POST /negotiations`).
5.  **Initialize Session** : Démarrer l'échange temps réel via WebSocket pour discuter.

### 🔌 Guide de Connexion (Python)

L'agent doit agir comme un **utilisateur privilégié** (Service Account).

**1. Authentification**
Récupérez un Token JWT Bearer.

```python
import requests

API_URL = "http://localhost:4000/api/v1"

# Login de l'Agent
payload = {
    "email": "ai-agent@drive-expert.com",
    "password": "SECURE_PASSWORD_123"
}
response = requests.post(f"{API_URL}/auth/login", json=payload)
token = response.json()['token']

print(f"🔑 Token Agent reçu : {token[:10]}...")
```

**2. Interaction avec le Backend**
Utilisez ce token dans le header `Authorization`.

```python
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Exemple : Trouver une voiture pour le client
params = {"price[lte]": 20000, "make": "Renault"}
cars = requests.get(f"{API_URL}/public/browse", headers=headers, params=params)

print(cars.json())
```

---

## 🚀 Installation & Démarrage

1.  **Prérequis** : Node.js, MongoDB (Local ou Atlas), Compte Cloudinary.
2.  **Installation** :
    ```bash
    npm install
    ```
3.  **Tests (Nouveau)** :
    Lancer la suite de tests unitaires et d'intégration (Jest) :
    ```bash
    npm test
    ```
4.  **Configuration** :
    Renommer `.env.example` en `.env` et remplir les clés (MONGO_URI, JWT_SECRET, CLOUDINARY...).
5.  **Lancement** :

    ```bash
    npm start
    ```

    _Serveur sur port 4000 par défaut._

6.  **Documentation API** :
    Rendez-vous sur `http://localhost:4000/api-docs` pour tester les endpoints.

---

**Drive Expert &copy; 2026 - Hackathon Edition**
