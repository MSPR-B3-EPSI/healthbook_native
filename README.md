# Healthbook — App mobile

Application mobile du projet Healthbook (MSPR). Front **Expo / React Native** qui parle à un backend local (**Keycloak + API NestJS + Postgres**) exposé derrière une **gateway NGINX**.

**Stack mobile** : Expo SDK 54 · React Native 0.81 · expo-router 6 · NativeWind · React Hook Form + Zod · expo-secure-store.

---

## 🏗 Architecture (repos côte à côte)

Le mobile **ne fonctionne pas seul** : il a besoin du backend qui tourne en local. Les repos doivent être clonés **dans le même dossier parent** (le backend monte le code des API par chemin relatif `../../`) :

```
healthbook/
├── healthbook_native/   ← CE repo (le mobile)
├── healthai-infra/      ← REQUIS — Docker Compose (NGINX + Keycloak + Postgres)
├── healthbook-api/      ← REQUIS — API NestJS (montée dans un container par healthai-infra)
├── tracking-api/        ← optionnel (sinon son container reste rouge, sans impact)
└── data-recommendation-api/  ← optionnel (idem)
```

> Sans `healthbook-api` cloné à côté, le container de l'API démarre sur un dossier vide et plante. `tracking-api` / `data-recommendation-api` peuvent manquer, on les ignore.

---

## 📋 Prérequis

- **Node.js 20.19+** et **npm 10+**
- **Docker Desktop** (Windows / macOS) ou **Docker Engine + Compose** (Linux)
- L'app **Expo Go** sur ton téléphone, **ou** un émulateur Android Studio / simulateur iOS
- Téléphone et PC sur le **même réseau Wi-Fi**

---

## 🚀 Démarrage rapide

### 1. Cloner les repos côte à côte

```bash
mkdir healthbook && cd healthbook
git clone <url>/healthbook_native.git
git clone <url>/healthai-infra.git
git clone <url>/healthbook-api.git
```

### 2. Trouver ton IP LAN

C'est l'IP de ton PC sur le Wi-Fi, que ton téléphone doit pouvoir joindre.

| OS | Commande |
| --- | --- |
| **Windows** | `ipconfig` → ligne **Adresse IPv4** de l'interface **Wi-Fi** |
| **Linux** | `ip a` → `inet 192.168.x.x` sur l'interface Wi-Fi |
| **macOS** | `ipconfig getifaddr en0` |

> ⚠️ **Prends bien l'IP de ton Wi-Fi/Ethernet réel** (souvent `192.168.x.x` ou `10.x.x.x`).
> **PAS** les adaptateurs virtuels : VirtualBox (`192.168.56.x`), WSL (`172.x.x.x`) — injoignables depuis le téléphone.

Pour la suite, on suppose **`192.168.1.42`** (remplace par la tienne).

### 3. Configurer les deux fichiers d'env

> 🔑 Les deux fichiers doivent contenir **la même IP**.

**Backend → `healthai-infra/.env`**
```bash
cd healthai-infra && cp .env.example .env    # 1ère fois uniquement
```
Mets ton IP dans `KEYCLOAK_HOSTNAME` :
```diff
- KEYCLOAK_HOSTNAME=localhost
+ KEYCLOAK_HOSTNAME=192.168.1.42
```
> 💡 **Laisse `KEYCLOAK_ISSUER_EXTERNAL` vide/commenté.** L'issuer de l'API se dérive alors automatiquement de `KEYCLOAK_HOSTNAME` → tu n'as qu'**une** valeur à gérer. Si tu le renseignes en dur, il faudra le changer à chaque fois aussi (piège classique).

**Mobile → `healthbook_native/.env.local`**
```bash
cd ../healthbook_native && cp .env.example .env.local    # 1ère fois uniquement
```
```ini
EXPO_PUBLIC_GATEWAY_HOST=192.168.1.42
EXPO_PUBLIC_GATEWAY_PORT=8080
```
> `.env.local` est gitignoré : ton IP reste chez toi, jamais poussée.

