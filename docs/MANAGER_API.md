# 🏢 API Manager - Documentation

## Vue d'ensemble

Le rôle **Manager** a été ajouté au système Auto-UC2 pour permettre la gestion d'une agence spécifique par un responsable d'agence. Le manager peut gérer les employés de son agence, visualiser les performances et les données sans avoir accès aux autres agences du système.

---

## 🔐 Hiérarchie des Rôles

```
SUPERADMIN
    ↓
  ADMIN (Multi-agences)
    ↓
 MANAGER (Une agence)
    ↓
  USER/COMMERCIAL (Employé)
    ↓
  CLIENT
    ↓
  GUEST
```

---

## 📋 Permissions du Manager

### ✅ **Autorisé**
- ✅ Voir le dashboard de son agence
- ✅ Créer/Modifier/Supprimer les employés (role: "user") de son agence
- ✅ Voir tous les véhicules de son agence
- ✅ Voir tous les clients de son agence
- ✅ Voir toutes les négociations de son agence
- ✅ Voir les analytics et statistiques de son agence
- ✅ Modifier les informations limitées de son agence (téléphone, email, config)

### ❌ **Interdit**
- ❌ Voir/Gérer d'autres agences
- ❌ Créer d'autres managers ou admins
- ❌ Modifier l'adresse ou le nom de l'agence
- ❌ Accéder aux métriques système (logs, health)
- ❌ Faire de l'impersonation
- ❌ Gérer les kiosks

---

## 🔌 Endpoints API

### Base URL
```
/api/v1/manager
```

### Authentification
Toutes les routes nécessitent :
- JWT Token dans le header `Authorization: Bearer <token>`
- Rôle : `manager`

---

## 📊 **Dashboard**

### GET `/manager/dashboard`
Récupère les statistiques de l'agence du manager.

**Response:**
```json
{
  "status": "success",
  "data": {
    "agencyId": "507f1f77bcf86cd799439011",
    "statistics": {
      "totalVehicles": 45,
      "availableVehicles": 32,
      "totalEmployees": 8,
      "activeNegotiations": 12,
      "totalClients": 156,
      "monthlyContracts": 7
    }
  }
}
```

---

## 🏢 **Gestion de l'Agence**

### GET `/manager/agency`
Récupère les informations de l'agence.

**Response:**
```json
{
  "status": "success",
  "data": {
    "agency": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Auto-UC2 Paris Nord",
      "address": {
        "street": "123 Rue de la République",
        "city": "Paris",
        "zip": "75001",
        "country": "France"
      },
      "location": {
        "type": "Point",
        "coordinates": [2.3522, 48.8566]
      },
      "phone": "+33123456789",
      "email": "paris@auto-uc2.com",
      "status": "active",
      "config": {
        "timezone": "Europe/Paris",
        "currency": "EUR"
      }
    }
  }
}
```

### PATCH `/manager/agency`
Modifie les informations limitées de l'agence.

**Request Body:**
```json
{
  "phone": "+33987654321",
  "email": "newemail@agency.com",
  "config": {
    "timezone": "Europe/Paris",
    "currency": "EUR"
  }
}
```

---

## 👥 **Gestion des Employés**

### GET `/manager/employees`
Liste tous les employés de l'agence.

**Response:**
```json
{
  "status": "success",
  "results": 8,
  "data": {
    "employees": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jean Dupont",
        "email": "jean.dupont@agency.com",
        "role": "user",
        "agency": "507f1f77bcf86cd799439011",
        "active": true,
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### POST `/manager/employees`
Crée un nouvel employé dans l'agence.

**Request Body:**
```json
{
  "name": "Marie Martin",
  "email": "marie.martin@agency.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "employee": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Marie Martin",
      "email": "marie.martin@agency.com",
      "role": "user",
      "agency": "507f1f77bcf86cd799439011",
      "active": true
    }
  }
}
```

### PATCH `/manager/employees/:id`
Modifie un employé de l'agence.

**Request Body:**
```json
{
  "name": "Jean Dupont-Martin",
  "email": "jean.dupont-martin@agency.com",
  "active": true
}
```

### DELETE `/manager/employees/:id`
Désactive un employé (soft delete).

**Response:** `204 No Content`

---

## 🚗 **Véhicules**

### GET `/manager/vehicles`
Liste tous les véhicules de l'agence.

**Response:**
```json
{
  "status": "success",
  "results": 45,
  "data": {
    "vehicles": [...]
  }
}
```

---

## 👥 **Clients**

### GET `/manager/clients`
Liste tous les clients de l'agence.

**Response:**
```json
{
  "status": "success",
  "results": 156,
  "data": {
    "clients": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "firstName": "Sophie",
        "lastName": "Bernard",
        "email": "sophie.bernard@email.com",
        "assignedAgent": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Jean Dupont",
          "email": "jean.dupont@agency.com"
        },
        "status": "Active"
      }
    ]
  }
}
```

---

## 💬 **Négociations**

### GET `/manager/negotiations`
Liste toutes les négociations de l'agence.

**Response:**
```json
{
  "status": "success",
  "results": 12,
  "data": {
    "negotiations": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "vehicle": {
          "make": "Renault",
          "model": "Clio",
          "year": 2023,
          "price": 18000
        },
        "client": {
          "firstName": "Sophie",
          "lastName": "Bernard",
          "email": "sophie.bernard@email.com"
        },
        "agent": {
          "name": "Jean Dupont",
          "email": "jean.dupont@agency.com"
        },
        "status": "discussion"
      }
    ]
  }
}
```

---

## 📊 **Analytics**

### GET `/manager/analytics`
Récupère les analytics de l'agence.

**Response:**
```json
{
  "status": "success",
  "data": {
    "salesData": [
      {
        "_id": { "year": 2026, "month": 1 },
        "totalSales": 12,
        "totalRevenue": 250000
      }
    ],
    "employeePerformance": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "agentName": "Jean Dupont",
        "totalSales": 5,
        "totalRevenue": 95000
      }
    ]
  }
}
```

---

## ⚠️ Codes d'Erreur

| Code | Message | Signification |
|------|---------|---------------|
| 400 | Manager is not assigned to any agency | Le manager n'a pas d'agence assignée dans son profil |
| 401 | You are not logged in | Token JWT manquant ou invalide |
| 403 | You do not have permission | L'utilisateur n'a pas le rôle "manager" |
| 404 | Employee not found in your agency | L'employé n'existe pas ou n'appartient pas à l'agence |
| 404 | Agency not found | L'agence n'existe pas en base de données |

---

## 🔧 Configuration Backend

### Modèle User
Le champ `agency` a été ajouté au modèle User :

```javascript
agency: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Agency'
}
```

### Rôles disponibles
```javascript
enum: ['superadmin', 'admin', 'manager', 'user', 'client', 'guest']
```

---

## 📝 Notes d'Implémentation

1. **Assignment automatique** : Lors de la création d'un employé par un manager, l'agence est automatiquement assignée (celle du manager).

2. **Sécurité** : Toutes les routes vérifient que l'utilisateur appartient bien à l'agence concernée avant toute opération.

3. **Limitations** : Les managers ne peuvent créer que des users (role: "user"), pas d'autres managers ou admins.

4. **Soft Delete** : La suppression d'employés est un soft delete (active: false), pas une suppression définitive.

---

## 🚀 Swagger Documentation

La documentation Swagger est disponible à : `http://localhost:4000/api-docs`

Tag Swagger : **Manager**

---

**Date de création** : 23 Janvier 2026  
**Version** : 1.0.0
