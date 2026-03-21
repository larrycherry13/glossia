# Glossia — Jeu d'éloquence

Application mobile de jeu d'éloquence avec analyse vocale par IA, mécanique de scoring gamifiée et couche sociale (amis, feed temps réel).

---

## Installation & lancement

```bash
# 1. Cloner le projet
git clone <repo> && cd glossia

# 2. Installer les dépendances
npm install

# 3. Créer le fichier d'environnement
cp .env.example .env
# puis remplir les valeurs (voir section Variables d'environnement)

# 4. Lancer
npx expo start --lan
```

> **Windows** : si `npx` est bloqué par PowerShell, exécute depuis le terminal bash de VS Code ou lance `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` en admin.

---

## Variables d'environnement

Créer un fichier `.env` à la racine :

```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

> Expo SDK 54 charge automatiquement les variables préfixées `EXPO_PUBLIC_` depuis `.env`. Ne jamais committer ce fichier.

Les services accèdent aux variables via `process.env.EXPO_PUBLIC_*`.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework mobile | Expo SDK 54 / React Native 0.81 |
| Navigation | React Navigation v6 (stack + bottom tabs) |
| Audio | expo-av (enregistrement + lecture) |
| Transcription | OpenAI Whisper (`whisper-1`) |
| Analyse du discours | OpenAI GPT-4o |
| Auth + Base de données | Firebase v12 (Auth + Firestore) |
| Persistance locale | AsyncStorage |
| Icônes | lucide-react-native |
| Polyfills | react-native-get-random-values + navigator.userAgent |

---

## Concept du jeu

L'utilisateur tire un **thème aléatoire** parmi 40 challenges (ex: *"Le Télétravail"*) avec une **question associée** (ex: *"Est-ce la fin des bureaux physiques ?"*). Il a exactement **10 secondes** pour parler. L'audio est transcrit par Whisper puis évalué par GPT-4o.

### Machine d'états (HomeScreen)

```
idle → theme_reveal → countdown_start → recording → analyzing → (navigate to Result)
```

- **idle** : écran d'accueil, bouton "Commencer"
- **theme_reveal** : carte animée (spring) avec thème + question
- **countdown_start** : décompte 3-2-1 animé avant l'enregistrement
- **recording** : enregistrement 10s, thème visible, barre de progression, compteur urgent (rouge à ≤3s)
- **analyzing** : deux étapes visibles — "Transcription audio…" → "Évaluation du discours…"

---

## Structure des fichiers

```
glossia/
├── App.js                          # Point d'entrée, auth state, tab navigator
├── polyfills.js                    # Polyfills chargés en premier (crypto, navigator)
├── app.json                        # Config Expo (nom, icônes, permissions micro)
├── .env                            # Variables d'environnement (ne pas committer)
├── .npmrc                          # legacy-peer-deps=true (React 19 compat)
│
├── screens/
│   ├── AuthScreen.js               # Login / Inscription (email + password)
│   ├── HomeScreen.js               # Écran de jeu principal (machine d'états)
│   ├── ResultScreen.js             # Résultat avec score, breakdown, historique, partage
│   ├── FeedScreen.js               # Feed temps réel des parties des amis
│   ├── FriendsScreen.js            # Gestion des amis (liste / demandes / recherche)
│   └── ProfileScreen.js            # Profil utilisateur, stats, historique, déconnexion
│
└── services/
    ├── firebase.js                 # Initialisation Firebase (auth + db)
    ├── authService.js              # signup(), login(), logout()
    ├── firestoreService.js         # CRUD Firestore (profils, scores, amis, feed)
    ├── openai.js                   # transcribeAudio() + analyzeWithGPT()
    ├── challenges.js               # Pool de 40 challenges, getRandomChallenge()
    ├── streak.js                   # Streak + historique local (AsyncStorage)
    └── validation.js               # Validation des inputs (email, password, username)
```

---

## Services

### `services/openai.js`

```js
transcribeAudio(audioUri: string): Promise<string>
// Envoie le fichier .m4a à Whisper (whisper-1), retourne la transcription FR
// Timeout : 60s — lance une erreur explicite si dépassé

