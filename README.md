# Glossia — Jeu d'éloquence IA

Application mobile de jeu d'éloquence avec analyse vocale par IA, mécanique de scoring gamifiée et couche sociale (amis, feed temps réel).

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
    └── streak.js                   # Streak + historique local (AsyncStorage)
```

---

## Services

### `services/openai.js`

Deux fonctions exportées :

```js
transcribeAudio(audioUri: string): Promise<string>
// Envoie le fichier .m4a à Whisper (whisper-1), retourne la transcription FR

analyzeWithGPT(transcript: string, theme: string): Promise<{
  score: number,          // 0-100
  fluidity: number,       // 0-30 (fluidité)
  fillers_score: number,  // 0-30 (absence de mots parasites)
  relevance: number,      // 0-40 (pertinence par rapport au thème)
  feedback: string,       // Retour textuel de GPT
  fillers_count: number,  // Nombre de mots parasites détectés
}>
```

**Prompt GPT-4o** : arbitre qui évalue fluidité (30pts), absence de mots parasites (30pts), pertinence au thème (40pts). Retourne un JSON strict.

**Mots parasites détectés** : "euh", "alors", "donc", "voilà", "genre", "en fait", "bah".

### `services/challenges.js`

40 challenges répartis en 4 catégories :
- 🏛️ Société & Actualité (10)
- 📺 Médias & Divertissement (10)
- 💡 Concepts & Objets (10)
- 🎤 Réflexion Rapide (10)

```js
getRandomChallenge(): { theme: string, consigne: string }
// Retourne un challenge aléatoire à chaque appel
```

### `services/streak.js` (AsyncStorage local)

```js
getStreak(): Promise<number>
recordPlay(): Promise<number>        // Incrémente le streak (1x/jour max), retourne nouveau streak
getHistory(): Promise<Array>         // Derniers 5 scores locaux
saveToHistory(score, theme): Promise<void>
```

### `services/firebase.js`

Initialise Firebase avec `initializeAuth` + `getReactNativePersistence(AsyncStorage)` pour la persistance de session entre les relances de l'app.

```js
export const auth  // Firebase Auth instance
export const db    // Firestore instance
```

### `services/authService.js`

```js
signup(email, password, username): Promise<User>
// Crée le compte Firebase Auth + document Firestore users/{uid}

login(email, password): Promise<User>
logout(): Promise<void>
```

### `services/firestoreService.js`

```js
// Profils
getProfile(uid): Promise<UserProfile | null>
searchUsers(queryStr): Promise<UserProfile[]>   // Recherche par usernameLower

// Scores
saveScore(scoreData): Promise<void>             // Sauvegarde une partie (appelé depuis HomeScreen)
subscribeMyScores(uid, callback): Unsubscribe   // Listener temps réel

// Amis
sendFriendRequest(targetUid): Promise<void>
acceptFriendRequest(friendshipId): Promise<void>
declineFriendRequest(friendshipId): Promise<void>
subscribeFriends(uid, callback): Unsubscribe
subscribePendingRequests(uid, callback): Unsubscribe

// Feed
subscribeFeed(friendUids[], callback): Unsubscribe
// Scores des amis, orderBy timestamp desc, limit 30
// Firestore 'in' query : max 10 UIDs supportés
```

---

## Schéma Firestore

### Collection `users/{uid}`
```json
{
  "username": "string",
  "usernameLower": "string",   // pour la recherche case-insensitive
  "email": "string",
  "streak": "number",
  "createdAt": "Timestamp"
}
```

### Collection `scores/{scoreId}`
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

### Collection `friendships/{docId}`
```json
{
  "members": ["uid1", "uid2"],   // array-contains pour les queries
  "senderId": "string",
  "receiverId": "string",
  "status": "pending | accepted | declined",
  "createdAt": "Timestamp"
}
```

**Index Firestore requis** :
- `scores` : `userId ASC` + `timestamp DESC`
- `friendships` : `receiverId ASC` + `status ASC`
- `friendships` : `members array-contains` + `status ASC`

---

## Navigation

```
App.js
├── (non connecté) → AuthScreen
└── (connecté) → Bottom Tab Navigator
    ├── Jouer  → Stack: HomeScreen → ResultScreen
    ├── Feed   → FeedScreen
    ├── Amis   → FriendsScreen
    └── Profil → ProfileScreen
