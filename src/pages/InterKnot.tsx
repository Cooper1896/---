import { useState, useEffect, useRef } from 'react';
import { Send, User, Trash2, MessageSquare, ShieldAlert, Zap, Cpu } from 'lucide-react';

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

export default function InterKnot() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/characters')
      .then(res => res.json())
      .then(data => {
        setCharacters(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch characters:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedCharId) {
      fetch(`/api/interknot/${selectedCharId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setMessages(data);
          } else {
            const char = characters.find(c => c.id === selectedCharId);
            if (char) {
              const initialMsgs: Message[] = [
                { id: Date.now() - 1000, role: 'system', name: 'SYSTEM', content: `[绳网私信加密通道已建立] 正在连接至代理人: ${char.name}...`, timestamp: new Date().toISOString() },
                { id: Date.now(), role: 'npc', name: char.name, content: char.firstMessage || '你好。', timestamp: new Date().toISOString() }
              ];
              setMessages(initialMsgs);
              syncMessages(selectedCharId, initialMsgs);
            }
          }
        });
    } else {
      setMessages([]);
    }
  }, [selectedCharId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const syncMessages = async (charId: string, msgs: Message[]) => {
    try {
      await fetch(`/api/interknot/${charId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs })
      });
    } catch (err) {
      console.error('Failed to sync messages:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !selectedCharId) return;
    
    const newMsgContent = input.trim();
    setInput('');
    setSending(true);

    const newUserMsg: Message = {
      id: Date.now(),
      role: 'user',
      name: 'Proxy',
      content: newMsgContent,
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    await syncMessages(selectedCharId, updatedMessages);

    try {
      const res = await fetch('/api/interknot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedMessages,
          characterId: selectedCharId
        })
      });
      const botMsg = await res.json();
      if (botMsg.error) throw new Error(botMsg.error);
      
      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      await syncMessages(selectedCharId, finalMessages);
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMsg: Message = {
        id: Date.now(),
        role: 'system',
        name: 'SYSTEM',
        content: `通信错误: ${err}`,
        timestamp: new Date().toISOString()
      };
      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
      await syncMessages(selectedCharId, finalMessages);
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!selectedCharId || !confirm('确定要清除与该代理人的所有私信记录吗？')) return;
    try {
      await fetch(`/api/interknot/${selectedCharId}/clear`, { method: 'POST' });
      const char = characters.find(c => c.id === selectedCharId);
      if (char) {
        const initialMsgs: Message[] = [
          { id: Date.now() - 1000, role: 'system', name: 'SYSTEM', content: `[绳网私信加密通道已建立] 正在连接至代理人: ${char.name}...`, timestamp: new Date().toISOString() },
          { id: Date.now(), role: 'npc', name: char.name, content: char.firstMessage || '你好。', timestamp: new Date().toISOString() }
        ];
        setMessages(initialMsgs);
        syncMessages(selectedCharId, initialMsgs);
      }
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  const selectedChar = characters.find(c => c.id === selectedCharId);

  return (
    <div className="max-w-7xl mx-auto w-full relative z-10 flex-1 flex flex-col py-6 h-[calc(100vh-80px)]">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-1 w-12 bg-[#00DAF3]"></div>
          <span className="font-headline text-[#00DAF3] text-xs tracking-[0.3em] font-bold uppercase">Inter-Knot DM System</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-headline text-white leading-none tracking-tighter">
          代理人网络 // 私信
        </h1>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Sidebar: Agent List */}
        <div className="w-1/4 bg-[#1c1b1b] border-2 border-[#353535] clip-path-chamfer flex flex-col">
          <div className="p-4 border-b border-[#353535] bg-[#131313]">
            <h3 className="text-[#00DAF3] font-bold font-headline tracking-widest flex items-center gap-2">
              <User className="w-5 h-5" /> 联系人列表
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {loading ? (
              <div className="text-[#959177] text-sm text-center py-4">正在加载代理人数据...</div>
            ) : characters.length === 0 ? (
              <div className="text-[#959177] text-sm text-center py-4">暂无代理人，请前往设置添加。</div>
            ) : (
              characters.map(char => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharId(char.id)}
                  className={`w-full text-left p-3 rounded-sm border-l-4 transition-all duration-200 flex items-center gap-3 ${
                    selectedCharId === char.id 
                      ? 'bg-[#353535] border-[#00DAF3] text-white' 
                      : 'bg-[#131313] border-transparent text-[#959177] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${selectedCharId === char.id ? 'bg-[#00DAF3] text-[#131313]' : 'bg-[#353535] text-[#959177]'}`}>
                    {char.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{char.name}</div>
                    <div className="text-[10px] truncate opacity-70 mt-0.5">{char.description}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Area: Chat Interface */}
        <div className="flex-1 bg-[#1c1b1b] border-2 border-[#353535] clip-path-chamfer flex flex-col relative overflow-hidden">
          {selectedCharId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[#353535] bg-[#131313] flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00DAF3] text-[#131313] flex items-center justify-center font-bold text-lg">
                    {selectedChar?.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold font-headline">{selectedChar?.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-[#00DAF3]">
                      <Zap className="w-3 h-3" /> 在线
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleClearChat}
                  className="text-[#959177] hover:text-red-400 transition-colors p-2"
                  title="清除聊天记录"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] text-[#959177] font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      <span className={`text-xs font-bold ${
                        msg.role === 'user' ? 'text-[#00DAF3]' : 
                        msg.role === 'system' ? 'text-[#FA5C1C]' : 'text-[#FFF000]'
                      }`}>
                        {msg.name}
                      </span>
                    </div>
                    
                    <div className={`max-w-[80%] p-4 rounded-sm relative ${
                      msg.role === 'user' 
                        ? 'bg-[#00DAF3]/10 border border-[#00DAF3]/30 text-[#e5e2e1]' 
                        : msg.role === 'system'
                        ? 'bg-[#FA5C1C]/10 border border-[#FA5C1C]/30 text-[#FA5C1C] font-mono text-sm'
                        : 'bg-[#353535]/50 border border-[#353535] text-[#e5e2e1]'
                    }`}>
                      {msg.role === 'system' && <ShieldAlert className="w-4 h-4 inline-block mr-2 -mt-1 opacity-70" />}
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-bold text-[#FFF000]">{selectedChar?.name}</span>
                    </div>
                    <div className="max-w-[80%] p-4 rounded-sm bg-[#353535]/50 border border-[#353535] text-[#e5e2e1]">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#FFF000] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#FFF000] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-[#FFF000] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-[#131313] border-t border-[#353535]">
                <div className="relative flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={`发送私信给 ${selectedChar?.name}... (Enter 发送, Shift+Enter 换行)`}
                    className="w-full bg-[#1c1b1b] border border-[#353535] text-white p-3 pr-12 focus:border-[#00DAF3] outline-none resize-none custom-scrollbar min-h-[50px] max-h-[150px]"
                    rows={1}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="absolute right-2 bottom-2 p-2 bg-[#00DAF3] text-[#131313] hover:bg-white disabled:opacity-50 disabled:hover:bg-[#00DAF3] transition-colors rounded-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#959177]">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-headline tracking-widest">请在左侧选择一个代理人开始私信</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
