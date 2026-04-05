export type ApiProvider = "OpenAI" | "Gemini" | "Custom";
export type SyncDirection = "up" | "down";
export type ChatRole = "system" | "npc" | "user";

export interface SavedApiPreset {
  provider: ApiProvider;
  url: string;
  key: string;
  model: string;
}

export interface AppSettings {
  tavern: {
    enabled: boolean;
    currentPreset: string;
    presetName: string;
    targetDesc: string;
    postProcess: string;
  };
  api: {
    provider: ApiProvider;
    url: string;
    key: string;
    model: string;
    temperature: number;
    max_tokens: number;
    top_p: number;
    context_size: number;
    jailbreakPrompt: string;
    savedPreset?: SavedApiPreset;
  };
  theme: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  personality: string;
  firstMessage: string;
  mesExample: string;
  avatar?: string;
}

export interface Lorebook {
  id: string;
  keys: string[];
  content: string;
  constant: boolean;
}

export interface Extension {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  enabled?: boolean;
}

export interface DbProviderSettings {
  enabled: boolean;
  url: string;
  key: string;
  model: string;
}

export interface SummaryProviderSettings extends DbProviderSettings {
  prompt: string;
}

export interface DbSettings {
  vectorApi: DbProviderSettings;
  summaryApi: SummaryProviderSettings;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: string[];
}

export interface ThemePayload extends Theme {
  desc: string;
}

export interface SummaryEntry {
  id: string;
  timestamp: string;
  content: string;
}

export interface VectorEntry {
  id: string;
  text: string;
  timestamp: string;
}

export interface AILog {
  id: number;
  timestamp: string;
  type: string;
  model?: string;
  prompt: string;
  response: string;
}

export interface ChatMessage {
  id: number;
  role: ChatRole;
  name: string;
  content: string;
  timestamp: string;
}

export interface SettingsBootstrap {
  settings: AppSettings;
  themes: ThemePayload[];
  characters: Character[];
  lorebooks: Lorebook[];
  extensions: Extension[];
  dbSettings: DbSettings;
  summaryDb: SummaryEntry[];
  vectorDb: VectorEntry[];
}