```

**Auth state** : géré dans `App.js` via `onAuthStateChanged`. État `undefined` = chargement (écran blanc), `null` = non connecté, `User` = connecté.

---

## Écrans

### `HomeScreen`
- Charge le streak local au montage
- `getRandomChallenge()` appelé à chaque nouveau défi
- Enregistrement audio en AAC/m4a (format compatible iOS + Android)
- Après analyse : sauvegarde dans AsyncStorage (local) ET Firestore (social)
- Passe au ResultScreen via `navigation.navigate('Result', { ...analysis, history, streak })`

### `ResultScreen`
Reçoit en params : `{ score, fluidity, fillers_score, relevance, feedback, fillers_count, theme, consigne, transcript, audioUri, streak, history }`

Affiche :
1. Tile de score animé (compteur qui monte, couleur verte/jaune/rouge)
2. Feedback GPT en héro
3. 3 barres de progression animées (Fluidité/Parasites/Pertinence)
4. Nombre de mots parasites
5. Rappel du thème
6. Historique 5 dernières sessions (tiles colorés)
7. Transcription
8. Boutons : Réécouter / Partager (Share API natif) / Nouvel essai

### `FeedScreen`
- Subscribe à `subscribeFriends` → récupère les UIDs des amis
- Subscribe à `subscribeFeed(friendUids)` → listener temps réel
- Affiche : username, thème, score tile, timestamp relatif

### `FriendsScreen`
3 onglets : **AMIS** / **DEMANDES** / **RECHERCHE**
- Recherche par username (query Firestore sur `usernameLower`)
- Demandes entrantes avec Accepter/Refuser
- Liste des amis confirmés

### `ProfileScreen`
- Avatar généré (initiale du username)
- Stats : streak 🔥, nombre de parties, meilleur score
- Historique des 10 dernières parties
- Bouton déconnexion

---

## Design system

Palette inspirée de Wordle (dark mode) :

```js
bg:     '#111111'   // fond
border: '#2C2C2C'   // séparateurs, bordures
text:   '#FFFFFF'   // texte principal
muted:  '#818384'   // texte secondaire
green:  '#538D4E'   // score ≥ 80
yellow: '#B59F3B'   // score 55-79
red:    '#C0392B'   // score < 55
```

**Principes** : zéro gradient, zéro ombre portée, typographie seule, dividers 1px, boutons avec `borderRadius: 4`.

---

## Variables d'environnement

La clé OpenAI est actuellement hardcodée dans `services/openai.js`.
⚠️ **Ne pas committer en production** — utiliser `expo-constants` + EAS Secrets.

La config Firebase dans `services/firebase.js` est publique par nature (sécurité assurée par les Firestore Rules).

---

## Problèmes connus / Notes

- **expo-av** : déprécié en SDK 54, à migrer vers `expo-audio` (installé mais pas encore utilisé)
- **Feed social** : limité à 10 amis pour les requêtes Firestore `in` (limite native)
- **Streak** : stocké localement (AsyncStorage), pas synchronisé avec Firestore `users/{uid}.streak`
- **Tunnel ngrok** : nécessite un auth token depuis 2023, utiliser `--lan` à la place
- **Windows** : le chemin `node:sea` dans les externals Metro cause une erreur sur Windows (colon invalide dans les paths) — patch appliqué dans `node_modules/@expo/cli/build/src/start/server/metro/externals.js`
- **npm** : `.npmrc` configuré avec `legacy-peer-deps=true` pour résoudre les conflits React 19
"# glossia" 
