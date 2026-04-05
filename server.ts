import express, { type Response } from "express";
import { createServer as createViteServer } from "vite";
import { promises as fs } from "fs";
import net from "net";
import path from "path";
import { z } from "zod";
import type {
  AILog,
  AppSettings,
  Character,
  ChatMessage,
  DbSettings,
  Extension,
  Lorebook,
  SettingsBootstrap,
  SummaryEntry,
  Theme,
  ThemePayload,
  VectorEntry,
} from "./server-types";

const PORT = 3002;
const STATE_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(STATE_DIR, "state.json");
const MAX_CHAT_MESSAGES = 500;
const MAX_REMOTE_REPO_BYTES = 1024 * 1024;
const REMOTE_REPO_TIMEOUT_MS = 8000;

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const apiProviderSchema = z.enum(["OpenAI", "Gemini", "Custom"]);

const chatMessageSchema = z.object({
  id: z.coerce.number().int(),
  role: z.enum(["system", "npc", "user"]),
  name: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(20000),
  timestamp: z.string().trim().min(1).max(120),
});

const chatMessagesSchema = z.array(chatMessageSchema).max(MAX_CHAT_MESSAGES);

const characterPayloadObjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(10000).default(""),
  personality: z.string().max(10000).default(""),
  firstMessage: z.string().max(10000).default(""),
  mesExample: z.string().max(20000).default(""),
  avatar: z.string().max(5_000_000).optional(),
});

const characterPayloadSchema: z.ZodType<Omit<Character, "id">> = characterPayloadObjectSchema;

const characterUpdateSchema = characterPayloadObjectSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one character field is required",
});

const loreKeysSchema = z
  .preprocess((value) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      return value.split(",");
    }

    return value;
  }, z.array(z.string().trim().min(1)))
  .transform((value) => value.map((item) => item.trim()).filter(Boolean));

const lorebookPayloadObjectSchema = z.object({
  keys: loreKeysSchema,
  content: z.string().max(20000).default(""),
  constant: z.boolean().default(false),
});

const lorebookPayloadSchema = lorebookPayloadObjectSchema;

const lorebookUpdateSchema = z.object({
  keys: loreKeysSchema.optional(),
  content: z.string().max(20000).optional(),
  constant: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one lorebook field is required",
});

const extensionPayloadSchema = z.object({
  id: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).default(""),
  author: z.string().trim().min(1).max(120),
  version: z.string().trim().min(1).max(80),
  enabled: z.boolean().optional(),
});

const extensionToggleSchema = z.object({
  id: z.string().trim().min(1).max(120),
  enabled: z.boolean(),
});

const idPayloadSchema = z.object({
  id: z.string().trim().min(1).max(120),
});

const tokenPayloadSchema = z.object({
  token: z.string().trim().min(1).max(500),
});

const interknotSyncSchema = z.object({
  messages: chatMessagesSchema,
});

const proxySyncSchema = z.object({
  charId: z.string().trim().min(1).max(120),
  messages: chatMessagesSchema,
  scenario: z.string().max(8000).optional(),
});

const proxyClearSchema = z.object({
  charId: z.string().trim().min(1).max(120),
});

const hollowSyncSchema = z.object({
  messages: chatMessagesSchema,
});

const modelsPayloadSchema = z.object({
  provider: apiProviderSchema,
  url: z.string().trim().max(2048).optional(),
  key: z.string().max(500).optional(),
});

const testConnectionPayloadSchema = modelsPayloadSchema.extend({
  model: z.string().trim().max(200).optional(),
});

const interknotChatPayloadSchema = z.object({
  messages: chatMessagesSchema,
  characterId: z.string().trim().max(120).optional(),
});

const proxyChatPayloadSchema = z.object({
  messages: chatMessagesSchema,
  charId: z.string().trim().min(1).max(120),
  scenario: z.string().max(8000).optional(),
});

const hollowChatPayloadSchema = z.object({
  messages: chatMessagesSchema,
});

const summaryGeneratePayloadSchema = z.object({
  chatHistory: z.string().trim().min(1).max(200_000),
});

const vectorAddPayloadSchema = z.object({
  text: z.string().trim().min(1).max(20000),
});

const dbSettingsSchema = z.object({
  vectorApi: z.object({
    enabled: z.boolean(),
    url: z.string().max(2048),
    key: z.string().max(500),
    model: z.string().max(200),
  }),
  summaryApi: z.object({
    enabled: z.boolean(),
    url: z.string().max(2048),
    key: z.string().max(500),
    model: z.string().max(200),
    prompt: z.string().max(20000),
  }),
});

const appSettingsPatchSchema = z.object({
  tavern: z.object({
    enabled: z.boolean().optional(),
    currentPreset: z.string().max(200).optional(),
    presetName: z.string().max(200).optional(),
    targetDesc: z.string().max(5000).optional(),
    postProcess: z.string().max(500).optional(),
  }).optional(),
  api: z.object({
    provider: apiProviderSchema.optional(),
    url: z.string().max(2048).optional(),
    key: z.string().max(500).optional(),
    model: z.string().max(200).optional(),
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().int().min(1).max(200000).optional(),
    top_p: z.number().min(0).max(1).optional(),
    context_size: z.number().int().min(128).max(2_000_000).optional(),
    jailbreakPrompt: z.string().max(50000).optional(),
    savedPreset: z.object({
      provider: apiProviderSchema,
      url: z.string().max(2048),
      key: z.string().max(500),
      model: z.string().max(200),
    }).optional(),
  }).optional(),
  theme: z.string().max(200).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one settings field is required",
});

const persistedStateSchema = z.object({
  settings: appSettingsPatchSchema.optional(),
  characters: z.array(characterPayloadObjectSchema.extend({ id: z.string() })).optional(),
  lorebooks: z.array(lorebookPayloadObjectSchema.extend({ id: z.string() })).optional(),
  aiLogs: z.array(z.object({
    id: z.number(),
    timestamp: z.string(),
    type: z.string(),
    model: z.string().optional(),
    prompt: z.string(),
    response: z.string(),
  })).optional(),
  interKnotHistories: z.record(z.string(), chatMessagesSchema).optional(),
  chatHistories: z.record(z.string(), chatMessagesSchema).optional(),
  hollowHistory: chatMessagesSchema.optional(),
  proxyScenarios: z.record(z.string(), z.string()).optional(),
  extensions: z.array(extensionPayloadSchema).optional(),
  dbSettings: dbSettingsSchema.optional(),
  summaryDb: z.array(z.object({
    id: z.string(),
    timestamp: z.string(),
    content: z.string(),
  })).optional(),
  vectorDb: z.array(z.object({
    id: z.string(),
    text: z.string(),
    timestamp: z.string(),
  })).optional(),
});

