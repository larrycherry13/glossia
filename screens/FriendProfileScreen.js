import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from '../services/LanguageContext';
import { getProfile, subscribeMyScores } from '../services/firestoreService';
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

export default function FriendProfileScreen({ route, navigation }) {
  const { friendUid, username } = route.params;
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    getProfile(friendUid).then(setProfile);
    const unsub = subscribeMyScores(friendUid, setScores);
    return unsub;
  }, [friendUid]);

  const bestScore = scores.length ? Math.max(...scores.map(s => s.score)) : null;
  const rank = profile ? getRank(profile.streak ?? 0, t('ranks')) : null;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={s.backBtn}>
          <ChevronLeft color={C.text} size={22} />
        </TouchableOpacity>
        <Text style={s.logo}>GLOSSIA</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.divider} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={s.identityBlock}>
          {profile?.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={s.avatarPhoto} />
          ) : (
            <View style={s.avatar}>
              <Text style={s.avatarLetter}>{(profile?.username || username)?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
          <Text style={s.username}>{profile?.username || username}</Text>

          {rank && (
            <View style={s.rankBlock}>
              <View style={s.rankRow}>
                <Text style={s.rankName}>{rank.name.toUpperCase()}</Text>
                {!rank.isMax && <Text style={s.rankNext}>→ {rank.nextName}</Text>}
              </View>
              <View style={s.rankTrack}>
                <View style={[s.rankFill, { width: `${rank.progress * 100}%` }]} />
              </View>
              {!rank.isMax && (
                <Text style={s.rankHint}>{rank.streak} / {rank.next} 🔥</Text>
              )}
            </View>
          )}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },
  backBtn: { width: 36, alignItems: 'flex-start' },
  logo:    { fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: 6 },
  divider: { height: 1, backgroundColor: C.border },

  identityBlock: { alignItems: 'center', paddingVertical: 32 },
  avatar:        { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  avatarPhoto:   { width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: C.border },
  avatarLetter:  { fontSize: 28, fontWeight: '800', color: C.text },
  username:      { fontSize: 22, fontWeight: '800', color: C.text, marginTop: 14 },

  rankBlock:  { width: '70%', marginTop: 16, gap: 6 },
  rankRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rankName:   { fontSize: 11, fontWeight: '800', color: C.text, letterSpacing: 2 },
  rankNext:   { fontSize: 10, color: C.muted, letterSpacing: 1 },
  rankTrack:  { height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  rankFill:   { height: '100%', backgroundColor: C.yellow, borderRadius: 2 },
  rankHint:   { fontSize: 10, color: C.muted, textAlign: 'right', letterSpacing: 1 },

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
});
