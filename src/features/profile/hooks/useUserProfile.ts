import { supabase } from '@/utils/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { profileKeys } from '@/features/profile/queries/profile';
import { useQuery } from '@tanstack/react-query';
import type { ProfileSummary } from '@/features/profile/schemas/profile.schema';

async function fetchProfile(userId: string): Promise<ProfileSummary> {
  const { data: profile, error } = await supabase
    .from('users')
    .select('nickname, email, birth_date')
    .eq('auth_user_id', userId)
    .single();

  if (error) throw error;

  // 총 일기 수
  const { count: totalDiaries } = await supabase
    .from('diary')
    .select('*', { count: 'exact', head: true })
    .eq('auth_user_id', userId)
    .is('deleted_at', null);

  // 좋았던 날
  const { count: totalStars } = await supabase
    .from('diary')
    .select('*', { count: 'exact', head: true })
    .eq('auth_user_id', userId)
    .eq('emotion_polarity', 'POSITIVE')
    .is('deleted_at', null);

  // 힘들었던 날
  const { count: totalWorries } = await supabase
    .from('diary')
    .select('*', { count: 'exact', head: true })
    .eq('auth_user_id', userId)
    .eq('emotion_polarity', 'NEGATIVE')
    .is('deleted_at', null);

  return {
    profile: {
      nickname: profile.nickname,
      email: profile.email,
      birth_date: profile.birth_date,
    },
    totalStars: totalStars ?? 0,
    totalWorries: totalWorries ?? 0,
    totalDiaries: totalDiaries ?? 0,
  };
}

export function useUserProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });
}
