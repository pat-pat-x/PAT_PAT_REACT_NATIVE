import { z } from 'zod';

export const TagSchema = z.object({
  tag_id: z.string().min(1),
  tag_name: z.string().min(1),
});

export const TagsSchema = z.array(TagSchema);

export type Tag = z.infer<typeof TagSchema>;
