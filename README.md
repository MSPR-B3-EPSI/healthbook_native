# Healthbook — App mobile (lancement en **dev build** `npx expo run:android`)

App Expo / React Native. Elle **ne fonctionne pas seule** : elle a besoin du backend local
(Keycloak + API NestJS + Postgres) exposé derrière une **gateway NGINX** sur le port **8080**.

> Ce guide couvre le lancement en **dev build natif** (`npx expo run:android`).
> Pour un test rapide sans build natif, voir la note « Expo Go » en bas.
>
> 📐 **Comment fonctionne l'app** (architecture, fichiers/dossiers, appels API, grandes fonctions) → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## ✅ TL;DR (machine déjà configurée)

```bash
# 0. Node 20+ actif  (sinon ça plante, voir Prérequis)
node --version                       # doit afficher v20+ / v22 / v24

# 1. Backend (depuis healthai-infra/ — sous Windows: dans un terminal Git Bash)
./scripts/up.sh core services data   # attendre ~2-3 min que l'API compile

# 2. Mobile (depuis healthbook_native/)
npm install
npx expo run:android
```

Si tu démarres pour la première fois ou que tu as **changé de réseau Wi-Fi**, ne saute PAS les étapes ci-dessous.

---

## 🧩 Prérequis (⚠️ les 3 premiers font **échouer le lancement** si absents)

| Prérequis | Détail / vérif |
| --- | --- |
| 🔴 **Node.js 20.19+** (LTS) | **Node 18 ne marche PAS** → erreur Metro `toReversed is not a function`. Vérifie `node --version`. Avec **nvm-windows** : `nvm install lts` puis `nvm use <version>` (ex. `nvm use 24.16.0`). Le choix nvm est persistant. |
| 🔴 **Android Studio + SDK Android** | Nécessaire pour compiler le natif. Un **appareil branché en USB** (débogage USB activé) **ou** un **émulateur lancé**. Vérifie : `adb devices` doit lister ton appareil. |
| 🔴 **Docker Desktop démarré** | Le backend tourne dedans. |
| **3 repos clonés côte à côte** | Voir l'arbo ci-dessous. |
| **JDK 17** | Fourni par Android Studio en général. |
| 🪟 **Git Bash** (Windows) | Indispensable pour lancer les scripts `./scripts/*.sh` du backend. Ces `.sh` **ne se double-cliquent pas** et **ne tournent pas dans PowerShell**. Fourni avec Git for Windows. |

**Arborescence obligatoire** (le backend monte le code des API par chemin relatif) :

```
healthbook/
├── healthbook_native/   ← CE repo (mobile)
├── healthai-infra/      ← REQUIS (Docker : NGINX + Keycloak + Postgres)
└── healthbook-api/      ← REQUIS (API NestJS, montée dans un container)
```

> ⚠️ **Branche du backend `healthbook-api`** : elle doit **compiler** ET contenir le **module publication**.
> La branche `main` du backend ne suffit pas encore (tsconfig cassé + pas de module publication).
> Utilise la branche qui a tout (ex. `fix-build`) tant que les MR ne sont pas mergées sur `main`.

---

## 🚀 Lancement pas à pas

### Étape 1 — Trouver ton IP LAN  (le piège n°1 du projet)

C'est l'IP de **ton PC sur le Wi-Fi**, que le téléphone doit pouvoir joindre.

| OS | Commande |
| --- | --- |
| **Windows** | `ipconfig` → **Adresse IPv4** de la carte **Wi-Fi** |
| **Linux** | `ip a` → `inet 192.168.x.x` sur l'interface Wi-Fi |
| **macOS** | `ipconfig getifaddr en0` |

> ⚠️ Prends **l'IP Wi-Fi / Ethernet réelle** (souvent `192.168.x.x`, `10.x.x.x` ou `172.20.x.x`).
> **JAMAIS** une carte virtuelle : VirtualBox `192.168.56.x`, WSL `172.22.x.x`, Docker — **injoignables depuis le téléphone**.

