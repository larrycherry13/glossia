import { Audio } from 'expo-av';
import { AlertCircle, Mic, X } from 'lucide-react-native';
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
import { getDailyChallenge, getRandomChallenge } from '../services/challenges';
import { useTranslation } from '../services/LanguageContext';
import { analyzeSession } from '../services/openai';
import { saveScore } from '../services/firestoreService';
import { getHistory, getStreak, hasPlayedToday, isFirstSession, recordPlay, saveToHistory } from '../services/streak';

const RECORD_DURATION_SEC = 30;

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

function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function HomeScreen({ navigation, route }) {
  const { t, lang, toggleLang } = useTranslation();
  const [phase, setPhase] = useState('idle');
  const [countdown, setCountdown] = useState(RECORD_DURATION_SEC);
  const [preCount, setPreCount] = useState(3);
  const [readCount, setReadCount] = useState(5);
  const [analysisStep, setAnalysisStep] = useState(0); // 0=transcription 1=évaluation
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [firstSession, setFirstSession] = useState(false);
  const [isPractice, setIsPractice] = useState(false);
  const [nextChallenge, setNextChallenge] = useState(getTimeUntilMidnight());

  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const preCountTimer = useRef(null);
  const readTimer = useRef(null);

  const revealAnim   = useRef(new Animated.Value(0)).current;
  const preCountAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(null);

  const midnightTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') setError(t('mic_denied'));
      setStreak(await getStreak());
      setChallenge(getDailyChallenge(lang));
      setAlreadyPlayed(await hasPlayedToday());
      setFirstSession(await isFirstSession());
    })();

    midnightTimer.current = setInterval(() => {
      setNextChallenge(getTimeUntilMidnight());
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(preCountTimer.current);
      clearInterval(readTimer.current);
      clearInterval(midnightTimer.current);
      progressAnimation.current?.stop();
    };
  }, []);

  // Theme reveal animation + auto read countdown
  useEffect(() => {
    if (phase === 'theme_reveal') {
      revealAnim.setValue(0);
      const readDuration = (firstSession && !isPractice) ? 15 : 5;
      setReadCount(readDuration);
      Animated.timing(revealAnim, {
        toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true,
      }).start();

      let count = readDuration;
      readTimer.current = setInterval(() => {
        count -= 1;
        setReadCount(count);
        if (count <= 0) {
          clearInterval(readTimer.current);
          setPhase('countdown_start');
        }
      }, 1000);

      return () => clearInterval(readTimer.current);
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
      if (!recording) throw new Error('No recording to process');
      
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      if (!uri) throw new Error('Failed to get recording URI');

      // Transcription + Analysis (Cloud Function)
      let transcript, analysis;
      try {
        const result = await analyzeSession(uri, challenge.theme, lang, firstSession);
        transcript = result.transcript;
        analysis = result;
        setAnalysisStep(1);
      } catch (e) {
        throw new Error(`Analysis failed: ${e.message}`);
      }

      // Save results
      try {
        let newStreak = streak;
        let history = [];
        if (!isPractice) {
          newStreak = await recordPlay();
          await saveToHistory(analysis.score, challenge.theme);
          await saveScore({ ...analysis, theme: challenge.theme, consigne: challenge.consigne, transcript });
          history = await getHistory();
          setAlreadyPlayed(true);
        }
        navigation.navigate('Result', {
          ...analysis,
          theme: challenge.theme,
          consigne: challenge.consigne,
          challengeId: challenge.challengeId,
          transcript,
          audioUri: uri,
          streak: newStreak,
          history,
          firstSession: firstSession && !isPractice,
          isPractice,
        });
      } catch (e) {
        throw new Error(`Failed to save results: ${e.message}`);
      }
    } catch (e) {
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setPhase('idle');
      setCountdown(RECORD_DURATION_SEC);
      progressAnim.setValue(0);
    }
  }

  // ── Phases ─────────────────────────────────────────────────────────────────

  function startPractice() {
    setIsPractice(true);
    setChallenge(getRandomChallenge(lang));
    setPhase('theme_reveal');
  }

  useEffect(() => {
    if (route.params?.startPractice) {
      navigation.setParams({ startPractice: false });
      startPractice();
    }
  }, [route.params?.startPractice]);

  function handleStart() {
    setIsPractice(false);
    setChallenge(getDailyChallenge(lang));
    setPhase('theme_reveal');
  }

  function renderIdle() {
    if (alreadyPlayed) {
      return (
        <View style={s.centerCol}>
          <Text style={s.doneTitle}>{t('done_title')}</Text>
          <Text style={s.doneSubtitle}>{t('done_subtitle')}</Text>
          <View style={s.countdownBlock}>
            <Text style={s.countdownLabel}>{t('next_label')}</Text>
            <Text style={s.countdownClock}>{nextChallenge}</Text>
          </View>
          <TouchableOpacity style={s.practiceBtn} onPress={startPractice} activeOpacity={0.7}>
            <Text style={s.practiceBtnText}>{t('practice_btn')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={s.centerCol}>
        <Text style={s.idleHint}>{t('ready_hint')}</Text>
        <TouchableOpacity
          style={s.btn}
          onPress={handleStart}
          activeOpacity={0.7}
        >
          <Text style={s.btnText}>{t('start_btn')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderThemeReveal() {
    const opacity = revealAnim;
    const translateY = revealAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
    const isUrgent = readCount <= 2;
    return (
      <Animated.View style={[s.card, { opacity, transform: [{ translateY }] }]}>
        <Text style={s.cardCategory}>{t('theme_label')}</Text>
        <Text style={s.cardTheme}>{challenge.theme}</Text>
        <Text style={s.cardConsigne}>{challenge.consigne}</Text>
        {firstSession && (
          <Text style={s.firstSessionHint}>{t('first_reassure')}</Text>
        )}
        <View style={s.divider} />
        <View style={s.readCountRow}>
          <Mic color={isUrgent ? C.red : C.muted} size={14} />
          <Text style={[s.readCountText, isUrgent && { color: C.red }]}>
            {readCount}s
          </Text>
        </View>
      </Animated.View>
    );
  }

  function renderCountdownStart() {
    return (
      <View style={s.centerCol}>
        <Animated.Text style={[s.preCountNum, { transform: [{ scale: preCountAnim }] }]}>
          {preCount}
        </Animated.Text>
        <Text style={s.preCountLabel}>{t('preparing')}</Text>
      </View>
    );
  }

  function renderRecording() {
    const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    const isUrgent = countdown <= 3;
    return (
      <View style={s.recordingWrapper}>
        <View style={s.recordingThemeBlock}>
          <Text style={s.cardCategory}>{t('theme_label')}</Text>
          <Text style={s.cardTheme}>{challenge.theme}</Text>
          <Text style={s.cardConsigne}>{challenge.consigne}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.centerCol}>
          <View style={[s.countdownBox, isUrgent && { borderColor: C.red }]}>
            <Text style={[s.countdownNum, isUrgent && { color: C.red }]}>{countdown}</Text>
          </View>
          <Text style={s.recordLabel}>{t('speak_now')}</Text>
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

  const ANALYSIS_STEPS = [t('step_transcription'), t('step_evaluation')];

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
        <View style={s.headerRight}>
          <TouchableOpacity style={s.langBtn} onPress={toggleLang} activeOpacity={0.7}>
            <Text style={s.langText}>{lang === 'fr' ? 'EN' : 'FR'}</Text>
          </TouchableOpacity>
          {streak > 0 && (
            <View style={s.streakRow}>
              <Text style={s.streakFire}>🔥</Text>
              <Text style={s.streakNum}>{streak}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={s.dividerFull} />

      <View style={s.content}>
        {phase === 'idle'            && renderIdle()}
        {phase === 'theme_reveal'    && renderThemeReveal()}
        {phase === 'countdown_start' && renderCountdownStart()}
        {phase === 'recording'       && renderRecording()}
        {phase === 'analyzing'       && renderAnalyzing()}
      </View>

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
  root:    { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16,
  },
  logo:        { fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: 6 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  langBtn:     { borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 4, paddingHorizontal: 8 },
  langText:    { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1 },
  streakRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakFire:  { fontSize: 16 },
  streakNum:   { fontSize: 18, fontWeight: '700', color: C.text },
  dividerFull:{ height: 1, backgroundColor: C.border },

  challengeNum: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 2, marginTop: 2 },

  centerCol: { alignItems: 'center' },
  idleHint:  { fontSize: 16, color: C.muted, marginBottom: 32 },

  doneTitle:    { fontSize: 20, fontWeight: '900', color: C.text, letterSpacing: 1, marginBottom: 10 },
  doneSubtitle: { fontSize: 14, color: C.muted, marginBottom: 36 },
  countdownBlock: { borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 24, paddingHorizontal: 40, alignItems: 'center' },
  countdownLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 2, marginBottom: 10 },
  countdownClock: { fontSize: 36, fontWeight: '900', color: C.text, letterSpacing: 4 },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.text, borderRadius: 4,
    paddingVertical: 16, paddingHorizontal: 40, marginTop: 8,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: '#111', letterSpacing: 1 },

  practiceBtn: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: C.border, borderRadius: 4 },
  practiceBtnText: { fontSize: 13, fontWeight: '600', color: C.muted, letterSpacing: 1 },

  readCountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  readCountText:{ fontSize: 22, fontWeight: '900', color: C.muted },

  card: { borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 28 },
  cardCategory:     { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 3, marginBottom: 12 },
  firstSessionHint: { fontSize: 13, color: C.green, marginTop: 14, lineHeight: 19 },
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
