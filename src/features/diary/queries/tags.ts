export const tagsKeys = {
  all: ['tags'] as const,
  list: () => [...tagsKeys.all, 'tags'] as const,
};
