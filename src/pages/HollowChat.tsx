import { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, Cpu, User, Zap, RefreshCw, Trash2, Edit3, Puzzle, Database } from 'lucide-react';

interface Message {
  id: number;
  role: 'system' | 'npc' | 'user';
  name: string;
  content: string;
  timestamp: string;
}

interface Character {
  id: string;
  name: string;
  description: string;
  firstMessage: string;
}

export default function HollowChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string>('');
  const [activeExtensions, setActiveExtensions] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/characters').then(res => res.json()),
      fetch('/api/extensions').then(res => res.json())
    ])
      .then(([charsData, extsData]) => {
        setCharacters(charsData);
        setActiveExtensions(extsData.filter((e: any) => e.enabled));
        if (charsData.length > 0) {
          setSelectedCharId(charsData[0].id);
          resetChat(charsData[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch data:', err);
        setLoading(false);
      });
  }, []);

  const resetChat = (char: Character) => {
    setMessages([
      { id: Date.now() - 1000, role: 'system', name: 'SYSTEM', content: '系统提示：已成功接入空洞。当前以太活性：高。请注意安全。', timestamp: new Date().toISOString() },
      { id: Date.now(), role: 'npc', name: char.name, content: char.firstMessage, timestamp: new Date().toISOString() }
    ]);
  };

  const handleCharChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCharId(id);
    const char = characters.find(c => c.id === id);
    if (char) resetChat(char);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customMessages?: Message[]) => {
    const msgsToSend = customMessages || messages;
    let newMsgContent = '';
    
    if (!customMessages) {
      if (!input.trim() || sending) return;
      newMsgContent = input.trim();
      setInput('');
      setSending(true);

      const tempId = Date.now();
      const newUserMsg: Message = {
        id: tempId,
        role: 'user',
        name: 'Proxy',
        content: newMsgContent,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, newUserMsg]);
      msgsToSend.push(newUserMsg);
    } else {
      setSending(true);
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: msgsToSend,
          characterId: selectedCharId
        })
      });
      const botMsg = await res.json();
      if (botMsg.error) throw new Error(botMsg.error);
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Add a system error message
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'system',
        name: 'SYSTEM',
        content: `通信错误: ${err}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleRegenerate = () => {
    if (messages.length < 2 || sending) return;
    // Remove last NPC message if it exists
    const lastMsg = messages[messages.length - 1];
    let newMsgs = [...messages];
    if (lastMsg.role === 'npc') {
      newMsgs.pop();
      setMessages(newMsgs);
    }
    handleSend(newMsgs);
  };

  const handleDelete = (id: number) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleSummarize = async () => {
    if (messages.length === 0 || summarizing) return;
    setSummarizing(true);
    try {
      const chatHistory = messages.map(m => `${m.name}: ${m.content}`).join('\n');
      const res = await fetch('/api/db/summary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory })
      });
      if (res.ok) {
        alert('对话纪要已生成并保存至数据库！');
      } else {
        const err = await res.json();
        alert(`生成失败: ${err.error}`);
      }
    } catch (err) {
      console.error('Failed to summarize:', err);
      alert('生成纪要失败，请检查网络或设置。');
    } finally {
      setSummarizing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="max-w-5xl mx-auto w-full relative z-10 flex-1 flex flex-col py-8 h-[calc(100vh-80px)]">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-1 w-12 bg-[#FFF000]"></div>
            <span className="font-headline text-[#FFF000] text-xs tracking-[0.3em] font-bold uppercase">Hollow Exploration Terminal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-headline text-white leading-none tracking-tighter">
            空洞深度探索
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-headline text-[#FA5C1C] bg-[#FA5C1C]/10 px-4 py-2 rounded-full border border-[#FA5C1C]/30">
          <Zap className="w-4 h-4 animate-pulse" /> 以太活性: 危险
        </div>
      </div>

      <div className="flex-1 bg-[#0e0e0e] border-2 border-[#353535] clip-path-chamfer flex flex-col overflow-hidden relative">
        {/* Chat Header */}
        <div className="bg-[#1c1b1b] border-b border-[#353535] p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00DAF3]/20 border border-[#00DAF3] rounded-full flex items-center justify-center">
              <Cpu className="w-5 h-5 text-[#00DAF3]" />
            </div>
            <div>
              <select 
                className="bg-transparent text-white font-bold font-headline outline-none appearance-none cursor-pointer"
                value={selectedCharId}
                onChange={handleCharChange}
              >
                {characters.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#131313] text-white">{c.name}</option>
                ))}
              </select>
              <div className="text-[#00DAF3] text-xs font-mono">AI_ASSISTANT_V1.4</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {activeExtensions.length > 0 && (
              <div className="flex items-center gap-1 bg-[#00DAF3]/10 text-[#00DAF3] px-2 py-1 rounded-sm border border-[#00DAF3]/30" title={`已启用 ${activeExtensions.length} 个插件`}>
                <Puzzle className="w-3 h-3" />
                <span className="text-[10px] font-bold">{activeExtensions.length}</span>
              </div>
            )}
            <button onClick={handleSummarize} disabled={summarizing} className="text-[#959177] hover:text-[#00DAF3] transition-colors" title="生成对话纪要 (存入数据库)">
              <Database className={`w-4 h-4 ${summarizing ? 'animate-pulse text-[#00DAF3]' : ''}`} />
            </button>
            <button onClick={handleRegenerate} disabled={sending} className="text-[#959177] hover:text-[#FFF000] transition-colors" title="重新生成">
              <RefreshCw className={`w-4 h-4 ${sending ? 'animate-spin' : ''}`} />
            </button>
            <div className="text-[#959177] text-xs font-mono">
              SYNC_RATE: 98.5%
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-6 crt-scanlines">
          {loading ? (
            <div className="text-center text-[#959177] my-auto">正在建立神经连接...</div>
          ) : (
            messages.map((msg, index) => (
              <div key={msg.id} className={`flex flex-col group ${msg.role === 'user' ? 'items-end' : msg.role === 'system' ? 'items-center' : 'items-start'}`}>
                
                {msg.role === 'system' && (
                  <div className="bg-[#FA5C1C]/10 border border-[#FA5C1C]/30 text-[#FA5C1C] px-4 py-2 rounded-sm text-xs font-mono flex items-center gap-2 max-w-[80%] text-center relative">
                    <AlertTriangle className="w-4 h-4" />
                    {msg.content}
                    <button onClick={() => handleDelete(msg.id)} className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[#FA5C1C] hover:text-white transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {msg.role === 'npc' && (
                  <div className="flex gap-3 max-w-[80%] relative">
                    <div className="w-8 h-8 bg-[#00DAF3]/20 border border-[#00DAF3] rounded-full flex items-center justify-center shrink-0 mt-1">
                      <Cpu className="w-4 h-4 text-[#00DAF3]" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[#00DAF3] font-bold text-sm font-headline">{msg.name}</span>
                        <span className="text-[#959177] text-[10px] font-mono">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className="bg-[#1c1b1b] border border-[#353535] text-[#e5e2e1] p-4 rounded-sm rounded-tl-none text-sm leading-relaxed clip-path-chamfer-small whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                    <div className="absolute -right-12 top-8 opacity-0 group-hover:opacity-100 flex flex-col gap-2 transition-opacity">
                      <button onClick={() => handleDelete(msg.id)} className="text-[#959177] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}

                {msg.role === 'user' && (
                  <div className="flex gap-3 max-w-[80%] flex-row-reverse relative">
                    <div className="w-8 h-8 bg-[#FFF000]/20 border border-[#FFF000] rounded-full flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-[#FFF000]" />
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-2 mb-1 flex-row-reverse">
                        <span className="text-[#FFF000] font-bold text-sm font-headline">{msg.name}</span>
                        <span className="text-[#959177] text-[10px] font-mono">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className="bg-[#FFF000]/10 border border-[#FFF000]/30 text-white p-4 rounded-sm rounded-tr-none text-sm leading-relaxed clip-path-chamfer-small whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                    <div className="absolute -left-12 top-8 opacity-0 group-hover:opacity-100 flex flex-col gap-2 transition-opacity">
                      <button onClick={() => handleDelete(msg.id)} className="text-[#959177] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}

              </div>
            ))
          )}
          {sending && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 bg-[#00DAF3]/20 border border-[#00DAF3] rounded-full flex items-center justify-center shrink-0 mt-1">
                <Cpu className="w-4 h-4 text-[#00DAF3]" />
              </div>
              <div className="bg-[#1c1b1b] border border-[#353535] text-[#00DAF3] p-4 rounded-sm rounded-tl-none text-sm clip-path-chamfer-small flex items-center gap-2">
                <div className="w-2 h-2 bg-[#00DAF3] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#00DAF3] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-[#00DAF3] rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-[#1c1b1b] border-t border-[#353535] p-4 z-10">
          <div className="relative flex items-end gap-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入指令... (Enter 发送, Shift+Enter 换行)"
              className="flex-1 bg-[#131313] border border-[#353535] text-white p-4 text-sm focus:border-[#FFF000] outline-none resize-none h-[60px] custom-scrollbar clip-path-chamfer-small transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="bg-[#FFF000] text-[#131313] h-[60px] px-8 font-headline font-black text-lg hover:bg-white transition-colors clip-path-chamfer-small disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              发送 <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
