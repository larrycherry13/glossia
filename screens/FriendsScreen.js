import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../services/firebase';
import {
  acceptFriendRequest,
  declineFriendRequest,
  searchUsers,
  sendFriendRequest,
  subscribeFriends,
  subscribePendingRequests,
} from '../services/firestoreService';

const C = {
  bg: '#111111', border: '#2C2C2C', text: '#FFFFFF',
  muted: '#818384', green: '#538D4E', red: '#C0392B',
};

const TABS = ['AMIS', 'DEMANDES', 'RECHERCHE'];

export default function FriendsScreen() {
  const [tab, setTab] = useState(0);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const u1 = subscribeFriends(uid, setFriends);
    const u2 = subscribePendingRequests(uid, setRequests);
    return () => { u1(); u2(); };
  }, [uid]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(targetUid) {
    setMsg(null);
    try {
      await sendFriendRequest(targetUid);
      setMsg('Demande envoyée !');
    } catch (e) { setMsg(e.message); }
  }

  async function handleAccept(id) {
    await acceptFriendRequest(id);
  }

  async function handleDecline(id) {
    await declineFriendRequest(id);
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>GLOSSIA</Text>
        <Text style={s.headerLabel}>AMIS</Text>
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

      {/* AMIS */}
      {tab === 0 && (
        friends.length === 0
          ? <View style={s.center}><Text style={s.empty}>Aucun ami pour l'instant.</Text></View>
          : <FlatList
              data={friends}
              keyExtractor={f => f.friendshipId}
              renderItem={({ item }) => (
                <View style={s.row}>
                  <Text style={s.username}>{item.username}</Text>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={s.divider} />}
            />
      )}

      {/* DEMANDES */}
      {tab === 1 && (
        requests.length === 0
          ? <View style={s.center}><Text style={s.empty}>Aucune demande en attente.</Text></View>
          : <FlatList
              data={requests}
              keyExtractor={r => r.id}
              renderItem={({ item }) => (
                <View style={s.requestRow}>
                  <Text style={s.username}>{item.senderUsername}</Text>
                  <View style={s.requestActions}>
                    <TouchableOpacity style={s.acceptBtn} onPress={() => handleAccept(item.id)} activeOpacity={0.7}>
                      <Text style={s.acceptText}>Accepter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.declineBtn} onPress={() => handleDecline(item.id)} activeOpacity={0.7}>
                      <Text style={s.declineText}>Refuser</Text>
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
              placeholder="Rechercher un joueur…"
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
                    <TouchableOpacity style={s.acceptBtn} onPress={() => handleAdd(item.uid)} activeOpacity={0.7}>
                      <Text style={s.acceptText}>+ Ajouter</Text>
                    </TouchableOpacity>
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={s.divider} />}
              />
          }
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  logo:    { fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: 6 },
  headerLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 2 },
  divider: { height: 1, backgroundColor: C.border },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:   { fontSize: 14, color: C.muted, textAlign: 'center', paddingHorizontal: 32 },

  tabRow:      { flexDirection: 'row' },
  tab:         { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive:   { borderBottomWidth: 2, borderBottomColor: C.text },
  tabText:     { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.5 },
  tabTextActive: { color: C.text },

  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18 },
  username: { fontSize: 15, fontWeight: '600', color: C.text },

  requestRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptBtn:  { backgroundColor: C.text, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 14 },
  acceptText: { fontSize: 12, fontWeight: '700', color: '#111' },
  declineBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 14 },
  declineText:{ fontSize: 12, fontWeight: '700', color: C.muted },

  searchContainer: { flex: 1, paddingTop: 20 },
  searchRow:   { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, color: C.text, backgroundColor: '#1A1A1A' },
  searchBtn:   { backgroundColor: C.text, borderRadius: 4, paddingHorizontal: 18, justifyContent: 'center' },
  searchBtnText: { fontSize: 13, fontWeight: '700', color: '#111' },
  msg:         { fontSize: 13, color: C.green, textAlign: 'center', marginBottom: 12 },
});
