import { Audio } from 'expo-av';
import { Pause, Play, RotateCcw, Share2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
  bg:     '#111111',
  border: '#2C2C2C',
  text:   '#FFFFFF',
  muted:  '#818384',
  green:  '#538D4E',
  yellow: '#B59F3B',
  red:    '#C0392B',
};

function tileColor(score) {
  if (score >= 80) return C.green;
  if (score >= 55) return C.yellow;
  return C.red;
}

function scoreGrade(score) {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 55) return 'CORRECT';
  return 'À RETRAVAILLER';
}

function scoreSquare(score) {
  if (score >= 80) return '🟩';
  if (score >= 55) return '🟨';
  return '🟥';
}


function ScoreBar({ label, value, max, delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  const color = value / max >= 0.8 ? C.green : value / max >= 0.55 ? C.yellow : C.red;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value,
      duration: 900,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    return () => anim.removeListener(id);
  }, []);

  const widthPct = anim.interpolate({ inputRange: [0, max], outputRange: ['0%', '100%'] });

  return (
    <View style={bar.row}>
      <View style={bar.labelRow}>
        <Text style={bar.label}>{label}</Text>
        <Text style={[bar.score, { color }]}>{display}<Text style={bar.max}>/{max}</Text></Text>
      </View>
      <View style={bar.track}>
        <Animated.View style={[bar.fill, { width: widthPct, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const bar = StyleSheet.create({
  row:      { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label:    { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 2 },
  score:    { fontSize: 13, fontWeight: '800' },
  max:      { fontWeight: '400', color: C.muted },
  track:    { height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  fill:     { height: '100%', borderRadius: 2 },
});

function AnimatedScore({ score }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    Animated.timing(anim, {
      toValue: score, duration: 1000, easing: Easing.out(Easing.quad), useNativeDriver: false,
    }).start();
    const id = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => anim.removeListener(id);
  }, [score]);
  const color = tileColor(score);
  return (
    <View style={[ss.tile, { borderColor: color }]}>
      <Text style={[ss.num, { color }]}>{display}</Text>
      <Text style={[ss.grade, { color }]}>{scoreGrade(score)}</Text>
    </View>
  );
}

const ss = StyleSheet.create({
  tile:  { width: 130, height: 130, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  num:   { fontSize: 52, fontWeight: '900', lineHeight: 56 },
  grade: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginTop: 4 },
});

export default function ResultScreen({ route, navigation }) {
  const {
    score, fluidity, fillers_score, relevance,
    feedback, fillers_count,
    theme, consigne, transcript, audioUri,
    streak, history = [],
  } = route.params;

  const [soundStatus, setSoundStatus] = useState('idle');
  const soundRef = useRef(null);

  useEffect(() => { return () => { soundRef.current?.unloadAsync(); }; }, []);

  async function handlePlayPause() {
    try {
      if (soundStatus === 'idle') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });
        soundRef.current = sound;
        setSoundStatus('playing');
        sound.setOnPlaybackStatusUpdate((st) => {
          if (st.didJustFinish) { setSoundStatus('idle'); sound.unloadAsync(); soundRef.current = null; }
        });
      } else if (soundStatus === 'playing') {
        await soundRef.current.pauseAsync(); setSoundStatus('paused');
      } else {
        await soundRef.current.playAsync(); setSoundStatus('playing');
      }
    } catch (e) { console.warn(e.message); }
  }

  async function handleShare() {
    const squares = history.map(h => scoreSquare(h.score)).join('');
    try {
      await Share.share({
        message:
          `GLOSSIA — Jeu d'éloquence\n\n` +
          `"${theme}"\n\n` +
          `Score : ${score}/100 ${scoreSquare(score)}\n` +
          `Mots parasites : ${fillers_count}\n\n` +
          `Mes 5 derniers : ${squares}`,
      });
    } catch {}
  }

  function handleReplay() {
    soundRef.current?.unloadAsync();
    navigation.goBack();
  }

  const fillerColor = fillers_count === 0 ? C.green : fillers_count <= 2 ? C.yellow : C.red;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>GLOSSIA</Text>
        {streak > 0 && (
          <View style={s.streakRow}>
            <Text>🔥</Text>
            <Text style={s.streakNum}>{streak}</Text>
          </View>
        )}
      </View>
      <View style={s.divider} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Score */}
        <View style={s.scoreSection}>
          <AnimatedScore score={score} />
          <Text style={s.scoreOutOf}>/100</Text>
        </View>

        <View style={s.divider} />

        {/* Feedback — héro */}
        <View style={s.feedbackBlock}>
          <Text style={s.sectionLabel}>RETOUR</Text>
          <Text style={s.feedbackText}>{feedback}</Text>
        </View>

        <View style={s.divider} />

        {/* Score breakdown */}
        <View style={s.breakdownBlock}>
          <Text style={s.sectionLabel}>DÉTAIL</Text>
          <ScoreBar label="FLUIDITÉ"       value={fluidity}      max={30} delay={0}   />
          <ScoreBar label="MOTS PARASITES" value={fillers_score} max={30} delay={150} />
          <ScoreBar label="PERTINENCE"     value={relevance}     max={40} delay={300} />
        </View>

        <View style={s.divider} />

        {/* Fillers count */}
        <View style={s.row}>
          <Text style={s.sectionLabel}>MOTS PARASITES</Text>
          <View style={s.rowRight}>
            <Text style={[s.bigVal, { color: fillerColor }]}>{fillers_count}</Text>
            <Text style={[s.sub, { color: fillerColor }]}>
              {fillers_count === 0 ? 'AUCUN' : fillers_count <= 2 ? 'QUELQUES-UNS' : 'TROP'}
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Theme recap */}
        <View style={s.row}>
          <Text style={s.sectionLabel}>THÈME</Text>
          <View style={s.rowRight}>
            <Text style={s.themeVal}>{theme}</Text>
            <Text style={s.sub}>{consigne}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* History — last 5 sessions */}
        {history.length > 0 && (
          <>
            <View style={s.historyBlock}>
              <Text style={s.sectionLabel}>HISTORIQUE</Text>
              <View style={s.historyRow}>
                {history.map((h, i) => (
                  <View key={i} style={[s.histTile, { borderColor: tileColor(h.score) }]}>
                    <Text style={[s.histScore, { color: tileColor(h.score) }]}>{h.score}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={s.divider} />
          </>
        )}

        {/* Transcript */}
        {transcript ? (
          <>
            <View style={s.feedbackBlock}>
              <Text style={s.sectionLabel}>TRANSCRIPTION</Text>
              <Text style={s.transcriptText}>{transcript}</Text>
            </View>
            <View style={s.divider} />
          </>
        ) : null}

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity style={s.btnSecondary} onPress={handlePlayPause} activeOpacity={0.7}>
            {soundStatus === 'playing' ? <Pause color={C.text} size={15} /> : <Play color={C.text} size={15} />}
            <Text style={s.btnSecondaryText}>
              {soundStatus === 'playing' ? 'Pause' : soundStatus === 'paused' ? 'Reprendre' : 'Réécouter'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btnSecondary} onPress={handleShare} activeOpacity={0.7}>
            <Share2 color={C.text} size={15} />
            <Text style={s.btnSecondaryText}>Partager</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[s.btnPrimary, { marginHorizontal: 24, marginTop: 12 }]} onPress={handleReplay} activeOpacity={0.7}>
          <RotateCcw color="#111" size={15} />
          <Text style={s.btnPrimaryText}>Nouvel essai</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 48 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16,
  },
  logo:      { fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: 6 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakNum: { fontSize: 18, fontWeight: '700', color: C.text },
  divider:   { height: 1, backgroundColor: C.border },

  scoreSection: { alignItems: 'center', paddingVertical: 36, gap: 6 },
  scoreOutOf:   { fontSize: 12, color: C.muted, letterSpacing: 1 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 2, marginBottom: 14 },

  feedbackBlock:  { paddingHorizontal: 24, paddingVertical: 22 },
  feedbackText:   { fontSize: 16, color: C.text, lineHeight: 26 },
  breakdownBlock: { paddingHorizontal: 24, paddingVertical: 22 },
  transcriptText: { fontSize: 14, color: C.muted, lineHeight: 22, fontStyle: 'italic' },

  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, paddingVertical: 20, gap: 16 },
  rowRight: { flex: 1, alignItems: 'flex-end' },
  bigVal:   { fontSize: 28, fontWeight: '900' },
  themeVal: { fontSize: 16, fontWeight: '700', color: C.text, textAlign: 'right' },
  sub:      { fontSize: 10, color: C.muted, marginTop: 2, textAlign: 'right', letterSpacing: 1 },

  historyBlock: { paddingHorizontal: 24, paddingVertical: 22 },
  historyRow:   { flexDirection: 'row', gap: 10 },
  histTile:     { width: 52, height: 52, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  histScore:    { fontSize: 16, fontWeight: '800' },

  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 24 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.text, borderRadius: 4, paddingVertical: 16,
  },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#111', letterSpacing: 1 },
  btnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 16,
  },
  btnSecondaryText: { fontSize: 14, fontWeight: '700', color: C.text, letterSpacing: 1 },
});
