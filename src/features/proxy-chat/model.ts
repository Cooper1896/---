/**
 * ProxyChat page – Model
 */
export interface ChatMessage {
  id: number;
  role: 'system' | 'npc' | 'user';
  name: string;
  content: string;
  timestamp: string;
}

export interface ProxyCharacter {
  id: string;
  name: string;
  description: string;
  avatar?: string;
}

export interface ProxyChatModel {
  view: 'list' | 'chat';
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  sending: boolean;
  characters: ProxyCharacter[];
  selectedCharId: string | null;
  scenario: string;
}

export const initProxyChatModel: ProxyChatModel = {
  view: 'list',
  messages: [],
  input: '',
  loading: true,
  sending: false,
  characters: [],
  selectedCharId: null,
  scenario: '在咖啡店相遇...',
};
