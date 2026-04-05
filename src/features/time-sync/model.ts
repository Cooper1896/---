/**
 * TimeSync page – Model
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface TimeSyncModel {
  token: string;
  isBound: boolean;
  loading: boolean;
  syncStatus: SyncStatus;
  lastSyncTime: string | null;
}

export const initTimeSyncModel: TimeSyncModel = {
  token: '',
  isBound: false,
  loading: false,
  syncStatus: 'idle',
  lastSyncTime: null,
};
