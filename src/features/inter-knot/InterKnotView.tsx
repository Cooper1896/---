/**
 * InterKnot page – View
 *
 * AI communication log viewer with MVU architecture.
 * Uses shared PageHeader and theme tokens throughout.
 */
import { useEffect, useCallback } from 'react';
import { Database, Zap, Cpu, Terminal, FileJson, Clock, Server, ShieldAlert } from 'lucide-react';
import { useMvu } from '../../mvu';
import { PageHeader } from '../../ui';
import { initInterKnotModel } from './model';
import { interKnotUpdate } from './update';
import type { InterKnotMsg } from './update';

export default function InterKnotView() {
  const { model, dispatch } = useMvu(interKnotUpdate, initInterKnotModel);

  const fetchLogs = useCallback(() => {
    dispatch({ type: 'SET_LOADING', loading: true });
    fetch('/api/ai-logs')
      .then(res => res.json())
      .then(data => {
        dispatch({ type: 'SET_LOGS', logs: data });
        dispatch({ type: 'SET_LOADING', loading: false });
      })
      .catch(err => {
        console.error('Failed to fetch AI logs:', err);
        dispatch({ type: 'SET_LOADING', loading: false });
      });
  }, [dispatch]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const selectedLog = model.logs.find(l => l.id === model.selectedLogId);

  return (
    <div className="max-w-7xl mx-auto w-full relative z-10 flex-1 flex flex-col py-6 h-[calc(100vh-80px)]">
      <PageHeader
        label="Inter-Knot Log System"
        title="绳网 // AI通信日志"
        accent="var(--zt-accent-tertiary)"
        actions={
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--zt-surface)] border border-[var(--zt-line)] text-[var(--zt-muted)] hover:text-[var(--zt-accent-tertiary)] hover:border-[var(--zt-accent-tertiary)] transition-colors clip-path-chamfer font-bold text-sm"
          >
            <Clock className="w-4 h-4" /> 刷新数据
          </button>
        }
      />

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Sidebar: Log List */}
        <div className="w-1/3 bg-[var(--zt-surface)] border-2 border-[var(--zt-line)] clip-path-chamfer flex flex-col">
          <div className="p-4 border-b border-[var(--zt-line)] bg-[var(--zt-bg)] flex items-center justify-between">
            <h3 className="text-[var(--zt-accent-tertiary)] font-bold font-headline tracking-widest flex items-center gap-2">
              <Database className="w-5 h-5" /> 传输节点记录
            </h3>
            <span className="text-xs bg-[var(--zt-line)] px-2 py-0.5 rounded text-[var(--zt-muted)]">{model.logs.length} LOGS</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {model.loading && model.logs.length === 0 ? (
              <div className="text-[var(--zt-muted)] text-sm text-center py-8 flex flex-col items-center gap-4">
                <Cpu className="w-8 h-8 animate-pulse text-[var(--zt-accent-tertiary)]" />
                正在解析离轨系统数据...
              </div>
            ) : model.logs.length === 0 ? (
              <div className="text-[var(--zt-muted)] text-sm text-center py-8 flex flex-col items-center gap-4">
                <Server className="w-12 h-12 opacity-20" />
                <p className="font-bold">无活跃通信记录</p>
                <span className="text-xs opacity-50 px-6">目前没有检测到代理人或大世界的AI交互数据，请发起始动信号建立连接。</span>
              </div>
            ) : (
              model.logs.map(log => (
                <button
                  key={log.id}
                  onClick={() => dispatch({ type: 'SELECT_LOG', id: log.id })}
                  className={`w-full text-left p-3 rounded-sm border-l-4 transition-all duration-200 flex flex-col gap-2 ${
                    model.selectedLogId === log.id
                      ? 'bg-[var(--zt-line)] border-[var(--zt-accent-tertiary)] text-white'
                      : 'bg-[var(--zt-bg)] border-transparent text-[var(--zt-muted)] hover:bg-[#2a2a2a] hover:text-[var(--zt-text)]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm flex items-center gap-2">
                      <Zap className={`w-3 h-3 ${model.selectedLogId === log.id ? 'text-[var(--zt-accent-tertiary)]' : 'text-[var(--zt-muted)]'}`} />
                      {log.type}
                    </span>
                    <span className="text-[10px] font-mono opacity-70 bg-black/30 px-1 rounded">{formatTime(log.timestamp)}</span>
                  </div>
                  <div className="text-xs font-mono truncate w-full opacity-60 flex justify-between">
                    <span>{log.model || 'Unknown'}</span>
                    <span>ID: {log.id.toString().slice(-4)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Area: Log Details */}
        <div className="flex-1 bg-[var(--zt-bg)] border-2 border-[var(--zt-line)] clip-path-chamfer flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--zt-line)] clip-path-corner opacity-20 z-0" />

          {selectedLog ? (
            <>
              <div className="p-4 border-b border-[var(--zt-line)] bg-[var(--zt-surface)] flex justify-between items-center z-10 relative">
                <div className="flex items-center gap-3">
                  <div className="bg-[var(--zt-accent-tertiary)] p-1.5 rounded-sm">
                    <Terminal className="w-5 h-5 text-[var(--zt-bg)]" />
                  </div>
                  <div>
                    <h2 className="font-headline font-bold text-white tracking-widest">{selectedLog.type}</h2>
                    <div className="flex gap-2 text-[10px] font-mono mt-0.5">
                      <span className="bg-[var(--zt-line)] text-[var(--zt-accent-tertiary)] px-1 rounded shadow-inner">ID:{selectedLog.id}</span>
                      <span className="bg-[var(--zt-line)] text-[var(--zt-muted)] px-1 rounded shadow-inner">MDL:{selectedLog.model || 'UNKNOWN'}</span>
                    </div>
                  </div>
                </div>
                <div className="font-mono text-xs text-[var(--zt-muted)] bg-[var(--zt-bg)] py-1.5 px-3 border border-[var(--zt-line)] shadow-inner">
                  {new Date(selectedLog.timestamp).toLocaleString('zh-CN')}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6 z-10 relative">
                <div className="flex flex-col gap-2 flex-1">
                  <h3 className="text-[var(--zt-accent-tertiary)] font-bold font-headline tracking-widest flex items-center gap-2 text-sm border-b border-[var(--zt-line)] pb-2">
                    <FileJson className="w-4 h-4" /> [INPUT] 完整提示词 (System + Context)
                  </h3>
                  <div className="bg-[var(--zt-bg-deep)] border border-[var(--zt-line)] p-4 text-[var(--zt-text)] font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap rounded-sm shadow-inner selection:bg-[var(--zt-accent-tertiary)] selection:text-black flex-1 min-h-[150px]">
                    {selectedLog.prompt}
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-none">
                  <h3 className="text-[var(--zt-accent-primary)] font-bold font-headline tracking-widest flex items-center gap-2 text-sm border-b border-[var(--zt-line)] pb-2 mt-4">
                    <Zap className="w-4 h-4" /> [OUTPUT] 模型原始回复
                  </h3>
                  <div className="bg-[var(--zt-bg-deep)] border border-[var(--zt-line)] p-4 text-[var(--zt-accent-primary)] font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap rounded-sm shadow-inner selection:bg-[var(--zt-accent-primary)] selection:text-black min-h-[100px]">
                    {selectedLog.response}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--zt-muted)] p-8 text-center space-y-4">
              <ShieldAlert className="w-16 h-16 opacity-20" />
              <div>
                <p className="font-bold text-lg text-white opacity-50 mb-1">未选择日志节点</p>
                <p className="text-sm opacity-50">请在左侧列表中指定一条记录进行解密查阅。</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
