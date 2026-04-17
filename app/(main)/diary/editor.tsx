import { useDiaryDetail } from '@/features/diary/hooks/useDiaryDetail';
import { useTags } from '@/features/diary/hooks/useTags';
import { useUpsertDiaryMutation } from '@/features/diary/hooks/useUpsertDiaryMutation';
import type { Tag } from '@/features/diary/schemas/tag.schema';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';

type Polarity = 'POSITIVE' | 'NEGATIVE' | 'UNSET';

const POLARITIES: Array<{ key: Polarity; label: string }> = [
  { key: 'POSITIVE', label: '좋았어요' },
  { key: 'NEGATIVE', label: '힘들었어요' },
];

const LIMIT = 200;
const MAX_TAGS = 3;

export default function DiaryEditorScreen() {
  const { diaryId } = useLocalSearchParams<{ diaryId?: string }>();
  const { data: tags } = useTags();
  const { data: diary } = useDiaryDetail(diaryId);
  const { mutate, isPending: saving } = useUpsertDiaryMutation({
    diary_id: diary?.diary_id,
  });

  const [polarity, setPolarity] = useState<Polarity>('UNSET');
  const [intensity, setIntensity] = useState(3);
  const [text, setText] = useState('');
  const [tagOpen, setTagOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (!diary) return;
    setPolarity(diary.emotion_polarity ?? 'UNSET');
    setIntensity(diary.emotion_intensity ?? 3);
    setText(diary.content ?? '');
    setSelectedTags(diary.tags?.map((t) => t.tag_id) ?? []);
  }, [diary?.diary_id]);

  const canSubmit = useMemo(() => {
    return text.trim().length > 0 && polarity !== 'UNSET' && !saving;
  }, [text, polarity, saving]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      const exists = prev.includes(tagId);
      if (exists) return prev.filter((t) => t !== tagId);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, tagId];
    });
  };

  const submit = () => {
    if (!canSubmit) return;
    const entryDate = new Date(Date.now() + 9 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    mutate({
      entry_date: entryDate,
      polarity,
      content: text,
      intensity,
      tag_ids: selectedTags,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>{'<'} 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>오늘의 별 남기기</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 상태 선택 */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>이 하루는</Text>
            <View style={styles.polarityRow}>
              {POLARITIES.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.polarityBtn,
                    polarity === p.key && styles.polaritySelected,
                  ]}
                  onPress={() => setPolarity(p.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.polarityText,
                      polarity === p.key && styles.polarityTextSelected,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 강도 슬라이더 */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>감정의 세기</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderValue}>{intensity}</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={intensity}
              onValueChange={setIntensity}
              minimumTrackTintColor={
                polarity === 'POSITIVE'
                  ? '#2563EB'
                  : polarity === 'NEGATIVE'
                    ? '#D88080'
                    : 'rgba(255,255,255,0.3)'
              }
              maximumTrackTintColor="rgba(255,255,255,0.1)"
              thumbTintColor="white"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>약하게</Text>
              <Text style={styles.sliderLabelText}>강하게</Text>
            </View>
          </View>

          {/* 기록 */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>오늘을 한 줄로 남겨보세요</Text>
            <TextInput
              style={styles.textarea}
              multiline
              maxLength={LIMIT}
              value={text}
              onChangeText={setText}
              placeholder="짧아도 괜찮아요"
              placeholderTextColor="rgba(255,255,255,0.3)"
              textAlignVertical="top"
            />
            <View style={styles.textMeta}>
              <Text style={styles.textHint}>이 기록은 하나의 별이 됩니다</Text>
              <Text style={styles.textCount}>
                {text.length}/{LIMIT}
              </Text>
            </View>

            {/* 태그 */}
            <TouchableOpacity
              style={styles.tagToggle}
              onPress={() => setTagOpen(!tagOpen)}
              activeOpacity={0.7}
            >
              <Text style={styles.tagToggleText}>태그 추가 (선택)</Text>
              <Text style={styles.tagToggleText}>{tagOpen ? '▴' : '▾'}</Text>
            </TouchableOpacity>

            {tagOpen && (
              <View style={styles.tagList}>
                {tags?.map((tag: Tag) => (
                  <TouchableOpacity
                    key={tag.tag_id}
                    style={[
                      styles.tagChip,
                      selectedTags.includes(tag.tag_id) && styles.tagSelected,
                    ]}
                    onPress={() => toggleTag(tag.tag_id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedTags.includes(tag.tag_id) &&
                          styles.tagTextSelected,
                      ]}
                    >
                      #{tag.tag_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* 하단 CTA */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.disabled]}
            onPress={submit}
            disabled={!canSubmit}
            activeOpacity={0.7}
          >
            <Text style={styles.submitText}>
              {saving ? '저장 중...' : '오늘의 별 남기기'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070f24' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: 'white' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    marginBottom: 16,
  },
  cardLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 16 },
  polarityRow: { flexDirection: 'row', gap: 12 },
  polarityBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  polaritySelected: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
  polarityText: { fontSize: 15, color: 'rgba(255,255,255,0.65)' },
  polarityTextSelected: { color: 'white' },
  sliderRow: { alignItems: 'center', marginBottom: 4 },
  sliderValue: { fontSize: 20, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderLabelText: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  textarea: {
    height: 128,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  textMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  textHint: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  textCount: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  tagToggle: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tagToggleText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tagSelected: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
  tagText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  tagTextSelected: { color: 'white' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    backgroundColor: 'rgba(7,15,36,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#18326f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: { opacity: 0.4 },
  submitText: { fontSize: 15, fontWeight: '600', color: 'white' },
});
