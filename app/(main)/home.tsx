import { getZodiacMessage } from '@/data/zodiacMessages';
import { useHomeSummary } from '@/features/home/hooks/useHomeSummary';
import { getZodiacNameKo, getZodiacSign } from '@/lib/zodiac';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon, Circle, Line } from 'react-native-svg';

const WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const STAR_POINTS = '12,2 13.8,8.6 20.5,8.6 15.4,12.8 17.2,19.4 12,15.2 6.8,19.4 8.6,12.8 3.5,8.6 10.2,8.6';

function getTodayIndex() {
  const day = new Date().getDay();
  return (day + 6) % 7;
}

export default function HomeScreen() {
  const { data: result, isPending } = useHomeSummary();
  const todayIndex = getTodayIndex();
  const weekDiaries = result?.weekDiaries ?? [];
  const filledDays = weekDiaries.length;
  const periodDiaryCount = result?.periodDiaryCount ?? 0;
  const periodTotalDays = result?.periodTotalDays ?? 0;
  const periodProgress = periodTotalDays > 0 ? Math.round((periodDiaryCount / periodTotalDays) * 100) : 0;
  const isCollected = periodProgress >= 80;
  const [popoverIndex, setPopoverIndex] = useState<number | null>(null);

  const diaryByDate = useMemo(
    () => Object.fromEntries(weekDiaries.map((d) => [d.entry_date, d])),
    [weekDiaries]
  );

  const weekStars = useMemo(() => {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstDay = kst.getUTCDay();
    const monday = new Date(kst);
    monday.setUTCDate(kst.getUTCDate() - ((kstDay + 6) % 7));

    return WEEK_LABELS.map((label, i) => {
      const dayKst = new Date(monday);
      dayKst.setUTCDate(monday.getUTCDate() + i);
      const dateStr = dayKst.toISOString().split('T')[0];
      const dateNumber = dayKst.getUTCDate();
      const isToday = i === todayIndex;
      const isFuture = i > todayIndex;
      const diary = diaryByDate[dateStr] ?? null;
      return { label, dateNumber, isToday, isFuture, isFilled: !!diary, diary };
    });
  }, [todayIndex, diaryByDate]);

  const birthSign = useMemo(() => {
    const bd = result?.profile.birth_date;
    if (!bd) return null;
    return getZodiacSign(new Date(bd));
  }, [result?.profile.birth_date]);

  const zodiacMessage = useMemo(() => {
    if (!birthSign) return null;
    return getZodiacMessage(birthSign);
  }, [birthSign]);

  const isMySeason = useMemo(() => {
    if (!birthSign) return false;
    return getZodiacSign(new Date()) === birthSign;
  }, [birthSign]);

  if (isPending) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8AB4F8" />
      </View>
    );
  }

  const isDiary = result?.isDiary ?? false;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.nickname}>{result?.profile.nickname}님의 하늘</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </Text>
            {zodiacMessage && (
              <Text style={styles.zodiacMsg}>{zodiacMessage}</Text>
            )}
          </View>
        </View>

        {/* Today 카드 */}
        <View style={styles.card}>
          <View style={styles.cardInner}>
            <View style={styles.todayRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.todayTitle}>
                  {isDiary ? '오늘의 감정이 담겼어요' : '오늘은 아직 기록이 없어요'}
                </Text>
                <Text style={styles.todaySub}>
                  {isDiary ? '언제든 다시 수정할 수 있어요' : '오늘의 별은 오늘만 담을 수 있어요'}
                </Text>
              </View>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Polygon
                  points={STAR_POINTS}
                  fill={isDiary ? 'rgba(200,220,255,0.95)' : 'rgba(200,220,255,0.2)'}
                />
              </Svg>
            </View>

            <TouchableOpacity
              style={styles.recordBtn}
              onPress={() =>
                router.push(
                  result?.diaryId
                    ? `/(main)/diary/editor?diaryId=${result.diaryId}`
                    : '/(main)/diary/editor'
                )
              }
              activeOpacity={0.5}
            >
              <Text style={styles.recordBtnText}>
                {isDiary ? '기록 수정하기' : '기록 남기기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 이번 주 별자리 */}
        <View style={styles.card}>
          <View style={styles.cardInner}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekLabel}>이번 주</Text>
              <Text style={styles.weekCount}>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{filledDays}</Text> / 7
              </Text>
            </View>

            <View style={styles.weekStars}>
              {weekStars.map((star, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.starCol}
                  onPress={() => {
                    if (star.isFilled) {
                      setPopoverIndex(popoverIndex === i ? null : i);
                    } else if (!star.isFuture) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.starWrap}>
                    <Svg width={star.isFilled ? 20 : 13} height={star.isFilled ? 20 : 13} viewBox="0 0 24 24">
                      <Polygon
                        points={STAR_POINTS}
                        fill={
                          star.isFilled
                            ? star.diary?.emotion_polarity === 'NEGATIVE'
                              ? 'rgba(210,190,255,0.92)'
                              : 'rgba(195,218,255,0.92)'
                            : 'rgba(255,255,255,0.14)'
                        }
                        opacity={star.isFuture ? 0.3 : 1}
                      />
                    </Svg>
                  </View>
                  <Text
                    style={[
                      styles.dayLabel,
                      star.isToday && styles.dayLabelToday,
                    ]}
                  >
                    {star.label}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      star.isToday && styles.dayNumberToday,
                    ]}
                  >
                    {star.dateNumber}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 선택된 별 미리보기 */}
            {popoverIndex !== null && weekStars[popoverIndex]?.diary && (
              <TouchableOpacity
                style={styles.popover}
                onPress={() => setPopoverIndex(null)}
                activeOpacity={0.7}
              >
                <View style={styles.popoverDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.popoverDate}>
                    {weekStars[popoverIndex].dateNumber}일 · {weekStars[popoverIndex].label}요일
                  </Text>
                  <Text style={styles.popoverContent} numberOfLines={2}>
                    {weekStars[popoverIndex].diary!.content}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {filledDays > 0 && popoverIndex === null && (
              <Text style={styles.weekSummary}>
                {filledDays === 7 ? '이번 주 별자리를 완성했어요' : `${filledDays}개의 별이 모였어요`}
              </Text>
            )}
          </View>
        </View>

        {/* 이번 달 진행률 */}
        <View style={styles.card}>
          <View style={styles.cardInner}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>이번 달 별자리</Text>
                {isMySeason && (
                  <View style={styles.mySeasonBadge}>
                    <Text style={styles.mySeasonText}>나의 별자리</Text>
                  </View>
                )}
              </View>
              <Text style={styles.progressCount}>
                <Text style={{ color: 'rgba(255,255,255,0.6)' }}>{periodDiaryCount}</Text> / {periodTotalDays}일
              </Text>
            </View>

            <Text style={styles.progressTitle}>
              {isCollected
                ? '이번 달 별자리를 수집했어요'
                : periodProgress >= 50
                  ? `별자리까지 ${80 - periodProgress}% 남았어요`
                  : '매일 기록하면 별자리가 완성돼요'}
            </Text>

            {/* 프로그레스 바 */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressGoalLine, { left: '80%' }]} />
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(periodProgress, 100)}%`,
                    backgroundColor: isCollected
                      ? 'rgba(160,120,255,0.8)'
                      : isMySeason
                        ? 'rgba(255,200,60,0.7)'
                        : 'rgba(100,150,255,0.7)',
                  },
                ]}
              />
            </View>
            <View style={styles.progressFooter}>
              <Text style={styles.progressPct}>{periodProgress}%</Text>
              <Text style={styles.progressGoal}>80% 달성 시 수집</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070f24' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070f24',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30 },
  header: { marginBottom: 20 },
  nickname: { fontSize: 17, fontWeight: '300', color: 'rgba(255,255,255,0.85)' },
  dateText: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  zodiacMsg: {
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
    marginTop: 6,
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  cardInner: { padding: 24 },
  todayRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  todayTitle: { fontSize: 17, fontWeight: '300', color: 'rgba(255,255,255,0.95)', lineHeight: 24 },
  todaySub: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  recordBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(160,185,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordBtnText: { fontSize: 13, fontWeight: '300', color: 'rgba(190,210,255,0.95)' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  weekLabel: { fontSize: 13, fontWeight: '300', color: 'rgba(255,255,255,0.7)' },
  weekCount: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.5)' },
  weekStars: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  starCol: { alignItems: 'center', gap: 10 },
  starWrap: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  dayLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '300' },
  dayLabelToday: { color: 'rgba(175,205,255,0.9)', fontWeight: '500' },
  dayNumber: { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: '300' },
  dayNumberToday: { color: 'rgba(175,205,255,0.7)' },
  popover: {
    marginTop: 20,
    borderRadius: 14,
    padding: 16,
    backgroundColor: 'rgba(80,120,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(120,170,255,0.18)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  popoverDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(140,200,255,0.9)',
    marginTop: 5,
  },
  popoverDate: { fontSize: 10, color: 'rgba(160,200,255,0.7)', letterSpacing: 0.5 },
  popoverContent: { fontSize: 13, color: 'rgba(220,230,255,0.9)', fontWeight: '300', lineHeight: 20, marginTop: 4 },
  weekSummary: {
    marginTop: 24,
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  mySeasonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,200,60,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,60,0.25)',
  },
  mySeasonText: { fontSize: 9, color: 'rgba(255,200,60,0.8)' },
  progressCount: { fontSize: 11, fontWeight: '300', color: 'rgba(255,255,255,0.5)' },
  progressTitle: { fontSize: 15, fontWeight: '300', color: 'rgba(255,255,255,0.85)', lineHeight: 22, marginBottom: 16 },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    position: 'relative',
  },
  progressGoalLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  progressBarFill: { height: '100%', borderRadius: 2 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressPct: { fontSize: 9, color: 'rgba(255,255,255,0.55)' },
  progressGoal: { fontSize: 9, color: 'rgba(255,255,255,0.45)' },
});
