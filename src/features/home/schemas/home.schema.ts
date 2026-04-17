import { z } from 'zod';

export const HomeSummarySchema = z.object({
  profile: z.object({
    nickname: z.string().min(1),
    email: z.string().min(1),
    birth_date: z.string().nullable().optional(),
  }),
  starCount: z.number().min(0),
  weekDiaries: z.array(
    z.object({
      diary_id: z.string(),
      entry_date: z.string(),
      content: z.string(),
      emotion_polarity: z.string(),
      emotion_intensity: z.number().nullable(),
    })
  ),
  isDiary: z.boolean(),
  diaryId: z.string().min(1).optional(),
  collectedCount: z.number().min(0),
  periodDiaryCount: z.number().min(0),
  periodTotalDays: z.number().min(0),
});

export type HomeSummary = z.infer<typeof HomeSummarySchema>;
