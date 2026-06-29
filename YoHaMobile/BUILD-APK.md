# Générer l'APK YoHa (voir le front sur téléphone)

## Méthode A — Sur ton PC (gratuit, ~15 min la 1ère fois)

### Prérequis
- Android Studio installé (SDK + Platform-Tools)
- Téléphone ou émulateur (optionnel pour l’install)

### Étapes

**1. Ouvre Android Studio une fois**  
→ SDK Manager → installe **Android SDK Platform 35** (ou 34) + **Build-Tools**

**2. Terminal — génère le projet Android :**
```powershell
cd C:\Users\zaoujal\Documents\yoha\YoHaMobile
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npx expo prebuild --platform android
```

**3. Compile l’APK :**
```powershell
cd android
.\gradlew assembleDebug
```

**4. Récupère l’APK :**
```
YoHaMobile\android\app\build\outputs\apk\debug\app-debug.apk
```

**5. Installe sur le téléphone :**
- Copie `app-debug.apk` sur le téléphone (USB, Google Drive, etc.)
- Ouvre le fichier → autorise « sources inconnues » si demandé
- Installe **YoHa**

---

## Méthode B — Une commande (script)

```powershell
cd C:\Users\zaoujal\Documents\yoha\YoHaMobile
npm run build:apk
```

L’APK sera dans `android\app\build\outputs\apk\debug\app-debug.apk`

---

## API (connexion login)

L’APK embarque l’URL dans `.env` au moment du build.

| Situation | `.env` avant build |
|-----------|-------------------|
| Téléphone même Wi‑Fi que le PC | `EXPO_PUBLIC_API_URL=http://192.168.0.231:8000/api/v1` |
| Câble USB + `adb reverse` | `EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1` |

Puis **rebuild** l’APK après changement de `.env`.

Django doit tourner :
```powershell
cd backend
python manage.py runserver 0.0.0.0:8000
```

---

## Méthode C — Cloud (EAS, sans Android Studio local)

```powershell
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Tu reçois un lien pour télécharger l’APK.

---

## Comptes démo

`client@yoha.ma` / `DemoClient2025!`
