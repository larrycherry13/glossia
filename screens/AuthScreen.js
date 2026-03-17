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
    if (!email.trim() || !password.trim()) { setError('Remplis tous les champs.'); return; }
    if (mode === 'signup' && !username.trim()) { setError('Choisis un nom d\'utilisateur.'); return; }
    if (mode === 'signup' && username.trim().length < 3) { setError('Nom d\'utilisateur trop court (3 min).'); return; }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signup(email.trim(), password, username.trim());
      } else {
        await login(email.trim(), password);
      }
    } catch (e) {
      const msg = e.code === 'auth/email-already-in-use' ? 'Email déjà utilisé.'
        : e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found' ? 'Email ou mot de passe incorrect.'
        : e.code === 'auth/weak-password' ? 'Mot de passe trop court (6 min).'
        : e.message;
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
