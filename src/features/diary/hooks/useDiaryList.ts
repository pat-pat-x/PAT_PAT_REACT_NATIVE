import { supabase } from '@/utils/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { diaryKeys } from '@/features/diary/queries/diaries';
import { useQuery } from '@tanstack/react-query';

type DiaryListItem = {
  diary_id: string;
  entry_date: string;
  content: string;
  emotion_polarity: string;
  emotion_intensity: number | null;
};

async function fetchDiaries(
  userId: string,
  month: string,
  q?: string
): Promise<DiaryListItem[]> {
  // month: "YYYY-MM"
  const startDate = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

  let query = supabase
    .from('diary')
    .select('diary_id, entry_date, content, emotion_polarity, emotion_intensity')
    .eq('auth_user_id', userId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .is('deleted_at', null)
    .order('entry_date', { ascending: false });

  if (q && q.trim()) {
    query = query.ilike('content', `%${q.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export function useDiaryList(month: string, q?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: diaryKeys.list({ month, q }),
    queryFn: () => fetchDiaries(user!.id, month, q),
    enabled: !!user,
  });
}
