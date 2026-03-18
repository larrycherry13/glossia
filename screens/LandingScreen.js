import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart2, Flame, Mic, Share2, Trophy } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '../services/LanguageContext';
import { getStreak, hasPlayedToday } from '../services/streak';

const { width: W } = Dimensions.get('window');

const C = {
  bg: '#111111', card: '#1A1A1A', border: '#2C2C2C',
  text: '#FFFFFF', muted: '#818384',
  green: '#538D4E', yellow: '#B59F3B', red: '#C0392B',
};

const SLIDES = 5;

// ─── Slide components ────────────────────────────────────────────────────────

function Slide1({ t }) {
  return (
    <View style={sl.root}>
      <Text style={sl.logo}>GLOSSIA</Text>
      <Text style={sl.tagline}>{t('tagline')}</Text>
      <Text style={sl.swipeHint}>{t('slide1_sub')}</Text>
    </View>
  );
}

function Slide2({ t }) {
  return (
    <View style={sl.root}>
      <Text style={sl.slideTitle}>{t('slide2_title')}</Text>
      <View style={sl.mockCard}>
        <Text style={sl.mockLabel}>{t('demo_step1')}</Text>
        <View style={sl.mockDivider} />
        <Text style={sl.mockTheme}>{t('demo_theme')}</Text>
        <Text style={sl.mockConsigne}>{t('demo_consigne')}</Text>
        <View style={sl.mockDivider} />
        <View style={sl.readRow}>
          <Mic color={C.text} size={14} />
          <Text style={sl.readNote}>30s · {t('slide3_sub')}</Text>
        </View>
      </View>
      <Text style={sl.slideSub}>{t('slide2_sub')}</Text>
    </View>
  );
}

function Slide3({ t }) {
  const bars = [6, 12, 8, 18, 10, 16, 7, 14, 9, 17, 6, 13, 8, 15, 10];
  return (
    <View style={sl.root}>
      <Text style={sl.slideTitle}>{t('slide3_title')}</Text>
      <View style={sl.mockCard}>
        <Text style={sl.mockLabel}>{t('demo_step2')}</Text>
        <View style={sl.mockDivider} />
        <View style={sl.countdownBox}>
          <Text style={sl.countdownNum}>28</Text>
          <Text style={sl.countdownSub}>/ 30s</Text>
        </View>
        <View style={sl.progressTrack}>
          <View style={sl.progressFill} />
        </View>
        <View style={sl.waveRow}>
          <View style={sl.micDot} />
          {bars.map((h, i) => (
            <View key={i} style={[sl.waveBar, { height: h, opacity: 0.4 + (i / bars.length) * 0.6 }]} />
          ))}
        </View>
        <Text style={[sl.mockLabel, { textAlign: 'center', marginTop: 8 }]}>{t('speak_now').toUpperCase()}</Text>
      </View>
      <Text style={sl.slideSub}>{t('slide3_sub')}</Text>
    </View>
  );
}

