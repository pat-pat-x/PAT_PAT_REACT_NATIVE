import { supabase } from '@/utils/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { homeKeys } from '@/features/home/queries/summary';
import { toDateString, getZodiacSign, getZodiacSeasonRange } from '@/lib/zodiac';
import { useQuery } from '@tanstack/react-query';
import type { HomeSummary } from '@/features/home/schemas/home.schema';

async function fetchHomeSummary(userId: string): Promise<HomeSummary> {
  // 1. 프로필
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('nickname, email, birth_date')
    .eq('auth_user_id', userId)
    .single();

  if (profileError || !profile) throw new Error('signup_incomplete');

  // 2. 이번 주 일기
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const kstDay = kst.getUTCDay();
  const monday = new Date(kst);
  monday.setUTCDate(kst.getUTCDate() - ((kstDay + 6) % 7));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const mondayStr = monday.toISOString().split('T')[0];
  const sundayStr = sunday.toISOString().split('T')[0];
  const todayStr = kst.toISOString().split('T')[0];

  const { data: weekDiaries } = await supabase
    .from('diary')
    .select('diary_id, entry_date, content, emotion_polarity, emotion_intensity')
    .eq('auth_user_id', userId)
    .gte('entry_date', mondayStr)
    .lte('entry_date', sundayStr)
    .is('deleted_at', null)
    .order('entry_date', { ascending: true });

  const diaries = weekDiaries ?? [];
  const todayDiary = diaries.find((d) => d.entry_date === todayStr);

  // 3. 별 수집 수
  const { data: collectedData } = await supabase.rpc(
    'get_collected_constellation_count',
    { p_auth_user_id: userId }
  );

  // 4. 이번 시즌 진행도
  const birthDate = profile.birth_date ? new Date(profile.birth_date) : null;
  let periodDiaryCount = 0;
  let periodTotalDays = 0;

  if (birthDate) {
    const sign = getZodiacSign(birthDate);
    const season = getZodiacSeasonRange(new Date(), sign);
    periodTotalDays = season.daysCount;

    const startStr = toDateString(season.start);
    const endStr = toDateString(season.end);

    const { count } = await supabase
      .from('diary')
      .select('*', { count: 'exact', head: true })
      .eq('auth_user_id', userId)
      .gte('entry_date', startStr)
      .lte('entry_date', endStr)
      .is('deleted_at', null);

    periodDiaryCount = count ?? 0;
  }

  // 5. 별 총 개수
  const { count: starCount } = await supabase
    .from('diary')
    .select('*', { count: 'exact', head: true })
    .eq('auth_user_id', userId)
    .is('deleted_at', null);

  return {
    profile: {
      nickname: profile.nickname,
      email: profile.email,
      birth_date: profile.birth_date,
    },
    starCount: starCount ?? 0,
    weekDiaries: diaries,
    isDiary: !!todayDiary,
    diaryId: todayDiary?.diary_id,
    collectedCount: collectedData ?? 0,
    periodDiaryCount,
    periodTotalDays,
  };
}

export function useHomeSummary() {
  const { user } = useAuth();
  return useQuery({
    queryKey: homeKeys.summary(),
    queryFn: () => fetchHomeSummary(user!.id),
    enabled: !!user,
  });
}
