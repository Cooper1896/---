/**
 * ProxyChat page – View
 *
 * Character-based single roleplay chat with character selection.
 * Uses MVU architecture with shared theme tokens.
 */
import React, { useEffect, useRef } from 'react';
import { Send, AlertTriangle, Cpu, User, RefreshCw, Trash2, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMvu } from '../../mvu';
import { OverlayEffects } from '../../ui';
import { initProxyChatModel } from './model';
import { proxyChatUpdate } from './update';
import type { ProxyChatMsg } from './update';
import type { ChatMessage } from './model';

export default function ProxyChatView() {
  const navigate = useNavigate();
  const { model, dispatch } = useMvu(proxyChatUpdate, initProxyChatModel);
  const send = (msg: ProxyChatMsg) => dispatch(msg);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/characters')
      .then(res => res.json())
      .then(data => {
        send({ type: 'SET_CHARACTERS', characters: data });
      })
      .catch(err => console.error('Failed to load characters:', err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!model.selectedCharId || model.view !== 'chat') return;
    send({ type: 'SET_LOADING', loading: true });
    fetch(`/api/proxy/history?charId=${model.selectedCharId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          send({ type: 'SET_MESSAGES', messages: data });
        } else {
          const char = model.characters.find(c => c.id === model.selectedCharId);
          const initialMsgs: ChatMessage[] = [
            { id: Date.now() - 1000, role: 'system', name: 'SYSTEM', content: `>>> 代理人网络：加密连接成功。当前对象: ${char?.name || '未知'}。当前场景：${model.scenario}`, timestamp: new Date().toISOString() },
            { id: Date.now(), role: 'npc', name: char?.name || '代理人', content: '（收到通信请求...在当前场景下准备响应）', timestamp: new Date().toISOString() }
          ];
          send({ type: 'SET_MESSAGES', messages: initialMsgs });
          syncMessages(initialMsgs, model.selectedCharId);
        }
        send({ type: 'SET_LOADING', loading: false });
      })
      .catch(err => {
        console.error('Failed to fetch data:', err);
        send({ type: 'SET_LOADING', loading: false });
      });
  }, [model.selectedCharId, model.scenario, model.view]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncMessages = async (msgs: ChatMessage[], charId: string) => {
    try {
      await fetch('/api/proxy/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charId, messages: msgs, scenario: model.scenario })
      });
    } catch (err) {
      console.error('Failed to sync messages:', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [model.messages, model.view]);

  const handleSend = async () => {
    if (!model.input.trim() || model.sending || !model.selectedCharId) return;
    const newMsgContent = model.input.trim();
    send({ type: 'SET_INPUT', input: '' });
    send({ type: 'SET_SENDING', sending: true });

    const newUserMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      name: 'User',
      content: newMsgContent,
      timestamp: new Date().toISOString()
    };

    const msgsToSend = [...model.messages, newUserMsg];
    send({ type: 'SET_MESSAGES', messages: msgsToSend });
    await syncMessages(msgsToSend, model.selectedCharId);

    try {
      const res = await fetch('/api/proxy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charId: model.selectedCharId,
          scenario: model.scenario,
          messages: msgsToSend
        })
      });
      const botMsg = await res.json();
      if (botMsg.error) throw new Error(botMsg.error);

      const finalMessages = [...msgsToSend, botMsg];
      send({ type: 'SET_MESSAGES', messages: finalMessages });
      await syncMessages(finalMessages, model.selectedCharId);
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
      await syncMessages(finalMessages, model.selectedCharId);
    } finally {
      send({ type: 'SET_SENDING', sending: false });
    }
  };

  const handleClearChat = async () => {
    if (!confirm('确定要清除与该代理人的对话记录吗？') || !model.selectedCharId) return;
    try {
      await fetch('/api/proxy/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charId: model.selectedCharId })
      });
      const char = model.characters.find(c => c.id === model.selectedCharId);
      const initialMsgs: ChatMessage[] = [
        { id: Date.now() - 1000, role: 'system', name: 'SYSTEM', content: `>>> 代理人网络：加密连接成功。当前对象: ${char?.name || '未知'}。当前场景：${model.scenario}`, timestamp: new Date().toISOString() },
        { id: Date.now(), role: 'npc', name: char?.name || '代理人', content: '（收到通信请求...在当前场景下准备响应）', timestamp: new Date().toISOString() }
      ];
      send({ type: 'SET_MESSAGES', messages: initialMsgs });
      syncMessages(initialMsgs, model.selectedCharId);
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
    <div className="fixed inset-0 bg-[var(--zt-bg-deep)] text-[var(--zt-text)] font-sans overflow-hidden flex flex-col z-[200]">
      <OverlayEffects />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-[var(--zt-accent-tertiary)]/5 blur-[150px] pointer-events-none z-0" />

      {/* Top Navigation Bar */}
      <div className="relative z-20 flex justify-between items-center px-6 py-4 border-b border-[var(--zt-line)] bg-[var(--zt-bg-deep)]/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button
            onClick={() => model.view === 'chat' ? send({ type: 'SET_VIEW', view: 'list' }) : navigate('/')}
            className="flex items-center gap-2 text-[var(--zt-accent-tertiary)] hover:text-white transition-colors font-headline font-bold"
          >
            <ChevronLeft className="w-6 h-6" />
            <span>{model.view === 'chat' ? '返回列表 (BACK)' : '返回终端 (EXIT)'}</span>
          </button>
          <div className="h-6 w-px bg-[var(--zt-line)]" />
          <div className="flex items-center gap-2 text-xs font-headline text-[var(--zt-accent-tertiary)] bg-[var(--zt-accent-tertiary)]/10 px-3 py-1.5 rounded-full border border-[var(--zt-accent-tertiary)]/30">
            <User className="w-4 h-4" /> 代理人网络 (单人攻略模式)
          </div>
        </div>
        <div className="flex items-center gap-4">
          {model.view === 'chat' && (<>
            <select
              value={model.selectedCharId || ''}
              onChange={(e) => send({ type: 'SELECT_CHAR', id: e.target.value })}
              className="bg-[var(--zt-bg)] border border-[var(--zt-accent-tertiary)] text-white px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[var(--zt-accent-tertiary)] rounded-sm"
            >
              {model.characters.length === 0 ? (
                <option value="" disabled>加载角色中...</option>
              ) : (
                model.characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              )}
            </select>

            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--zt-muted)]">场景设定:</label>
              <input
                type="text"
                value={model.scenario}
                onChange={e => send({ type: 'SET_SCENARIO', scenario: e.target.value })}
                className="bg-[var(--zt-bg)] border border-[var(--zt-line)] text-white px-3 py-1.5 text-sm outline-none focus:border-[var(--zt-accent-tertiary)] rounded-sm w-48"
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

      {model.view === 'list' ? (
        <div className="flex-1 relative z-20 flex flex-col p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            <h1 className="text-3xl font-black text-[var(--zt-accent-tertiary)] font-headline mb-8 tracking-widest uppercase">选择联络对象 / CONTACT</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {model.characters.map(char => (
                <div
                  key={char.id}
                  onClick={() => { send({ type: 'SELECT_CHAR', id: char.id }); send({ type: 'SET_VIEW', view: 'chat' }); }}
                  className="bg-[var(--zt-bg)] border-2 border-[var(--zt-line)] hover:border-[var(--zt-accent-tertiary)] p-4 rounded-sm cursor-pointer transition-all group clip-path-chamfer-small flex flex-col items-center gap-4 relative overflow-hidden shadow-lg"
                >
                  <div className="w-full aspect-[3/4] bg-[var(--zt-bg-elevated)] rounded-sm flex items-center justify-center overflow-hidden border-2 border-[var(--zt-line)] group-hover:border-[var(--zt-accent-tertiary)]/50 transition-colors relative shadow-inner">
                    {char.avatar ? (
                      <img src={char.avatar} alt={char.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 group-hover:text-[var(--zt-accent-tertiary)] text-[var(--zt-line)] transition-colors">
                        <User className="w-16 h-16" />
                        <span className="text-xs font-mono font-bold">NO_IMAGE</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-[var(--zt-line)] group-hover:border-[var(--zt-accent-tertiary)]" />
                    <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-[var(--zt-line)] group-hover:border-[var(--zt-accent-tertiary)]" />
                  </div>
                  <div className="text-left w-full px-2">
                    <h3 className="text-xl font-black text-white font-headline truncate group-hover:text-[var(--zt-accent-tertiary)] transition-colors">{char.name}</h3>
                    <p className="text-xs text-[var(--zt-muted)] line-clamp-2 mt-1 min-h-[32px]">{char.description || '暂无情报记录'}</p>
                  </div>
                  <div className="absolute top-2 right-2 bg-[var(--zt-accent-tertiary)] text-black text-[10px] font-black px-2 py-1 transform translate-x-2 -translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all clip-path-chamfer-small">
                    CONNECT...
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 relative z-20 flex flex-col max-w-5xl mx-auto w-full border-x border-[var(--zt-line)] bg-[var(--zt-bg-deep)]/50">
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-8">
            {model.loading ? (
              <div className="text-center text-[var(--zt-accent-tertiary)] my-auto font-headline animate-pulse tracking-widest">
                [ 正在建立私密通信频道... ]
              </div>
            ) : (
              model.messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : msg.role === 'system' ? 'items-center' : 'items-start'}`}>
                  {msg.role === 'system' && (
                    <div className="bg-[var(--zt-accent-tertiary)]/10 border border-[var(--zt-accent-tertiary)]/30 text-[var(--zt-accent-tertiary)] px-6 py-3 rounded-sm text-xs font-mono flex items-center gap-3 max-w-[80%] text-center">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="tracking-widest">{msg.content}</span>
                    </div>
                  )}
                  {msg.role === 'npc' && (
                    <div className="flex gap-4 max-w-[85%]">
                      <div className="w-12 h-12 bg-[var(--zt-accent-tertiary)]/20 border-2 border-[var(--zt-accent-tertiary)] rounded-sm flex items-center justify-center shrink-0 clip-path-chamfer-small overflow-hidden">
                        {model.characters.find(c => c.id === model.selectedCharId)?.avatar ? (
                          <img src={model.characters.find(c => c.id === model.selectedCharId)!.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Cpu className="w-6 h-6 text-[var(--zt-accent-tertiary)]" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-3 mb-2">
                          <span className="text-[var(--zt-accent-tertiary)] font-black text-lg font-headline tracking-wider">{msg.name}</span>
                          <span className="text-[var(--zt-muted)] text-xs font-mono">{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className="text-[var(--zt-text)] text-lg leading-relaxed whitespace-pre-wrap font-sans bg-[var(--zt-bg)] p-4 border border-[var(--zt-line)] rounded-sm rounded-tl-none">
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
                          <span className="text-[var(--zt-muted)] text-xs font-mono">{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className="text-[var(--zt-bg)] bg-white p-4 text-lg leading-relaxed whitespace-pre-wrap font-sans rounded-sm rounded-tr-none border border-white">
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

          <div className="p-6 bg-[var(--zt-bg-deep)] border-t border-[var(--zt-line)]">
            <div className="relative flex items-end gap-4 max-w-4xl mx-auto">
              <button className="p-3 text-[var(--zt-muted)] hover:text-[var(--zt-accent-tertiary)] transition-colors shrink-0 outline-none">
                <ImageIcon className="w-6 h-6" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  value={model.input}
                  onChange={(e) => send({ type: 'SET_INPUT', input: e.target.value })}
                  onKeyDown={handleKeyDown}
                  disabled={model.sending}
                  placeholder={model.sending ? "等待对方回复..." : "开始你们的对话... (Shift+Enter 换行, Enter 发送)"}
                  className="w-full bg-[var(--zt-bg)] border-2 border-[var(--zt-line)] focus:border-[var(--zt-accent-tertiary)] rounded-sm text-white p-4 pr-12 text-lg outline-none resize-none custom-scrollbar transition-colors disabled:opacity-50"
                  rows={Math.min(Math.max(model.input.split('\n').length, 1), 6)}
                  style={{ minHeight: '60px' }}
                />
                <div className="absolute right-4 bottom-4 text-xs font-mono text-[var(--zt-muted)]">
                  {model.input.length}
                </div>
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!model.input.trim() || model.sending || !model.selectedCharId}
                className="bg-[var(--zt-accent-tertiary)] text-[var(--zt-bg)] p-4 rounded-sm hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-[var(--zt-accent-tertiary)] shrink-0 font-bold clip-path-chamfer-small outline-none h-[60px]"
              >
                {model.sending ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
