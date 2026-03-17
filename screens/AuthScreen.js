import { useState } from 'react';
import {
  Alert,
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
import { validateEmail, validatePassword, validateUsername } from '../services/validation';

const C = {
  bg: '#111111', border: '#2C2C2C', text: '#FFFFFF',
  muted: '#818384', red: '#C0392B',
};

export default function AuthScreen() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);

    // Validate email
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }

    // Validate password
    const passErr = validatePassword(password);
    if (passErr) { setError(passErr); return; }

    // Validate username for signup
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
      let msg = 'An error occurred. Please try again.';
      if (e.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered.';
      } else if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
        msg = 'Invalid email or password.';
      } else if (e.code === 'auth/weak-password') {
        msg = 'Password is too weak (minimum 6 characters).';
      } else if (e.code === 'auth/invalid-email') {
        msg = 'Invalid email address.';
      } else if (e.code === 'auth/network-request-failed') {
        msg = 'Network error. Please check your connection.';
      } else if (e.message) {
        msg = e.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.inner}>

        <Text style={s.logo}>GLOSSIA</Text>
        <Text style={s.sub}>Jeu d'éloquence</Text>

        <View style={s.divider} />

        <View style={s.form}>
          {mode === 'signup' && (
            <TextInput
              style={s.input}
              placeholder="Nom d'utilisateur"
              placeholderTextColor={C.muted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor={C.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={s.input}
            placeholder="Mot de passe"
            placeholderTextColor={C.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={s.btn} onPress={handleSubmit} activeOpacity={0.7} disabled={loading}>
            <Text style={s.btnText}>{loading ? '…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}>
          <Text style={s.toggle}>
            {mode === 'login' ? 'Pas encore de compte — S\'inscrire' : 'Déjà un compte — Se connecter'}
          </Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  inner:  { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logo:   { fontSize: 28, fontWeight: '900', color: C.text, letterSpacing: 6, textAlign: 'center' },
  sub:    { fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 6, letterSpacing: 1 },
  divider:{ height: 1, backgroundColor: '#2C2C2C', marginVertical: 36 },
  form:   { gap: 12 },
  input: {
    borderWidth: 1, borderColor: '#2C2C2C', borderRadius: 4,
    paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 15, color: C.text, backgroundColor: '#1A1A1A',
  },
  error:  { fontSize: 13, color: C.red, textAlign: 'center', marginTop: 4 },
  btn: {
    backgroundColor: C.text, borderRadius: 4,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: '#111', letterSpacing: 1 },
  toggle:  { textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 24 },
});