analyzeWithGPT(transcript: string, theme: string): Promise<{
  score: number,          // 0-100 (somme des 3 critères)
  fluidity: number,       // 0-30
  fillers_score: number,  // 0-30
  relevance: number,      // 0-40
  feedback: string,       // Retour textuel de GPT en français
  fillers_count: number,  // Nombre de mots parasites détectés
}>
// Gère les erreurs 401 (clé invalide), 429 (rate limit), timeout
```

**Prompt GPT-4o** : arbitre qui évalue fluidité (30pts), absence de mots parasites (30pts), pertinence au thème (40pts). Retourne un JSON strict via `response_format: { type: 'json_object' }`.

**Mots parasites** : "euh", "alors", "donc", "voilà", "genre", "en fait", "bah".

### `services/challenges.js`

40 challenges en 4 catégories. Chaque objet : `{ theme: string, consigne: string }`.

```js
getRandomChallenge(): { theme: string, consigne: string }
// Retourne un challenge aléatoire à chaque appel (Math.random)
```

Catégories : 🏛️ Société & Actualité · 📺 Médias & Divertissement · 💡 Concepts & Objets · 🎤 Réflexion Rapide

### `services/streak.js` (AsyncStorage local)

```js
getStreak(): Promise<number>
recordPlay(): Promise<number>              // Max 1 incrément/jour, retourne nouveau streak
getHistory(): Promise<{score, theme, date}[]>  // 5 entrées max
saveToHistory(score: number, theme: string): Promise<void>
```

### `services/validation.js`

```js
validateEmail(email: string): string | null     // null = valide
validatePassword(password: string): string | null
validateUsername(username: string): string | null
// Username : 2-20 chars, alphanumérique + _ et -
```

### `services/firebase.js`

Initialise Firebase avec `initializeAuth` + `getReactNativePersistence(AsyncStorage)`.
Toutes les valeurs viennent de `process.env.EXPO_PUBLIC_FIREBASE_*`.

```js
export const auth  // Firebase Auth instance
export const db    // Firestore instance
```

### `services/authService.js`

```js
signup(email, password, username): Promise<User>
// createUserWithEmailAndPassword + setDoc users/{uid} avec username, usernameLower, streak:0

login(email, password): Promise<User>
logout(): Promise<void>
```

### `services/firestoreService.js`

```js
// Profils
getProfile(uid): Promise<UserProfile | null>
searchUsers(queryStr): Promise<UserProfile[]>       // Sur usernameLower, case-insensitive

// Scores
saveScore(scoreData): Promise<void>                 // Appelé automatiquement après chaque partie
subscribeMyScores(uid, callback): Unsubscribe        // Listener temps réel, limit 10

// Amis
sendFriendRequest(targetUid): Promise<void>         // Vérifie les doublons avant création
acceptFriendRequest(friendshipId): Promise<void>
declineFriendRequest(friendshipId): Promise<void>
subscribeFriends(uid, callback): Unsubscribe        // status == 'accepted'
subscribePendingRequests(uid, callback): Unsubscribe // receiverId == uid, status == 'pending'

// Feed
subscribeFeed(friendUids[], callback): Unsubscribe
// Scores des amis, orderBy timestamp desc, limit 30
// ⚠️ Firestore 'in' : max 10 UIDs — au-delà, les amis supplémentaires sont ignorés
```

---

## Schéma Firestore

### `users/{uid}`
```json
{
  "username": "string",
  "usernameLower": "string",
  "email": "string",
  "streak": "number",
  "createdAt": "Timestamp"
}
```

### `scores/{scoreId}`
```json
{
  "userId": "string",
  "username": "string",
  "score": "number",
  "fluidity": "number",
  "fillers_score": "number",
  "relevance": "number",
  "fillers_count": "number",
  "theme": "string",
  "consigne": "string",
  "feedback": "string",
  "timestamp": "Timestamp"
}
```

### `friendships/{docId}`
```json
{
  "members": ["uid1", "uid2"],
  "senderId": "string",
  "receiverId": "string",
  "status": "pending | accepted | declined",
  "createdAt": "Timestamp"
}
```

### Index Firestore requis

| Collection | Champs | Ordre |
|---|---|---|
| `scores` | `userId` + `timestamp` | ASC + DESC |
| `friendships` | `members` (array) + `status` | — + ASC |
| `friendships` | `receiverId` + `status` | ASC + ASC |

> Firebase génère un lien direct dans les logs d'erreur pour créer les index manquants — clique dessus.

### Règles de sécurité Firestore (à copier dans la console Firebase)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == uid;
      allow update: if request.auth.uid == uid;
    }

    match /scores/{scoreId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.userId;
    }

    match /friendships/{docId} {
      allow read: if request.auth != null &&
        request.auth.uid in resource.data.members;
      allow create: if request.auth.uid == request.resource.data.senderId;
      allow update: if request.auth.uid == resource.data.receiverId ||
        request.auth.uid == resource.data.senderId;
    }
  }
}
```

