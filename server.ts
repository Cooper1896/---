import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory data store for the backend
  let logs = [
    { id: 1, time: '04:21:09.112', method: 'GET', path: '/api/tavern/status', status: 200, latency: '12ms', ip: '192.168.1.104' },
    { id: 2, time: '04:21:10.045', method: 'POST', path: '/api/tavern/auth', status: 401, latency: '45ms', ip: '10.0.0.5' },
    { id: 3, time: '04:21:15.882', method: 'GET', path: '/api/tavern/patrons', status: 200, latency: '120ms', ip: '192.168.1.104' },
    { id: 4, time: '04:21:16.201', method: 'PUT', path: '/api/tavern/order/992', status: 201, latency: '34ms', ip: '192.168.1.104' },
    { id: 5, time: '04:21:22.000', method: 'GET', path: '/api/tavern/inventory', status: 200, latency: '18ms', ip: '10.0.0.2' },
    { id: 6, time: '04:21:25.404', method: 'DELETE', path: '/api/tavern/session/expired', status: 200, latency: '89ms', ip: '127.0.0.1' },
    { id: 7, time: '04:21:30.111', method: 'GET', path: '/api/tavern/ws/connect', status: 101, latency: '2ms', ip: '192.168.1.104' },
    { id: 8, time: '04:21:35.555', method: 'POST', path: '/api/tavern/drink/mix', status: 500, latency: '405ms', ip: '10.0.0.5' },
    { id: 9, time: '04:21:36.102', method: 'GET', path: '/api/tavern/drink/menu', status: 200, latency: '15ms', ip: '192.168.1.104' },
  ];

  let settings = {
    tavern: {
      enabled: true,
      currentPreset: 'default',
      presetName: '',
      targetDesc: '',
      postProcess: '未选择'
    },
    api: {
      provider: 'OpenAI',
      url: 'https://api.openai.com',
      key: '',
      model: '',
      temperature: 0.8,
      max_tokens: 2048,
      top_p: 0.9,
      context_size: 4096
    },
    theme: '墨色经典'
  };

  let characters = [
    { 
      id: 'default', 
      name: 'Fairy', 
      description: '你是Fairy，新艾利都的智能助理。你说话专业、冷静、带有一点机械感，总是称呼用户为“主人”。', 
      firstMessage: '主人，我已经为您规划了最佳探索路线。前方检测到以太变异体反应，请做好战斗准备。' 
    }
  ];

  app.get("/api/characters", (req, res) => {
    res.json(characters);
  });

  app.post("/api/characters", (req, res) => {
    const newChar = { id: Date.now().toString(), ...req.body };
    characters.push(newChar);
    res.json(newChar);
  });

  app.put("/api/characters/:id", (req, res) => {
    const index = characters.findIndex(c => c.id === req.params.id);
    if (index !== -1) {
      characters[index] = { ...characters[index], ...req.body };
      res.json(characters[index]);
    } else {
      res.status(404).json({error: 'Not found'});
    }
  });

  app.delete("/api/characters/:id", (req, res) => {
    characters = characters.filter(c => c.id !== req.params.id);
    res.json({success: true});
  });

  // Extensions System
  let extensions: any[] = [];
  const stRepo = [
    { id: 'st-tts', name: 'SillyTavern TTS', description: '文本转语音支持 (ElevenLabs, Silero, Edge-TTS 等)。', author: 'SillyTavern', version: '1.0.0' },
    { id: 'st-dnd-dice', name: 'D&D Dice Roller', description: '在聊天中使用 /roll 命令掷骰子。', author: 'SillyTavern', version: '1.2.0' },
    { id: 'st-image-gen', name: 'Image Generation', description: '使用 Stable Diffusion 或 DALL-E 生成图片。', author: 'SillyTavern', version: '2.1.0' },
    { id: 'st-websearch', name: 'Web Search', description: '允许角色搜索网络以获取最新信息。', author: 'SillyTavern', version: '1.0.5' },
    { id: 'st-memory', name: 'Vector Storage', description: '使用向量数据库的长期记忆扩展 (ChromaDB)。', author: 'SillyTavern', version: '1.5.2' },
    { id: 'st-expressions', name: 'Character Expressions', description: '根据对话情感自动切换角色立绘表情。', author: 'SillyTavern', version: '2.0.1' }
  ];

  app.get("/api/extensions", (req, res) => {
    res.json(extensions);
  });

  app.get("/api/extensions/repo", (req, res) => {
    // Simulate network delay for repo fetch
    setTimeout(() => res.json(stRepo), 600);
  });

  app.post("/api/extensions/install", (req, res) => {
    const ext = req.body;
    if (!extensions.find(e => e.id === ext.id)) {
      extensions.push({ ...ext, enabled: true });
    }
    res.json(extensions);
  });

  app.post("/api/extensions/uninstall", (req, res) => {
    extensions = extensions.filter(e => e.id !== req.body.id);
    res.json(extensions);
  });

  app.post("/api/extensions/toggle", (req, res) => {
    const ext = extensions.find(e => e.id === req.body.id);
    if (ext) ext.enabled = req.body.enabled;
    res.json(extensions);
  });

  // Database Management System
  let dbSettings = {
    vectorApi: {
      enabled: false,
      url: '',
      key: '',
      model: 'text-embedding-ada-002'
    },
    summaryApi: {
      enabled: false,
      url: '',
      key: '',
      model: 'gpt-3.5-turbo',
      prompt: '请总结以下对话内容：\n\n{{chat}}'
    }
  };

  let vectorDb: any[] = [];
  let summaryDb: any[] = [];

  app.get("/api/db/settings", (req, res) => {
    res.json(dbSettings);
  });

  app.put("/api/db/settings", (req, res) => {
    dbSettings = { ...dbSettings, ...req.body };
    res.json(dbSettings);
  });

  app.get("/api/db/summary", (req, res) => {
    res.json(summaryDb);
  });

  app.post("/api/db/summary/generate", async (req, res) => {
    const { chatHistory } = req.body;
    if (!dbSettings.summaryApi.enabled || !dbSettings.summaryApi.url) {
      return res.status(400).json({ error: "Summary API not configured or disabled" });
    }
    
    try {
      let summaryText = "这是一个模拟的总结内容。由于未配置真实的API Key，返回此占位符。";
      
      if (dbSettings.summaryApi.key && dbSettings.summaryApi.key !== 'dummy') {
        const response = await fetch(`${dbSettings.summaryApi.url}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dbSettings.summaryApi.key}`
          },
          body: JSON.stringify({
            model: dbSettings.summaryApi.model,
            messages: [
              { role: 'system', content: dbSettings.summaryApi.prompt.replace('{{chat}}', chatHistory) }
            ]
          })
        });
        if (response.ok) {
          const data = await response.json();
          summaryText = data.choices[0].message.content;
        }
      }

      const newSummary = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        content: summaryText
      };
      summaryDb.push(newSummary);
      res.json(newSummary);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/db/vector", (req, res) => {
    res.json(vectorDb);
  });

  app.post("/api/db/vector/add", (req, res) => {
    const { text } = req.body;
    const newEntry = {
      id: Date.now().toString(),
      text,
      timestamp: new Date().toISOString()
    };
    vectorDb.push(newEntry);
    res.json(newEntry);
  });

  app.delete("/api/db/summary/:id", (req, res) => {
    summaryDb = summaryDb.filter(s => s.id !== req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/db/vector/:id", (req, res) => {
    vectorDb = vectorDb.filter(v => v.id !== req.params.id);
    res.json({ success: true });
  });

  const themes = [
    { id: '墨色经典', name: '墨色经典', desc: '参考传统黑金 UI 与国风界面常用搭配，沉稳、厚重。', colors: ['#1a1a1a', '#2a2a2a', '#d4af37', '#4a90e2'] },
    { id: '青鸾入梦', name: '青鸾入梦', desc: '参考高对比深绿与亮青配色，偏现代阅读体验。', colors: ['#0a1f1c', '#11332d', '#00ffaa', '#aaffee'] },
    { id: '赤金残阳', name: '赤金残阳', desc: '参考夕阳、铜火、琥珀调，强调戏剧感与热烈氛围。', colors: ['#2b1100', '#4a1c00', '#ff8c00', '#ff3300'] },
    { id: '寒玉山岚', name: '寒玉山岚', desc: '重新调整为偏冷墨绿与玉石灰青，不再与其他主题重复。', colors: ['#0d1a18', '#1a332f', '#88ccaa', '#cceeff'] },
  ];

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/logs", (req, res) => {
    res.json(logs);
  });

  app.get("/api/settings", (req, res) => {
    res.json(settings);
  });

  app.put("/api/settings", (req, res) => {
    settings = { ...settings, ...req.body };
    res.json(settings);
  });

  app.get("/api/themes", (req, res) => {
    res.json(themes);
  });

  app.post("/api/models", async (req, res) => {
    const { provider, url, key } = req.body;
    try {
      if (provider === 'OpenAI' || provider === 'Custom') {
        const baseUrl = url || 'https://api.openai.com';
        const endpoint = baseUrl.replace(/\/+$/, '') + '/v1/models';
        const response = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        res.json(data.data.map((m: any) => m.id));
      } else if (provider === 'Gemini') {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        res.json(data.models.map((m: any) => m.name.replace('models/', '')));
      } else {
        res.json(['mock-model-1', 'mock-model-2']);
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  let chatMessages: any[] = [];

  app.get("/api/chat", (req, res) => {
    res.json(chatMessages);
  });

  app.post("/api/chat", async (req, res) => {
    const { messages, characterId } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array' });
    }

    const char = characters.find(c => c.id === characterId) || characters[0];
    
    // If no API key, fallback to mock response
    if (!settings.api.key) {
      setTimeout(() => {
        const botMessage = {
          id: Date.now(),
          role: 'npc',
          name: char.name,
          content: `[未配置API密钥] 收到指令：“${messages[messages.length - 1].content}”。请在设置中配置API密钥以启用真实对话。`,
          timestamp: new Date().toISOString()
        };
        res.json(botMessage);
      }, 1000);
      return;
    }

    try {
      let replyContent = '';
      const systemPrompt = char.description;

      if (settings.api.provider === 'OpenAI' || settings.api.provider === 'Custom') {
        const baseUrl = settings.api.url || 'https://api.openai.com';
        const endpoint = baseUrl.replace(/\/+$/, '') + '/v1/chat/completions';
        
        const apiMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role === 'npc' ? 'assistant' : 'user', content: m.content }))
        ];

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.api.key}`
          },
          body: JSON.stringify({
            model: settings.api.model,
            messages: apiMessages,
            temperature: Number(settings.api.temperature),
            max_tokens: Number(settings.api.max_tokens),
            top_p: Number(settings.api.top_p)
          })
        });
        
        if (!response.ok) {
          const errData = await response.text();
          throw new Error(`API Error: ${response.status} - ${errData}`);
        }
        const data = await response.json();
        replyContent = data.choices[0].message.content;

      } else if (settings.api.provider === 'Gemini') {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${settings.api.model}:generateContent?key=${settings.api.key}`;
        
        const geminiMessages = messages.map(m => ({
          role: m.role === 'npc' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: geminiMessages,
            generationConfig: {
              temperature: Number(settings.api.temperature),
              maxOutputTokens: Number(settings.api.max_tokens),
              topP: Number(settings.api.top_p)
            }
          })
        });
        
        if (!response.ok) {
          const errData = await response.text();
          throw new Error(`API Error: ${response.status} - ${errData}`);
        }
        const data = await response.json();
        replyContent = data.candidates[0].content.parts[0].text;
      }

      const botMessage = {
        id: Date.now(),
        role: 'npc',
        name: char.name,
        content: replyContent,
        timestamp: new Date().toISOString()
      };
      
      res.json(botMessage);

    } catch (error: any) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
