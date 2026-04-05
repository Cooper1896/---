const fs = require("fs");
let c = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const presetButtons = `        <div className="bg-[#1c1b1b] border border-[#353535] p-6 rounded-sm mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#FA5C1C]" />
              <h4 className="text-lg font-bold text-white">连接设置 (API)</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings?.api?.savedPreset && (
                <button
                  onClick={() => {
                    const saved = settings.api.savedPreset;
                    updateSetting("api", "provider", saved.provider);
                    updateSetting("api", "url", saved.url);
                    updateSetting("api", "key", saved.key);
                    updateSetting("api", "model", saved.model || "");
                    if(dbSettings) {
                      updateDbSetting("summaryApi", "url", saved.url);
                      updateDbSetting("summaryApi", "key", saved.key);
                      updateDbSetting("vectorApi", "url", saved.url);
                      updateDbSetting("vectorApi", "key", saved.key);
                    }
                    alert("已加载覆盖槽位配置！");
                  }}
                  className="text-xs px-3 py-1.5 focus:outline-none bg-[#2a2a2a] hover:bg-[#353535] text-[#FA5C1C] border border-[#454545] transition-colors"
                >
                  加载配置槽
                </button>
               )}
               <button
                 onClick={() => {
                   const saved = { provider: settings.api.provider, url: settings.api.url, key: settings.api.key, model: settings.api.model };
                   updateSetting("api", "savedPreset", saved);
                   alert("API 配置已保存此覆盖槽位。");
                 }}
                 className="text-xs px-3 py-1.5 focus:outline-none bg-[#2a2a2a] hover:bg-[#353535] text-[#00DAF3] border border-[#454545] transition-colors"
               >
                 保存当前配置
               </button>
               <button
                 onClick={handleTestConnection}
                 disabled={isTesting}
                 className="text-xs px-3 py-1.5 focus:outline-none bg-[#2a2a2a] hover:bg-[#353535] text-[#FA5C1C] border border-[#454545] transition-colors flex items-center gap-1 disabled:opacity-50"
               >
                 {isTesting ? "测试中..." : "测试连接"}
               </button>
            </div>
          </div>
          {testResult && testResult.status !== "idle" && (
            <div className={\`text-xs mb-4 text-right \${testResult.status === "success" ? "text-green-400" : "text-red-400"}\`}>
              {testResult.message}
            </div>
          )}

          <div className="space-y-6">
            <div>`;

c = c.replace(/<div className="bg-\[#1c1b1b\] border border-\[#353535\] p-6 rounded-sm mb-6\">[\s\S]*?<div className=\"space-y-6\">\s*<div>/m, presetButtons);
fs.writeFileSync('src/pages/Settings.tsx', c);

