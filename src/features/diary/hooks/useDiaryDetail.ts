import { supabase } from '@/utils/supabase';
import { diaryKeys } from '@/features/diary/queries/diaries';
import { useQuery } from '@tanstack/react-query';
import type { DiaryDetail } from '@/features/diary/schemas/diaryDetail.schema';

async function fetchDiaryDetail(diaryId: string): Promise<DiaryDetail> {
  const { data: diary, error } = await supabase
    .from('diary')
    .select('diary_id, entry_date, content, emotion_polarity, emotion_intensity, created_at, updated_at')
    .eq('diary_id', diaryId)
    .is('deleted_at', null)
    .single();

  if (error) throw error;

  // 태그 가져오기
  const { data: diaryTags } = await supabase
    .from('diary_tags')
    .select('tag:tag(tag_id, tag_name)')
    .eq('diary_id', diaryId);

  const tags = (diaryTags ?? [])
    .map((dt: any) => dt.tag)
    .filter(Boolean);

  return { ...diary, tags };
}

export function useDiaryDetail(diaryId?: string) {
  return useQuery({
    queryKey: diaryKeys.detail(diaryId ?? ''),
    queryFn: () => fetchDiaryDetail(diaryId!),
    enabled: !!diaryId,
  });
}
