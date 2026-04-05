import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, Cpu, User, Zap, RefreshCw, Trash2, LogOut, Database, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: number;
  role: 'system' | 'npc' | 'user';
  name: string;
  content: string;
  timestamp: string;
}

export default function HollowChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/hollow/history')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setMessages(data);
        } else {
          const initialMsgs: Message[] = [
            { id: Date.now() - 1000, role: 'system', name: 'SYSTEM', content: '>>> 警告：已脱离安全网络。当前处于空洞直连模式。大世界探索已开启。', timestamp: new Date().toISOString() },
            { id: Date.now(), role: 'npc', name: 'World', content: '你环顾四周，空洞内的以太物质在空气中漂浮。你的代理人们正在后台待命，随时准备响应你的行动。你打算做什么？', timestamp: new Date().toISOString() }
          ];
          setMessages(initialMsgs);
          syncMessages(initialMsgs);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch data:', err);
        setLoading(false);
      });
  }, []);

  const syncMessages = async (msgs: Message[]) => {
    try {
      await fetch(`/api/hollow/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs })
      });
    } catch (err) {
      console.error('Failed to sync messages:', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customMessages?: Message[]) => {
    const msgsToSend = customMessages || [...messages];
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
      msgsToSend.push(newUserMsg);
      setMessages(msgsToSend);
      await syncMessages(msgsToSend);
    } else {
      setSending(true);
    }

    try {
      const res = await fetch('/api/hollow/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: msgsToSend
        })
      });
      const botMsg = await res.json();
      if (botMsg.error) throw new Error(botMsg.error);
      
      const finalMessages = [...msgsToSend, botMsg];
      setMessages(finalMessages);
      await syncMessages(finalMessages);
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
      await syncMessages(finalMessages);
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('确定要清除空洞探索的所有记录吗？')) return;
    try {
      await fetch(`/api/hollow/clear`, { method: 'POST' });
      const initialMsgs: Message[] = [
        { id: Date.now() - 1000, role: 'system', name: 'SYSTEM', content: '>>> 警告：已脱离安全网络。当前处于空洞直连模式。大世界探索已开启。', timestamp: new Date().toISOString() },
        { id: Date.now(), role: 'npc', name: 'World', content: '你环顾四周，空洞内的以太物质在空气中漂浮。你的代理人们正在后台待命，随时准备响应你的行动。你打算做什么？', timestamp: new Date().toISOString() }
      ];
      setMessages(initialMsgs);
      syncMessages(initialMsgs);
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
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-50 z-0"></div>
      <div className="absolute inset-0 crt-scanlines pointer-events-none z-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-[#FFF000]/5 blur-[150px] pointer-events-none z-0"></div>

      {/* Top Navigation Bar */}
      <div className="relative z-20 flex justify-between items-center px-6 py-4 border-b border-[#353535] bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#FFF000] hover:text-white transition-colors font-headline font-bold"
          >
            <ChevronLeft className="w-6 h-6" />
            <span>断开连接 (EXIT)</span>
          </button>
          <div className="h-6 w-px bg-[#353535]"></div>
          <div className="flex items-center gap-2 text-xs font-headline text-[#FA5C1C] bg-[#FA5C1C]/10 px-3 py-1.5 rounded-full border border-[#FA5C1C]/30">
            <Zap className="w-4 h-4 animate-pulse" /> 空洞直连模式 (大世界探索)
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 relative z-20 flex flex-col max-w-5xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-8">
          {loading ? (
            <div className="text-center text-[#FFF000] my-auto font-headline animate-pulse tracking-widest">
              [ 正在建立神经连接... ]
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : msg.role === 'system' ? 'items-center' : 'items-start'}`}>
                
                {msg.role === 'system' && (
                  <div className="bg-[#FA5C1C]/10 border border-[#FA5C1C]/30 text-[#FA5C1C] px-6 py-3 rounded-sm text-xs font-mono flex items-center gap-3 max-w-[80%] text-center">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="tracking-widest">{msg.content}</span>
                  </div>
                )}

                {msg.role === 'npc' && (
                  <div className="flex gap-4 max-w-[85%]">
                    <div className="w-12 h-12 bg-[#00DAF3]/10 border-2 border-[#00DAF3] rounded-sm flex items-center justify-center shrink-0 clip-path-chamfer-small">
                      <Cpu className="w-6 h-6 text-[#00DAF3]" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-[#00DAF3] font-black text-lg font-headline tracking-wider">{msg.name}</span>
                        <span className="text-[#959177] text-xs font-mono">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className="text-[#e5e2e1] text-lg leading-relaxed whitespace-pre-wrap font-sans">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )}

                {msg.role === 'user' && (
                  <div className="flex gap-4 max-w-[85%] flex-row-reverse">
                    <div className="w-12 h-12 bg-[#FFF000]/10 border-2 border-[#FFF000] rounded-sm flex items-center justify-center shrink-0 clip-path-chamfer-small">
                      <User className="w-6 h-6 text-[#FFF000]" />
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-3 mb-2 flex-row-reverse">
                        <span className="text-[#FFF000] font-black text-lg font-headline tracking-wider">{msg.name}</span>
                        <span className="text-[#959177] text-xs font-mono">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className="text-[#e5e2e1] text-lg leading-relaxed whitespace-pre-wrap font-sans text-right">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-12 h-12 bg-[#00DAF3]/10 border-2 border-[#00DAF3] rounded-sm flex items-center justify-center shrink-0 clip-path-chamfer-small">
                <Cpu className="w-6 h-6 text-[#00DAF3]" />
              </div>
              <div className="flex items-center gap-2 text-[#00DAF3] pt-3">
                <div className="w-3 h-3 bg-[#00DAF3] rounded-sm animate-pulse"></div>
                <div className="w-3 h-3 bg-[#00DAF3] rounded-sm animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-3 h-3 bg-[#00DAF3] rounded-sm animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-[#0a0a0a] to-transparent">
          <div className="relative flex items-end gap-4 bg-[#131313]/80 backdrop-blur-md border-2 border-[#353535] p-2 clip-path-chamfer focus-within:border-[#FFF000] transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="[ 输入指令... ]"
              className="flex-1 bg-transparent text-white p-4 text-lg focus:outline-none resize-none h-[80px] custom-scrollbar placeholder:text-[#353535] font-headline"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="bg-[#FFF000] text-[#131313] h-[80px] px-10 font-headline font-black text-xl hover:bg-white transition-colors clip-path-chamfer-small disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              发送 <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
