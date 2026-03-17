import { Audio } from 'expo-av';
import { Mic } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRandomChallenge } from '../services/challenges';
import { analyzeWithGPT, transcribeAudio } from '../services/openai';
import { saveScore } from '../services/firestoreService';
import { getHistory, getStreak, recordPlay, saveToHistory } from '../services/streak';

const RECORD_DURATION_SEC = 10;

const C = {
  bg:     '#111111',
  card:   '#1A1A1A',
  border: '#2C2C2C',
  text:   '#FFFFFF',
  muted:  '#818384',
  green:  '#538D4E',
  yellow: '#B59F3B',
  red:    '#C0392B',
};

// Phases: idle → theme_reveal → countdown_start → recording → analyzing → (Result)

export default function HomeScreen({ navigation }) {
  const [phase, setPhase] = useState('idle');
  const [countdown, setCountdown] = useState(RECORD_DURATION_SEC);
  const [preCount, setPreCount] = useState(3);
  const [analysisStep, setAnalysisStep] = useState(0); // 0=transcription 1=évaluation
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState(null);
  const [challenge, setChallenge] = useState(getRandomChallenge());

  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const preCountTimer = useRef(null);

  const revealAnim   = useRef(new Animated.Value(0)).current;
  const preCountAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') setError('Permission microphone refusée.');
      setStreak(await getStreak());
    })();
    return () => {
      clearInterval(timerRef.current);
      clearInterval(preCountTimer.current);
      progressAnimation.current?.stop();
    };
  }, []);

  // Theme reveal animation
  useEffect(() => {
    if (phase === 'theme_reveal') {
      revealAnim.setValue(0);
      Animated.timing(revealAnim, {
        toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true,
      }).start();
    }
  }, [phase]);

  // 3-2-1 countdown before recording
  useEffect(() => {
    if (phase !== 'countdown_start') return;
    setPreCount(3);
    let count = 3;

    function animatePop() {
      preCountAnim.setValue(1.4);
      Animated.timing(preCountAnim, {
        toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true,
      }).start();
    }
    animatePop();

    preCountTimer.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(preCountTimer.current);
        handleStartRecording();
      } else {
        setPreCount(count);
        animatePop();
      }
    }, 1000);

    return () => clearInterval(preCountTimer.current);
  }, [phase]);

  async function handleStartRecording() {
    setError(null);
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: false,
        android: {
          extension: '.m4a', outputFormat: 2, audioEncoder: 3,
          sampleRate: 44100, numberOfChannels: 1, bitRate: 128000,
        },
        ios: {
          extension: '.m4a', outputFormat: 'aac ', audioQuality: 127,
          sampleRate: 44100, numberOfChannels: 1, bitRate: 128000,
          linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false,
        },
        web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
      });
      recordingRef.current = recording;

      setPhase('recording');
      setCountdown(RECORD_DURATION_SEC);

      progressAnim.setValue(0);
      progressAnimation.current = Animated.timing(progressAnim, {
        toValue: 1, duration: RECORD_DURATION_SEC * 1000,
        easing: Easing.linear, useNativeDriver: false,
      });
      progressAnimation.current.start();

      let remaining = RECORD_DURATION_SEC;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) { clearInterval(timerRef.current); finishRecording(); }
      }, 1000);
    } catch (e) {
      setError('Impossible de démarrer : ' + e.message);
      setPhase('idle');
    }
  }

  async function finishRecording() {
    progressAnimation.current?.stop();
    setPhase('analyzing');
    setAnalysisStep(0);
    try {
      const recording = recordingRef.current;
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();

      const transcript = await transcribeAudio(uri);
      setAnalysisStep(1);
      const analysis = await analyzeWithGPT(transcript, challenge.theme);

      const newStreak = await recordPlay();
      await saveToHistory(analysis.score, challenge.theme);
      await saveScore({ ...analysis, theme: challenge.theme, consigne: challenge.consigne });
      const history = await getHistory();

      navigation.navigate('Result', {
        ...analysis,
        theme: challenge.theme,
        consigne: challenge.consigne,
        transcript,
        audioUri: uri,
        streak: newStreak,
        history,
      });
    } catch (e) {
      setError('Erreur : ' + e.message);
    } finally {
      setPhase('idle');
      setCountdown(RECORD_DURATION_SEC);
      progressAnim.setValue(0);
    }
  }

  // ── Phases ─────────────────────────────────────────────────────────────────

  function renderIdle() {
    return (
      <View style={s.centerCol}>
        <Text style={s.idleHint}>Prêt pour le défi ?</Text>
        <TouchableOpacity
          style={s.btn}
          onPress={() => { setChallenge(getRandomChallenge()); setPhase('theme_reveal'); }}
          activeOpacity={0.7}
        >
          <Text style={s.btnText}>Commencer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderThemeReveal() {
    const opacity = revealAnim;
    const translateY = revealAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
    return (
      <Animated.View style={[s.card, { opacity, transform: [{ translateY }] }]}>
        <Text style={s.cardCategory}>THÈME</Text>
        <Text style={s.cardTheme}>{challenge.theme}</Text>
        <Text style={s.cardConsigne}>{challenge.consigne}</Text>
        <View style={s.divider} />
        <TouchableOpacity
          style={s.btn}
          onPress={() => setPhase('countdown_start')}
          activeOpacity={0.7}
        >
          <Mic color="#111" size={16} style={{ marginRight: 8 }} />
          <Text style={[s.btnText, { color: '#111' }]}>Je suis prêt</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  function renderCountdownStart() {
    return (
      <View style={s.centerCol}>
        <Animated.Text style={[s.preCountNum, { transform: [{ scale: preCountAnim }] }]}>
          {preCount}
        </Animated.Text>
        <Text style={s.preCountLabel}>Préparez-vous…</Text>
      </View>
    );
  }

  function renderRecording() {
    const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    const isUrgent = countdown <= 3;
    return (
      <View style={s.recordingWrapper}>
        <View style={s.recordingThemeBlock}>
          <Text style={s.cardCategory}>THÈME</Text>
          <Text style={s.cardTheme}>{challenge.theme}</Text>
          <Text style={s.cardConsigne}>{challenge.consigne}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.centerCol}>
          <View style={[s.countdownBox, isUrgent && { borderColor: C.red }]}>
            <Text style={[s.countdownNum, isUrgent && { color: C.red }]}>{countdown}</Text>
          </View>
          <Text style={s.recordLabel}>Parlez maintenant</Text>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, {
              width: progressWidth,
              backgroundColor: isUrgent ? C.red : C.text,
            }]} />
          </View>
        </View>
      </View>
    );
  }

  const ANALYSIS_STEPS = [
    'Transcription audio…',
    'Évaluation du discours…',
  ];

  function renderAnalyzing() {
    return (
      <View style={s.centerCol}>
        <View style={s.analysisSteps}>
          {ANALYSIS_STEPS.map((label, i) => (
            <View key={i} style={s.analysisRow}>
              <View style={[s.analysisDot, {
                backgroundColor: i < analysisStep ? C.green : i === analysisStep ? C.text : C.border,
              }]} />
              <Text style={[s.analysisLabel, {
                color: i < analysisStep ? C.green : i === analysisStep ? C.text : C.muted,
              }]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>GLOSSIA</Text>
        {streak > 0 && (
          <View style={s.streakRow}>
            <Text style={s.streakFire}>🔥</Text>
            <Text style={s.streakNum}>{streak}</Text>
          </View>
        )}
      </View>
      <View style={s.dividerFull} />

      <View style={s.content}>
        {phase === 'idle'            && renderIdle()}
        {phase === 'theme_reveal'    && renderThemeReveal()}
        {phase === 'countdown_start' && renderCountdownStart()}
        {phase === 'recording'       && renderRecording()}
        {phase === 'analyzing'       && renderAnalyzing()}
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16,
  },
  logo:       { fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: 6 },
  streakRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakFire: { fontSize: 16 },
  streakNum:  { fontSize: 18, fontWeight: '700', color: C.text },
  dividerFull:{ height: 1, backgroundColor: C.border },

  centerCol: { alignItems: 'center' },
  idleHint:  { fontSize: 16, color: C.muted, marginBottom: 32 },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.text, borderRadius: 4,
    paddingVertical: 16, paddingHorizontal: 40, marginTop: 8,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: '#111', letterSpacing: 1 },

  card: { borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 28 },
  cardCategory: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 3, marginBottom: 12 },
  cardTheme:    { fontSize: 28, fontWeight: '800', color: C.text, lineHeight: 36, marginBottom: 10 },
  cardConsigne: { fontSize: 16, color: C.muted, lineHeight: 24 },
  divider:      { height: 1, backgroundColor: C.border, marginVertical: 24 },

  // 3-2-1
  preCountNum:   { fontSize: 96, fontWeight: '900', color: C.text },
  preCountLabel: { fontSize: 14, color: C.muted, letterSpacing: 2, marginTop: 12 },

  // Recording
  recordingWrapper:    { width: '100%' },
  recordingThemeBlock: {},
  countdownBox: {
    width: 100, height: 100, borderWidth: 2, borderColor: C.border,
    borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  countdownNum: { fontSize: 56, fontWeight: '900', color: C.text },
  recordLabel:  { fontSize: 13, color: C.muted, letterSpacing: 2, marginBottom: 28 },
  progressTrack:{ width: '100%', height: 2, backgroundColor: C.border },
  progressFill: { height: '100%' },

  // Analyzing
  analysisSteps: { gap: 20, alignItems: 'flex-start', width: '100%' },
  analysisRow:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  analysisDot:   { width: 10, height: 10, borderRadius: 5 },
  analysisLabel: { fontSize: 16, fontWeight: '600' },

  error: { textAlign: 'center', color: C.red, fontSize: 13, paddingBottom: 24, paddingHorizontal: 24 },
});
