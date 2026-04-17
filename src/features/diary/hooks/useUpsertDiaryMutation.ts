import { supabase } from '@/utils/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { diaryKeys } from '@/features/diary/queries/diaries';
import { homeKeys } from '@/features/home/queries/summary';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

type UpsertParams = {
  entry_date: string;
  polarity: string;
  content: string;
  intensity: number;
  tag_ids: string[];
};

export function useUpsertDiaryMutation(opts?: { diary_id?: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpsertParams) => {
      if (!user) throw new Error('Not authenticated');

      if (opts?.diary_id) {
        // 수정
        const { error } = await supabase.rpc('update_diary_entry', {
          p_auth_user_id: user.id,
          p_diary_id: opts.diary_id,
          p_polarity: params.polarity,
          p_content: params.content,
          p_emotion_intensity: params.intensity,
          p_tag_ids: params.tag_ids,
        });
        if (error) throw error;
      } else {
        // 생성
        const { error } = await supabase.rpc('create_diary_entry', {
          p_auth_user_id: user.id,
          p_entry_date: params.entry_date,
          p_polarity: params.polarity,
          p_content: params.content,
          p_emotion_intensity: params.intensity,
          p_tag_ids: params.tag_ids,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: diaryKeys.all });
      qc.invalidateQueries({ queryKey: homeKeys.all });
      router.replace('/(main)/home');
    },
  });
}