Pour la suite, exemple : **`192.168.1.42`** (remplace **partout** par la tienne).

### Étape 2 — Mettre ton IP dans **DEUX** fichiers  (ils doivent être identiques)

**a) Mobile → `healthbook_native/.env.local`**
```ini
EXPO_PUBLIC_GATEWAY_HOST=192.168.1.42
EXPO_PUBLIC_GATEWAY_PORT=8080
```

**b) Backend → `healthai-infra/.env`**
```ini
KEYCLOAK_HOSTNAME=192.168.1.42
# Mettre la même IP ici AUSSI, ou laisser vide pour qu'elle se déduise automatiquement :
KEYCLOAK_ISSUER_EXTERNAL=http://192.168.1.42:8080/auth/realms/healthai
```

> 💡 `.env.local` est **gitignoré** : ton IP ne sera jamais poussée.
> 💡 Si tu laisses `KEYCLOAK_ISSUER_EXTERNAL` **vide**, l'issuer se calcule tout seul depuis `KEYCLOAK_HOSTNAME` → une seule valeur à gérer côté backend.

### Étape 3 — Démarrer le backend

> 🪟 **Sous Windows : les scripts `./scripts/*.sh` se lancent dans un terminal Git Bash, PAS en PowerShell** (et on ne les double-clique pas).
> Ouvre **Git Bash** (fourni avec Git for Windows) : **clic droit dans le dossier `healthai-infra` → « Git Bash Here »**, ou lance Git Bash puis `cd /c/Users/.../healthai-infra`.
> Pas de bash ? Utilise la commande **PowerShell équivalente** juste en dessous.

**Linux / macOS / Windows (Git Bash) :**
```bash
cd healthai-infra
./scripts/up.sh core services data
```
**Windows PowerShell** (pas de script .ps1, commande directe) :
```powershell
docker compose --project-name healthai --env-file "$PWD\.env" `
  -f "$PWD\compose\compose.core.yaml" -f "$PWD\compose\compose.services.yaml" -f "$PWD\compose\compose.data.yaml" `
  --profile core --profile services --profile data up -d
```

⏳ La **1ʳᵉ fois (ou après un recreate)**, l'API fait `npm install` + `prisma migrate` + compilation → **attendre ~2-3 min**. Vérifie que ça répond :
```bash
curl http://localhost:8080/api/status        # → "Hello unconnected user..."
curl http://localhost:8080/api/publication    # → 200  []   (et PAS 500/502)
```

> 🔴 **Port 8080 déjà pris ?** Si NGINX refuse de démarrer (`bind: address already in use`), un **Apache/XAMPP/EDB** squatte le 8080.
> Windows : `Get-Process -Id (Get-NetTCPConnection -LocalPort 8080 -State Listen).OwningProcess` pour le repérer,
> puis arrête le service (ex. `Stop-Service PEMHTTPD-x64` en admin) **ou** change `GATEWAY_PORT` dans `.env` (et réaligne le mobile).

### Étape 4 — Lancer le dev build

```bash
cd healthbook_native
npm install            # 1ère fois
npx expo run:android
```

Ce que fait `run:android` : compile le natif Android (long la 1ʳᵉ fois, ~5-10 min) → installe l'APK sur l'appareil → démarre Metro → bundle le JS.

> 🟠 **Warnings inoffensifs** que tu PEUX ignorer : `CMake Warning ... object file directory has N characters` (longueur de chemin Windows), `Deprecated Gradle features`. Le build réussit quand même (`BUILD SUCCESSFUL`).
> 🔴 **Build qui plante sur « insufficient memory » / OOM** (machine à RAM limitée) : le build Gradle parallèle sature la RAM. Solutions : ferme Docker/apps lourdes **pendant** le build, **ou** dans `android/gradle.properties` mets `org.gradle.parallel=false`. La 1ʳᵉ compil réussie est ensuite mise en cache (builds suivants rapides).

### Étape 5 — Se connecter

Comptes seed créés automatiquement par Keycloak :

