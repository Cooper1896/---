/**
 * Zod schemas for application settings validation.
 * Provides runtime type-checking and default values for all config.
 */
import { z } from 'zod';

export const ApiProviderSchema = z.enum(['OpenAI', 'Gemini', 'Custom']);

export const SavedApiPresetSchema = z.object({
  provider: ApiProviderSchema,
  url: z.string().url(),
  key: z.string(),
  model: z.string(),
});

export const ApiSettingsSchema = z.object({
  provider: ApiProviderSchema.default('OpenAI'),
  url: z.string().default('https://api.openai.com'),
  key: z.string().default(''),
  model: z.string().default(''),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().int().positive().default(4096),
  top_p: z.number().min(0).max(1).default(1),
  context_size: z.number().int().positive().default(8192),
  jailbreakPrompt: z.string().default(''),
  savedPreset: SavedApiPresetSchema.optional(),
});

export const TavernSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  currentPreset: z.string().default('default'),
  presetName: z.string().default('默认预设'),
  targetDesc: z.string().default(''),
  postProcess: z.string().default(''),
});

export const AppSettingsSchema = z.object({
  tavern: TavernSettingsSchema.default({
    enabled: true,
    currentPreset: 'default',
    presetName: '默认预设',
    targetDesc: '',
    postProcess: '',
  }),
  api: ApiSettingsSchema.default({
    provider: 'OpenAI',
    url: 'https://api.openai.com',
    key: '',
    model: '',
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 1,
    context_size: 8192,
    jailbreakPrompt: '',
  }),
  theme: z.string().default('default'),
});

export type AppSettingsInput = z.input<typeof AppSettingsSchema>;
export type AppSettingsOutput = z.output<typeof AppSettingsSchema>;
