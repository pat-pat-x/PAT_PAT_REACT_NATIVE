import { z } from 'zod';

export const PolaritySchema = z.enum(['POSITIVE', 'NEGATIVE', 'UNSET']);

export const DiaryTagSchema = z.object({
  tag_id: z.string().min(1),
  tag_name: z.string().min(1),
});

export const DiaryDetailSchema = z.object({
  diary_id: z.string().min(1),
  entry_date: z.string().min(1),
  content: z.string().min(1),
  emotion_polarity: PolaritySchema,
  emotion_intensity: z.number().int().min(1).max(5).nullable(),
  tags: z.array(DiaryTagSchema),
  created_at: z.string().optional(),
  updated_at: z.string().nullable().optional(),
});

export type DiaryDetail = z.infer<typeof DiaryDetailSchema>;
export type Polarity = z.infer<typeof PolaritySchema>;
