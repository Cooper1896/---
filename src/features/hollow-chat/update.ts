/**
 * HollowChat page – Update (reducer)
 */
import type { HollowChatModel, ChatMessage } from './model';

export type HollowChatMsg =
  | { type: 'SET_MESSAGES'; messages: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'SET_INPUT'; input: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SENDING'; sending: boolean };

export function hollowChatUpdate(model: HollowChatModel, msg: HollowChatMsg): HollowChatModel {
  switch (msg.type) {
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
    default:
      return model;
  }
}
