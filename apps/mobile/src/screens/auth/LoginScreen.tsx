import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../theme/theme';
import { KInput } from '../../components/ui/KInput';
import { KButton } from '../../components/ui/KButton';
import { Smartphone, Lock } from 'lucide-react-native';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { BatuwaLogo } from '../../components/ui/BatuwaLogo';

export default function LoginScreen() {
  const [target, setTarget] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/dev-login', { target, password });
      const { accessToken, user } = response.data;
      setAuth(user, accessToken);
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <BatuwaLogo size={48} />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Login with your test credentials</Text>
          </View>

          <KInput
            label="Email or Phone"
            placeholder="test@batuwa.com"
            value={target}
            onChangeText={setTarget}
            leftIcon={<Smartphone color={THEME.colors.textMuted} size={20} />}
          />

          <KInput
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            leftIcon={<Lock color={THEME.colors.textMuted} size={20} />}
          />

          <KButton 
            label="Login" 
            onPress={handleLogin} 
            loading={loading}
            style={styles.button}
          />

          <Text style={styles.footer}>
            Test User: test@batuwa.com / password123
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  keyboardView: { flex: 1 },
  content: { flex: 1, padding: THEME.spacing.xl, justifyContent: 'center' },
  header: { marginBottom: 40, alignItems: 'center' },
  logo: { color: THEME.colors.primary, fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  title: { color: THEME.colors.textPrimary, fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: THEME.colors.textSecondary, fontSize: 14, marginTop: 10, textAlign: 'center' },
  button: { marginTop: 20 },
  footer: { color: THEME.colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 40, lineHeight: 18 },
});