function Slide4({ t }) {
  return (
    <View style={sl.root}>
      <Text style={sl.slideTitle}>{t('slide4_title')}</Text>
      <View style={sl.mockCard}>
        <Text style={sl.mockLabel}>{t('demo_step3')}</Text>
        <View style={sl.mockDivider} />
        <View style={sl.resultTop}>
          <View style={[sl.scoreTile, { borderColor: C.yellow }]}>
            <Text style={[sl.scoreNum, { color: C.yellow }]}>78</Text>
            <Text style={[sl.scoreGrade, { color: C.yellow }]}>CORRECT</Text>
          </View>
          <View style={sl.barsCol}>
            {[
              { label: t('fluidity'), val: 22, max: 30, color: C.yellow },
              { label: t('fillers'),  val: 18, max: 30, color: C.yellow },
              { label: t('relevance'),val: 38, max: 40, color: C.green  },
            ].map(b => (
              <View key={b.label} style={sl.miniBar}>
                <Text style={sl.miniBarLabel}>{b.label}</Text>
                <View style={sl.miniBarTrack}>
                  <View style={[sl.miniBarFill, { width: `${(b.val / b.max) * 100}%`, backgroundColor: b.color }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
        <Text style={sl.mockFeedback}>{t('demo_feedback')}</Text>
      </View>
      <Text style={sl.slideSub}>{t('slide4_sub')}</Text>
    </View>
  );
}

function Slide5({ t, streak, played, onPlay, onLogin }) {
  return (
    <View style={sl.root}>
      <Text style={sl.slide5Title}>{t('slide5_title')}</Text>
      <Text style={sl.slide5Sub}>{t('slide5_sub')}</Text>

      <View style={sl.statsRow}>
        <View style={sl.statPill}>
          <Flame color="#E8A87C" size={18} />
          <Text style={sl.statLabel}>{t('streak_days', streak > 0 ? streak : 0)}</Text>
        </View>
        <View style={sl.statPill}>
          <Trophy color="#D4B483" size={18} />
          <Text style={sl.statLabel}>{t('podium_title')}</Text>
        </View>
        <View style={sl.statPill}>
          <BarChart2 color="#7BAF8E" size={18} />
          <Text style={sl.statLabel}>{t('history_label')}</Text>
        </View>
      </View>

      <View style={sl.shareTeaser}>
        <Share2 color="#7BA7C4" size={14} />
        <Text style={sl.shareTeaserText}>{t('slide5_share')}</Text>
      </View>

      <View style={sl.actions}>
        <TouchableOpacity style={sl.btnPrimary} onPress={onPlay} activeOpacity={0.7}>
          <Text style={sl.btnPrimaryText}>{played ? t('played_btn') : t('play_btn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={sl.btnSecondary} onPress={onLogin} activeOpacity={0.7}>
          <Text style={sl.btnSecondaryText}>{t('login_btn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function LandingScreen({ navigation }) {
  const { t, lang, toggleLang } = useTranslation();
  const [streak, setStreak] = useState(0);
  const [played, setPlayed] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      setStreak(await getStreak());
      setPlayed(await hasPlayedToday());
    })();
  }, []);

  function onScroll(e) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setActiveSlide(idx);
  }

  return (
    <SafeAreaView style={s.root}>
      <TouchableOpacity style={s.langBtn} onPress={toggleLang} activeOpacity={0.7}>
        <Text style={s.langText}>{lang === 'fr' ? 'EN' : 'FR'}</Text>
      </TouchableOpacity>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
        <View style={{ width: W }}>
          <Slide1 t={t} />
        </View>
        <View style={{ width: W }}>
          <Slide2 t={t} />
        </View>
        <View style={{ width: W }}>
          <Slide3 t={t} />
        </View>
        <View style={{ width: W }}>
          <Slide4 t={t} />
        </View>
        <View style={{ width: W }}>
          <Slide5
            t={t}
            streak={streak}
            played={played}
            onPlay={() => navigation.navigate('Home')}
            onLogin={() => navigation.navigate('Auth')}
          />
        </View>
      </ScrollView>

      {/* Dots */}
      <View style={s.dots}>
        {Array.from({ length: SLIDES }).map((_, i) => (
          <View key={i} style={[s.dot, activeSlide === i && s.dotActive]} />
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const sl = StyleSheet.create({
  root:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 28 },

  // Slide 1
  langBtn:   { position: 'absolute', top: -20, right: 0, borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 5, paddingHorizontal: 10 },
  langText:  { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1 },
  logo:      { fontSize: 42, fontWeight: '900', color: C.text, letterSpacing: 10 },
  tagline:   { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 22, letterSpacing: 0.3 },
  swipeHint: { fontSize: 12, color: C.muted, letterSpacing: 2, marginTop: 8 },

  // Slides 2-4
  slideTitle: { fontSize: 13, fontWeight: '700', color: C.muted, letterSpacing: 2, textAlign: 'center' },
  slideSub:   { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },

  mockCard:     { width: '100%', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 22 },
  mockLabel:    { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 3 },
  mockDivider:  { height: 1, backgroundColor: C.border, marginVertical: 14 },
  mockTheme:    { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 8 },
  mockConsigne: { fontSize: 14, color: C.muted, lineHeight: 20 },

  readRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readNote:  { fontSize: 12, color: C.muted, flex: 1 },

  // Slide 3 — recording
  countdownBox: { alignSelf: 'center', width: 80, height: 80, borderWidth: 2, borderColor: C.border, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  countdownNum: { fontSize: 42, fontWeight: '900', color: C.text, lineHeight: 46 },
  countdownSub: { fontSize: 10, color: C.muted, fontWeight: '600' },
  progressTrack: { height: 2, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden', marginBottom: 14 },
  progressFill:  { width: '93%', height: '100%', backgroundColor: C.text, borderRadius: 2 },
  waveRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center' },
  micDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: C.red, marginRight: 4 },
  waveBar:   { width: 3, backgroundColor: C.text, borderRadius: 2 },

  // Slide 4 — result
  resultTop:   { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 14 },
  scoreTile:   { width: 72, height: 72, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  scoreNum:    { fontSize: 28, fontWeight: '900' },
  scoreGrade:  { fontSize: 7, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
  barsCol:     { flex: 1, gap: 8 },
  miniBar:     { gap: 4 },
  miniBarLabel:{ fontSize: 9, fontWeight: '700', color: C.muted, letterSpacing: 1.5 },
  miniBarTrack:{ height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 2 },
  mockFeedback:{ fontSize: 12, color: C.muted, fontStyle: 'italic', lineHeight: 18 },

  // Slide 5
  slide5Title:   { fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: 2, textAlign: 'center' },
  slide5Sub:     { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 24 },
  shareTeaser:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 12, paddingHorizontal: 16, width: '100%' },
  shareTeaserText: { fontSize: 13, color: C.muted, letterSpacing: 0.5 },
  statsRow:    { flexDirection: 'row', gap: 10 },
  statPill:    { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 12, alignItems: 'center', gap: 6 },
  statLabel:   { fontSize: 9, fontWeight: '700', color: C.muted, letterSpacing: 1, textAlign: 'center' },
  actions:          { width: '100%', gap: 12 },
  btnPrimary:       { backgroundColor: C.text, borderRadius: 4, paddingVertical: 18, alignItems: 'center' },
  btnPrimaryText:   { fontSize: 15, fontWeight: '700', color: '#111', letterSpacing: 1 },
  btnSecondary:     { borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 18, alignItems: 'center' },
  btnSecondaryText: { fontSize: 15, fontWeight: '700', color: C.muted, letterSpacing: 1 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  langBtn: { position: 'absolute', top: 52, right: 24, zIndex: 10, borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingVertical: 5, paddingHorizontal: 10 },
  langText: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 24, paddingTop: 12 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive: { width: 20, backgroundColor: C.text },
});
