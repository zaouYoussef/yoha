# Voir YouHa sur ton téléphone

## Pourquoi Expo Go disait « incompatible » ?

Le projet avait **`expo-dev-client`** activé → ça force une app custom, **pas Expo Go**.
C’est corrigé : tu peux utiliser **Expo Go** (SDK 56) ou installer un **APK**.

---

## Méthode 1 — Expo Go (la plus rapide, 2 min)

### Sur le téléphone
1. Installe **Expo Go** (Play Store) — version SDK 56
2. Même **Wi‑Fi** que le PC
3. Désactive le **VPN**

### Sur le PC

**Terminal 1 — Django :**
```powershell
cd C:\Users\zaoujal\Documents\yoha\backend
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 — Expo :**
```powershell
cd C:\Users\zaoujal\Documents\yoha\YoHaMobile
npm run start:go
```

4. Scanne le **QR code** **depuis l’app Expo Go** (onglet *Scan QR code*), pas l’app Appareil photo
5. Login : `client@yoha.ma` / `DemoClient2025!`

### Écran blanc après le scan ?

1. **Même Wi‑Fi** que le PC, **VPN désactivé**
2. Relance avec cache vidé : `npm run start:go`
3. Si toujours blanc → **mode tunnel** (contourne pare-feu / box) :
   ```powershell
   npm run start:tunnel
   ```
4. Ouvre le pare-feu Windows pour les ports **8081** (Metro) et **8000** (Django)
5. Vérifie que `.env` contient l’IP du PC : `EXPO_PUBLIC_API_URL=http://192.168.0.231:8000/api/v1`
   (remplace par ton IP — `ipconfig` → adresse IPv4 du Wi‑Fi)

---

## Méthode 2 — APK (app installée, sans Expo Go)

```powershell
cd C:\Users\zaoujal\Documents\yoha\YoHaMobile
npm run build:apk
```

APK généré :
```
android\app\build\outputs\apk\debug\app-debug.apk
```

Copie le fichier sur le téléphone → ouvre → installe **YouHa**.

---

## Méthode 3 — Câble USB (dev)

1. Débogage USB activé sur le téléphone
2. Branche en USB, accepte « Autoriser le débogage »
3. Vérifie : `adb devices` doit afficher ton téléphone
4. Lance :
```powershell
cd C:\Users\zaoujal\Documents\yoha\YoHaMobile
npm run device
```

---

## Versions du projet (OK)

| Outil | Version |
|-------|---------|
| Expo SDK | 56.0.9 |
| Expo CLI | 56.1.14 |
| React Native | 0.85.3 |
| expo-doctor | 21/21 OK |
