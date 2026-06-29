# YoHa Mobile (Expo)

Application **Android & iOS** pour YoHa — client, livreur et restaurant (pas d’admin).

## Prérequis

- Node.js 20+
- [Expo Go](https://expo.dev/go) sur votre téléphone (Android ou iOS)
- Backend Django qui tourne et accessible en **Wi‑Fi local**
- PC et téléphone sur le **même réseau**

## 1. Backend (obligatoire pour mobile)

```powershell
cd backend
# Dans .env, ajoutez votre IP LAN :
# DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,192.168.x.x
python manage.py runserver 0.0.0.0:8000
```

> Les apps natives n’utilisent pas le proxy Next.js : l’URL doit pointer **directement** vers Django.

## 2. Configurer l’API

```powershell
cd YoHaMobile
copy .env.example .env
```

Éditez `.env` :

```
EXPO_PUBLIC_API_URL=http://VOTRE_IP:8000/api/v1
```

Trouver votre IP Windows : `ipconfig` → **Adresse IPv4**.

## 3. Lancer avec Expo Go

```powershell
cd YoHaMobile
npm install
npx expo start
```

- Scannez le **QR code** avec Expo Go (Android) ou l’app Appareil photo / Expo Go (iOS).
- Si le QR ne marche pas, tapez l’URL manuellement dans Expo Go.

## Comptes démo

| Rôle        | E-mail           | Mot de passe        |
|-------------|------------------|---------------------|
| Client      | client@yoha.ma   | DemoClient2025!     |
| Livreur     | livreur@yoha.ma  | DemoCourier2025!    |
| Restaurant  | resto@yoha.ma    | DemoResto2025!      |

(`python manage.py seed_yoha` si la base est vide.)

## Fonctionnalités

### Client
- Parcourir les restaurants, menu, panier, checkout
- Suivi de commande en temps réel
- Historique des commandes

### Livreur
- Courses disponibles (claim)
- Mes courses (récupération → livraison)
- Historique + gains estimés (16 MAD/course)

### Restaurant
- Commandes entrantes (accepter, préparer, annuler)
- Consultation du menu
- Statistiques CA
- Profil (WhatsApp)

## Dépannage

| Problème | Solution |
|----------|----------|
| « Impossible de joindre l'API » | Vérifiez IP, `runserver 0.0.0.0:8000`, pare-feu Windows |
| Invalid HTTP_HOST | Ajoutez votre IP dans `DJANGO_ALLOWED_HOSTS` |
| Images cassées | Normal si `MEDIA_PUBLIC_BASE_URL` vide — utilisez l’IP Django pour `/media/` |

## Structure

```
YoHaMobile/
  app/           # écrans Expo Router
  src/           # API, thème, contextes, composants
  .env           # EXPO_PUBLIC_API_URL (local, ne pas committer)
```
