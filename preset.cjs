const fs = require("fs");
let c = fs.readFileSync("src/pages/Settings.tsx", "utf8");

const injection = `          <div>
            <div className="flex flex-col gap-2 mb-4 bg-[#111] p-3 border border-[#333]">
             <span className="text-xs text-[#00DAF3] font-bold">API ≈‰÷√∏≤∏«≤€Œª</span>
             <div className="flex gap-2">
             <button
               onClick={() => {
                 const saved = { provider: settings.api.provider, url: settings.api.url, key: settings.api.key, model: settings.api.model };
                 updateSetting("api", "savedPreset", saved);
                 alert("API ≈‰÷√“—±£¥Ê¥À∏≤∏«≤€Œª°£");
               }}
               className="text-xs px-3 py-1.5 focus:outline-none bg-[#2a2a2a] hover:bg-[#353535] text-[#00DAF3] border border-[#454545] transition-colors"
             >
               ±£¥Êµ±«∞≈‰÷√
             </button>
            {settings.api.savedPreset && (
              <button
                onClick={() => {
                  const saved = settings.api.savedPreset;
                  updateSetting("api", "provider", saved.provider);
                  updateSetting("api", "url", saved.url);
                  updateSetting("api", "key", saved.key);
                  updateSetting("api", "model", saved.model || "");
                  updateDbSetting("summaryApi", "url", saved.url);
                  updateDbSetting("summaryApi", "key", saved.key);
                  updateDbSetting("vectorApi", "url", saved.url);
                  updateDbSetting("vectorApi", "key", saved.key);
                  alert("“—º”‘ÿ∏≤∏«≤€Œª≈‰÷√£°");
                }}
                className="text-xs px-3 py-1.5 focus:outline-none bg-[#2a2a2a] hover:bg-[#353535] text-[#FA5C1C] border border-[#454545] transition-colors"
               >
                 º”‘ÿ≈‰÷√≤€
               </button>
             )}
             </div>
            </div>
`;

c = c.replace(/            <div>\s+<label className="block text-xs text-\[\#00DAF3\] font-bold mb-2 flex items-center gap-2">/, injection + "            </div>\n\n            <div>\n              <label className=\"block text-xs text-[#00DAF3] font-bold mb-2 flex items-center gap-2\">");

fs.writeFileSync("src/pages/Settings.tsx", c);

