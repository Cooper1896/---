import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, Cpu, User, RefreshCw, Trash2, LogOut, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  avatar?: string;
}

export default function ProxyChat() {
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [scenario, setScenario] = useState('在咖啡店相遇...');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load available characters
    fetch('/api/characters')
      .then(res => res.json())
      .then(data => {
        setCharacters(data);
      })
      .catch(err => console.error('Failed to load characters:', err));
  }, []);

  useEffect(() => {
    if (!selectedChar || view !== 'chat') return;
    setLoading(true);
    fetch(`/api/proxy/history?charId=${selectedChar}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setMessages(data);
        } else {
          const char = characters.find(c => c.id === selectedChar);
          const initialMsgs: Message[] = [
            { id: Date.now() - 1000, role: 'system', name: 'SYSTEM', content: `>>> 代理人网络：加密连接成功。当前对象: ${char?.name || '未知'}。当前场景：${scenario}`, timestamp: new Date().toISOString() },
            { id: Date.now(), role: 'npc', name: char?.name || '代理人', content: '（收到通信请求...在当前场景下准备响应）', timestamp: new Date().toISOString() }
          ];
          setMessages(initialMsgs);
          syncMessages(initialMsgs, selectedChar);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch data:', err);
        setLoading(false);
      });
  }, [selectedChar, scenario, view]); // eslint-disable-line

  const syncMessages = async (msgs: Message[], charId: string) => {
    try {
      await fetch(`/api/proxy/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charId, messages: msgs, scenario })
      });
    } catch (err) {
      console.error('Failed to sync messages:', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, view]);

  const handleSend = async () => {
    if (!input.trim() || sending || !selectedChar) return;
    const newMsgContent = input.trim();
    setInput('');
    setSending(true);

    const tempId = Date.now();
    const newUserMsg: Message = {
      id: tempId,
      role: 'user',
      name: 'User',
      content: newMsgContent,
      timestamp: new Date().toISOString()
    };
    
    const msgsToSend = [...messages, newUserMsg];
    setMessages(msgsToSend);
    await syncMessages(msgsToSend, selectedChar);

    try {
      const res = await fetch('/api/proxy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          charId: selectedChar,
          scenario,
          messages: msgsToSend
        })
      });
      const botMsg = await res.json();
      if (botMsg.error) throw new Error(botMsg.error);
      
      const finalMessages = [...msgsToSend, botMsg];
      setMessages(finalMessages);
      await syncMessages(finalMessages, selectedChar);
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMsg: Message = {
        id: Date.now(),
        role: 'system',
        name: 'SYSTEM',
        content: `通信错误: ${err}`,
        timestamp: new Date().toISOString()
      };
      const finalMessages = [...msgsToSend, errorMsg];
      setMessages(finalMessages);
      await syncMessages(finalMessages, selectedChar);
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('确定要清除与该代理人的对话记录吗？') || !selectedChar) return;
    try {
      await fetch(`/api/proxy/clear`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charId: selectedChar })
      });
      const char = characters.find(c => c.id === selectedChar);
      const initialMsgs: Message[] = [
        { id: Date.now() - 1000, role: 'system', name: 'SYSTEM', content: `>>> 代理人网络：加密连接成功。当前对象: ${char?.name || '未知'}。当前场景：${scenario}`, timestamp: new Date().toISOString() },
        { id: Date.now(), role: 'npc', name: char?.name || '代理人', content: '（收到通信请求...在当前场景下准备响应）', timestamp: new Date().toISOString() }
      ];
      setMessages(initialMsgs);
      syncMessages(initialMsgs, selectedChar);
    } catch (err) {
      console.error('Failed to clear chat:', err);
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
    <div className="fixed inset-0 bg-[#0a0a0a] text-[#e5e2e1] font-sans overflow-hidden flex flex-col z-[200]">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-30 z-0"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-[#00DAF3]/5 blur-[150px] pointer-events-none z-0"></div>

      {/* Top Navigation Bar */}
      <div className="relative z-20 flex justify-between items-center px-6 py-4 border-b border-[#353535] bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => view === 'chat' ? setView('list') : navigate('/')}
            className="flex items-center gap-2 text-[#00DAF3] hover:text-white transition-colors font-headline font-bold"
          >
            <ChevronLeft className="w-6 h-6" />
            <span>{view === 'chat' ? '返回列表 (BACK)' : '返回终端 (EXIT)'}</span>
          </button>
          <div className="h-6 w-px bg-[#353535]"></div>
          <div className="flex items-center gap-2 text-xs font-headline text-[#00DAF3] bg-[#00DAF3]/10 px-3 py-1.5 rounded-full border border-[#00DAF3]/30">
            <User className="w-4 h-4" /> 代理人网络 (单人攻略模式)
          </div>
        </div>
        <div className="flex items-center gap-4">
           {view === 'chat' && (<>
           {/* Character Selector */}
           <select 
              value={selectedChar || ''} 
              onChange={(e) => setSelectedChar(e.target.value)}
              className="bg-[#131313] border border-[#00DAF3] text-white px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[#00DAF3] rounded-sm"
           >
              {characters.length === 0 ? (
                <option value="" disabled>加载角色中...</option>
              ) : (
                characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              )}
           </select>

           <div className="flex items-center gap-2">
              <label className="text-xs text-[#959177]">场景设定:</label>
              <input 
                type="text" 
                value={scenario}
                onChange={e => setScenario(e.target.value)}
                className="bg-[#131313] border border-[#353535] text-white px-3 py-1.5 text-sm outline-none focus:border-[#00DAF3] rounded-sm w-48"
                placeholder="例如：在拉面店偶遇..."
              />
           </div>

           <button 
             onClick={handleClearChat}
             className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors bg-red-400/10 px-3 py-1.5 rounded-sm border border-red-400/30 text-xs"
             title="清除纪录重置场景"
           >
             <Trash2 className="w-4 h-4" />
             重置
           </button>
           </>)}
        </div>
      </div>

      {view === 'list' ? (
        <div className="flex-1 relative z-20 flex flex-col p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            <h1 className="text-3xl font-black text-[#00DAF3] font-headline mb-8 tracking-widest uppercase">选择联络对象 / CONTACT</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {characters.map(char => (
                <div 
                  key={char.id} 
                  onClick={() => { setSelectedChar(char.id); setView('chat'); }}
                  className="bg-[#131313] border-2 border-[#353535] hover:border-[#00DAF3] p-4 rounded-sm cursor-pointer transition-all group clip-path-chamfer-small flex flex-col items-center gap-4 relative overflow-hidden shadow-lg"
                >
                  <div className="w-full aspect-[3/4] bg-[#1c1b1b] rounded-sm flex items-center justify-center overflow-hidden border-2 border-[#353535] group-hover:border-[#00DAF3]/50 transition-colors relative shadow-inner">
                    {char.avatar ? (
                      <img src={char.avatar} alt={char.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 group-hover:text-[#00DAF3] text-[#353535] transition-colors">
                        <User className="w-16 h-16" />
                        <span className="text-xs font-mono font-bold">NO_IMAGE</span>
                      </div>
                    )}
                    {/* Decorative corner accents */}
                    <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-[#353535] group-hover:border-[#00DAF3]"></div>
                    <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-[#353535] group-hover:border-[#00DAF3]"></div>
                  </div>
                  <div className="text-left w-full px-2">
                    <h3 className="text-xl font-black text-white font-headline truncate group-hover:text-[#00DAF3] transition-colors">{char.name}</h3>
                    <p className="text-xs text-[#959177] line-clamp-2 mt-1 min-h-[32px]">{char.description || '暂无情报记录'}</p>
                  </div>
                  <div className="absolute top-2 right-2 bg-[#00DAF3] text-black text-[10px] font-black px-2 py-1 transform translate-x-2 -translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all clip-path-chamfer-small">
                    CONNECT...
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 relative z-20 flex flex-col max-w-5xl mx-auto w-full border-x border-[#353535] bg-[#0a0a0a]/50">
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-8">
            {loading ? (
              <div className="text-center text-[#00DAF3] my-auto font-headline animate-pulse tracking-widest">
                [ 正在建立私密通信频道... ]
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : msg.role === 'system' ? 'items-center' : 'items-start'}`}>
                  
                  {msg.role === 'system' && (
                    <div className="bg-[#00DAF3]/10 border border-[#00DAF3]/30 text-[#00DAF3] px-6 py-3 rounded-sm text-xs font-mono flex items-center gap-3 max-w-[80%] text-center">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="tracking-widest">{msg.content}</span>
                    </div>
                  )}

                  {msg.role === 'npc' && (
                    <div className="flex gap-4 max-w-[85%]">
                      <div className="w-12 h-12 bg-[#00DAF3]/20 border-2 border-[#00DAF3] rounded-sm flex items-center justify-center shrink-0 clip-path-chamfer-small overflow-hidden">
                        {characters.find(c => c.id === selectedChar)?.avatar ? (
                          <img src={characters.find(c => c.id === selectedChar)!.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Cpu className="w-6 h-6 text-[#00DAF3]" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-3 mb-2">
                          <span className="text-[#00DAF3] font-black text-lg font-headline tracking-wider">{msg.name}</span>
                          <span className="text-[#959177] text-xs font-mono">{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className="text-[#e5e2e1] text-lg leading-relaxed whitespace-pre-wrap font-sans bg-[#131313] p-4 border border-[#353535] rounded-sm rounded-tl-none">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.role === 'user' && (
                    <div className="flex gap-4 max-w-[85%] flex-row-reverse">
                      <div className="w-12 h-12 bg-white text-black font-black text-xl flex items-center justify-center shrink-0 clip-path-chamfer-small">
                        P
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-3 mb-2 flex-row-reverse">
                          <span className="text-white font-black text-lg font-headline tracking-wider">绳匠</span>
                          <span className="text-[#959177] text-xs font-mono">{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className="text-[#131313] bg-white p-4 text-lg leading-relaxed whitespace-pre-wrap font-sans rounded-sm rounded-tr-none border border-white">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 bg-[#0e0e0e] border-t border-[#353535]">
            <div className="relative flex items-end gap-4 max-w-4xl mx-auto">
              <button className="p-3 text-[#959177] hover:text-[#00DAF3] transition-colors shrink-0 outline-none">
                <ImageIcon className="w-6 h-6" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  placeholder={sending ? "等待对方回复..." : "开始你们的对话... (Shift+Enter 换行, Enter 发送)"}
                  className="w-full bg-[#131313] border-2 border-[#353535] focus:border-[#00DAF3] rounded-sm text-white p-4 pr-12 text-lg outline-none resize-none custom-scrollbar transition-colors disabled:opacity-50"
                  rows={Math.min(Math.max(input.split('\n').length, 1), 6)}
                  style={{ minHeight: '60px' }}
                />
                <div className="absolute right-4 bottom-4 text-xs font-mono text-[#959177]">
                  {input.length} 
                </div>
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || sending || !selectedChar}
                className="bg-[#00DAF3] text-[#131313] p-4 rounded-sm hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-[#00DAF3] shrink-0 font-bold clip-path-chamfer-small outline-none h-[60px]"
              >
                {sending ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
