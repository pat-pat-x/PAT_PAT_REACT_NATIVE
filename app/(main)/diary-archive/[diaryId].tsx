import { useDiaryDetail } from '@/features/diary/hooks/useDiaryDetail';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiaryDetailScreen() {
  const { diaryId } = useLocalSearchParams<{ diaryId: string }>();
  const { data: diary, isPending } = useDiaryDetail(diaryId);

  if (isPending) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8AB4F8" />
      </View>
    );
  }

  if (!diary) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>기록을 찾을 수 없어요</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>뒤로가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const polarityLabel =
    diary.emotion_polarity === 'POSITIVE'
      ? '좋았어요'
      : diary.emotion_polarity === 'NEGATIVE'
        ? '힘들었어요'
        : '';

  const polarityColor =
    diary.emotion_polarity === 'POSITIVE'
      ? 'rgba(140,180,255,0.9)'
      : diary.emotion_polarity === 'NEGATIVE'
        ? 'rgba(210,190,255,0.9)'
        : 'rgba(200,210,220,0.6)';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>{'<'} 뒤로</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            router.push(`/(main)/diary/editor?diaryId=${diary.diary_id}`)
          }
        >
          <Text style={styles.editText}>수정</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 날짜 & 감정 */}
        <View style={styles.metaRow}>
          <Text style={styles.date}>{diary.entry_date}</Text>
          <View style={styles.polarityBadge}>
            <View style={[styles.polarityDot, { backgroundColor: polarityColor }]} />
            <Text style={[styles.polarityLabel, { color: polarityColor }]}>
              {polarityLabel}
            </Text>
          </View>
        </View>

        {/* 강도 */}
        {diary.emotion_intensity && (
          <View style={styles.intensityRow}>
            <Text style={styles.intensityLabel}>감정 세기</Text>
            <View style={styles.intensityDots}>
              {[1, 2, 3, 4, 5].map((n) => (
                <View
                  key={n}
                  style={[
                    styles.intensityDot,
                    n <= diary.emotion_intensity!
                      ? { backgroundColor: polarityColor }
                      : { backgroundColor: 'rgba(255,255,255,0.1)' },
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* 본문 */}
        <View style={styles.contentCard}>
          <Text style={styles.contentText}>{diary.content}</Text>
        </View>

        {/* 태그 */}
        {diary.tags.length > 0 && (
          <View style={styles.tagRow}>
            {diary.tags.map((tag) => (
              <View key={tag.tag_id} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag.tag_name}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070f24' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#070f24' },
  errorText: { fontSize: 16, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 100 },
  backLink: { fontSize: 14, color: 'rgba(140,180,255,0.8)', textAlign: 'center', marginTop: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backText: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  editText: { fontSize: 14, color: 'rgba(180,210,255,0.8)' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  date: { fontSize: 18, fontWeight: '300', color: 'rgba(255,255,255,0.9)' },
  polarityBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  polarityDot: { width: 8, height: 8, borderRadius: 4 },
  polarityLabel: { fontSize: 13, fontWeight: '300' },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  intensityLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  intensityDots: { flexDirection: 'row', gap: 6 },
  intensityDot: { width: 8, height: 8, borderRadius: 4 },
  contentCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 20,
    marginBottom: 16,
  },
  contentText: {
    fontSize: 15,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
});
