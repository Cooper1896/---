/**
 * Settings page – Model
 *
 * The Settings page is complex with many sub-sections (tavern, API, theme, extensions, database).
 * The state is managed via local useState hooks in the view component due to
 * the page's complexity and many independent sub-states.
 * Future iterations may break this into sub-feature modules.
 */
export interface SettingsModel {
  activeTab: string;
  loading: boolean;
}

export const initSettingsModel: SettingsModel = {
  activeTab: 'api',
  loading: true,
};
