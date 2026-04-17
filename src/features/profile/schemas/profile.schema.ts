import { z } from 'zod';

export const ProfileSchema = z.object({
  profile: z.object({
    nickname: z.string().min(1),
    email: z.string().min(1),
    birth_date: z.string().nullable().optional(),
  }),
  totalStars: z.number().min(0),
  totalWorries: z.number().min(0),
  totalDiaries: z.number().min(0),
});

export type ProfileSummary = z.infer<typeof ProfileSchema>;
