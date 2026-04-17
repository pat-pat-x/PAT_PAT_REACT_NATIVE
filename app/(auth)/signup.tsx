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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Step = 'info' | 'otp' | 'password';

export default function SignUpScreen() {
  const [step, setStep] = useState<Step>('info');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email.trim() || !nickname.trim()) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setLoading(false);

    if (error) {
      Alert.alert('오류', error.message);
      return;
    }

    setStep('otp');
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    });

    setLoading(false);

    if (error) {
      Alert.alert('인증 실패', error.message);
      return;
    }

    setStep('password');
  };

  const handleSetPassword = async () => {
    if (!password.trim() || password.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setLoading(true);

    const { error: pwError } = await supabase.auth.updateUser({ password });
    if (pwError) {
      setLoading(false);
      Alert.alert('오류', pwError.message);
      return;
    }

    // 프로필 생성
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.rpc('register_user_after_otp', {
        _auth_user_id: user.id,
        _email: email.trim(),
        _nickname: nickname.trim(),
        _signup_method: 'email',
      });
    }

    setLoading(false);
    router.replace('/(auth)/terms');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{'<'} 뒤로</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {step === 'info' && '회원가입'}
            {step === 'otp' && '이메일 인증'}
            {step === 'password' && '비밀번호 설정'}
          </Text>

          {step === 'info' && (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="닉네임"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
              />
              <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabled]}
                onPress={handleSendOtp}
                disabled={loading || !email || !nickname}
                activeOpacity={0.7}
              >
                <Text style={styles.submitText}>
                  {loading ? '전송 중...' : '인증 코드 받기'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'otp' && (
            <View style={styles.form}>
              <Text style={styles.desc}>
                {email}로 전송된 인증 코드를 입력해주세요
              </Text>
              <TextInput
                style={styles.input}
                placeholder="인증 코드 8자리"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                maxLength={8}
              />
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabled]}
                onPress={handleVerifyOtp}
                disabled={loading || otp.length < 8}
                activeOpacity={0.7}
              >
                <Text style={styles.submitText}>
                  {loading ? '확인 중...' : '인증하기'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'password' && (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="비밀번호 (6자 이상)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabled]}
                onPress={handleSetPassword}
                disabled={loading || password.length < 6}
                activeOpacity={0.7}
              >
                <Text style={styles.submitText}>
                  {loading ? '설정 중...' : '완료'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070f24' },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: { marginTop: 8, marginBottom: 24 },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 32,
  },
  desc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
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
});