---

## Navigation

```
App.js
├── user === undefined  →  écran blanc (chargement auth)
├── user === null       →  AuthScreen
└── user connecté       →  Bottom Tab Navigator
    ├── Jouer   (Home icon)   →  Stack: HomeScreen → ResultScreen
    ├── Feed    (Trophy icon) →  FeedScreen
    ├── Amis    (Users icon)  →  FriendsScreen
    └── Profil  (User icon)   →  ProfileScreen
```

---

## Écrans

### `HomeScreen`
- Charge le streak local au montage + demande permission micro
- `getRandomChallenge()` appelé à chaque tap "Commencer" (nouveau thème à chaque essai)
- Enregistrement audio AAC/m4a (explicitement configuré pour iOS + Android)
- Après analyse : sauvegarde dans AsyncStorage (local) ET Firestore (social)
- Params passés à ResultScreen : `{ score, fluidity, fillers_score, relevance, feedback, fillers_count, theme, consigne, transcript, audioUri, streak, history }`

### `ResultScreen`
1. Tile de score animé (compteur 0→score, couleur verte/jaune/rouge)
2. Feedback GPT en héro (premier contenu lisible)
3. 3 barres animées : Fluidité /30 · Mots parasites /30 · Pertinence /40
4. Compteur de mots parasites (coloré)
5. Rappel du thème + consigne
6. Historique 5 sessions (tiles colorés)
7. Transcription complète
8. Boutons : Réécouter / Partager (Share API natif) / Nouvel essai

### `FeedScreen`
- Double listener temps réel : `subscribeFriends` → UIDs → `subscribeFeed`
- Affiche : username · thème · consigne · score tile · timestamp relatif

### `FriendsScreen`
3 onglets : **AMIS** / **DEMANDES** / **RECHERCHE**
- Recherche Firestore sur `usernameLower` (prefix match)
- Demandes avec état de chargement par item (`loadingRequests`)
- Bannière d'erreur dismissable en bas

### `ProfileScreen`
- Avatar généré (initiale du username)
- Stats : streak 🔥 · nb parties · meilleur score
- 10 dernières parties avec score tile
- Déconnexion via `logout()`

---

## Design system

Palette Wordle dark mode :

```js
bg:     '#111111'  // fond
border: '#2C2C2C'  // séparateurs, bordures
text:   '#FFFFFF'  // texte principal
muted:  '#818384'  // texte secondaire, labels
green:  '#538D4E'  // score ≥ 80
yellow: '#B59F3B'  // score 55–79
red:    '#C0392B'  // score < 55 + erreurs
```

**Principes** : zéro gradient · zéro ombre portée · typographie seule · dividers 1px · `borderRadius: 4` partout · boutons flat blanc sur fond noir · bannière d'erreur en bas de chaque écran (dismissable).

---

## Problèmes connus

| Problème | Statut | Solution |
|---|---|---|
| `expo-av` déprécié SDK 54 | ⚠️ Warning | `expo-audio` installé, migration non faite |
| Feed limité à 10 amis | Limitation Firestore | Requête `in` max 10 éléments |
| Streak non synchronisé Firestore | Local seulement | AsyncStorage ≠ `users/{uid}.streak` |
| Tunnel ngrok | Auth token requis | Utiliser `--lan` à la place |
| Windows : `node:sea` path invalide | Patché | `externals.js` dans `@expo/cli` modifié |
| npm peer deps React 19 | Contourné | `.npmrc` avec `legacy-peer-deps=true` |