function parseWithSchema<T>(schema: z.ZodSchema<T>, payload: unknown, context: string): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");

    throw new HttpError(400, `${context} validation failed - ${details}`);
  }

  return parsed.data;
}

function handleRouteError(res: Response, error: unknown, fallbackMessage: string): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  if (error instanceof Error) {
    res.status(500).json({ error: error.message || fallbackMessage });
    return;
  }

  res.status(500).json({ error: fallbackMessage });
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((value) => Number(value));
  if (parts.length !== 4 || parts.some((value) => Number.isNaN(value))) {
    return true;
  }

  if (parts[0] === 10 || parts[0] === 127 || parts[0] === 0) {
    return true;
  }

  if (parts[0] === 169 && parts[1] === 254) {
    return true;
  }

  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }

  if (parts[0] === 192 && parts[1] === 168) {
    return true;
  }

  return false;
}

function assertSafeOutboundUrl(rawUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new HttpError(400, "Invalid URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new HttpError(400, "Only HTTP(S) URLs are allowed");
  }

  if (isBlockedRemoteHost(parsed.hostname)) {
    throw new HttpError(400, "Target host is blocked for security reasons");
  }
}

function isBlockedRemoteHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().trim();

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  const ipType = net.isIP(normalized);
  if (ipType === 4) {
    return isPrivateIpv4(normalized);
  }

  if (ipType === 6) {
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80")
    );
  }

  return false;
}

async function fetchJsonWithLimit(url: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REMOTE_REPO_TIMEOUT_MS);

  try {
    const headers = new Headers(init?.headers);
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers,
    });

    if (!response.ok) {
      throw new HttpError(response.status, `Remote request failed with status ${response.status}`);
    }

    const raw = await response.text();
    if (raw.length > MAX_REMOTE_REPO_BYTES) {
      throw new HttpError(413, "Remote repository index is too large");
    }

    try {
      return JSON.parse(raw);
    } catch {
      throw new HttpError(400, "Remote repository did not return valid JSON");
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new HttpError(504, "Remote repository request timed out");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getOpenAIMessageText(payload: unknown): string {
  const content = (payload as any)?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new HttpError(502, "Upstream model response missing text content");
  }

  return content;
}

function getGeminiMessageText(payload: unknown): string {
  const content = (payload as any)?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof content !== "string" || !content.trim()) {
    throw new HttpError(502, "Gemini response missing text content");
  }

  return content;
}

function getOpenAIModelIds(payload: unknown): string[] {
  const items = (payload as any)?.data;
  if (!Array.isArray(items)) {
    throw new HttpError(502, "Model list response missing data array");
  }

  return items
    .map((item: any) => item?.id)
    .filter((id: unknown): id is string => typeof id === "string" && Boolean(id.trim()));
}

function getGeminiModelIds(payload: unknown): string[] {
  const items = (payload as any)?.models;
  if (!Array.isArray(items)) {
    throw new HttpError(502, "Gemini model list missing models array");
  }

  return items
    .map((item: any) => item?.name)
    .filter((name: unknown): name is string => typeof name === "string" && name.startsWith("models/"))
    .map((name) => name.replace("models/", ""));
}

