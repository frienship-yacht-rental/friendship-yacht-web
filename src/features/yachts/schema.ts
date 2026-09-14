import { z } from "zod";

/**
 * The shape the app relies on, not necessarily everything the API returns.
 * Zod strips unknown keys by default, so extra backend fields are ignored
 * rather than silently flowing into components.
 */
export const yachtSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  model: z.string().min(1),
  lengthOverallMeters: z.number().positive(),
  beamMeters: z.number().positive(),
  draftMeters: z.number().positive(),
  yearBuilt: z.number().int().min(1900).max(2100),
  heroImageUrl: z.url().nullable(),
  summary: z.string(),
});

export const yachtListSchema = z.object({
  items: z.array(yachtSchema),
  total: z.number().int().nonnegative(),
});

export type Yacht = z.infer<typeof yachtSchema>;
export type YachtList = z.infer<typeof yachtListSchema>;
