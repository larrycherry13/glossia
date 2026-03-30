import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function signup(email, password, username) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', user.uid), {
    username,
    usernameLower: username.toLowerCase(),
    email,
    streak: 0,
    createdAt: serverTimestamp(),
  });
  return user;
}

export async function login(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function logout() {
  await signOut(auth);
}

export async function deleteAccount(password) {
  const user = auth.currentUser;
  if (!user) return;
  const uid = user.uid;

  // Re-authenticate before deleting
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);

  // Delete scores subcollection
  const scoresSnap = await getDocs(collection(db, 'users', uid, 'scores'));
  await Promise.all(scoresSnap.docs.map(d => deleteDoc(d.ref)));

  // Delete user document
  await deleteDoc(doc(db, 'users', uid));

  // Delete Firebase Auth account
  await deleteUser(user);
}
