# YoHa Mobile — refonte « braise cinématique »

Refonte complète de l'app Expo : direction artistique, design system et écrans.
Le dossier reproduit l'arborescence de `YoHaMobile/`, fichier pour fichier.

## 1. Installer les polices

Trois familles, trois rôles. Aucune n'est déjà dans le projet :

```bash
npx expo install @expo-google-fonts/big-shoulders-display @expo-google-fonts/archivo @expo-google-fonts/dm-mono
```

| Famille | Rôle |
| --- | --- |
| Big Shoulders Display | titres condensés, capitales, interlignage serré |
| Archivo | texte courant, boutons, formulaires |
| DM Mono | prix, minutes, quantités — les colonnes s'alignent |

`@expo-google-fonts/inter` et `plus-jakarta-sans` ne sont plus chargées par
`app/_layout.tsx` ; tu peux les désinstaller une fois la migration finie.

## 2. Copier les fichiers

Depuis la racine de ton clone `yoha` :

```bash
cp -R chemin/vers/yoha-mobile/app/*       YoHaMobile/app/
cp -R chemin/vers/yoha-mobile/src/*       YoHaMobile/src/
```

Ce qui est **écrasé** :

- `src/theme/index.ts`, `src/theme/fonts.ts` — nouveaux tokens
- `src/components/ui/YohaTabBar.tsx` — barre d'onglets redessinée
- `app/_layout.tsx`, `app/(client)/_layout.tsx`
- tous les écrans `app/(client)/`, `app/(courier)/`, `app/(restaurant)/`,
  `app/landing.tsx`, `app/auth/login.tsx`, `app/auth/register.tsx`

Ce qui est **ajouté** : `src/components/yoha/` (Type, Motion, Atoms, Cards,
Sheet, Screen, EmberButton, StickyCartBar, Ops).

Rien d'autre n'est touché : `src/lib/api.ts`, les contextes, les hooks et le
backend Django restent identiques. Les nouveaux écrans consomment la même
surface d'API qu'avant.

## 3. Compatibilité

`src/theme/index.ts` réexporte tous les anciens noms (`brand`, `ink`, `accent`,
`gradients.primary`, `shadows.glow`…). Un écran non encore migré compile donc
sans modification — il héritera juste des nouvelles couleurs.

## 4. La direction artistique en une page

- **Fond charbon chaud** `#0a0806`, jamais du noir pur. La photo du plat est la
  seule source de lumière de l'écran.
- **Un seul accent**, la braise `#ff5a1f`. Un bouton plein par écran, pas deux :
  l'œil sait toujours où appuyer.
- **Braises flottantes** (`EmberField`) en fond de héros, `useNativeDriver`
  partout, aucune dépendance d'animation ajoutée.
- **Icônes en glyphes unicode** plutôt qu'une librairie : `react-native-svg`
  n'est pas installé et le trait fin colle au registre éditorial.

## 5. Les leviers de commande

Chaque écran a une raison de faire avancer la commande :

- accueil : un plat, un prix, un bouton — commander sans rien parcourir
- « livraison offerte · aucun compte requis » dès le premier écran
- dé « Crave Roulette » contre la paralysie du choix
- bandeau de re-commande, preuve sociale en direct, « N personnes regardent »
- barre panier collante qui rebondit à chaque ajout
- jauge de livraison offerte à 200 DH (fait monter le panier moyen)
- checkout sur un seul écran, adresse pré-remplie
- garantie « livré à HH:MM sinon remboursé »
- « Re-commander » proposé dès la fin du suivi

## 6. Écrans métier

- **Livreur** — `À prendre` (gain visible avant d'accepter), `Mes courses`
  (une seule action suivante par carte), `Historique` (gain du jour d'abord).
- **Restaurant** — `Commandes` (les livreurs au comptoir passent en premier,
  annulation motivée obligatoire), `Sept jours` (histogramme sans librairie,
  top plats), `Profil` (interrupteur maître de réception des commandes).
