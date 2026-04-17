import { supabase } from '@/utils/supabase';
import { tagsKeys } from '@/features/diary/queries/tags';
import { useQuery } from '@tanstack/react-query';
import type { Tag } from '@/features/diary/schemas/tag.schema';

async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tag')
    .select('tag_id, tag_name')
    .order('tag_name');

  if (error) throw error;
  return data ?? [];
}

export function useTags() {
  return useQuery({
    queryKey: tagsKeys.list(),
    queryFn: fetchTags,
    staleTime: Infinity,
  });
}
