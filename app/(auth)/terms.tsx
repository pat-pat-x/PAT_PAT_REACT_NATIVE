import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!agreed || loading) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      Alert.alert('오류', '로그인 정보를 찾을 수 없습니다.');
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ terms_accepted_at: new Date().toISOString() })
      .eq('auth_user_id', user.id);

    setLoading(false);

    if (error) {
      // 유저가 없으면 upsert
      await supabase.from('users').upsert({
        auth_user_id: user.id,
        email: user.email ?? '',
        nickname: user.email?.split('@')[0] ?? '별빛 기록가',
        signup_method: user.app_metadata?.provider ?? 'email',
        terms_accepted_at: new Date().toISOString(),
      });
    }

    router.replace('/(main)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>이용약관</Text>
        <Text style={styles.subtitle}>
          PAT PAT 서비스 이용을 위해 약관에 동의해주세요
        </Text>
      </View>

      <ScrollView style={styles.termsBox}>
        <Text style={styles.termsText}>
          {`제1조 (목적)\n이 약관은 PAT PAT(이하 "서비스")의 이용 조건을 규정합니다.\n\n제2조 (개인정보)\n서비스는 이용자의 감정 기록 데이터를 안전하게 보관하며, 제3자에게 제공하지 않습니다.\n\n제3조 (이용자의 의무)\n이용자는 서비스를 법령 및 약관에 따라 이용해야 합니다.\n\n제4조 (서비스 제공)\n서비스는 일기 작성, 별자리 시각화, 감정 분석 등의 기능을 제공합니다.\n\n제5조 (면책)\n서비스는 천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임지지 않습니다.`}
        </Text>
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreed && styles.checked]}>
            {agreed && <Text style={styles.checkmark}>{'✓'}</Text>}
          </View>
          <Text style={styles.checkLabel}>이용약관 및 개인정보 처리방침에 동의합니다</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, !agreed && styles.disabled]}
          onPress={handleAccept}
          disabled={!agreed || loading}
          activeOpacity={0.7}
        >
          <Text style={styles.submitText}>
            {loading ? '처리 중...' : '동의하고 시작하기'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070f24' },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
  },
  termsBox: {
    flex: 1,
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  termsText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  bottom: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 16 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checked: {
    backgroundColor: 'rgba(100,150,255,0.3)',
    borderColor: 'rgba(140,180,255,0.5)',
  },
  checkmark: { color: 'white', fontSize: 14, fontWeight: '600' },
  checkLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, flex: 1 },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(100,150,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(140,180,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: { opacity: 0.4 },
  submitText: { fontSize: 16, fontWeight: '600', color: 'rgba(180,210,255,0.95)' },
});