### 4. Démarrer le backend

```bash
cd ../healthai-infra
```
**Linux / macOS / Git Bash :**
```bash
./scripts/up.sh core services data
```
**Windows PowerShell :**
```powershell
docker compose --project-name healthai --env-file "$PWD\.env" `
  -f "$PWD\compose\compose.core.yaml" -f "$PWD\compose\compose.services.yaml" -f "$PWD\compose\compose.data.yaml" `
  --profile core --profile services --profile data up -d
```
La 1ʳᵉ fois, l'API fait `npm install` + `prisma migrate` → **compte ~2-3 min** avant qu'elle réponde. Vérifie :
```bash
curl http://localhost:8080/api/status      # → "Hello unconnected user..."
```

### 5. Lancer le mobile

```bash
cd ../healthbook_native
npm install        # 1ère fois uniquement
npm start
```
Puis, dans le terminal Metro :

| Cible | Action |
| --- | --- |
| 📱 Téléphone | Scanne le QR code avec **Expo Go** (même Wi-Fi que le PC) |
| 🤖 Émulateur Android | Touche `a` |
| 🍏 Simulateur iOS | Touche `i` (macOS) |

### 6. Se connecter

3 comptes seed créés automatiquement par Keycloak :

| Identifiant | Mot de passe | Rôle |
| --- | --- | --- |
| `user-freemium` | `password` | freemium |
| `user-premium` | `password` | premium |
| `user-premium-plus` | `password` | premium-plus |

