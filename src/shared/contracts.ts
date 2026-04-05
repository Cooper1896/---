export type ApiProvider = 'OpenAI' | 'Gemini' | 'Custom';
export type SyncDirection = 'up' | 'down';
export type ChatRole = 'system' | 'npc' | 'user';

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
    global_system_prompt?: string;
    instruct_mode_format?: string;
    nsfw_toggle?: boolean;
    main_prompt?: string;
  };
  theme: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  personality: string;
  first_mes?: string;
  mes_example?: string;
  scenario?: string;
  creator_notes?: string;
  system_prompt?: string;
  post_history_instructions?: string;
  alternate_greetings?: string[];
  tags?: string[];
  creator?: string;
  character_version?: string;
  extensions?: Record<string, any>;
  avatar?: string;
}

export interface LorebookEntry {
  keys?: string[];
  content: string;
  constant: boolean;
  insertion_order?: number;
  position?: 'before_char' | 'after_char' | 'top_of_prompt' | 'bottom_of_prompt';
  keyword_logic?: 'ANY' | 'AND' | 'NOT';
  regex_matching?: boolean;
  secondary_keys?: string[];
  extensions?: Record<string, any>;
  search_range?: number;
}

export interface Lorebook {
  id: string;
  entries: LorebookEntry[];
  // Backward compatibility
  keys?: string[];
  content?: string;
  constant?: boolean;
  insertion_order?: number;
  position?: 'before_char' | 'after_char' | 'top_of_prompt' | 'bottom_of_prompt';
  keyword_logic?: 'ANY' | 'AND' | 'NOT';
  regex_matching?: boolean;
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
  role: ChatRole | 'narration';
  name: string;
  content: string;
  timestamp: string;
  swipes?: string[];
  active_swipe_id?: number;
  is_edited?: boolean;
  extra?: Record<string, any>;
  swipe_id?: number; // Backward compatibility
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

export interface ModelsRequest {
  provider: ApiProvider;
  url?: string;
  key?: string;
}

export interface TestConnectionRequest extends ModelsRequest {
  model?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
}

export interface BasicSuccessResponse {
  success: boolean;
}

export interface SyncValidationResponse extends BasicSuccessResponse {
  login: string;
  avatarUrl?: string;
}
