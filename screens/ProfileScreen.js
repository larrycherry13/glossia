import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logout } from '../services/authService';
import { auth } from '../services/firebase';
import { getProfile, subscribeMyScores } from '../services/firestoreService';

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
  const [profile, setProfile] = useState(null);
  const [scores, setScores] = useState([]);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    getProfile(uid).then(setProfile);
    const unsub = subscribeMyScores(uid, setScores);
    return unsub;
  }, [uid]);

  async function handleLogout() {
    await logout();
  }

  const bestScore = scores.length ? Math.max(...scores.map(s => s.score)) : null;

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
          <View style={s.avatar}>
            <Text style={s.avatarLetter}>{profile?.username?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={s.username}>{profile?.username || '…'}</Text>
          <Text style={s.email}>{auth.currentUser?.email}</Text>
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

      </ScrollView>
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
  avatar:        { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarLetter:  { fontSize: 28, fontWeight: '800', color: C.text },
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

  logoutBtn:  { marginHorizontal: 24, marginVertical: 24, borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 16, alignItems: 'center' },
  logoutText: { fontSize: 14, fontWeight: '700', color: C.muted, letterSpacing: 1 },
});
