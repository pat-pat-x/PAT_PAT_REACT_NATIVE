import { useDiaryList } from '@/features/diary/hooks/useDiaryList';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function getCurrentMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function DiaryArchiveScreen() {
  const [month, setMonth] = useState(getCurrentMonth);
  const [search, setSearch] = useState('');
  const { data: diaries, isPending } = useDiaryList(month, search);

  const [y, m] = month.split('-').map(Number);

  const prevMonth = () => {
    const d = new Date(y, m - 2, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const d = new Date(y, m, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const polarityColor = (p: string) => {
    if (p === 'POSITIVE') return 'rgba(140,180,255,0.9)';
    if (p === 'NEGATIVE') return 'rgba(210,190,255,0.9)';
    return 'rgba(200,210,220,0.6)';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>기록</Text>
      </View>

      {/* 월 선택 */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
          <Text style={styles.monthArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>{y}년 {m}월</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
          <Text style={styles.monthArrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* 검색 */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="기록 검색..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* 목록 */}
      {isPending ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8AB4F8" />
        </View>
      ) : (
        <FlatList
          data={diaries}
          keyExtractor={(item) => item.diary_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>이 달의 기록이 없어요</Text>
              <Text style={styles.emptySubText}>오늘부터 별을 남겨보세요</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.diaryCard}
              onPress={() => router.push(`/(main)/diary-archive/${item.diary_id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.diaryCardRow}>
                <View style={[styles.dot, { backgroundColor: polarityColor(item.emotion_polarity) }]} />
                <View style={{ flex: 1 }}>
                  <View style={styles.diaryMeta}>
                    <Text style={styles.diaryDate}>{item.entry_date}</Text>
                    <Text style={styles.diaryPolarity}>
                      {item.emotion_polarity === 'POSITIVE' ? '좋았어요' : item.emotion_polarity === 'NEGATIVE' ? '힘들었어요' : ''}
                    </Text>
                  </View>
                  <Text style={styles.diaryContent} numberOfLines={2}>
                    {item.content}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070f24' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '600', color: 'white', letterSpacing: -0.3 },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 12,
  },
  monthBtn: { padding: 8 },
  monthArrow: { fontSize: 18, color: 'rgba(255,255,255,0.6)' },
  monthText: { fontSize: 16, fontWeight: '500', color: 'rgba(255,255,255,0.85)' },
  searchRow: { paddingHorizontal: 20, marginBottom: 12 },
  searchInput: {
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: '300' },
  emptySubText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 6 },
  diaryCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 16,
    marginBottom: 10,
  },
  diaryCardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  diaryMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  diaryDate: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  diaryPolarity: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  diaryContent: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '300', lineHeight: 20 },
});
