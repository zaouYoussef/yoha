# YoHa sur Android — sans Expo Go

Installe l’app **YoHa** directement sur ton téléphone. Plus besoin d’Expo Go.

## Ce qu’il te faut

1. **Android Studio** (une fois) — [developer.android.com/studio](https://developer.android.com/studio)
   - À l’installation, coche **Android SDK** et **Android SDK Platform**
2. Téléphone Android avec **Débogage USB** activé
3. Câble USB (données, pas charge seule)

### Activer le débogage USB

Paramètres → À propos du téléphone → tape 7× sur **Numéro de build**  
→ Options développeur → **Débogage USB** : ON

---

## Installation (première fois, ~10 min)

### Terminal 1 — Django
```powershell
cd C:\Users\zaoujal\Documents\yoha\backend
python manage.py runserver 127.0.0.1:8000
```

### Terminal 2 — Branche le téléphone en USB, puis :
```powershell
cd C:\Users\zaoujal\Documents\yoha\YoHaMobile
npm run device
```

Cette commande :
1. Redirige le port 8000 du PC vers le téléphone (`adb reverse`)
2. Compile et installe l’app **YoHa** sur le téléphone

À la fin tu vois l’icône **YoHa** sur ton téléphone — ouvre-la (pas Expo Go).

---

## Les fois suivantes (quotidien)

### Terminal 1 — Django
```powershell
cd backend
python manage.py runserver 127.0.0.1:8000
```

### Terminal 2 — Redirection USB + Metro
```powershell
cd YoHaMobile
npm run adb:reverse
npm start
```

Ouvre l’app **YoHa** déjà installée sur le téléphone.

---

## Comptes démo

| Rôle | E-mail | Mot de passe |
|------|--------|--------------|
| Client | client@yoha.ma | DemoClient2025! |
| Livreur | livreur@yoha.ma | DemoCourier2025! |
| Restaurant | resto@yoha.ma | DemoResto2025! |

---

## Dépannage

| Problème | Solution |
|----------|----------|
| `adb` introuvable | Ouvre Android Studio → SDK Manager → **Platform-Tools**. Ajoute au PATH : `%LOCALAPPDATA%\Android\Sdk\platform-tools` |
| Aucun appareil détecté | Autorise le débogage USB sur le téléphone (popup) |
| API ne répond pas | `npm run adb:reverse` puis relance l’app |
| Build échoue | Android Studio ouvert une fois, SDK 34+ installé |

---

## Émulateur (sans téléphone)

```powershell
# Lance un émulateur depuis Android Studio (AVD Manager)
cd YoHaMobile
npm run android
```

L’API utilise automatiquement `http://10.0.2.2:8000/api/v1`.
