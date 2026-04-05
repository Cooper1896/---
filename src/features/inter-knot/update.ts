/**
 * InterKnot page – Update (reducer)
 */
import type { InterKnotModel, AILog } from './model';

export type InterKnotMsg =
  | { type: 'SET_LOGS'; logs: AILog[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SELECT_LOG'; id: number | null };

export function interKnotUpdate(model: InterKnotModel, msg: InterKnotMsg): InterKnotModel {
  switch (msg.type) {
    case 'SET_LOGS':
      return {
        ...model,
        logs: msg.logs,
        selectedLogId: model.selectedLogId ?? (msg.logs.length > 0 ? msg.logs[0].id : null),
      };
    case 'SET_LOADING':
      return { ...model, loading: msg.loading };
    case 'SELECT_LOG':
      return { ...model, selectedLogId: msg.id };
    default:
      return model;
  }
}
