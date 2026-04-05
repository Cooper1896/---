/**
 * Zod schemas for chat message validation.
 */
import { z } from 'zod';

export const ChatRoleSchema = z.enum(['system', 'npc', 'user']);

export const ChatMessageSchema = z.object({
  id: z.number(),
  role: ChatRoleSchema,
  name: z.string(),
  content: z.string(),
  timestamp: z.string(),
});

export type ChatMessageInput = z.input<typeof ChatMessageSchema>;