async function startServer() {
  const app = express();

  app.use(express.json());

  // In-memory data store for the backend
  let logs = [
    { id: 1, time: '04:21:09.112', method: 'GET', path: '/api/tavern/status', status: 200, latency: '12ms', ip: '192.168.1.104' },
    { id: 2, time: '04:21:10.045', method: 'POST', path: '/api/tavern/auth', status: 401, latency: '45ms', ip: '10.0.0.5' },
    { id: 3, time: '04:21:15.882', method: 'GET', path: '/api/tavern/patrons', status: 200, latency: '120ms', ip: '192.168.1.104' },
    { id: 4, time: '04:21:16.201', method: 'PUT', path: '/api/tavern/order/992', status: 201, latency: '34ms', ip: '192.168.1.104' },
    { id: 5, time: '04:21:22.000', method: 'GET', path: '/api/tavern/inventory', status: 200, latency: '18ms', ip: '10.0.0.2' },
    { id: 6, time: '04:21:25.404', method: 'DELETE', path: '/api/tavern/session/expired', status: 200, latency: '89ms', ip: '127.0.0.1' },
    { id: 7, time: '04:21:30.111', method: 'GET', path: '/api/tavern/ws/connect', status: 101, latency: '2ms', ip: '192.168.1.104' },
    { id: 8, time: '04:21:35.555', method: 'POST', path: '/api/tavern/drink/mix', status: 500, latency: '405ms', ip: '10.0.0.5' },
    { id: 9, time: '04:21:36.102', method: 'GET', path: '/api/tavern/drink/menu', status: 200, latency: '15ms', ip: '192.168.1.104' },
  ];

  let settings: AppSettings = {
    tavern: {
      enabled: true,
      currentPreset: 'default',
      presetName: '',
      targetDesc: '',
      postProcess: '未选择'
    },
    api: {
      provider: 'OpenAI',
      url: 'https://api.openai.com',
      key: '',
      model: '',
      temperature: 0.8,
      max_tokens: 2048,
      top_p: 0.9,
      context_size: 4096,
      jailbreakPrompt: ''
    },
    theme: '墨色经典'
  };

  let characters: Character[] = [];
  let lorebooks: Lorebook[] = [];
  let aiLogs: AILog[] = [];
  let proxyScenarios: Record<string, string> = {};
  let interKnotHistories: Record<string, ChatMessage[]> = {};
  let hollowHistory: ChatMessage[] = [];
  let extensions: Extension[] = [];

  let dbSettings: DbSettings = {
    vectorApi: {
      enabled: false,
      url: '',
      key: '',
      model: 'text-embedding-ada-002'
    },
    summaryApi: {
      enabled: false,
      url: '',
      key: '',
      model: 'gpt-3.5-turbo',
      prompt: '请总结以下对话内容：\n\n{{chat}}'
    }
  };

  let vectorDb: VectorEntry[] = [];
  let summaryDb: SummaryEntry[] = [];

  const fallbackCharacter: Character = {
    id: "fallback-character",
    name: "AI",
    description: "You are a helpful assistant.",
    personality: "",
    firstMessage: "",
    mesExample: "",
  };

  let persistTimer: NodeJS.Timeout | null = null;

  const persistState = async (): Promise<void> => {
    const payload = {
      settings,
      characters,
      lorebooks,
      aiLogs,
      interKnotHistories,
      hollowHistory,
      proxyScenarios,
      extensions,
      dbSettings,
      summaryDb,
      vectorDb,
    };

    await fs.mkdir(STATE_DIR, { recursive: true });
    await fs.writeFile(STATE_FILE, JSON.stringify(payload, null, 2), "utf8");
  };

  const schedulePersist = (): void => {
    if (persistTimer) {
      clearTimeout(persistTimer);
    }

    persistTimer = setTimeout(() => {
      void persistState().catch((error) => {
        console.error("Persist state failed:", error);
      });
    }, 200);
  };

  const loadPersistedState = async (): Promise<void> => {
    try {
      const raw = await fs.readFile(STATE_FILE, "utf8");
      const parsed = parseWithSchema(persistedStateSchema, JSON.parse(raw), "Persisted state");

      if (parsed.settings) {
        settings = {
          ...settings,
          ...parsed.settings,
          tavern: {
            ...settings.tavern,
            ...(parsed.settings.tavern ?? {}),
          },
          api: {
            ...settings.api,
            ...(parsed.settings.api ?? {}),
          },
        };
      }

      if (parsed.characters) characters = parsed.characters;
      if (parsed.lorebooks) lorebooks = parsed.lorebooks as Lorebook[];
      if (parsed.aiLogs) aiLogs = parsed.aiLogs;
      if (parsed.interKnotHistories) interKnotHistories = parsed.interKnotHistories;
      if (parsed.hollowHistory) hollowHistory = parsed.hollowHistory;
      if (parsed.proxyScenarios) proxyScenarios = parsed.proxyScenarios;
      if (parsed.extensions) extensions = parsed.extensions;
      if (parsed.dbSettings) dbSettings = parsed.dbSettings;
      if (parsed.summaryDb) summaryDb = parsed.summaryDb;
      if (parsed.vectorDb) vectorDb = parsed.vectorDb;
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        console.error("Load persisted state failed:", error);
      }
    }
  };

  const sanitizeSettingsForSync = (input: AppSettings): AppSettings => ({
    ...input,
    api: {
      ...input.api,
      key: "",
      savedPreset: input.api.savedPreset
        ? { ...input.api.savedPreset, key: "" }
        : undefined,
    },
  });

  const mergeSettingsFromSync = (incoming: AppSettings): AppSettings => {
    const currentApiKey = settings.api.key;
    const currentSavedPresetKey = settings.api.savedPreset?.key ?? "";

    const merged: AppSettings = {
      ...settings,
      ...incoming,
      api: {
        ...settings.api,
        ...incoming.api,
      },
    };

    if (merged.api.savedPreset) {
      merged.api.savedPreset = {
        ...merged.api.savedPreset,
        key: currentSavedPresetKey,
      };
    }

    merged.api.key = currentApiKey;
    return merged;
  };

  const findSyncGistId = async (headers: Record<string, string>): Promise<string | null> => {
    for (let page = 1; page <= 20; page += 1) {
      const gistsRes = await fetch(`https://api.github.com/gists?per_page=100&page=${page}`, { headers });
      if (!gistsRes.ok) throw new Error("Failed to fetch gists");

      const gists = await gistsRes.json();
      if (!Array.isArray(gists)) throw new Error("Unexpected GitHub gists response");

      const matched = gists.find((gist: any) => Boolean(gist?.files?.["zenless_tavern_sync.json"]));
      if (matched?.id) {
        return matched.id as string;
      }

      if (gists.length < 100) {
        break;
      }
    }

    return null;
  };

  const readSyncFileFromGist = async (gistData: any): Promise<string> => {
    const syncFile = gistData?.files?.["zenless_tavern_sync.json"];
    if (!syncFile) throw new Error("Sync file not found in gist");

    if (typeof syncFile.content === "string") {
      return syncFile.content;
    }

    if (typeof syncFile.raw_url === "string") {
      const rawRes = await fetch(syncFile.raw_url, {
        headers: { Accept: "application/vnd.github.v3.raw" },
      });

      if (!rawRes.ok) throw new Error("Failed to fetch gist raw content");
      return rawRes.text();
    }

    throw new Error("Sync file content unavailable");
  };

  await loadPersistedState();

  app.get("/api/ai-logs", (req, res) => {
    res.json(aiLogs);
  });

  app.get("/api/characters", (req, res) => {
    res.json(characters);
  });

  app.post("/api/characters", (req, res) => {
    try {
      const payload = parseWithSchema(characterPayloadSchema, req.body, "Character payload");
      const newChar: Character = { id: Date.now().toString(), ...payload };
      characters.push(newChar);
      schedulePersist();
      res.json(newChar);
    } catch (error) {
      handleRouteError(res, error, "Failed to create character");
    }
  });

  app.put("/api/characters/:id", (req, res) => {
    try {
      const payload = parseWithSchema(characterUpdateSchema, req.body, "Character update payload");
      const index = characters.findIndex(c => c.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Character not found" });
      }

      characters[index] = { ...characters[index], ...payload };
      schedulePersist();
      res.json(characters[index]);
    } catch (error) {
      handleRouteError(res, error, "Failed to update character");
    }
  });

  app.delete("/api/characters/:id", (req, res) => {
    const before = characters.length;
    characters = characters.filter(c => c.id !== req.params.id);
    if (before === characters.length) {
      return res.status(404).json({ error: "Character not found" });
    }

    schedulePersist();
    res.json({success: true});
  });

  app.get("/api/lorebooks", (req, res) => {
    res.json(lorebooks);
  });

  app.post("/api/lorebooks", (req, res) => {
    try {
      const payload = parseWithSchema(lorebookPayloadSchema, req.body, "Lorebook payload");
      const newLore: Lorebook = {
        id: Date.now().toString(),
        keys: payload.keys ?? [],
        content: payload.content,
        constant: payload.constant,
      };
      lorebooks.push(newLore);
      schedulePersist();
      res.json(newLore);
    } catch (error) {
      handleRouteError(res, error, "Failed to create lorebook");
    }
  });

  app.put("/api/lorebooks/:id", (req, res) => {
    try {
      const payload = parseWithSchema(lorebookUpdateSchema, req.body, "Lorebook update payload");
      const index = lorebooks.findIndex(l => l.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Lorebook not found" });
      }

      lorebooks[index] = { ...lorebooks[index], ...payload };
      schedulePersist();
      res.json(lorebooks[index]);
    } catch (error) {
      handleRouteError(res, error, "Failed to update lorebook");
    }
  });

  app.delete("/api/lorebooks/:id", (req, res) => {
    const before = lorebooks.length;
    lorebooks = lorebooks.filter(l => l.id !== req.params.id);
    if (before === lorebooks.length) {
      return res.status(404).json({ error: "Lorebook not found" });
    }

    schedulePersist();
    res.json({success: true});
  });

  // Extensions System
  const stRepo: Extension[] = [
    { id: 'st-tts', name: 'SillyTavern TTS', description: 'Text-to-Speech support (ElevenLabs, Silero, Edge-TTS)', author: 'SillyTavern', version: '1.0.0' },
    { id: 'st-dnd-dice', name: 'D&D Dice Roller', description: 'D&D Dice Roller for chat (/roll)', author: 'SillyTavern', version: '1.2.0' },
    { id: 'st-image-gen', name: 'Image Generation', description: 'Stable Diffusion & DALL-E generation', author: 'SillyTavern', version: '2.1.0' },
    { id: 'st-websearch', name: 'Web Search', description: 'Web search for up-to-date info', author: 'SillyTavern', version: '1.0.5' },
    { id: 'st-memory', name: 'Vector Storage', description: 'Vector DB (ChromaDB) long term memory', author: 'SillyTavern', version: '1.5.2' },
    { id: 'st-expressions', name: 'Character Expressions', description: 'Auto-switch character expressions based on sentiment', author: 'SillyTavern', version: '2.0.1' }
  ];

  app.get("/api/extensions", (req, res) => {
    res.json(extensions);
  });

  app.get("/api/extensions/repo", async (req, res) => {
    try {
      if (Array.isArray(req.query.url)) {
        throw new HttpError(400, "Repository URL must be a single value");
      }

      const repoUrl = typeof req.query.url === "string" ? req.query.url.trim() : "";

      if (!repoUrl) {
        setTimeout(() => res.json(stRepo), 300);
        return;
      }

      const remoteUrl = new URL(repoUrl);
      if (remoteUrl.protocol !== "https:") {
        throw new HttpError(400, "Repository URL must use HTTPS");
      }

      if (isBlockedRemoteHost(remoteUrl.hostname)) {
        throw new HttpError(400, "Repository host is blocked for security reasons");
      }

      const data = await fetchJsonWithLimit(remoteUrl.toString());
      const parsed = z.array(extensionPayloadSchema).safeParse(data);
      if (!parsed.success) {
        throw new HttpError(400, "Repository index must be a valid extension array");
      }

      res.json(parsed.data);
    } catch (error) {
      handleRouteError(res, error, "Failed to fetch extension repository");
    }
  });

  app.post("/api/extensions/install", (req, res) => {
    try {
      const ext = parseWithSchema(extensionPayloadSchema, req.body, "Extension install payload");
      if (!extensions.find(e => e.id === ext.id)) {
        extensions.push({ ...ext, enabled: true });
        schedulePersist();
      }
      res.json(extensions);
    } catch (error) {
      handleRouteError(res, error, "Failed to install extension");
    }
  });

  app.post("/api/extensions/uninstall", (req, res) => {
    try {
      const payload = parseWithSchema(idPayloadSchema, req.body, "Extension uninstall payload");
      const before = extensions.length;
      extensions = extensions.filter(e => e.id !== payload.id);
      if (before === extensions.length) {
        return res.status(404).json({ error: "Extension not found" });
      }

      schedulePersist();
      res.json(extensions);
    } catch (error) {
      handleRouteError(res, error, "Failed to uninstall extension");
    }
  });

  app.post("/api/extensions/toggle", (req, res) => {
    try {
      const payload = parseWithSchema(extensionToggleSchema, req.body, "Extension toggle payload");
      const ext = extensions.find(e => e.id === payload.id);
      if (!ext) {
        return res.status(404).json({ error: "Extension not found" });
      }

      ext.enabled = payload.enabled;
      schedulePersist();
      res.json(extensions);
    } catch (error) {
      handleRouteError(res, error, "Failed to toggle extension");
    }
  });

  // Database Management System

  app.get("/api/db/settings", (req, res) => {
    res.json(dbSettings);
  });

  app.put("/api/db/settings", (req, res) => {
    try {
      const payload = parseWithSchema(dbSettingsSchema, req.body, "DB settings payload");
      dbSettings = payload;
      schedulePersist();
      res.json(dbSettings);
    } catch (error) {
      handleRouteError(res, error, "Failed to update DB settings");
    }
  });

  app.get("/api/db/summary", (req, res) => {
    res.json(summaryDb);
  });

  app.post("/api/db/summary/generate", async (req, res) => {
    try {
      const payload = parseWithSchema(summaryGeneratePayloadSchema, req.body, "Summary generate payload");
      if (!dbSettings.summaryApi.enabled || !dbSettings.summaryApi.url) {
        return res.status(400).json({ error: "Summary API not configured or disabled" });
      }

      let summaryText = "This is a simulated summary content. Since no real API Key is configured, returning this placeholder.";

      if (dbSettings.summaryApi.key && dbSettings.summaryApi.key !== 'dummy') {
        let baseUrl = dbSettings.summaryApi.url.trim().replace(/\/+$/, '');
        if (!baseUrl.endsWith('/v1')) baseUrl += '/v1';

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dbSettings.summaryApi.key}`
          },
          body: JSON.stringify({
            model: dbSettings.summaryApi.model,
            messages: [
              { role: 'system', content: dbSettings.summaryApi.prompt.replace('{{chat}}', payload.chatHistory) }
            ]
          })
        });

        if (!response.ok) {
          const details = await response.text();
          throw new HttpError(response.status, `Summary API error: ${details}`);
        }

        const data = await response.json();
        summaryText = getOpenAIMessageText(data);
      }

      const newSummary: SummaryEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        content: summaryText
      };
      summaryDb.push(newSummary);
      schedulePersist();
      res.json(newSummary);
    } catch (error) {
      handleRouteError(res, error, "Failed to generate summary");
    }
  });

  app.get("/api/db/vector", (req, res) => {
    res.json(vectorDb);
  });

  app.post("/api/db/vector/add", (req, res) => {
    try {
      const payload = parseWithSchema(vectorAddPayloadSchema, req.body, "Vector add payload");
      const newEntry: VectorEntry = {
        id: Date.now().toString(),
        text: payload.text,
        timestamp: new Date().toISOString()
      };
      vectorDb.push(newEntry);
      schedulePersist();
      res.json(newEntry);
    } catch (error) {
      handleRouteError(res, error, "Failed to add vector entry");
    }
  });

  app.delete("/api/db/summary/:id", (req, res) => {
    const before = summaryDb.length;
    summaryDb = summaryDb.filter(s => s.id !== req.params.id);
    if (before === summaryDb.length) {
      return res.status(404).json({ error: "Summary entry not found" });
    }

    schedulePersist();
    res.json({ success: true });
  });

  app.delete("/api/db/vector/:id", (req, res) => {
    const before = vectorDb.length;
    vectorDb = vectorDb.filter(v => v.id !== req.params.id);
    if (before === vectorDb.length) {
      return res.status(404).json({ error: "Vector entry not found" });
    }

    schedulePersist();
    res.json({ success: true });
  });

  const themes: ThemePayload[] = [
    { id: 'zzz-default', name: 'ZZZ Default', description: 'Neon Hacker', desc: 'Neon Hacker', colors: ['#131313', '#00DAF3', '#FFF000', '#1c1b1b'] },
    { id: 'belobog', name: 'Belobog Heavy Industries', description: 'Industrial', desc: 'Industrial', colors: ['#1a1a1a', '#2a2a2a', '#d4af37', '#252525'] },
    { id: 'victoria', name: 'Victoria Housekeeping', description: 'Elegant Maid', desc: 'Elegant Maid', colors: ['#2c1836', '#4a154b', '#f5e6e8', '#381f45'] },
    { id: 'gentle-house', name: 'Cunning Hares', description: 'Street Style', desc: 'Street Style', colors: ['#1f2937', '#10b981', '#f3f4f6', '#111827'] }
  ];

  app.get("/api/settings/bootstrap", (req, res) => {
    const bootstrap: SettingsBootstrap = {
      settings,
      themes,
      characters,
      lorebooks,
      extensions,
      dbSettings,
      summaryDb,
      vectorDb,
    };

    res.json(bootstrap);
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/logs", (req, res) => {
    res.json(logs);
  });

  app.get("/api/settings", (req, res) => {
    res.json(settings);
  });

  app.put("/api/settings", (req, res) => {
    try {
      const payload = parseWithSchema(appSettingsPatchSchema, req.body, "Settings payload");
      settings = {
        ...settings,
        ...payload,
        tavern: {
          ...settings.tavern,
          ...(payload.tavern ?? {}),
        },
        api: {
          ...settings.api,
          ...(payload.api ?? {}),
        },
      };
      schedulePersist();
      res.json(settings);
    } catch (error) {
      handleRouteError(res, error, "Failed to update settings");
    }
  });

  app.get("/api/themes", (req, res) => {
    res.json(themes);
  });

  app.post("/api/models", async (req, res) => {
    try {
      const { provider, url, key } = parseWithSchema(modelsPayloadSchema, req.body, "Models payload");

      if (provider === 'OpenAI' || provider === 'Custom') {
        if (provider === 'OpenAI' && !key?.trim()) {
          throw new HttpError(400, "API key is required to list OpenAI-compatible models");
        }

        let baseUrl = (url || 'https://api.openai.com').trim();
        baseUrl = baseUrl.replace(/\/+$/, '');
        if (!baseUrl.endsWith('/v1')) baseUrl += '/v1';
        const endpoint = baseUrl + '/models';

        if (provider === 'OpenAI') {
          assertSafeOutboundUrl(endpoint);
        }

        const headers: Record<string, string> = {};
        if (key?.trim()) {
          headers.Authorization = `Bearer ${key}`;
        }

        const response = await fetch(endpoint, {
          headers,
        });

        if (!response.ok) {
          const details = await response.text();
          throw new HttpError(response.status, `API Error: ${details}`);
        }

        const data = await response.json();
        res.json(getOpenAIModelIds(data));
      } else if (provider === 'Gemini') {
        if (!key?.trim()) {
          throw new HttpError(400, "API key is required to list Gemini models");
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await fetch(endpoint);

        if (!response.ok) {
          const details = await response.text();
          throw new HttpError(response.status, `API Error: ${details}`);
        }

        const data = await response.json();
        res.json(getGeminiModelIds(data));
      } else {
        res.json(['mock-model-1', 'mock-model-2']);
      }
    } catch (error) {
      handleRouteError(res, error, "Failed to load model list");
    }
  });

  app.post("/api/test-connection", async (req, res) => {
    try {
      const { provider, url, key, model } = parseWithSchema(testConnectionPayloadSchema, req.body, "Test connection payload");

      if ((provider === "OpenAI" || provider === "Custom" || provider === "Gemini") && !model) {
        return res.status(400).json({ error: "Please select a model before testing the connection" });
      }

      if ((provider === "OpenAI" || provider === "Gemini") && !key?.trim()) {
        return res.status(400).json({ error: "API key is required" });
      }

      const messages = [{ role: 'user', content: 'Hi' }];
      let responseText = '';

      if (provider === 'OpenAI' || provider === 'Custom') {
        let baseUrl = (url || 'https://api.openai.com').trim();
        baseUrl = baseUrl.replace(/\/+$/, '');
        if (!baseUrl.endsWith('/v1')) baseUrl += '/v1';
        const endpoint = baseUrl + '/chat/completions';

        if (provider === 'OpenAI') {
          assertSafeOutboundUrl(endpoint);
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (key?.trim()) {
          headers.Authorization = `Bearer ${key}`;
        }

        const aiRes = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: model || 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 10
          })
        });

        if (!aiRes.ok) {
          const details = await aiRes.text();
          throw new HttpError(aiRes.status, `API Error: ${details}`);
        }

        const data = await aiRes.json();
        responseText = getOpenAIMessageText(data);
      } else if (provider === 'Gemini') {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const aiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Hi" }] }]
          })
        });

        if (!aiRes.ok) {
          const details = await aiRes.text();
          throw new HttpError(aiRes.status, `API Error: ${details}`);
        }

        const data = await aiRes.json();
        responseText = getGeminiMessageText(data);
      } else {
        responseText = 'Test reply from Mock Provider';
      }

      res.json({ success: true, message: responseText });
    } catch (error) {
      handleRouteError(res, error, "Connection test failed");
    }
  });

  // --- Inter-Knot (Agent Network) Endpoints ---
  app.get("/api/interknot/:charId", (req, res) => {
    res.json(interKnotHistories[req.params.charId] || []);
  });

  app.post("/api/interknot/:charId/sync", (req, res) => {
    try {
      const payload = parseWithSchema(interknotSyncSchema, req.body, "InterKnot sync payload");
      if (!req.params.charId?.trim()) {
        throw new HttpError(400, "charId is required");
      }

      interKnotHistories[req.params.charId] = payload.messages;
      schedulePersist();
      res.json({ success: true });
    } catch (error) {
      handleRouteError(res, error, "Failed to sync InterKnot history");
    }
  });

  app.post("/api/interknot/:charId/clear", (req, res) => {
    if (!req.params.charId?.trim()) {
      return res.status(400).json({ error: "charId is required" });
    }

    interKnotHistories[req.params.charId] = [];
    schedulePersist();
    res.json({ success: true });
  });

  // --- Proxy (Single Character) Endpoints ---
  app.get("/api/proxy/history", (req, res) => {
    const charId = typeof req.query.charId === "string" ? req.query.charId : "";
    if (!charId) {
      return res.status(400).json({ error: "charId is required" });
    }

    res.json(interKnotHistories[charId] || []);
  });

  app.post("/api/proxy/sync", (req, res) => {
    try {
      const payload = parseWithSchema(proxySyncSchema, req.body, "Proxy sync payload");

      interKnotHistories[payload.charId] = payload.messages;

      if (typeof payload.scenario === "string") {
        proxyScenarios[payload.charId] = payload.scenario;
      }

      schedulePersist();
      res.json({ success: true });
    } catch (error) {
      handleRouteError(res, error, "Failed to sync proxy history");
    }
  });

  app.post("/api/proxy/clear", (req, res) => {
    try {
      const payload = parseWithSchema(proxyClearSchema, req.body, "Proxy clear payload");
      interKnotHistories[payload.charId] = [];
      delete proxyScenarios[payload.charId];
      schedulePersist();
      res.json({ success: true });
    } catch (error) {
      handleRouteError(res, error, "Failed to clear proxy history");
    }
  });

  // --- Hollow (World Exploration) Endpoints ---
  app.get("/api/hollow/history", (req, res) => {
    res.json(hollowHistory);
  });

  app.post("/api/hollow/sync", (req, res) => {
    try {
      const payload = parseWithSchema(hollowSyncSchema, req.body, "Hollow sync payload");
      hollowHistory = payload.messages;
      schedulePersist();
      res.json({ success: true });
    } catch (error) {
      handleRouteError(res, error, "Failed to sync hollow history");
    }
  });

  app.post("/api/hollow/clear", (req, res) => {
    hollowHistory = [];
    schedulePersist();
    res.json({ success: true });
  });

  app.post("/api/sync/validate", async (req, res) => {
    try {
      const { token } = parseWithSchema(tokenPayloadSchema, req.body, "Sync validate payload");
      const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      };

      const userRes = await fetch('https://api.github.com/user', { headers });
      if (!userRes.ok) {
        if (userRes.status === 401 || userRes.status === 403) {
          return res.status(401).json({ error: 'Invalid GitHub token' });
        }

        const details = await userRes.text();
        throw new HttpError(userRes.status, `GitHub validation failed: ${details}`);
      }

      const user = await userRes.json();
      res.json({
        success: true,
        login: user.login,
        avatarUrl: user.avatar_url
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to validate GitHub token");
    }
  });

  app.post("/api/sync/up", async (req, res) => {
    try {
      const { token } = parseWithSchema(tokenPayloadSchema, req.body, "Sync up payload");
      const dataToSync = {
        characters,
        lorebooks,
        interKnotHistories,
        hollowHistory,
        proxyScenarios,
        settings: sanitizeSettingsForSync(settings),
      };
      
      const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      };

      const gistId = await findSyncGistId(headers);

      const payload = {
        description: "Zenless Tavern Sync Data",
        public: false,
        files: {
          "zenless_tavern_sync.json": {
            content: JSON.stringify(dataToSync, null, 2)
          }
        }
      };

      let syncRes;
      if (gistId) {
        syncRes = await fetch(`https://api.github.com/gists/${gistId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        syncRes = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (!syncRes.ok) throw new Error('Failed to sync to GitHub');
      
      res.json({ success: true });
    } catch (error) {
      console.error('Sync Up Error:', error);
      handleRouteError(res, error, "Failed to sync data to GitHub");
    }
  });

  app.post("/api/sync/down", async (req, res) => {
    try {
      const { token } = parseWithSchema(tokenPayloadSchema, req.body, "Sync down payload");
      const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      };

      const gistId = await findSyncGistId(headers);

      if (!gistId) {
        return res.status(404).json({ error: 'No sync data found on GitHub' });
      }

      const gistRes = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
      if (!gistRes.ok) throw new Error('Failed to fetch gist content');
      const gistData = await gistRes.json();
      
      const fileContent = await readSyncFileFromGist(gistData);
      const parsedData = parseWithSchema(persistedStateSchema, JSON.parse(fileContent), "Synced state payload");

      if (parsedData.characters) characters = parsedData.characters;
      if (parsedData.lorebooks) lorebooks = parsedData.lorebooks as Lorebook[];
      if (parsedData.interKnotHistories) interKnotHistories = parsedData.interKnotHistories;
      if (parsedData.hollowHistory) hollowHistory = parsedData.hollowHistory;
      if (!parsedData.interKnotHistories && parsedData.chatHistories) interKnotHistories = parsedData.chatHistories; // Backward compatibility
      if (parsedData.proxyScenarios) proxyScenarios = parsedData.proxyScenarios;
      if (parsedData.settings) {
        const incomingSettings: AppSettings = {
          ...settings,
          ...parsedData.settings,
          tavern: {
            ...settings.tavern,
            ...(parsedData.settings.tavern ?? {}),
          },
          api: {
            ...settings.api,
            ...(parsedData.settings.api ?? {}),
          },
        };
        settings = mergeSettingsFromSync(incomingSettings);
      }

      if (parsedData.extensions) extensions = parsedData.extensions;
      if (parsedData.dbSettings) dbSettings = parsedData.dbSettings;
      if (parsedData.summaryDb) summaryDb = parsedData.summaryDb;
      if (parsedData.vectorDb) vectorDb = parsedData.vectorDb;

      schedulePersist();

      res.json({ success: true });
    } catch (error) {
      console.error('Sync Down Error:', error);
      handleRouteError(res, error, "Failed to sync data from GitHub");
    }
  });

  const runCharacterChat = async ({
    messages,
    characterId,
    scenario,
    logType,
  }: {
    messages: ChatMessage[];
    characterId?: string;
    scenario?: string;
    logType: string;
  }) => {
    const char: Character =
      characters.find(c => c.id === characterId) ??
      characters[0] ??
      fallbackCharacter;

    const latestMessage = messages[messages.length - 1]?.content ?? "";

    // If no API key, fallback to mock response
    if (!settings.api.key) {
      return {
        id: Date.now(),
        role: "npc" as const,
        name: char.name,
        content: `[未配置API密钥] 收到指令：“${latestMessage}”。请在设置中配置API密钥以启用真实对话。`,
        timestamp: new Date().toISOString(),
      };
    }

    let replyContent = "";

    // --- PROMPT BUILDER ENGINE ---
    const recentText = messages
      .slice(-5)
      .map((m: ChatMessage) => m.content)
      .join("\n");
    const activeLorebooks = lorebooks.filter(lore => {
      if (lore.constant) return true;
      if (!lore.keys || !Array.isArray(lore.keys)) return false;
      return lore.keys.some((key: string) => {
        if (!key) return false;
        return recentText.toLowerCase().includes(key.toLowerCase());
      });
    });

    let systemPrompt = `[System Note: You are engaging in a private 1-on-1 text-based roleplay (Agent Network). You must strictly stay in character as ${char.name}. This is a focused scenario with the user. Other characters may appear briefly to drive the plot, but they are not the main focus. Use asterisks for *actions and expressions* and quotes for "speech". Do not break character or refer to yourself as an AI.]\n\n`;

    systemPrompt += `[Character Identity: ${char.name}]\n${char.description || ""}\n\n`;

    if (char.personality) {
      systemPrompt += `[Personality Traits]\n${char.personality}\n\n`;
    }

    const scenarioText = scenario?.trim();
    if (scenarioText) {
      systemPrompt += `[Current Scenario]\n${scenarioText}\n\n`;
    }

    if (activeLorebooks.length > 0) {
      systemPrompt += `[World Info / Lorebook]\n`;
      activeLorebooks.forEach(lore => {
        systemPrompt += `- ${lore.content}\n`;
      });
      systemPrompt += `\n`;
    }

    if (char.mesExample) {
      systemPrompt += `[Dialogue Examples]\n${char.mesExample}\n\n`;
    }

    if (settings.api.jailbreakPrompt) {
      systemPrompt += "\n[System Override / Jailbreak]\n" + settings.api.jailbreakPrompt + "\n\n";
    }

    // INJECT SUMMARY DB MEMORY
    if (summaryDb && summaryDb.length > 0) {
      systemPrompt += "<|背景世界记忆/总结|>\n";
      summaryDb.slice(-3).forEach(summ => {
        systemPrompt += "- " + summ.content + "\n";
      });
      systemPrompt += "</背景世界记忆/总结>\n\n";
    }

    // --- CONTEXT PRUNING ---
    const maxContextChars = (Number(settings.api.context_size) || 4096) * 2.5;
    let currentLength = systemPrompt.length;
    const prunedMessages: ChatMessage[] = [];

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msgLen = messages[i].content.length;
      if (currentLength + msgLen > maxContextChars && prunedMessages.length > 0) break;
      prunedMessages.unshift(messages[i]);
      currentLength += msgLen;
    }
    // -----------------------------

    if (settings.api.provider === "OpenAI" || settings.api.provider === "Custom") {
      let baseUrl = settings.api.url || "https://api.openai.com";
      baseUrl = baseUrl.replace(/\/+$/, "");
      if (!baseUrl.endsWith("/v1")) baseUrl += "/v1";
      const endpoint = baseUrl + "/chat/completions";

      if (settings.api.provider === "OpenAI") {
        assertSafeOutboundUrl(endpoint);
      }

      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...prunedMessages.map(m => ({
          role: m.role === "npc" ? "assistant" : m.role === "system" ? "system" : "user",
          content: m.content,
        })),
      ];

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.api.key}`,
        },
        body: JSON.stringify({
          model: settings.api.model,
          messages: apiMessages,
          temperature: Number(settings.api.temperature),
          max_tokens: Number(settings.api.max_tokens),
          top_p: Number(settings.api.top_p),
        }),
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errData}`);
      }
      const data = await response.json();
      replyContent = getOpenAIMessageText(data);
    } else if (settings.api.provider === "Gemini") {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${settings.api.model}:generateContent?key=${settings.api.key}`;

      const geminiMessages = prunedMessages.map(m => ({
        role: m.role === "npc" ? "model" : "user",
        parts: [{ text: m.role === "system" ? `[SYSTEM]\n${m.content}` : m.content }],
      }));

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: geminiMessages,
          generationConfig: {
            temperature: Number(settings.api.temperature),
            maxOutputTokens: Number(settings.api.max_tokens),
            topP: Number(settings.api.top_p),
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errData}`);
      }
      const data = await response.json();
      replyContent = getGeminiMessageText(data);
    }

    const botMessage = {
      id: Date.now(),
      role: "npc" as const,
      name: char.name,
      content: replyContent,
      timestamp: new Date().toISOString(),
    };

    aiLogs.unshift({
      id: botMessage.id,
      timestamp: botMessage.timestamp,
      type: logType,
      model: settings.api.model || undefined,
      prompt: systemPrompt + "\n\n[Messages]\n" + JSON.stringify(messages, null, 2),
      response: replyContent,
    });
    if (aiLogs.length > 50) aiLogs = aiLogs.slice(0, 50);
    schedulePersist();

    return botMessage;
  };

  app.post("/api/interknot/chat", async (req, res) => {
    try {
      const payload = parseWithSchema(interknotChatPayloadSchema, req.body, "InterKnot chat payload");
      const botMessage = await runCharacterChat({
        messages: payload.messages,
        characterId: payload.characterId,
        scenario: undefined,
        logType: "InterKnot Chat",
      });
      res.json(botMessage);
    } catch (error) {
      console.error("Chat API Error:", error);
      handleRouteError(res, error, "InterKnot chat failed");
    }
  });

  app.post("/api/proxy/chat", async (req, res) => {
    try {
      const payload = parseWithSchema(proxyChatPayloadSchema, req.body, "Proxy chat payload");
      const scenarioText = typeof payload.scenario === "string" ? payload.scenario : proxyScenarios[payload.charId];
      if (typeof scenarioText === "string") {
        proxyScenarios[payload.charId] = scenarioText;
        schedulePersist();
      }

      const botMessage = await runCharacterChat({
        messages: payload.messages,
        characterId: payload.charId,
        scenario: scenarioText,
        logType: "Proxy Chat",
      });
      res.json(botMessage);
    } catch (error) {
      console.error("Chat API Error:", error);
      handleRouteError(res, error, "Proxy chat failed");
    }
  });

  app.post("/api/hollow/chat", async (req, res) => {
    let messages: ChatMessage[] = [];

    try {
      const payload = parseWithSchema(hollowChatPayloadSchema, req.body, "Hollow chat payload");
      messages = payload.messages;
    } catch (error) {
      return handleRouteError(res, error, "Invalid hollow chat payload");
    }

    // If no API key, fallback to mock response
    if (!settings.api.key) {
      setTimeout(() => {
        const latestMessage = messages[messages.length - 1]?.content ?? "";
        const botMessage = {
          id: Date.now(),
          role: 'npc',
          name: 'World',
          content: `[未配置API密钥] 收到探索指令：“${latestMessage}”。请在设置中配置API密钥以启用真实世界探索。`,
          timestamp: new Date().toISOString()
        };
        res.json(botMessage);
      }, 1000);
      return;
    }

    try {
      let replyContent = '';
      
      // --- PROMPT BUILDER ENGINE ---
      const recentText = messages.slice(-5).map((m: any) => m.content).join('\n');
      const activeLorebooks = lorebooks.filter(lore => {
        if (lore.constant) return true;
        if (!lore.keys || !Array.isArray(lore.keys)) return false;
        return lore.keys.some((key: string) => {
          if (!key) return false;
          return recentText.toLowerCase().includes(key.toLowerCase());
        });
      });

      let systemPrompt = `[System Note: You are the Game Master and Narrator of the Zenless Zone Zero world (The Hollow). The user is exploring this large open world freely via text. 
The following agents/characters are currently bound to the user and are silently acting in the background during each turn:
`;
      characters.forEach(c => {
         systemPrompt += `- ${c.name}: ${c.description}\n`;
      });
      
      systemPrompt += `\nIn each turn, you must describe the environment, the results of the user's actions, and briefly mention what the other characters are doing in the background to support the user or react to the situation. You act as the world itself, narrating events. Do not break character or refer to yourself as an AI.]\n\n`;

      if (activeLorebooks.length > 0) {
        systemPrompt += `[World Info / Lorebook]\n`;
        activeLorebooks.forEach(lore => {
          systemPrompt += `- ${lore.content}\n`;
        });
        systemPrompt += `\n`;
      }

      if (settings.api.jailbreakPrompt) {
        systemPrompt += "\n[System Override / Jailbreak]\n" + settings.api.jailbreakPrompt + "\n\n";
      }

      // INJECT SUMMARY DB MEMORY
      if (summaryDb && summaryDb.length > 0) {
        systemPrompt += "<|背景世界记忆/总结|>\n";
        summaryDb.slice(-3).forEach(summ => {
          systemPrompt += "- " + summ.content + "\n";
        });
        systemPrompt += "</背景世界记忆/总结>\n\n";
      }

      // --- CONTEXT PRUNING ---
      const maxContextChars = (Number(settings.api.context_size) || 4096) * 2.5;
      let currentLength = systemPrompt.length;
      let prunedMessages = [];

      for (let i = messages.length - 1; i >= 0; i--) {
        const msgLen = messages[i].content.length;
        if (currentLength + msgLen > maxContextChars && prunedMessages.length > 0) break;
        prunedMessages.unshift(messages[i]);
        currentLength += msgLen;
      }
      // -----------------------------

      if (settings.api.provider === 'OpenAI' || settings.api.provider === 'Custom') {
        let baseUrl = settings.api.url || 'https://api.openai.com';
        baseUrl = baseUrl.replace(/\/+$/, ''); if (!baseUrl.endsWith('/v1')) baseUrl += '/v1'; const endpoint = baseUrl + '/chat/completions';

        if (settings.api.provider === 'OpenAI') {
          assertSafeOutboundUrl(endpoint);
        }

        const apiMessages = [
          { role: 'system', content: systemPrompt },
          ...prunedMessages.map(m => ({
            role: m.role === 'npc' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
            content: m.content,
          }))
        ];

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.api.key}`
          },
          body: JSON.stringify({
            model: settings.api.model,
            messages: apiMessages,
            temperature: Number(settings.api.temperature),
            max_tokens: Number(settings.api.max_tokens),
            top_p: Number(settings.api.top_p)
          })
        });
        
        if (!response.ok) {
          const errData = await response.text();
          throw new Error(`API Error: ${response.status} - ${errData}`);
        }
        const data = await response.json();
        replyContent = getOpenAIMessageText(data);

      } else if (settings.api.provider === 'Gemini') {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${settings.api.model}:generateContent?key=${settings.api.key}`;
        
        const geminiMessages = prunedMessages.map(m => ({
          role: m.role === 'npc' ? 'model' : 'user',
          parts: [{ text: m.role === 'system' ? `[SYSTEM]\n${m.content}` : m.content }]
        }));

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: geminiMessages,
            generationConfig: {
              temperature: Number(settings.api.temperature),
              maxOutputTokens: Number(settings.api.max_tokens),
              topP: Number(settings.api.top_p)
            }
          })
        });
        
        if (!response.ok) {
          const errData = await response.text();
          throw new Error(`API Error: ${response.status} - ${errData}`);
        }
        const data = await response.json();
        replyContent = getGeminiMessageText(data);
      }

      const botMessage = {
        id: Date.now(),
        role: 'npc',
        name: 'World',
        content: replyContent,
        timestamp: new Date().toISOString()
      };
      
      aiLogs.unshift({
        id: botMessage.id,
        timestamp: botMessage.timestamp,
        type: 'Hollow Chat',
        model: settings.api.model || undefined,
        prompt: systemPrompt + '\n\n[Messages]\n' + JSON.stringify(messages, null, 2),
        response: replyContent
      });
      if (aiLogs.length > 50) aiLogs = aiLogs.slice(0, 50);
      schedulePersist();

      res.json(botMessage);

    } catch (error) {
      console.error("Chat API Error:", error);
      handleRouteError(res, error, "Hollow chat failed");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();


















