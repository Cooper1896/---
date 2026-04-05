import type {
  AILog,
  AppSettings,
  BasicSuccessResponse,
  Character,
  ChatMessage,
  DbSettings,
  Extension,
  Lorebook,
  ModelsRequest,
  SettingsBootstrap,
  SummaryEntry,
  SyncDirection,
  SyncValidationResponse,
  TestConnectionRequest,
  TestConnectionResponse,
  VectorEntry,
} from '../shared/contracts';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === 'string'
        ? data
        : data?.error || data?.message || `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function putJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

function deleteJson<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

export const api = {
  getSettingsBootstrap(): Promise<SettingsBootstrap> {
    return request<SettingsBootstrap>('/api/settings/bootstrap');
  },

  updateSettings(settings: AppSettings): Promise<AppSettings> {
    return putJson<AppSettings>('/api/settings', settings);
  },

  createCharacter(character: Omit<Character, 'id'>): Promise<Character> {
    return postJson<Character>('/api/characters', character);
  },

  updateCharacter(id: string, character: Partial<Character>): Promise<Character> {
    return putJson<Character>(`/api/characters/${id}`, character);
  },

  deleteCharacter(id: string): Promise<BasicSuccessResponse> {
    return deleteJson<BasicSuccessResponse>(`/api/characters/${id}`);
  },

  createLorebook(lorebook: Omit<Lorebook, 'id'>): Promise<Lorebook> {
    return postJson<Lorebook>('/api/lorebooks', lorebook);
  },

  updateLorebook(id: string, lorebook: Partial<Lorebook>): Promise<Lorebook> {
    return putJson<Lorebook>(`/api/lorebooks/${id}`, lorebook);
  },

  deleteLorebook(id: string): Promise<BasicSuccessResponse> {
    return deleteJson<BasicSuccessResponse>(`/api/lorebooks/${id}`);
  },

  getModels(payload: ModelsRequest): Promise<string[]> {
    return postJson<string[]>('/api/models', payload);
  },

  testConnection(payload: TestConnectionRequest): Promise<TestConnectionResponse> {
    return postJson<TestConnectionResponse>('/api/test-connection', payload);
  },

  getExtensionsRepo(repoUrl?: string): Promise<Extension[]> {
    const search = new URLSearchParams();

    if (repoUrl?.trim()) {
      search.set('url', repoUrl.trim());
    }

    const suffix = search.toString() ? `?${search.toString()}` : '';
    return request<Extension[]>(`/api/extensions/repo${suffix}`);
  },

  installExtension(extension: Extension): Promise<Extension[]> {
    return postJson<Extension[]>('/api/extensions/install', extension);
  },

  uninstallExtension(id: string): Promise<Extension[]> {
    return postJson<Extension[]>('/api/extensions/uninstall', { id });
  },

  toggleExtension(id: string, enabled: boolean): Promise<Extension[]> {
    return postJson<Extension[]>('/api/extensions/toggle', { id, enabled });
  },

  updateDbSettings(settings: DbSettings): Promise<DbSettings> {
    return putJson<DbSettings>('/api/db/settings', settings);
  },

  deleteSummary(id: string): Promise<BasicSuccessResponse> {
    return deleteJson<BasicSuccessResponse>(`/api/db/summary/${id}`);
  },

  deleteVector(id: string): Promise<BasicSuccessResponse> {
    return deleteJson<BasicSuccessResponse>(`/api/db/vector/${id}`);
  },

  getAiLogs(): Promise<AILog[]> {
    return request<AILog[]>('/api/ai-logs');
  },

  validateGitHubToken(token: string): Promise<SyncValidationResponse> {
    return postJson<SyncValidationResponse>('/api/sync/validate', { token });
  },

  syncData(direction: SyncDirection, token: string): Promise<BasicSuccessResponse> {
    return postJson<BasicSuccessResponse>(`/api/sync/${direction}`, { token });
  },

  getHollowHistory(): Promise<ChatMessage[]> {
    return request<ChatMessage[]>('/api/hollow/history');
  },

  syncHollowHistory(messages: ChatMessage[]): Promise<BasicSuccessResponse> {
    return postJson<BasicSuccessResponse>('/api/hollow/sync', { messages });
  },

  clearHollowHistory(): Promise<BasicSuccessResponse> {
    return postJson<BasicSuccessResponse>('/api/hollow/clear', {});
  },

  sendHollowChat(messages: ChatMessage[]): Promise<ChatMessage> {
    return postJson<ChatMessage>('/api/hollow/chat', { messages });
  },
};
