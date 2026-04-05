/**
 * ProxyChat page – Update (reducer)
 */
import type { ProxyChatModel, ChatMessage, ProxyCharacter } from './model';

export type ProxyChatMsg =
  | { type: 'SET_VIEW'; view: 'list' | 'chat' }
  | { type: 'SET_MESSAGES'; messages: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'SET_INPUT'; input: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SENDING'; sending: boolean }
  | { type: 'SET_CHARACTERS'; characters: ProxyCharacter[] }
  | { type: 'SELECT_CHAR'; id: string | null }
  | { type: 'SET_SCENARIO'; scenario: string };

export function proxyChatUpdate(model: ProxyChatModel, msg: ProxyChatMsg): ProxyChatModel {
  switch (msg.type) {
    case 'SET_VIEW':
      return { ...model, view: msg.view };
    case 'SET_MESSAGES':
      return { ...model, messages: msg.messages };
    case 'ADD_MESSAGE':
      return { ...model, messages: [...model.messages, msg.message] };
    case 'SET_INPUT':
      return { ...model, input: msg.input };
    case 'SET_LOADING':
      return { ...model, loading: msg.loading };
    case 'SET_SENDING':
      return { ...model, sending: msg.sending };
    case 'SET_CHARACTERS':
      return { ...model, characters: msg.characters };
    case 'SELECT_CHAR':
      return { ...model, selectedCharId: msg.id };
    case 'SET_SCENARIO':
      return { ...model, scenario: msg.scenario };
    default:
      return model;
  }
}
