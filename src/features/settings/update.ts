/**
 * Settings page – Update (reducer)
 */
import type { SettingsModel } from './model';

export type SettingsMsg =
  | { type: 'SET_TAB'; tab: string }
  | { type: 'SET_LOADING'; loading: boolean };

export function settingsUpdate(model: SettingsModel, msg: SettingsMsg): SettingsModel {
  switch (msg.type) {
    case 'SET_TAB':
      return { ...model, activeTab: msg.tab };
    case 'SET_LOADING':
      return { ...model, loading: msg.loading };
    default:
      return model;
  }
}
