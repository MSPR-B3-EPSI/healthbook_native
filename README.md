# Healthbook

Application mobile Healthbook + backend (Keycloak + API NestJS + Postgres + NGINX).

Stack mobile : Expo SDK 54 · React Native 0.81 · NativeWind · React Hook Form + Zod · expo-secure-store.

---

## 📋 Prérequis

- **Node.js 20.19+** et **npm 10+**
- **Docker Desktop** (Windows / macOS) ou **Docker Engine + Compose** (Linux)
- L'app **Expo Go** sur ton téléphone, ou un émulateur Android Studio / simulateur iOS
- Les deux repos clonés **côte à côte** :
  ```
  healthbook/
  ├── healthai-infra/      ← le backend (Keycloak + API + gateway)
  └── healthbook_native/   ← ce repo (le mobile)
  ```

---

## 🚀 Setup en 4 étapes

### Étape 1 — Trouve ton IP LAN

C'est l'IP de ton PC sur ton réseau Wi-Fi. Ton téléphone doit pouvoir l'atteindre.

**Windows (PowerShell)** :
```powershell
ipconfig
```
Cherche la ligne `Adresse IPv4` de ton interface **Wi-Fi** (ou Ethernet si tu es en filaire). Format typique : `192.168.x.x` ou `10.x.x.x`.

**Linux** :
```bash
ip a
```
Cherche `inet 192.168.x.x` (ou similaire) sur ton interface Wi-Fi.

**macOS** :
```bash
ipconfig getifaddr en0
```

Pour la suite, on suppose que ton IP est **`192.168.1.42`** (remplace par la tienne).

### Étape 2 — Mets ton IP dans les deux `.env`

> ⚠️ Les deux fichiers doivent contenir **la même IP**.

#### 2.1 Backend → `healthai-infra/.env`

```bash
cd healthai-infra
cp .env.example .env       # première fois uniquement
```

Ouvre `healthai-infra/.env` et change la ligne `KEYCLOAK_HOSTNAME` :

```diff
- KEYCLOAK_HOSTNAME=localhost
+ KEYCLOAK_HOSTNAME=192.168.1.42
```

#### 2.2 Mobile → `healthbook_native/.env.local`

```bash
cd ../healthbook_native
cp .env.example .env.local    # première fois uniquement
```

Ouvre `healthbook_native/.env.local` et mets la même IP :

```
EXPO_PUBLIC_GATEWAY_HOST=192.168.1.42
EXPO_PUBLIC_GATEWAY_PORT=8080
```

### Étape 3 — Démarre le backend

```bash
cd ../healthai-infra
```

**Linux / macOS / Git Bash** :
```bash
./scripts/up.sh core services data
```

