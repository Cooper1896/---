/**
 * TimeSync page – Update (reducer)
 */
import type { TimeSyncModel, SyncStatus } from './model';

export type TimeSyncMsg =
  | { type: 'SET_TOKEN'; token: string }
  | { type: 'SET_BOUND'; bound: boolean }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SYNC_STATUS'; status: SyncStatus }
  | { type: 'SET_LAST_SYNC'; time: string | null };

export function timeSyncUpdate(model: TimeSyncModel, msg: TimeSyncMsg): TimeSyncModel {
  switch (msg.type) {
    case 'SET_TOKEN':
      return { ...model, token: msg.token };
    case 'SET_BOUND':
      return { ...model, isBound: msg.bound };
    case 'SET_LOADING':
      return { ...model, loading: msg.loading };
    case 'SET_SYNC_STATUS':
      return { ...model, syncStatus: msg.status };
    case 'SET_LAST_SYNC':
      return { ...model, lastSyncTime: msg.time };
    default:
      return model;
  }
}
