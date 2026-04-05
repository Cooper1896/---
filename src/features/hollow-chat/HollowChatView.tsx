/**
 * HollowChat page – View
 *
 * Full-screen immersive chat for "Hollow" world exploration.
 * Uses MVU architecture with shared theme tokens.
 */
import React, { useEffect, useRef } from 'react';
import { Send, AlertTriangle, Cpu, User, Zap, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMvu } from '../../mvu';
import { OverlayEffects } from '../../ui';
import { initHollowChatModel } from './model';
import { hollowChatUpdate } from './update';
import type { HollowChatMsg } from './update';
import type { ChatMessage } from './model';

export default function HollowChatView() {
  const navigate = useNavigate();
  const { model, dispatch } = useMvu(hollowChatUpdate, initHollowChatModel);
  const send = (msg: HollowChatMsg) => dispatch(msg);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/hollow/history')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          send({ type: 'SET_MESSAGES', messages: data });
        } else {
          const initialMsgs: ChatMessage[] = [
            { id: Date.now() - 1000, role: 'system', name: 'SYSTEM', content: '>>> 警告：已脱离安全网络。当前处于空洞直连模式。大世界探索已开启。', timestamp: new Date().toISOString() },
            { id: Date.now(), role: 'npc', name: 'World', content: '你环顾四周，空洞内的以太物质在空气中漂浮。你的代理人们正在后台待命，随时准备响应你的行动。你打算做什么？', timestamp: new Date().toISOString() }
          ];
          send({ type: 'SET_MESSAGES', messages: initialMsgs });
          syncMessages(initialMsgs);
        }
        send({ type: 'SET_LOADING', loading: false });
      })
      .catch(err => {
        console.error('Failed to fetch data:', err);
        send({ type: 'SET_LOADING', loading: false });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const syncMessages = async (msgs: ChatMessage[]) => {
    try {
      await fetch('/api/hollow/sync', {
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
  }, [model.messages]);

  const handleSend = async (customMessages?: ChatMessage[]) => {
    const msgsToSend = customMessages || [...model.messages];

    if (!customMessages) {
      if (!model.input.trim() || model.sending) return;
      const newMsgContent = model.input.trim();
      send({ type: 'SET_INPUT', input: '' });
      send({ type: 'SET_SENDING', sending: true });

      const newUserMsg: ChatMessage = {
        id: Date.now(),
        role: 'user',
        name: 'Proxy',
        content: newMsgContent,
        timestamp: new Date().toISOString()
      };
      msgsToSend.push(newUserMsg);
      send({ type: 'SET_MESSAGES', messages: msgsToSend });
      await syncMessages(msgsToSend);
    } else {
      send({ type: 'SET_SENDING', sending: true });
    }

    try {
      const res = await fetch('/api/hollow/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgsToSend })
      });
      const botMsg = await res.json();
      if (botMsg.error) throw new Error(botMsg.error);

      const finalMessages = [...msgsToSend, botMsg];
      send({ type: 'SET_MESSAGES', messages: finalMessages });
      await syncMessages(finalMessages);
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMsg: ChatMessage = {
        id: Date.now(),
        role: 'system',
        name: 'SYSTEM',
        content: `通信错误: ${err}`,
        timestamp: new Date().toISOString()
      };
      const finalMessages = [...msgsToSend, errorMsg];
      send({ type: 'SET_MESSAGES', messages: finalMessages });
      await syncMessages(finalMessages);
    } finally {
      send({ type: 'SET_SENDING', sending: false });
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
    <div className="fixed inset-0 bg-[var(--zt-bg-deep)] text-[var(--zt-text)] font-sans overflow-hidden flex flex-col z-[200]">
      <OverlayEffects />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-[var(--zt-accent-primary)]/5 blur-[150px] pointer-events-none z-0" />

      {/* Top Navigation Bar */}
      <div className="relative z-20 flex justify-between items-center px-6 py-4 border-b border-[var(--zt-line)] bg-[var(--zt-bg-deep)]/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[var(--zt-accent-primary)] hover:text-white transition-colors font-headline font-bold">
            <ChevronLeft className="w-6 h-6" />
            <span>断开连接 (EXIT)</span>
          </button>
          <div className="h-6 w-px bg-[var(--zt-line)]" />
          <div className="flex items-center gap-2 text-xs font-headline text-[var(--zt-accent-secondary)] bg-[var(--zt-accent-secondary)]/10 px-3 py-1.5 rounded-full border border-[var(--zt-accent-secondary)]/30">
            <Zap className="w-4 h-4 animate-pulse" /> 空洞直连模式 (大世界探索)
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 relative z-20 flex flex-col max-w-5xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-8">
          {model.loading ? (
            <div className="text-center text-[var(--zt-accent-primary)] my-auto font-headline animate-pulse tracking-widest">
              [ 正在建立神经连接... ]
            </div>
          ) : (
            model.messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : msg.role === 'system' ? 'items-center' : 'items-start'}`}>
                {msg.role === 'system' && (
                  <div className="bg-[var(--zt-accent-secondary)]/10 border border-[var(--zt-accent-secondary)]/30 text-[var(--zt-accent-secondary)] px-6 py-3 rounded-sm text-xs font-mono flex items-center gap-3 max-w-[80%] text-center">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="tracking-widest">{msg.content}</span>
                  </div>
                )}
                {msg.role === 'npc' && (
                  <div className="flex gap-4 max-w-[85%]">
                    <div className="w-12 h-12 bg-[var(--zt-accent-tertiary)]/10 border-2 border-[var(--zt-accent-tertiary)] rounded-sm flex items-center justify-center shrink-0 clip-path-chamfer-small">
                      <Cpu className="w-6 h-6 text-[var(--zt-accent-tertiary)]" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-[var(--zt-accent-tertiary)] font-black text-lg font-headline tracking-wider">{msg.name}</span>
                        <span className="text-[var(--zt-muted)] text-xs font-mono">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className="text-[var(--zt-text)] text-lg leading-relaxed whitespace-pre-wrap font-sans">{msg.content}</div>
                    </div>
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="flex gap-4 max-w-[85%] flex-row-reverse">
                    <div className="w-12 h-12 bg-[var(--zt-accent-primary)]/10 border-2 border-[var(--zt-accent-primary)] rounded-sm flex items-center justify-center shrink-0 clip-path-chamfer-small">
                      <User className="w-6 h-6 text-[var(--zt-accent-primary)]" />
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-3 mb-2 flex-row-reverse">
                        <span className="text-[var(--zt-accent-primary)] font-black text-lg font-headline tracking-wider">{msg.name}</span>
                        <span className="text-[var(--zt-muted)] text-xs font-mono">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className="text-[var(--zt-text)] text-lg leading-relaxed whitespace-pre-wrap font-sans text-right">{msg.content}</div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {model.sending && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-12 h-12 bg-[var(--zt-accent-tertiary)]/10 border-2 border-[var(--zt-accent-tertiary)] rounded-sm flex items-center justify-center shrink-0 clip-path-chamfer-small">
                <Cpu className="w-6 h-6 text-[var(--zt-accent-tertiary)]" />
              </div>
              <div className="flex items-center gap-2 text-[var(--zt-accent-tertiary)] pt-3">
                <div className="w-3 h-3 bg-[var(--zt-accent-tertiary)] rounded-sm animate-pulse" />
                <div className="w-3 h-3 bg-[var(--zt-accent-tertiary)] rounded-sm animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-3 h-3 bg-[var(--zt-accent-tertiary)] rounded-sm animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-[var(--zt-bg-deep)] to-transparent">
          <div className="relative flex items-end gap-4 bg-[var(--zt-bg)]/80 backdrop-blur-md border-2 border-[var(--zt-line)] p-2 clip-path-chamfer focus-within:border-[var(--zt-accent-primary)] transition-colors">
            <textarea
              value={model.input}
              onChange={(e) => send({ type: 'SET_INPUT', input: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="[ 输入指令... ]"
              className="flex-1 bg-transparent text-white p-4 text-lg focus:outline-none resize-none h-[80px] custom-scrollbar placeholder:text-[var(--zt-line)] font-headline"
            />
            <button
              onClick={() => handleSend()}
              disabled={!model.input.trim() || model.sending}
              className="bg-[var(--zt-accent-primary)] text-[var(--zt-bg)] h-[80px] px-10 font-headline font-black text-xl hover:bg-white transition-colors clip-path-chamfer-small disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              发送 <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
