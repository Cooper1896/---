/**
 * Zod schemas for lorebook / world-book data validation.
 */
import { z } from 'zod';

export const LorebookSchema = z.object({
  id: z.string(),
  keys: z.array(z.string()).default([]),
  content: z.string().default(''),
  constant: z.boolean().default(false),
});

export const LorebookFormSchema = z.object({
  keys: z.string().default(''),
  content: z.string().default(''),
  constant: z.boolean().default(false),
});

export type LorebookInput = z.input<typeof LorebookSchema>;
export type LorebookFormInput = z.input<typeof LorebookFormSchema>;
