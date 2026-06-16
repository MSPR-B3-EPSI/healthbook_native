# Architecture & doc technique — App mobile HealthBook

Documentation **technique** de l'app mobile : structure des fichiers/dossiers, navigation, appels backend et grandes fonctions utiles.

> 🚀 **Pour lancer l'app** (prérequis, config réseau, dépannage), voir le [`README.md`](../README.md) à la racine. Ce document décrit **comment le code est organisé**, pas comment démarrer l'environnement.

---

## 1. Vue d'ensemble

App **Expo / React Native** (expo-router) structurée en **deux univers** qui partagent **le même compte Keycloak** (SSO) :

| Univers | Rôle | Backend | Préfixe gateway |
| --- | --- | --- | --- |
| **HealthBook** | Réseau social santé (posts, likes, commentaires) | NestJS `healthbook-api` | `/api` |
| **HealthAI** | Coach IA (programme, nutrition, vision repas, stats) | `healthai-brain-api` (Nest + FastAPI/ML) | `/brain` |

Le mobile **ne fonctionne pas seul** : il a besoin du backend local exposé derrière une **gateway NGINX** (port `8080`) qui route `/api`, `/brain` et `/auth` (Keycloak) vers les bons services. Un seul JWT Keycloak est valable pour les deux univers (audiences multiples).

```
healthbook/
├── healthbook_native/   ← CE repo (mobile, Expo)
├── healthbook-api/      ← API NestJS (réseau social, /api)
├── healthai-brain-api/  ← API coach IA (/brain)
└── healthai-infra/      ← Docker Compose (NGINX + Keycloak + Postgres)
```

**Parcours utilisateur** : `login → hub (choix d'univers) → HealthBook` **ou** `HealthAI`.

---

## 2. Stack technique

| Domaine | Techno | Version |
| --- | --- | --- |
| Framework | Expo SDK | `~54` |
| Runtime | React Native / React | `0.81` / `19.1` |
| Routing | expo-router (file-based) | `~6` |
| Styling | NativeWind (Tailwind RN) | `4` |
| Formulaires | react-hook-form + Zod | `7` / `4` |
| Validation | `@hookform/resolvers` (zodResolver) | `5` |
| Stockage sécurisé | expo-secure-store | `~15` |
| Médias | expo-image, expo-image-picker | `~3` / `~17` |
| Animations | react-native-reanimated / worklets | `~4.1` / `0.5.1` |
| Icônes | `@expo/vector-icons` (Ionicons) | `^15` |

Config app : `scheme: healthbook`, **New Architecture activée**, plugins `expo-router` / `expo-secure-store` / `expo-font` (voir `app.json`).

Scripts utiles (`package.json`) :

```bash
npm start            # Metro (Expo Go)
npm run android      # dev build natif (expo run:android)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
npm run format       # prettier --write .
```

---

## 3. Arborescence générale

Deux racines de code : **`app/`** (le routing, un fichier = une route) et **`src/`** (toute la logique réutilisable). Alias d'import **`@/` → `src/`** (`tsconfig.json`) : on écrit `import { apiFetch } from '@/lib/http'`.

```
app/                     Routing expo-router (écrans + layouts)
├── _layout.tsx          Stack racine + RouteGuard (auth) + AuthProvider
├── index.tsx            Splash / loader
├── (auth)/login.tsx     Connexion
├── (hub)/index.tsx      Sélecteur d'univers
├── (social)/            Univers HealthBook (Tabs)
└── (coach)/             Univers HealthAI (Stack + CoachProvider)

src/
├── components/          UI générique (ui/ + layout/) + UniverseErrorBoundary
├── config/env.ts        Source unique des URLs (gateway, Keycloak)
├── features/            Code métier par domaine
│   ├── auth/            AuthProvider, keycloak, storage, schemas
│   ├── publications/    Réseau social (posts, likes, commentaires)
│   └── coach/           Coach IA (api, profil, métriques, onboarding)
└── lib/                 http.ts (apiFetch), relativeTime.ts, shadows.ts
```

---

## 4. Navigation & routing (`app/`)

### Garde d'authentification

