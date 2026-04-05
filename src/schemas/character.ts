/**
 * Zod schemas for character data validation.
 */
import { z } from 'zod';

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string().min(1, '角色名称不能为空'),
  description: z.string().default(''),
  personality: z.string().default(''),
  firstMessage: z.string().default(''),
  mesExample: z.string().default(''),
  avatar: z.string().optional(),
});

export const CharacterFormSchema = CharacterSchema.omit({ id: true });

export type CharacterInput = z.input<typeof CharacterSchema>;
export type CharacterFormInput = z.input<typeof CharacterFormSchema>;
