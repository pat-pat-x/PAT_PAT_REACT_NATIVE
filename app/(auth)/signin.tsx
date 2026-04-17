import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('로그인 실패', error.message);
      return;
    }

    router.replace('/(main)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* 뒤로가기 */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'<'} 뒤로</Text>
        </TouchableOpacity>

        <Text style={styles.title}>이메일 로그인</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="이메일"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor="rgba(255,255,255,0.3)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.submitBtn, (!email || !password || loading) && styles.disabled]}
            onPress={handleSignIn}
            disabled={!email || !password || loading}
            activeOpacity={0.7}
          >
            <Text style={styles.submitText}>
              {loading ? '로그인 중...' : '로그인'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/signup')}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>계정이 없으신가요? 회원가입</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070f24' },
  content: { flex: 1, paddingHorizontal: 24 },
  backBtn: { marginTop: 8, marginBottom: 24 },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 32,
  },
  form: { gap: 14 },
  input: {
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(100,150,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(140,180,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disabled: { opacity: 0.4 },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(180,210,255,0.95)',
  },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
});