`app/_layout.tsx` monte le `RootLayout` : il enveloppe l'app dans `<AuthProvider>` + `<UniverseErrorBoundary>` et exécute un **`RouteGuard`** qui redirige selon `useAuth().status` et le groupe de route courant (`useSegments()`) :

| État | Comportement |
| --- | --- |
| `loading` | Spinner (lecture de la session en cours) |
| `authenticated` sur `/` ou `(auth)` | → `router.replace('/(hub)')` |
| `unauthenticated` hors `(auth)` | → `router.replace('/(auth)/login')` |

### Groupes de routes

| Groupe | Navigateur | Écrans |
| --- | --- | --- |
| `(auth)` | — | `login.tsx` — connexion Keycloak, lien « Créer un compte » (navigateur) |
| `(hub)` | — | `index.tsx` — 2 cartes d'univers + bouton déconnexion |
| `(social)` | **Tabs** | `index` (Fil), `create` (Publier), `account` (Compte), `post/[id]` (détail, masqué de la barre) |
| `(coach)` | **Stack** (+ `CoachProvider`) | `index` (gate), `home/*` (tabs), `onboarding/*` (4 étapes) |

### Détail univers Coach

- `(coach)/index.tsx` = **gate** : si un profil existe → `/home`, sinon → `/onboarding`.
- `(coach)/home/_layout.tsx` = **Tabs** : `index` (Séance), `nutrition`, `stats`, `exercises`, `profile` + routes modales masquées `session` et `exercise/[id]`.
- `(coach)/onboarding/` = assistant 4 étapes : `index` (identité) → `objective` → `equipment` → `level`.

### Table des écrans

