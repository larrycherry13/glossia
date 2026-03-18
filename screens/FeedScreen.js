import { AlertCircle, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GuestGate from '../components/GuestGate';
import { useAuth } from '../services/AuthContext';
import { useTranslation } from '../services/LanguageContext';
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
  const user = useAuth();
  const { t } = useTranslation();

  if (!user) {
    return <GuestGate title={t('gate_feed_title')} subtitle={t('gate_feed_sub')} />;
  }

  return <FeedContent />;
}

function FeedContent() {
  const [feed, setFeed] = useState([]);
  const [friendUids, setFriendUids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setError('Not authenticated');
      return;
    }
    try {
      const unsub = subscribeFriends(uid, (friends) => {
        setFriendUids(friends.map(f => f.friendUid));
      });
      return unsub;
    } catch (e) {
      setError('Failed to load friends');
    }
  }, [uid]);

  useEffect(() => {
    setLoading(true);
    try {
      const unsub = subscribeFeed(friendUids, (items) => {
        setFeed(items);
        setLoading(false);
      });
      return unsub;
    } catch (e) {
      setError('Failed to load feed');
      setLoading(false);
    }
  }, [friendUids]);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>GLOSSIA</Text>
        <Text style={s.headerLabel}>FEED</Text>
      </View>
      <View style={s.divider} />

      {loading ? (
        <View style={s.center}><Text style={s.empty}>Loading…</Text></View>
      ) : feed.length === 0 ? (
        <View style={s.center}>
          <Text style={s.empty}>
            {friendUids.length === 0
              ? 'Add friends to see their activity.'
              : 'No recent plays from your friends.'}
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

      {error && (
        <View style={s.errorBanner}>
          <View style={s.errorContent}>
            <AlertCircle color={C.red} size={18} />
            <Text style={s.errorText}>{error}</Text>
          </View>
          <TouchableOpacity onPress={() => setError(null)} activeOpacity={0.7}>
            <X color={C.muted} size={20} />
          </TouchableOpacity>
        </View>
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

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#2C1515', borderTopWidth: 1, borderColor: C.red,
    paddingVertical: 14, paddingHorizontal: 16, gap: 12,
  },
  errorContent: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  errorText: { flex: 1, fontSize: 13, color: C.red, fontWeight: '500' },
});
