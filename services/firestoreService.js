import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from './firebase';

export async function uploadProfilePhoto(uri) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const response = await fetch(uri);
  const blob = await response.blob();
  const photoRef = ref(storage, `profiles/${user.uid}/avatar.jpg`);
  await uploadBytes(photoRef, blob);
  const photoURL = await getDownloadURL(photoRef);

  await updateDoc(doc(db, 'users', user.uid), { photoURL });
  return photoURL;
}

// ── Users ──────────────────────────────────────────────────────────────────────

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

export async function searchUsers(queryStr) {
  if (!queryStr.trim()) return [];
  const lower = queryStr.toLowerCase();
  const q = query(
    collection(db, 'users'),
    where('usernameLower', '>=', lower),
    where('usernameLower', '<=', lower + '\uf8ff'),
    limit(10)
  );
  const snap = await getDocs(q);
  const myUid = auth.currentUser?.uid;
  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .filter(u => u.uid !== myUid);
}

// ── Scores ─────────────────────────────────────────────────────────────────────

export async function saveScore(scoreData) {
  const user = auth.currentUser;
  if (!user) return;
  const profile = await getProfile(user.uid);
  await addDoc(collection(db, 'scores'), {
    userId: user.uid,
    username: profile?.username || 'Anonyme',
    ...scoreData,
    timestamp: serverTimestamp(),
  });
}

export function subscribeMyScores(uid, callback) {
  const q = query(
    collection(db, 'scores'),
    where('userId', '==', uid),
    orderBy('timestamp', 'desc'),
    limit(10)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

// ── Friends ────────────────────────────────────────────────────────────────────

export async function sendFriendRequest(targetUid) {
  const myUid = auth.currentUser?.uid;
  // Check not already friends / pending
  const existing = await getDocs(query(
    collection(db, 'friendships'),
    where('members', 'array-contains', myUid)
  ));
  const alreadyExists = existing.docs.some(d => (d.data().members || []).includes(targetUid));
  if (alreadyExists) throw new Error('Demande déjà envoyée ou déjà amis');

  await addDoc(collection(db, 'friendships'), {
    members: [myUid, targetUid],
    senderId: myUid,
    receiverId: targetUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function acceptFriendRequest(friendshipId) {
  await updateDoc(doc(db, 'friendships', friendshipId), { status: 'accepted' });
}

export async function declineFriendRequest(friendshipId) {
  await updateDoc(doc(db, 'friendships', friendshipId), { status: 'declined' });
}

export function subscribeFriends(uid, callback) {
  const q = query(
    collection(db, 'friendships'),
    where('members', 'array-contains', uid),
    where('status', '==', 'accepted')
  );
  return onSnapshot(q, async snap => {
    const friends = await Promise.all(
      snap.docs.map(async d => {
        const data = d.data();
        const friendUid = (data.members || []).find(m => m !== uid);
        const profile = await getProfile(friendUid);
        return { friendshipId: d.id, friendUid, username: profile?.username || '?', photoURL: profile?.photoURL || null, ...data };
      })
    );
    callback(friends);
  });
}

export function subscribePendingRequests(uid, callback) {
  const q = query(
    collection(db, 'friendships'),
    where('receiverId', '==', uid),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, async snap => {
    const requests = await Promise.all(
      snap.docs.map(async d => {
        const data = d.data();
        const profile = await getProfile(data.senderId);
        return { id: d.id, senderUsername: profile?.username || '?', ...data };
      })
    );
    callback(requests);
  });
}

// ── Daily Podium ───────────────────────────────────────────────────────────────

export function subscribeDailyPodium(friendUids, callback) {
  const myUid = auth.currentUser?.uid;
  const allUids = [myUid, ...friendUids].filter(Boolean).slice(0, 10);
  if (allUids.length === 0) { callback([]); return () => {}; }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, 'scores'),
    where('userId', 'in', allUids),
    where('timestamp', '>=', startOfToday),
    orderBy('timestamp', 'desc'),
    limit(50)
  );

  return onSnapshot(q, snap => {
    const scores = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Keep best score per user today
    const byUser = {};
    scores.forEach(s => {
      if (!byUser[s.userId] || s.score > byUser[s.userId].score) {
        byUser[s.userId] = s;
      }
    });
    const podium = Object.values(byUser)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    callback(podium);
  });
}

// ── Feed ───────────────────────────────────────────────────────────────────────

export function subscribeFeed(friendUids, callback) {
  if (friendUids.length === 0) { callback([]); return () => {}; }
  // Firestore 'in' supports max 10 values
  const uids = friendUids.slice(0, 10);
  const q = query(
    collection(db, 'scores'),
    where('userId', 'in', uids),
    orderBy('timestamp', 'desc'),
    limit(30)
  );
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}
