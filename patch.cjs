const fs = require('fs');

let code = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// Patch updateSetting
const oldUpdateSetting = `const updateSetting = (category: string, key: string, value: any) => {
      const newSettings = {
        ...settings,
        [category]: {
          ...settings[category],
          [key]: value
        }
      };
      setSettings(newSettings);
      fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    };`;

const newUpdateSetting = `const updateSetting = (category: string, key: string, value: any) => {
      setSettings((prev: any) => {
        const newSettings = {
          ...prev,
          [category]: {
            ...prev[category],
            [key]: value
          }
        };
        if ((window as any)._settingUpdateTimer) clearTimeout((window as any)._settingUpdateTimer);
        (window as any)._settingUpdateTimer = setTimeout(() => {
          fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSettings)
          }).catch(console.error);
        }, 150);
        return newSettings;
      });
    };`;

code = code.replace(oldUpdateSetting, newUpdateSetting);


// Patch updateDbSetting
const oldUpdateDbSetting = `const updateDbSetting = async (type: 'vectorApi' | 'summaryApi', key: string, value: any) => {
      const newSettings = {
        ...dbSettings,
        [type]: { ...dbSettings[type], [key]: value }
      };
      setDbSettings(newSettings);
      try {
        await fetch('/api/db/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings)
        });
      } catch (err) {
        console.error('Failed to save db settings:', err);
      }
    };`;

const newUpdateDbSetting = `const updateDbSetting = (type: 'vectorApi' | 'summaryApi', key: string, value: any) => {
      setDbSettings((prev: any) => {
        const newSettings = {
          ...prev,
          [type]: { ...prev[type], [key]: value }
        };
        if ((window as any)._dbUpdateTimer) clearTimeout((window as any)._dbUpdateTimer);
        (window as any)._dbUpdateTimer = setTimeout(() => {
          fetch('/api/db/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSettings)
          }).catch(err => console.error('Failed to save db settings:', err));
        }, 150);
        return newSettings;
      });
    };`;

code = code.replace(oldUpdateDbSetting, newUpdateDbSetting);

fs.writeFileSync('src/pages/Settings.tsx', code);
console.log('Patched correctly');
