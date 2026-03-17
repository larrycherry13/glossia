import { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../services/firebase';
import { subscribeFeed, subscribeFriends } from '../services/firestoreService';

const C = {
  bg: '#111111', border: '#2C2C2C', text: '#FFFFFF',
  muted: '#818384', green: '#538D4E', yellow: '#B59F3B', red: '#C0392B',
};

function tileColor(score) {
  if (score >= 80) return C.green;
  if (score >= 55) return C.yellow;
  return C.red;
}

function timeAgo(timestamp) {
  if (!timestamp?.toDate) return '';
  const diff = (Date.now() - timestamp.toDate().getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

function FeedItem({ item }) {
  const color = tileColor(item.score);
  return (
    <View style={s.item}>
      <View style={s.itemTop}>
        <Text style={s.username}>{item.username}</Text>
        <Text style={s.time}>{timeAgo(item.timestamp)}</Text>
      </View>
      <View style={s.itemBottom}>
        <View style={s.themeBlock}>
          <Text style={s.theme}>{item.theme}</Text>
          <Text style={s.consigne}>{item.consigne}</Text>
        </View>
        <View style={[s.scoreTile, { borderColor: color }]}>
          <Text style={[s.scoreNum, { color }]}>{item.score}</Text>
        </View>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const [feed, setFeed] = useState([]);
  const [friendUids, setFriendUids] = useState([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeFriends(uid, (friends) => {
      setFriendUids(friends.map(f => f.friendUid));
    });
    return unsub;
  }, [uid]);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeFeed(friendUids, (items) => {
      setFeed(items);
      setLoading(false);
    });
    return unsub;
  }, [friendUids]);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>GLOSSIA</Text>
        <Text style={s.headerLabel}>FEED</Text>
      </View>
      <View style={s.divider} />

      {loading ? (
        <View style={s.center}><Text style={s.empty}>Chargement…</Text></View>
      ) : feed.length === 0 ? (
        <View style={s.center}>
          <Text style={s.empty}>
            {friendUids.length === 0
              ? 'Ajoute des amis pour voir leur activité.'
              : 'Aucune partie récente de tes amis.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <FeedItem item={item} />}
          ItemSeparatorComponent={() => <View style={s.divider} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  logo:   { fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: 6 },
  headerLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 2 },
  divider:{ height: 1, backgroundColor: C.border },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:  { fontSize: 14, color: C.muted, textAlign: 'center', paddingHorizontal: 32, lineHeight: 22 },

  item:       { paddingHorizontal: 24, paddingVertical: 20 },
  itemTop:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  username:   { fontSize: 13, fontWeight: '700', color: C.text, letterSpacing: 0.5 },
  time:       { fontSize: 11, color: C.muted },
  itemBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  themeBlock: { flex: 1 },
  theme:      { fontSize: 15, fontWeight: '700', color: C.text },
  consigne:   { fontSize: 12, color: C.muted, marginTop: 3 },
  scoreTile:  { width: 52, height: 52, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  scoreNum:   { fontSize: 18, fontWeight: '900' },
});