| Identifiant | Mot de passe |
| --- | --- |
| `user-freemium` | `password` |
| `user-premium` | `password` |
| `user-premium-plus` | `password` |

Bouton **« Créer un compte »** → ouvre Keycloak dans le navigateur du téléphone (doit pointer sur ton IP, cf. section réseau).

---

## 🔄 Tu changes de réseau (école / maison / hotspot) ?

L'IP de ton PC change → il faut **TOUT réaligner**, sinon : `[Keycloak] Network request failed`, ou register vers une vieille IP, ou tokens rejetés.

1. Récupère ta **nouvelle IP** (Étape 1).
2. Mets-la dans **les deux** fichiers (Étape 2) : `EXPO_PUBLIC_GATEWAY_HOST` **et** `KEYCLOAK_HOSTNAME` (+ `KEYCLOAK_ISSUER_EXTERNAL` s'il est renseigné).
3. **Force-recreate** Keycloak + l'API (un simple `docker restart` **ne relit PAS** le `.env`) :
   ```bash
   cd healthai-infra
   docker compose --project-name healthai --env-file .env \
     -f compose/compose.core.yaml -f compose/compose.services.yaml -f compose/compose.data.yaml \
     --profile core --profile services --profile data \
     up -d --force-recreate keycloak healthbook-api
   ```
   *(PowerShell : mêmes `-f` avec `"$PWD\..."` et backtick `` ` `` en fin de ligne.)*
4. **Redémarre NGINX** (sinon `502` : il garde l'ancienne IP des containers recréés) :
   ```bash
   docker restart healthai-nginx-1
   ```
5. **Redémarre Metro complètement** : `Ctrl+C` puis relance. Le reload `r` **ne relit pas** les `EXPO_PUBLIC_*`.
   *(Inutile de refaire `run:android` : relance juste `npx expo start` ou réutilise Metro.)*

---

## 🐛 Dépannage rapide

| Symptôme | Cause / solution |
| --- | --- |
| `Error: ... toReversed is not a function` (Metro) | **Node trop vieux** → passe en Node 20+ (`nvm use <v20+>`), rouvre le terminal. |
| `ERR_UNSUPPORTED_ESM_URL_SCHEME` au chargement de metro.config | Même cause : Node < 20. |
| Build natif : `insufficient memory` / OOM | RAM saturée → `org.gradle.parallel=false` dans `android/gradle.properties`, ferme Docker pendant le build. |
| `[Keycloak] Network request failed` (mobile) | Même Wi-Fi ? Bonne IP dans `.env.local` ? Metro relancé (pas juste `r`) ? |
| Register → « site inaccessible » avec une **ancienne IP** | Keycloak tourne encore avec l'ancien `KC_HOSTNAME` → **force-recreate Keycloak** (section réseau). Ce n'est PAS du cache. |
| `502 Bad Gateway` sur `/api/...` | L'API n'écoute pas encore (boot ~2-3 min) **ou** NGINX pointe vers l'ancienne IP → `docker restart healthai-nginx-1`. |
| `500` sur `/api/publication` | Table `post` absente → `docker exec healthai-healthbook-api-1 npx prisma migrate deploy`. |
| L'API ne prend pas une modif de code backend | Le `--watch` **ne voit pas** les changements à travers le bind mount Windows → `docker restart healthai-healthbook-api-1`. |
| `adb devices` vide | Active le **débogage USB** sur le tél, accepte la clé RSA, ou lance un émulateur. |
| Containers `tracking-api` / `data-recommendation-api` rouges | Repos optionnels non clonés → sans impact, ignore. |

---

## 📱 Alternative rapide : Expo Go (sans build natif)

Pour itérer vite sans Android Studio :
```bash
npm install
npm start            # puis scanne le QR code avec l'app Expo Go
```
> Limite : ne supporte que les modules Expo standard. Pour un module natif custom, repasse en `npx expo run:android`.

---

Détails infra (compose, profils, realm Keycloak) : voir [`../healthai-infra/README.md`](../healthai-infra/README.md).
