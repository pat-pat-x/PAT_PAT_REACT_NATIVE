import { supabase } from '@/utils/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useUserProfile } from '@/features/profile/hooks/useUserProfile';
import { profileKeys } from '@/features/profile/queries/profile';
import { getZodiacNameKo, getZodiacSign } from '@/lib/zodiac';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { data, isLoading } = useUserProfile();
  const qc = useQueryClient();

  const [editingNick, setEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState('');
  const [nickPending, setNickPending] = useState(false);

  const [editingBirth, setEditingBirth] = useState(false);
  const [birthInput, setBirthInput] = useState('');
  const [birthPending, setBirthPending] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  const birthDate = data?.profile.birth_date ? new Date(data.profile.birth_date) : null;
  const birthZodiac = birthDate ? getZodiacNameKo(getZodiacSign(birthDate)) : null;

  const handleLogout = async () => {
    if (logoutPending) return;
    setLogoutPending(true);
    await supabase.auth.signOut();
    router.replace('/');
  };

  const handleDeleteAccount = async () => {
    if (deletePending || !user) return;
    setDeletePending(true);

    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('auth_user_id', user.id);

    if (!error) {
      await supabase.auth.signOut();
      router.replace('/');
    } else {
      setDeletePending(false);
      Alert.alert('오류', '계정 삭제에 실패했어요.');
    }
  };

  const saveNickname = async () => {
    if (!nickInput.trim() || nickPending || !user) return;
    setNickPending(true);

    await supabase
      .from('users')
      .update({ nickname: nickInput.trim() })
      .eq('auth_user_id', user.id);

    setNickPending(false);
    setEditingNick(false);
    qc.invalidateQueries({ queryKey: profileKeys.all });
  };

  const saveBirthDate = async () => {
    if (!birthInput || birthPending || !user) return;
    setBirthPending(true);

    await supabase
      .from('users')
      .update({ birth_date: birthInput })
      .eq('auth_user_id', user.id);

    setBirthPending(false);
    setEditingBirth(false);
    qc.invalidateQueries({ queryKey: profileKeys.all });
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8AB4F8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>내 정보</Text>

        {/* 프로필 카드 */}
        <View style={styles.card}>
          <Text style={styles.greeting}>
            안녕하세요, {data?.profile.nickname || '별빛 기록가'}님
          </Text>
          {birthZodiac && (
            <Text style={styles.zodiacText}>{birthZodiac}</Text>
          )}
          <View style={styles.statsRow}>
            <StatCell label="좋았던 날" value={String(data?.totalStars ?? 0)} />
            <StatCell label="힘들었던 날" value={String(data?.totalWorries ?? 0)} />
            <StatCell label="기록한 별들" value={String(data?.totalDiaries ?? 0)} />
          </View>
        </View>

        {/* 계정 설정 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>계정</Text>

          {/* 닉네임 */}
          {editingNick ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={nickInput}
                onChangeText={setNickInput}
                maxLength={20}
                autoFocus
                placeholder="닉네임"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
              <TouchableOpacity onPress={saveNickname} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{nickPending ? '...' : '저장'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingNick(false)}>
                <Text style={styles.cancelLinkText}>취소</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <SettingRow
              label="닉네임"
              value={data?.profile.nickname}
              onEdit={() => {
                setNickInput(data?.profile.nickname ?? '');
                setEditingNick(true);
              }}
            />
          )}

          {/* 생일 */}
          {editingBirth ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={birthInput}
                onChangeText={setBirthInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoFocus
              />
              <TouchableOpacity onPress={saveBirthDate} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{birthPending ? '...' : '저장'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingBirth(false)}>
                <Text style={styles.cancelLinkText}>취소</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <SettingRow
              label="생일"
              value={
                data?.profile.birth_date
                  ? `${data.profile.birth_date} · ${birthZodiac}`
                  : '설정되지 않음'
              }
              onEdit={() => {
                setBirthInput(data?.profile.birth_date ?? '');
                setEditingBirth(true);
              }}
            />
          )}

          <SettingRow label="이메일" value={user?.email || ''} />

          <SettingRow
            label="로그인 방식"
            value={
              user?.app_metadata?.provider === 'kakao'
                ? 'KAKAO'
                : user?.app_metadata?.provider === 'google'
                  ? 'Google'
                  : 'Email'
            }
          />
        </View>

        {/* 세션 */}
        {deleteConfirm ? (
          <View style={styles.deleteCard}>
            <Text style={styles.deleteWarn}>
              정말로 계정을 삭제할까요?{'\n'}모든 기록과 별이 영구적으로 사라져요.
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setDeleteConfirm(false)}
              >
                <Text style={styles.deleteCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={handleDeleteAccount}
                disabled={deletePending}
              >
                <Text style={styles.deleteConfirmText}>
                  {deletePending ? '삭제 중...' : '삭제하기'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.sessionButtons}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              disabled={logoutPending}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutText}>
                {logoutPending ? '로그아웃 중...' : '로그아웃'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDeleteConfirm(true)}>
              <Text style={styles.deleteLink}>계정 삭제</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value?: string;
  onEdit?: () => void;
}) {
  return (
    <View style={settingStyles.row}>
      <View style={{ flex: 1 }}>
        <Text style={settingStyles.label}>{label}</Text>
        {value && <Text style={settingStyles.value}>{value}</Text>}
      </View>
      {onEdit && (
        <TouchableOpacity onPress={onEdit} style={settingStyles.editBtn}>
          <Text style={settingStyles.editText}>수정</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={statStyles.cell}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070f24' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#070f24' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60 },
  title: { fontSize: 20, fontWeight: '600', color: 'white', marginBottom: 20, letterSpacing: -0.3 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 16,
    marginBottom: 16,
  },
  greeting: { fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 22 },
  zodiacText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  editInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    fontSize: 14,
    color: 'white',
  },
  saveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  saveBtnText: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  cancelLinkText: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  sessionButtons: { alignItems: 'center', gap: 16 },
  logoutBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.85)' },
  deleteLink: { fontSize: 12, color: 'rgba(255,255,255,0.25)' },
  deleteCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.2)',
    backgroundColor: 'rgba(255,80,80,0.08)',
    padding: 16,
  },
  deleteWarn: { fontSize: 13.5, color: 'rgba(255,120,120,0.9)', lineHeight: 20 },
  deleteActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  deleteCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteCancelText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  deleteConfirmBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,80,80,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmText: { fontSize: 13, fontWeight: '500', color: 'rgba(255,120,120,0.9)' },
});

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  label: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  value: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
});

const statStyles = StyleSheet.create({
  cell: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    alignItems: 'center',
  },
  value: { fontSize: 18, fontWeight: '600', color: 'white' },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
});
