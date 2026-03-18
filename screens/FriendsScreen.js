import { AlertCircle, ChevronRight, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import GuestGate from '../components/GuestGate';
import { useAuth } from '../services/AuthContext';
import { useTranslation } from '../services/LanguageContext';
import { auth } from '../services/firebase';
import {
  acceptFriendRequest,
  declineFriendRequest,
  searchUsers,
  sendFriendRequest,
  subscribeDailyPodium,
  subscribeFriends,
  subscribePendingRequests,
} from '../services/firestoreService';

const C = {
  bg: '#111111', border: '#2C2C2C', text: '#FFFFFF',
  muted: '#818384', green: '#538D4E', yellow: '#B59F3B', red: '#C0392B',
};

const MEDALS = ['🥇', '🥈', '🥉'];

function tileColor(score) {
  if (score >= 80) return C.green;
  if (score >= 55) return C.yellow;
  return C.red;
}

export default function FriendsScreen() {
  const user = useAuth();
  const { t } = useTranslation();
  if (!user) {
    return <GuestGate title={t('gate_friends_title')} subtitle={t('gate_friends_sub')} />;
  }
  return <FriendsContent />;
}

function FriendsContent() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [tab, setTab] = useState(0);
  const [friends, setFriends] = useState([]);
  const [friendUids, setFriendUids] = useState([]);
  const [podium, setPodium] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [loadingRequests, setLoadingRequests] = useState({});
  const [msg, setMsg] = useState(null);

  const uid = auth.currentUser?.uid;
  const TABS = [t('gate_friends_title'), 'DEMANDES', 'RECHERCHE'];

  useEffect(() => {
    if (!uid) return;
    const u1 = subscribeFriends(uid, data => {
      setFriends(data);
      setFriendUids(data.map(f => f.friendUid));
    });
    const u2 = subscribePendingRequests(uid, setRequests);
    return () => { u1(); u2(); };
  }, [uid]);

  useEffect(() => {
    const unsub = subscribeDailyPodium(friendUids, setPodium);
    return unsub;
  }, [friendUids]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setError(null);
    setSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
      if (results.length === 0) setMsg('No players found.');
    } catch (e) {
      setError(e.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(targetUid) {
    setError(null);
    try {
      await sendFriendRequest(targetUid);
      setMsg('Friend request sent!');
      setSearchQuery('');
      setSearchResults([]);
    } catch (e) {
      setError(e.message || 'Failed to send request');
    }
  }

  async function handleAccept(id) {
    setError(null);
    setLoadingRequests(prev => ({ ...prev, [id]: true }));
    try {
      await acceptFriendRequest(id);
    } catch (e) {
      setError(e.message || 'Failed to accept request');
    } finally {
      setLoadingRequests(prev => ({ ...prev, [id]: false }));
    }
  }

  async function handleDecline(id) {
    setError(null);
    setLoadingRequests(prev => ({ ...prev, [id]: true }));
    try {
      await declineFriendRequest(id);
    } catch (e) {
      setError(e.message || 'Failed to decline request');
    } finally {
      setLoadingRequests(prev => ({ ...prev, [id]: false }));
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>GLOSSIA</Text>
        <Text style={s.headerLabel}>{t('gate_friends_title')}</Text>
      </View>
      <View style={s.divider} />

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((label, i) => (
          <TouchableOpacity key={i} style={[s.tab, tab === i && s.tabActive]} onPress={() => setTab(i)} activeOpacity={0.7}>
            <Text style={[s.tabText, tab === i && s.tabTextActive]}>
              {label}{label === 'DEMANDES' && requests.length > 0 ? ` (${requests.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.divider} />

      {/* AMIS + PODIUM */}
      {tab === 0 && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Podium */}
          <View style={s.podiumBlock}>
            <Text style={s.sectionLabel}>{t('podium_title')}</Text>
            {podium.length === 0 ? (
              <Text style={s.empty}>{t('podium_empty')}</Text>
            ) : (
              <View style={s.podiumRow}>
                {podium.map((entry, i) => {
                  const color = tileColor(entry.score);
                  const isFirst = i === 0;
                  return (
                    <View key={entry.id} style={[s.podiumCard, isFirst && s.podiumCardFirst]}>
                      <Text style={s.medal}>{MEDALS[i]}</Text>
                      <View style={[s.scoreTile, { borderColor: color }]}>
                        <Text style={[s.scoreNum, { color }]}>{entry.score}</Text>
                      </View>
                      <Text style={[s.podiumName, isFirst && s.podiumNameFirst]} numberOfLines={1}>
                        {entry.username}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={s.divider} />

          {/* Friends list */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionLabel}>LISTE</Text>
          </View>
          {friends.length === 0 ? (
            <Text style={[s.empty, { paddingHorizontal: 24 }]}>{t('no_friends')}</Text>
          ) : (
            friends.map((item, i) => (
              <View key={item.friendshipId}>
                <TouchableOpacity
                  style={s.row}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('FriendProfile', { friendUid: item.friendUid, username: item.username })}
                >
                  {item.photoURL ? (
                    <Image source={{ uri: item.photoURL }} style={s.friendAvatar} />
                  ) : (
                    <View style={s.friendAvatarPlaceholder}>
                      <Text style={s.friendAvatarLetter}>{item.username?.[0]?.toUpperCase() || '?'}</Text>
                    </View>
                  )}
                  <Text style={s.username}>{item.username}</Text>
                  <ChevronRight color={C.muted} size={16} />
                </TouchableOpacity>
                {i < friends.length - 1 && <View style={s.divider} />}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* DEMANDES */}
      {tab === 1 && (
        requests.length === 0
          ? <View style={s.center}><Text style={s.empty}>{t('no_requests')}</Text></View>
          : <FlatList
              data={requests}
              keyExtractor={r => r.id}
              renderItem={({ item }) => (
                <View style={s.requestRow}>
                  <Text style={s.username}>{item.senderUsername}</Text>
                  <View style={s.requestActions}>
                    <TouchableOpacity
                      style={s.acceptBtn}
                      onPress={() => handleAccept(item.id)}
                      activeOpacity={0.7}
                      disabled={loadingRequests[item.id]}
                    >
                      {loadingRequests[item.id]
                        ? <ActivityIndicator color="#111" size="small" />
                        : <Text style={s.acceptText}>Accept</Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.declineBtn}
                      onPress={() => handleDecline(item.id)}
                      activeOpacity={0.7}
                      disabled={loadingRequests[item.id]}
                    >
                      <Text style={s.declineText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={s.divider} />}
            />
      )}

      {/* RECHERCHE */}
      {tab === 2 && (
        <View style={s.searchContainer}>
          <View style={s.searchRow}>
            <TextInput
              style={s.searchInput}
              placeholder={t('search_placeholder')}
              placeholderTextColor={C.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            <TouchableOpacity style={s.searchBtn} onPress={handleSearch} activeOpacity={0.7}>
              <Text style={s.searchBtnText}>OK</Text>
            </TouchableOpacity>
          </View>

          {msg ? <Text style={s.msg}>{msg}</Text> : null}

          {searching
            ? <ActivityIndicator color={C.text} style={{ marginTop: 24 }} />
            : <FlatList
                data={searchResults}
                keyExtractor={u => u.uid}
                renderItem={({ item }) => (
                  <View style={s.requestRow}>
                    <Text style={s.username}>{item.username}</Text>
                    <TouchableOpacity
                      style={s.acceptBtn}
                      onPress={() => handleAdd(item.uid)}
                      activeOpacity={0.7}
                      disabled={loadingRequests[item.uid]}
                    >
                      {loadingRequests[item.uid]
                        ? <ActivityIndicator color="#111" size="small" />
                        : <Text style={s.acceptText}>+ Add</Text>
                      }
                    </TouchableOpacity>
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={s.divider} />}
              />
          }
        </View>
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
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  logo:        { fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: 6 },
  headerLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 2 },
  divider:     { height: 1, backgroundColor: C.border },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:       { fontSize: 14, color: C.muted, paddingVertical: 16 },

  tabRow:        { flexDirection: 'row' },
  tab:           { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive:     { borderBottomWidth: 2, borderBottomColor: C.text },
  tabText:       { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.5 },
  tabTextActive: { color: C.text },

  // Podium
  podiumBlock:     { paddingHorizontal: 24, paddingVertical: 22 },
  sectionLabel:    { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 2, marginBottom: 18 },
  podiumRow:       { flexDirection: 'row', justifyContent: 'center', gap: 12, alignItems: 'flex-end' },
  podiumCard:      { alignItems: 'center', flex: 1, gap: 8 },
  podiumCardFirst: { transform: [{ scale: 1.08 }] },
  medal:           { fontSize: 22 },
  scoreTile:       { width: 58, height: 58, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  scoreNum:        { fontSize: 20, fontWeight: '900' },
  podiumName:      { fontSize: 12, fontWeight: '600', color: C.muted, textAlign: 'center' },
  podiumNameFirst: { color: C.text, fontWeight: '700' },

  sectionHeader: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 4 },

  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 12 },
  username: { fontSize: 15, fontWeight: '600', color: C.text, flex: 1 },
  friendAvatar:            { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  friendAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  friendAvatarLetter:      { fontSize: 16, fontWeight: '700', color: C.text },

  requestRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptBtn:      { backgroundColor: C.text, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 14 },
  acceptText:     { fontSize: 12, fontWeight: '700', color: '#111' },
  declineBtn:     { borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 14 },
  declineText:    { fontSize: 12, fontWeight: '700', color: C.muted },

  searchContainer: { flex: 1, paddingTop: 20 },
  searchRow:       { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 8 },
  searchInput:     { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, color: C.text, backgroundColor: '#1A1A1A' },
  searchBtn:       { backgroundColor: C.text, borderRadius: 4, paddingHorizontal: 18, justifyContent: 'center' },
  searchBtnText:   { fontSize: 13, fontWeight: '700', color: '#111' },
  msg:             { fontSize: 13, color: C.green, textAlign: 'center', marginBottom: 12 },

  errorBanner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2C1515', borderTopWidth: 1, borderColor: C.red, paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  errorContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText:    { flex: 1, fontSize: 13, color: C.red, fontWeight: '500' },
});
