/**
 * HollowChat page – Model
 */
export interface ChatMessage {
  id: number;
  role: 'system' | 'npc' | 'user';
  name: string;
  content: string;
  timestamp: string;
}

export interface HollowChatModel {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  sending: boolean;
}

export const initHollowChatModel: HollowChatModel = {
  messages: [],
  input: '',
  loading: true,
  sending: false,
};