**Windows PowerShell** (copie-colle tel quel, c'est la même commande que le script bash exécute) :
```powershell
docker compose --project-name healthai --env-file "$PWD\.env" `
  -f "$PWD\compose\compose.core.yaml" `
  -f "$PWD\compose\compose.services.yaml" `
  -f "$PWD\compose\compose.data.yaml" `
  --profile core --profile services --profile data up -d
```

Attends ~1 min que tout finisse de démarrer (Nest doit faire `npm install` + `prisma migrate` à la première fois).

Vérifie que ça répond :
```bash
curl http://localhost:8080/api/status
# → "Hello unconnected user..."
```

### Étape 4 — Lance le mobile

```bash
cd ../healthbook_native
npm install                  # première fois uniquement
npm start
```

Puis dans le terminal Metro :
| Cible              | Action                                   |
| ------------------ | ---------------------------------------- |
| Téléphone physique | Scan le QR code avec **Expo Go**. Téléphone + PC sur le **même Wi-Fi**. |
| Émulateur Android  | Appuie sur `a`                           |
| Simulateur iOS     | Appuie sur `i` (macOS only)              |

Connecte-toi avec un des 3 users seed (créés automatiquement par Keycloak) :

| Identifiant         | Mot de passe |
| ------------------- | ------------ |
| `user-freemium`     | `password`   |
| `user-premium`      | `password`   |
| `user-premium-plus` | `password`   |

Ou crée ton compte via le lien **« Créer un compte »** depuis l'écran de login.

---

## 🔄 Tu changes de réseau (bureau / maison / hotspot) ?

1. Récupère ta nouvelle IP LAN (cf. Étape 1)
2. Remplace l'IP dans **les deux fichiers** :
   - `healthai-infra/.env` → `KEYCLOAK_HOSTNAME`
   - `healthbook_native/.env.local` → `EXPO_PUBLIC_GATEWAY_HOST`
3. **Force-recreate Keycloak + l'API** (sinon ils continuent à utiliser l'ancienne IP) :

   **Linux / macOS / Git Bash** :
   ```bash
   cd healthai-infra
   docker compose --project-name healthai --env-file .env \
     -f compose/compose.core.yaml -f compose/compose.services.yaml -f compose/compose.data.yaml \
     --profile core --profile services --profile data \
     up -d --force-recreate keycloak healthbook-api
   ```

   **Windows PowerShell** :
   ```powershell
   cd healthai-infra
   docker compose --project-name healthai --env-file "$PWD\.env" `
     -f "$PWD\compose\compose.core.yaml" -f "$PWD\compose\compose.services.yaml" -f "$PWD\compose\compose.data.yaml" `
     --profile core --profile services --profile data `
     up -d --force-recreate keycloak healthbook-api
   ```

4. Côté mobile : **redémarre Metro complètement** (Ctrl+C puis `npm start`).

---

## 🧠 Pourquoi tout ce setup ?

Légitime question. En résumé :

- **Pourquoi mon IP LAN dans 2 fichiers ?** Le mobile et le backend tournent dans **2 runtimes différents** (Metro côté mobile, Docker Compose côté backend) qui lisent **2 fichiers d'env distincts**. Il n'y a pas de variable globale partagée.

- **Pourquoi Keycloak a besoin de mon IP LAN ?** Quand ton téléphone parle à Keycloak via `http://192.168.x.x:8080`, Keycloak doit générer ses **propres URLs** (page de login, redirects, claim `iss` du JWT) **avec cette même adresse**. Sinon ton téléphone tombe sur des liens `localhost` qu'il ne peut pas atteindre.

- **Pourquoi l'API doit aussi connaître cette IP ?** L'API valide le claim `iss` du JWT. Si Keycloak l'émet avec `192.168.x.x` mais que l'API attend `localhost`, le token est rejeté (401). Le `KEYCLOAK_ISSUER` de l'API est dérivé automatiquement de `KEYCLOAK_HOSTNAME` (vois `compose/compose.services.yaml`).

- **Pourquoi `--force-recreate` ?** Docker ne re-injecte pas les variables d'env sur un simple `restart`. Pour qu'un changement de `KEYCLOAK_HOSTNAME` prenne effet, il faut recréer les containers.

---

## 🛠 Scripts utiles

```bash
# Mobile
npm start          # Démarre Metro
npm run typecheck  # Vérifie les types
npm run lint       # Lint
npm run format     # Prettier

# Backend (depuis healthai-infra/, en bash)
./scripts/up.sh core services data        # Démarrer
./scripts/down.sh                         # Arrêter (garde les données)
./scripts/logs.sh healthbook-api          # Voir les logs (Ctrl+C pour quitter)
./scripts/reset.sh --yes                  # Reset complet (vire toutes les DB)
```

Sous Windows sans Git Bash, utilise les commandes `docker compose` directes
documentées dans les étapes 3 et « changement de réseau » ci-dessus.

---

## 🐛 Si ça ne marche pas

| Symptôme                                                | Solution                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| `[Keycloak] Erreur réseau` côté mobile                  | Téléphone + PC sur le même Wi-Fi ? IP correcte dans `.env.local` ? Métro redémarré complètement ? |
| URL `http://[object Object]:8080/...` dans les logs     | `.env.local` mal lu → Ctrl+C dans Metro puis `npm start` (pas juste `r`) |
| Après login, redirection vers `localhost/...` qui plante | Tu as changé `KEYCLOAK_HOSTNAME` mais pas force-recreate Keycloak (cf. section « Tu changes de réseau ») |
| `502 Bad Gateway` sur `/api/...`                        | Attends 30–60 s, l'API finit `npm install` + `prisma migrate`            |
| Port 8080 déjà utilisé (Apache, XAMPP)                  | Arrête le service squatteur, ou change `GATEWAY_PORT=8090` dans `.env`   |
| Le téléphone ne voit pas Metro                          | Même Wi-Fi, pas de VPN, pas de pare-feu agressif                         |
| Containers `tracking-api` / `data-recommendation-api` rouges | Tu n'as pas cloné ces repos. Sans impact, ignore-les.                 |

Pour les détails techniques de l'infra (compose files, profils, etc.), voir [../healthai-infra/README.md](../healthai-infra/README.md).
