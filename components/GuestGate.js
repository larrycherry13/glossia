import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login, signup } from '../services/authService';
import { useTranslation } from '../services/LanguageContext';
import { validateEmail, validatePassword, validateUsername } from '../services/validation';

const C = {
  bg: '#111111', border: '#2C2C2C', text: '#FFFFFF',
  muted: '#818384', red: '#C0392B',
};

export default function GuestGate({ title, subtitle }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);

    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }

    const passErr = validatePassword(password);
    if (passErr) { setError(passErr); return; }

    if (mode === 'signup') {
      const userErr = validateUsername(username);
      if (userErr) { setError(userErr); return; }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signup(email.trim(), password, username.trim());
      } else {
        await login(email.trim(), password);
      }
    } catch (e) {
      let msg = t('err_generic');
      if (e.code === 'auth/email-already-in-use')                                   msg = t('err_email_used');
      else if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') msg = t('err_wrong_pass');
      else if (e.code === 'auth/weak-password')                                      msg = t('err_weak_pass');
      else if (e.code === 'auth/invalid-email')                                      msg = t('err_invalid_email');
      else if (e.code === 'auth/network-request-failed')                             msg = t('err_network');
      else if (e.message) msg = e.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.inner}>

        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>

        <View style={s.divider} />

        <View style={s.form}>
          {mode === 'signup' && (
            <TextInput
              style={s.input}
              placeholder={t('ph_username')}
              placeholderTextColor={C.muted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
          <TextInput
            style={s.input}
            placeholder={t('ph_email')}
            placeholderTextColor={C.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={s.input}
            placeholder={t('ph_password')}
            placeholderTextColor={C.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={s.btn} onPress={handleSubmit} activeOpacity={0.7} disabled={loading}>
            <Text style={s.btnText}>
              {loading ? '…' : mode === 'login' ? t('submit_login') : t('submit_signup')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}>
          <Text style={s.toggle}>
            {mode === 'login' ? t('toggle_to_signup') : t('toggle_to_login')}
          </Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: C.bg },
  inner:    { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title:    { fontSize: 18, fontWeight: '900', color: C.text, letterSpacing: 3, textAlign: 'center' },
  subtitle: { fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 8, letterSpacing: 0.5, lineHeight: 20 },
  divider:  { height: 1, backgroundColor: C.border, marginVertical: 32 },
  form:     { gap: 12 },
  input: {
    borderWidth: 1, borderColor: C.border, borderRadius: 4,
    paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 15, color: C.text, backgroundColor: '#1A1A1A',
  },
  error:    { fontSize: 13, color: C.red, textAlign: 'center', marginTop: 4 },
  btn: {
    backgroundColor: C.text, borderRadius: 4,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnText:  { fontSize: 15, fontWeight: '700', color: '#111', letterSpacing: 1 },
  toggle:   { textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 24 },
});