Ou bouton **« Créer un compte »** (ouvre Keycloak dans le navigateur du téléphone, puis reviens te connecter dans l'app).

---

## 🔄 Tu changes de réseau (maison / école / hotspot) ?

L'IP de ton PC change → il faut la réaligner partout, sinon `[Keycloak] Network request failed` côté mobile.

1. Récupère ta nouvelle IP LAN (étape 2).
2. Mets-la à jour dans :
   - `healthbook_native/.env.local` → `EXPO_PUBLIC_GATEWAY_HOST`
   - `healthai-infra/.env` → `KEYCLOAK_HOSTNAME` *(+ `KEYCLOAK_ISSUER_EXTERNAL` s'il est renseigné en dur — mieux : laisse-le vide)*
3. **Force-recreate** Keycloak + l'API (`docker start`/`restart` ne relit PAS le `.env`) :
   ```bash
   cd healthai-infra
   docker compose --project-name healthai --env-file .env \
     -f compose/compose.core.yaml -f compose/compose.services.yaml -f compose/compose.data.yaml \
     --profile core --profile services --profile data \
     up -d --force-recreate keycloak healthbook-api
   ```
   *(PowerShell : mêmes flags avec `"$PWD\..."` et backtick `` ` `` en fin de ligne.)*
4. **Redémarre NGINX** pour qu'il re-résolve les IP des containers recréés (sinon `502 Bad Gateway`) :
   ```bash
   docker restart healthai-nginx-1
   ```
5. Côté mobile : **redémarre Metro complètement** (`Ctrl+C` puis `npm start` — le reload `r` ne relit PAS les `EXPO_PUBLIC_*`).

---

## 🧠 Pourquoi ce setup ?

- **Pourquoi mon IP dans 2 fichiers ?** Mobile et backend sont 2 runtimes (Metro / Docker Compose) qui lisent 2 fichiers d'env distincts. Pas de variable partagée.
- **Pourquoi Keycloak a besoin de l'IP ?** Il génère ses propres URLs (login, redirects, claim `iss` du JWT) avec `KC_HOSTNAME`. Avec `localhost`, le téléphone tomberait sur des liens injoignables.
- **Pourquoi l'API aussi ?** Elle valide le claim `iss` du JWT contre son `KEYCLOAK_ISSUER`. Celui-ci vaut `KEYCLOAK_ISSUER_EXTERNAL` s'il est défini, **sinon** il est dérivé de `KEYCLOAK_HOSTNAME` (cf. `compose/compose.services.yaml`). D'où le conseil de laisser `KEYCLOAK_ISSUER_EXTERNAL` vide.
- **Pourquoi `--force-recreate` ?** Docker ne ré-injecte pas les variables d'env sur un simple `restart` : il faut recréer les containers.

---

## 📁 Structure du projet

```
app/                    Expo Router (file-based routing)
├── _layout.tsx         RouteGuard (redirige login/app selon l'auth)
├── (auth)/login.tsx
└── (app)/              Bottom Tabs (feed, create, account)
src/
├── components/         UI génériques (Button, Card, Screen, TextField…)
├── config/env.ts       Source unique des URLs (résout l'IP/port de la gateway)
├── features/<domain>/  Code par domaine : api.ts, schemas.ts (Zod), components/
│   ├── auth/           AuthProvider, keycloak.ts, storage.ts (SecureStore)
│   └── publications/   Feed + création de posts
└── lib/http.ts         apiFetch — tous les appels API (Bearer + refresh auto)
```

Conventions : alias `@/` → `src/`, styling via les tokens de `tailwind.config.js`, tous les appels réseau passent par `apiFetch` (jamais `fetch` direct).

---

## 🛠 Commandes utiles

```bash
# Mobile (depuis healthbook_native/)
npm start              # Démarre Metro
npm start -- --clear   # Idem, en vidant le cache Metro (si erreurs ENOENT fantômes)
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run format         # prettier --write

# Backend (depuis healthai-infra/, en bash)
./scripts/up.sh core services data    # Démarrer
./scripts/down.sh                     # Arrêter (garde les données)
./scripts/logs.sh healthbook-api      # Logs de l'API (Ctrl+C pour quitter)
./scripts/reset.sh --yes              # Reset complet (vide toutes les DB)
```

---

## 🐛 Dépannage

| Symptôme | Solution |
| --- | --- |
| `[Keycloak] Network request failed` (mobile) | Même Wi-Fi ? Bonne IP dans `.env.local` ? Metro redémarré (pas juste `r`) ? |
| `http://[object Object]:8080/...` dans les logs | `.env.local` mal lu → `Ctrl+C` dans Metro puis `npm start` |
| Après login, redirection vers `localhost` qui plante | `KEYCLOAK_HOSTNAME` changé mais pas de `--force-recreate` (voir « changement de réseau ») |
| `502 Bad Gateway` sur `/api/...` | L'API n'a pas fini de booter (~2-3 min : npm install + prisma + compil). Sinon `docker restart healthai-nginx-1`. |
| `500` sur `/api/publication` | Migrations pas appliquées → `docker exec healthai-healthbook-api-1 npx prisma migrate deploy` |
| Port 8080 déjà utilisé (Apache/XAMPP/EDB) | Arrête le service qui squatte le 8080, ou change `GATEWAY_PORT` dans `.env` (puis réaligne le mobile) |
| Le téléphone ne voit pas Metro | Même Wi-Fi, pas de VPN, pare-feu non bloquant |
| Containers `tracking-api` / `data-recommendation-api` rouges | Repos non clonés → sans impact, ignore |

---

## 📦 Build natif (optionnel — avancé)

Le dev quotidien se fait sur **Expo Go** (`npm start`). Un **dev build** natif n'est nécessaire que pour des modules non supportés par Expo Go :

```bash
npx expo run:android      # nécessite Android Studio ; build long (~5-10 min)
```
> La 1ʳᵉ compilation de `react-native-worklets` est lourde (RAM). Sur une machine limitée : ferme Docker/apps pendant le build, ou réduis la parallélisation Gradle (`org.gradle.parallel=false`).

---

Détails techniques de l'infra (compose, profils, realm Keycloak) : voir [`../healthai-infra/README.md`](../healthai-infra/README.md).
