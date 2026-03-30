import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GuestGate from '../components/GuestGate';
import { deleteAccount, logout } from '../services/authService';
import { useAuth } from '../services/AuthContext';
import { useTranslation } from '../services/LanguageContext';
import { auth } from '../services/firebase';
import { getProfile, subscribeMyScores, uploadProfilePhoto, updateStreak } from '../services/firestoreService';
import { getStreak } from '../services/streak';
import { getRank } from '../services/rank';

const C = {
  bg: '#111111', border: '#2C2C2C', text: '#FFFFFF',
  muted: '#818384', green: '#538D4E', yellow: '#B59F3B', red: '#C0392B',
};

function tileColor(score) {
  if (score >= 80) return C.green;
  if (score >= 55) return C.yellow;
  return C.red;
}

export default function ProfileScreen() {
  const user = useAuth();
  const { t } = useTranslation();
  if (!user) {
    return <GuestGate title={t('gate_profile_title')} subtitle={t('gate_profile_sub')} />;
  }
  return <ProfileContent />;
}

function ProfileContent() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [scores, setScores] = useState([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeMyScores(uid, setScores);
    return unsub;
  }, [uid]);

  useFocusEffect(useCallback(() => {
    if (!uid) return;
    // Sync local streak to Firestore in case it's out of sync
    getStreak().then(localStreak => {
      getProfile(uid).then(profile => {
        setProfile(profile);
        if (localStreak > (profile?.streak ?? 0)) {
          updateStreak(localStreak);
          setProfile(prev => ({ ...prev, streak: localStreak }));
        }
      });
    });
  }, [uid]));

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (result.canceled) return;

    setPhotoUploading(true);
    try {
      const photoURL = await uploadProfilePhoto(result.assets[0].uri);
      setProfile(prev => ({ ...prev, photoURL }));
    } catch (e) {
      console.warn('Photo upload failed:', e.message);
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleLogout() {
    await logout();
  }

  function handleDeleteAccount() {
    setDeletePassword('');
    setDeleteModal(true);
  }

  async function confirmDelete() {
    if (!deletePassword) return;
    try {
      await deleteAccount(deletePassword);
      setDeleteModal(false);
    } catch (e) {
      setDeleteModal(false);
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        Alert.alert('Error', 'Wrong password. Please try again.');
      } else {
        Alert.alert('Error', e.message);
      }
    }
  }

  const bestScore = scores.length ? Math.max(...scores.map(s => s.score)) : null;
  const rank = getRank(profile?.streak ?? 0, t('ranks'));

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>GLOSSIA</Text>
        <Text style={s.headerLabel}>PROFIL</Text>
      </View>
      <View style={s.divider} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={s.identityBlock}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8} style={s.avatarWrapper}>
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={s.avatarPhoto} />
            ) : (
              <View style={s.avatar}>
                <Text style={s.avatarLetter}>{profile?.username?.[0]?.toUpperCase() || '?'}</Text>
              </View>
            )}
            <View style={s.cameraBtn}>
              <Text style={s.cameraIcon}>{photoUploading ? '…' : '📷'}</Text>
            </View>
          </TouchableOpacity>
          <Text style={s.username}>{profile?.username || '…'}</Text>
          <Text style={s.email}>{auth.currentUser?.email}</Text>

          {/* Rank */}
          <View style={s.rankBlock}>
            <View style={s.rankRow}>
              <Text style={s.rankName}>{rank.name.toUpperCase()}</Text>
              {!rank.isMax && (
                <Text style={s.rankNext}>→ {rank.nextName}</Text>
              )}
            </View>
            <View style={s.rankTrack}>
              <View style={[s.rankFill, { width: `${rank.progress * 100}%` }]} />
            </View>
            {!rank.isMax && (
              <Text style={s.rankHint}>{rank.streak} / {rank.next} 🔥</Text>
            )}
          </View>
        </View>

        <View style={s.divider} />

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statBlock}>
            <Text style={s.statNum}>🔥 {profile?.streak ?? 0}</Text>
            <Text style={s.statLabel}>STREAK</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBlock}>
            <Text style={s.statNum}>{scores.length}</Text>
            <Text style={s.statLabel}>PARTIES</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBlock}>
            <Text style={s.statNum}>{bestScore ?? '—'}</Text>
            <Text style={s.statLabel}>MEILLEUR</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Recent scores */}
        {scores.length > 0 && (
          <View style={s.scoresBlock}>
            <Text style={s.sectionLabel}>DERNIÈRES PARTIES</Text>
            {scores.slice(0, 8).map(item => {
              const color = tileColor(item.score);
              return (
                <View key={item.id} style={s.scoreRow}>
                  <View style={s.scoreLeft}>
                    <Text style={s.scoreTheme}>{item.theme}</Text>
                    <Text style={s.scoreConsigne}>{item.consigne}</Text>
                  </View>
                  <View style={[s.scoreTile, { borderColor: color }]}>
                    <Text style={[s.scoreNum, { color }]}>{item.score}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={s.divider} />

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={s.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Delete account */}
        <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.7}>
          <Text style={s.deleteText}>Supprimer mon compte</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Delete account modal */}
      <Modal visible={deleteModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Supprimer mon compte</Text>
            <Text style={s.modalSub}>Entre ton mot de passe pour confirmer. Cette action est irréversible.</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Mot de passe"
              placeholderTextColor="#818384"
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              autoFocus
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setDeleteModal(false)}>
                <Text style={s.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalDelete} onPress={confirmDelete}>
                <Text style={s.modalDeleteText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  logo:    { fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: 6 },
  headerLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 2 },
  divider: { height: 1, backgroundColor: C.border },

  identityBlock: { alignItems: 'center', paddingVertical: 32 },
  avatarWrapper: { marginBottom: 14, position: 'relative' },
  avatar:        { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  avatarPhoto:   { width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: C.border },
  avatarLetter:  { fontSize: 28, fontWeight: '800', color: C.text },
  cameraBtn:     { position: 'absolute', bottom: 0, right: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  cameraIcon:    { fontSize: 12 },
  username:      { fontSize: 22, fontWeight: '800', color: C.text },
  email:         { fontSize: 13, color: C.muted, marginTop: 4 },

  statsRow:    { flexDirection: 'row', paddingVertical: 24 },
  statBlock:   { flex: 1, alignItems: 'center' },
  statNum:     { fontSize: 22, fontWeight: '900', color: C.text },
  statLabel:   { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 2, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: C.border },

  scoresBlock:   { paddingHorizontal: 24, paddingVertical: 20 },
  sectionLabel:  { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 2, marginBottom: 16 },
  scoreRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, gap: 12 },
  scoreLeft:     { flex: 1 },
  scoreTheme:    { fontSize: 14, fontWeight: '700', color: C.text },
  scoreConsigne: { fontSize: 12, color: C.muted, marginTop: 2 },
  scoreTile:     { width: 46, height: 46, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  scoreNum:      { fontSize: 15, fontWeight: '900' },

  rankBlock:  { width: '70%', marginTop: 16, gap: 6 },
  rankRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rankName:   { fontSize: 11, fontWeight: '800', color: C.text, letterSpacing: 2 },
  rankNext:   { fontSize: 10, color: C.muted, letterSpacing: 1 },
  rankTrack:  { height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  rankFill:   { height: '100%', backgroundColor: C.yellow, borderRadius: 2 },
  rankHint:   { fontSize: 10, color: C.muted, textAlign: 'right', letterSpacing: 1 },

  logoutBtn:  { marginHorizontal: 24, marginTop: 24, marginBottom: 8, borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 16, alignItems: 'center' },
  logoutText: { fontSize: 14, fontWeight: '700', color: C.muted, letterSpacing: 1 },
  deleteBtn:  { marginHorizontal: 24, marginBottom: 32, paddingVertical: 12, alignItems: 'center' },
  deleteText: { fontSize: 12, color: C.red, letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox:     { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2C2C2C', borderRadius: 8, padding: 24, width: '85%' },
  modalTitle:   { fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  modalSub:     { fontSize: 13, color: '#818384', marginBottom: 20, lineHeight: 19 },
  modalInput:   { borderWidth: 1, borderColor: '#2C2C2C', borderRadius: 4, padding: 12, color: '#FFFFFF', fontSize: 15, marginBottom: 20 },
  modalBtns:    { flexDirection: 'row', gap: 12 },
  modalCancel:  { flex: 1, borderWidth: 1, borderColor: '#2C2C2C', borderRadius: 4, paddingVertical: 12, alignItems: 'center' },
  modalCancelText: { color: '#818384', fontWeight: '600' },
  modalDelete:  { flex: 1, backgroundColor: '#C0392B', borderRadius: 4, paddingVertical: 12, alignItems: 'center' },
  modalDeleteText: { color: '#FFFFFF', fontWeight: '700' },
});
