export const diaryKeys = {
  all: ['diary'] as const,
  details: () => [...diaryKeys.all, 'detail'] as const,
  detail: (id: string) => [...diaryKeys.details(), id] as const,
  lists: () => [...diaryKeys.all, 'list'] as const,
  list: (filters: { month?: string; q?: string }) =>
    [...diaryKeys.lists(), filters] as const,
};