| Fichier | Rôle |
| --- | --- |
| `app/index.tsx` | Loader d'amorçage |
| `app/(auth)/login.tsx` | Formulaire connexion (identifiant + mot de passe) |
| `app/(hub)/index.tsx` | Choix d'univers HealthBook / HealthAI |
| `app/(social)/index.tsx` | Fil de posts (FlatList, pull-to-refresh, re-fetch au focus) |
| `app/(social)/create.tsx` | Création de post (titre, contenu, image) |
| `app/(social)/account.tsx` | Profil + mes posts + retour au hub |
| `app/(social)/post/[id].tsx` | Détail post + commentaires + like/suppression |
| `app/(coach)/home/index.tsx` | Séance du jour (carte héro, liste d'exos, démarrer) |
| `app/(coach)/home/nutrition.tsx` | Scan repas (vision IA) + cibles caloriques + conseil diète |
| `app/(coach)/home/stats.tsx` | Jauge IMC, % masse grasse, mesures |
| `app/(coach)/home/exercises.tsx` | Bibliothèque d'exercices (recherche + filtre muscle) |
| `app/(coach)/home/session.tsx` | Suivi de séance (chrono + cases à cocher) |
| `app/(coach)/home/profile.tsx` | Réglages, réinitialiser profil, changer d'univers, logout |
| `app/(coach)/home/exercise/[id].tsx` | Détail exercice (image, séries/reps, muscles) |
| `app/(coach)/onboarding/*` | Identité → Objectif → Matériel → Niveau |

---

## 5. Organisation du code (`src/`)

### `src/components/` — UI générique

| Catégorie | Composants |
| --- | --- |
| `ui/` | `Button`, `Card`, `TextField`, `EmptyState`, `Avatar`, `IconButton`, `Skeleton`, `SkeletonPostCard`, `StatPill` |
| `layout/` | `Screen` (wrapper safe-area, scroll optionnel), `ScreenHeader` (titre + sous-titre) |
| racine | `UniverseErrorBoundary` (isole les crashs par univers) |

### `src/features/<domaine>/` — code métier

Chaque domaine regroupe `api.ts`, `schemas.ts` (Zod), `types.ts` et ses `components/`. Les domaines : **`auth`**, **`publications`**, **`coach`** (détaillés §7, §9, §10).

### `src/lib/` — utilitaires partagés

| Fichier | Rôle |
| --- | --- |
| `http.ts` | `apiFetch<T>` — client HTTP unique (Bearer auto, refresh dédupliqué) |
| `relativeTime.ts` | `formatRelativeTime(iso)` — « à l'instant », « il y a 2 h », « hier »… |
| `shadows.ts` | constantes `cardShadow`, `floatingShadow` |

> 🔑 **Règles d'or**
> - **Tous les appels backend passent par `apiFetch`** (`src/lib/http.ts`) — jamais `fetch` direct (sauf dans `keycloak.ts`, qui parle à Keycloak en `x-www-form-urlencoded`).
> - Composant **générique** → `src/components/` ; composant **spécifique à un domaine** → `src/features/<domaine>/components/`.

---

## 6. Configuration & environnement (`src/config/env.ts`)

`env.ts` est la **source unique** des URLs. Host et port sont résolus dans cet ordre (le premier non vide gagne) :

```
EXPO_PUBLIC_GATEWAY_HOST  (Metro, .env.local)
  → app.json › extra.gatewayHost
  → défaut plateforme : Android '10.0.2.2' (pont émulateur) · iOS/web 'localhost'
```

Même logique pour `EXPO_PUBLIC_GATEWAY_PORT` (défaut `8080`). Les helpers `asNonEmptyString` / `asPositiveNumber` filtrent les valeurs invalides (évite le bug historique `http://[object Object]:8080`).

À partir de `baseUrl = http://{host}:{port}`, l'objet `env` expose :

| Clé | Valeur | Usage |
| --- | --- | --- |
| `env.apiBaseUrl` | `{base}/api` | Réseau social (défaut d'`apiFetch`) |
| `env.coachBaseUrl` | `{base}/brain` | Coach IA (à passer en option `baseUrl`) |
| `env.keycloakBaseUrl` | `{base}/auth` | Keycloak |
| `env.keycloakRealm` | `healthai` | Realm |
| `env.keycloakClientId` | `mobile-app` | Client public |

URLs Keycloak dérivées (exportées) : `keycloakTokenUrl`, `keycloakLogoutUrl`, `keycloakRegisterUrl` (cette dernière avec `kc_action=register` et `redirect_uri=healthbook://login`).

> ⚠️ Modifier `.env.local` impose de **redémarrer Metro complètement** (le reload `r` ne relit pas les `EXPO_PUBLIC_*`). Voir la checklist réseau du [`README.md`](../README.md).

---

## 7. Authentification (`src/features/auth/`)

### Hook `useAuth()`

Exposé par `AuthProvider.tsx`, c'est le point d'entrée auth de toute l'app :

```ts
const { status, user, login, logout } = useAuth();
// status : 'loading' | 'authenticated' | 'unauthenticated'
// user   : { sub, email?, username?, roles[] } | null   (décodé du JWT)
// login(username, password) / logout()
```

Au montage, l'`AuthProvider` lit la session stockée ; si l'access token est expiré il tente un **refresh**, sinon il déconnecte. `user` est obtenu par `decodeJwt(accessToken)` (claims `sub`, `email`, `preferred_username`, `realm_access.roles`).

### `keycloak.ts` — flux OAuth2

Communique directement avec Keycloak (`POST` form-urlencoded). Le **login** est un *password grant* (client public + Direct Access Grants) ; pas de WebView ni PKCE.

| Fonction | Requête | Notes |
| --- | --- | --- |
| `loginWithPassword(username, password)` | `grant_type=password`, `client_id`, `username`, `password`, `scope=openid` → `keycloakTokenUrl` | `401`/`invalid_grant` → `AuthError('Identifiants invalides', 'invalid_credentials')` |
| `refreshSession(refreshToken)` | `grant_type=refresh_token`, `client_id`, `refresh_token` | Échec → `AuthError('Session expirée', …)` |
| `logoutSession(refreshToken)` | `client_id`, `refresh_token` → `keycloakLogoutUrl` | **Best-effort** (erreurs avalées) |

Détails : `toSession()` calcule `expiresAt = Date.now() + (expires_in − 10s)` (marge de sécurité). Logs `[Keycloak]` sous `__DEV__`, **password et refresh_token masqués `***`**.

**Inscription** : pas d'API. Le bouton « Créer un compte » ouvre `keycloakRegisterUrl` dans le navigateur du téléphone (`Linking`), l'utilisateur s'inscrit côté Keycloak, puis revient se connecter normalement.

### `storage.ts` — persistance des tokens

`expo-secure-store` (Keychain iOS / Keystore Android), clé **`healthbook.auth.session`**. Type `StoredSession = { accessToken, refreshToken, expiresAt }`. Fonctions `saveSession` / `loadSession` / `clearSession`.

---

## 8. Couche HTTP (`src/lib/http.ts`)

`apiFetch` est le **client unique** pour `/api` et `/brain`. Il gère l'auth, le refresh et les erreurs.

```ts
apiFetch<T>(path, {
  auth?:    boolean        // défaut true → injecte Authorization: Bearer
  baseUrl?: string         // défaut env.apiBaseUrl ; passer env.coachBaseUrl pour /brain
  body?:    unknown        // objet JS (sérialisé JSON) ou FormData (multipart)
  method?, headers?, ...   // reste de RequestInit
}): Promise<T>
```

Comportement clé :

- **Auth** : si `auth` (défaut), appelle `ensureFreshSession()` **avant** la requête → rafraîchit le token si expiré, puis ajoute `Authorization: Bearer …`.
- **Refresh dédupliqué** : une seule promesse `refreshInFlight` en vol — évite les *stampedes* quand plusieurs requêtes partent en parallèle avec un token expiré.
- **Body** : objet → `Content-Type: application/json` + `JSON.stringify` ; `FormData` → laissé tel quel (multipart, ex. upload photo repas).
- **Réponses** : `204` → `undefined` ; `application/json` → parsé ; sinon texte brut.
- **Erreurs** : tout statut non-2xx lève **`HttpError(message, status, body)`** (le `body` parsé est conservé — utile pour distinguer un `404` côté coach).
- **Logs** `[API]` sous `__DEV__` (méthode, URL, authentifié, statut).

> 💡 Les `path` passés sont **relatifs au préfixe** : `apiFetch('/post')` vise `{base}/api/post`, et `apiFetch('/status', { baseUrl: env.coachBaseUrl })` vise `{base}/brain/status`.

---

## 9. Appels backend (inventaire)

### Keycloak — `/auth`

| Action | Méthode | URL |
| --- | --- | --- |
| Login / Refresh | `POST` | `{auth}/realms/healthai/protocol/openid-connect/token` |
| Logout | `POST` | `…/openid-connect/logout` |
| Register (navigateur) | redirect | `…/openid-connect/auth?…&kc_action=register` |

### HealthBook social — `/api` (`src/features/publications/api.ts`)

| Fonction | Méthode + path | Description |
| --- | --- | --- |
| `listPosts()` | `GET /post` | Renvoie `data: Post[]` (extrait de `PostListResponse`) |
| `listPostsByAuthor(authorId, limit=50)` | `GET /post?authorId=…&limit=…` | Posts d'un auteur |
| `getPost(id)` | `GET /post/:id` | Un post |
| `createPost(input)` | `POST /post` | Crée `{ title, content, mediaUrl? }` |
| `deletePost(postId)` | `DELETE /post/:id` | Supprime |
| `toggleLike(postId)` | `POST /post/like/:id` | → `{ liked, likesCount }` |
| `listComments(postId)` | *(stub)* | Backend **501** → renvoie `[]` (TODO) |
| `createComment(input)` | *(stub)* | Lève `Error('LOCAL_ONLY')` (TODO) |

Type renvoyé :

```ts
type Post = {
  id: string; title: string; content: string;
  mediaUrl: string | null; authorId: string;
  createdAt: string; updatedAt: string;
  likesCount: number; commentsCount: number;
};
```

### HealthAI coach — `/brain` (`src/features/coach/api.ts`)

Toutes ces fonctions passent `baseUrl: env.coachBaseUrl`.

| Fonction | Méthode + path | Description |
| --- | --- | --- |
| `getCoachStatus()` | `GET /status` | Ping de disponibilité (valide le câblage `/brain`) |
| `generateWeeklyProgram(body)` | `POST /exercise-recommendation/weekly-program` | Génère + persiste le programme 7 jours (Nest → FastAPI/ML), renvoie un `programId` |
| `getLatestProgram()` | `GET /exercise-recommendation/weekly-program/latest` | Dernier programme persisté (**404** si aucun) |
| `predictWorkoutCalories(body)` | `POST /recommendation/workout` | Calories brûlées estimées (RandomForest) |
| `getExercises(params?)` | `GET /exercise-recommendation/exercises` | Catalogue d'exercices (bibliothèque, ~873) — filtre ClickHouse, lecture seule, aucun ML |
| `searchFoods(query)` | `GET /nutrition/foods?search=` | Recherche d'aliments → calories + macros (`daily_food.food_item`) |
| `analyzeMeal(photo)` | `POST /vision/analyze` (multipart, champ `image`) | Reconnaissance d'aliments (modèle HF `nateraw/food`) → `predictions[]` |

> Le SSO Keycloak est mutualisé : `apiFetch` injecte le **même Bearer** que pour `/api` ; seul le préfixe de path change. NGINX route `/api`, `/brain` et `/auth` vers les bons conteneurs et strip le préfixe avant de forwarder.

---

## 10. Les features en détail

### `publications/` (réseau social)

- `api.ts` — voir §9.
- `schemas.ts` — `createPostSchema` (Zod) : `title` 1–120, `content` 1–2000, `mediaUrl` URL ou vide.
- `usePostLikes.ts` — état optimiste des likes.
- `components/` — `PostCard`, `PostActionBar`, `LikeButton`, `CommentComposer`, `CommentItem`.

### `coach/` (coach IA)

Univers piloté par un **contexte React** monté dans `(coach)/_layout.tsx`.

**`CoachProvider.tsx` → `useCoach()`** expose :

```ts
{
  status,            // 'loading' | 'ready'  (lecture SecureStore = gate d'entrée)
  profile,           // CoachProfile | null
  draft, updateDraft,        // brouillon partagé entre les 4 étapes d'onboarding
  completeOnboarding,        // persiste le profil + invalide l'ancien programme
  resetProfile,
  program, generating, programError,
  ensureProgram,     // restaure (GET latest) ou génère si 404
  generateProgram,   // force une nouvelle génération
  catalog, ensureCatalog,    // bibliothèque d'exercices (chargée une fois)
}
```

Logique programme : `ensureProgram()` tente `getLatestProgram()` et, sur `HttpError 404`, bascule sur `generateWeeklyProgram(...)`. Un `staleRef` force la régénération après modification du profil.

**`profile.ts`** — profil onboarding + mappings UI → API :

- Type `CoachProfile = { firstName, age, weightKg, heightCm, gender, objective, equipment[], level }`, persisté en SecureStore (clé **`healthbook.coach.profile`**) via `saveCoachProfile` / `loadCoachProfile` / `clearCoachProfile`.
- `toWeeklyProgramRequest(profile)` construit le corps de la requête weekly-program.
- Mappings **objectif** (4 UI → 3 moteur) et **matériel** (tuiles → catalogue d'exercices) :

  | Objectif UI | → API | | Matériel UI | → catalogue |
  | --- | --- | --- | --- | --- |
  | `prise_muscle` | `prise_muscle` | | `none` | `[]` |
  | `perte_gras` | `perte_poids` | | `dumbbells` | `dumbbell, kettlebells` |
  | `gain_force` | `prise_muscle` | | `barbell` | `barbell, e-z curl bar` |
  | `bien_etre` | `reprise` | | `bands` | `bands` |
  | | | | `full_gym` | 11 équipements |

  (`bench` est gardé dans le profil mais n'ajoute rien à la requête — pas d'équipement « banc » dans le catalogue.)

**`metrics.ts`** — métriques santé calculées **localement** (affichage Stats/Nutrition, pas un avis médical) :

| Fonction | Calcul |
| --- | --- |
| `bmi(profile)` | IMC |
| `bmiCategory(value)` | Maigreur / Normal / Surpoids / Obésité + position jauge |
| `bodyFatEstimate(profile)` | % masse grasse (Deurenberg, borné 5–50) |
| `dailyCalorieTarget(profile)` | BMR Mifflin-St Jeor × activité × facteur objectif |
| `dailyProteinTarget(profile)` | 1,6–2 g/kg selon l'objectif |

**Autres** : `errors.ts` (`userFacingError(err, fallback)` → messages FR), `useSessionCalories.ts`, et `components/` (`BmiGauge`, `ScanMealCard`, `MealAnalysisCard`, `OnboardingScaffold`, `WeekStrip`, `SessionHeroCard`, `CatalogExerciseRow`, `EquipmentTile`, `OptionCard`, `SegmentedToggle`…).

---

## 11. Grandes fonctions utiles (cheat-sheet)

| Fonction / objet | Fichier | À quoi ça sert |
| --- | --- | --- |
| `apiFetch<T>(path, opts)` | `src/lib/http.ts` | **Tout appel backend** — Bearer auto, refresh, erreurs |
| `useAuth()` | `src/features/auth/AuthProvider.tsx` | État de session + `login` / `logout` |
| `loginWithPassword` / `refreshSession` / `logoutSession` | `src/features/auth/keycloak.ts` | Flux Keycloak OAuth2 |
| `env` (+ `keycloak*Url`) | `src/config/env.ts` | URLs gateway + Keycloak |
| `listPosts` / `createPost` / `toggleLike` / `deletePost` | `src/features/publications/api.ts` | CRUD posts + likes |
| `useCoach()` | `src/features/coach/CoachProvider.tsx` | Profil + programme du coach |
| `generateWeeklyProgram` / `getLatestProgram` / `getExercises` / `searchFoods` / `analyzeMeal` | `src/features/coach/api.ts` | Appels coach IA `/brain` |
| `bmi` / `dailyCalorieTarget` / `bodyFatEstimate` | `src/features/coach/metrics.ts` | Métriques santé locales |
| `toWeeklyProgramRequest` | `src/features/coach/profile.ts` | Mapping profil → requête weekly-program |
| `formatRelativeTime(iso)` | `src/lib/relativeTime.ts` | Dates relatives en français |

---

## 12. Conventions & styling

- **NativeWind** + tokens custom de `tailwind.config.js` (utiliser ces tokens plutôt que les couleurs Tailwind par défaut) :

  | Token | Hex | Usage |
  | --- | --- | --- |
  | `primary` | `#007AFF` | Bleu d'action |
  | `coral` / `like` | `#FC5200` | CTA + likes (accent Strava) |
  | `coach` | `#5B2EE5` | Violet signature de l'univers HealthAI |
  | `text-primary` / `secondary` / `muted` | `#1A1A1A` / `#6B6B6B` / `#9AA0A6` | Texte |
  | `surface` / `background` / `border` | `#FFFFFF` / `#F5F5F5` / `#E1E4E8` | Surfaces |
  | `danger` / `success` | `#E53935` / `#2E7D32` | États |
  | `mint` / `sun` | `#22B573` / `#E8A800` | Tints icônes / conseils |

- **Formulaires** : `react-hook-form` + `zodResolver` + schémas dans `features/<domaine>/schemas.ts`. Écrans à form long → wrapper `KeyboardAvoidingView`.
- **Logs** en français, préfixés `[Auth]` / `[Keycloak]` / `[API]` / `[Coach]`, **uniquement sous `__DEV__`**, avec password et tokens masqués `***`.
- **Typage `process.env`** : seulement les `EXPO_PUBLIC_*` (via `nativewind-env.d.ts`). **Ne pas installer `@types/node`.**
- **Alias** `@/` → `src/` partout.

---

## 13. Pour aller plus loin

- **Lancer l'environnement** (Node, Android, Docker, réseau LAN, dépannage) → [`README.md`](../README.md).
- **Contexte projet & pièges** (Keycloak, NGINX, branches backend) → [`../CLAUDE.md`](../CLAUDE.md).

> ⚠️ En cas de doute, **le code fait foi** : cette doc reflète l'état réel des fichiers `src/` au moment de sa rédaction (l'API mobile cible bien `/api/post`, pas l'ancien `/publication`).
