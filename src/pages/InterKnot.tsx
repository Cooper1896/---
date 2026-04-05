import { useState, useEffect } from 'react';
import { Database, Zap, Cpu, Terminal, FileJson, Clock, Server, ShieldAlert } from 'lucide-react';

interface AILog {
  id: number;
  timestamp: string;
  type: string;
  model?: string;
  prompt: string;
  response: string;
}

export default function InterKnot() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  const fetchLogs = () => {
    setLoading(true);
    fetch('/api/ai-logs')
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        if (data.length > 0 && !selectedLogId) {
          setSelectedLogId(data[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch AI logs:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const selectedLog = logs.find(l => l.id === selectedLogId);

  return (
    <div className="max-w-7xl mx-auto w-full relative z-10 flex-1 flex flex-col py-6 h-[calc(100vh-80px)]">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="h-1 w-12 bg-[#00DAF3]"></div>
              <span className="font-headline text-[#00DAF3] text-xs tracking-[0.3em] font-bold uppercase">Inter-Knot Log System</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-headline text-white leading-none tracking-tighter">
              绳网 // AI通信日志
            </h1>
          </div>
          <button 
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 bg-[#1c1b1b] border border-[#353535] text-[#959177] hover:text-[#00DAF3] hover:border-[#00DAF3] transition-colors clip-path-chamfer font-bold text-sm"
          >
            <Clock className="w-4 h-4" /> 刷新数据
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Sidebar: Log List */}
        <div className="w-1/3 bg-[#1c1b1b] border-2 border-[#353535] clip-path-chamfer flex flex-col">
          <div className="p-4 border-b border-[#353535] bg-[#131313] flex items-center justify-between">
            <h3 className="text-[#00DAF3] font-bold font-headline tracking-widest flex items-center gap-2">
              <Database className="w-5 h-5" /> 传输节点记录
            </h3>
            <span className="text-xs bg-[#353535] px-2 py-0.5 rounded text-[#959177]">{logs.length} LOGS</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {loading && logs.length === 0 ? (
              <div className="text-[#959177] text-sm text-center py-8 flex flex-col items-center gap-4">
                <Cpu className="w-8 h-8 animate-pulse text-[#00DAF3]" />
                正在解析离轨系统数据...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-[#959177] text-sm text-center py-8 flex flex-col items-center gap-4">
                <Server className="w-12 h-12 opacity-20" />
                <p className="font-bold">无活跃通信记录</p>
                <span className="text-xs opacity-50 px-6">目前没有检测到代理人或大世界的AI交互数据，请发起始动信号建立连接。</span>
              </div>
            ) : (
              logs.map(log => (
                <button
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  className={`w-full text-left p-3 rounded-sm border-l-4 transition-all duration-200 flex flex-col gap-2 ${
                    selectedLogId === log.id
                      ? 'bg-[#353535] border-[#00DAF3] text-white' 
                      : 'bg-[#131313] border-transparent text-[#959177] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm flex items-center gap-2">
                      <Zap className={`w-3 h-3 ${selectedLogId === log.id ? 'text-[#00DAF3]' : 'text-[#959177]'}`} />
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
        <div className="flex-1 bg-[#131313] border-2 border-[#353535] clip-path-chamfer flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#353535] clip-path-corner opacity-20 z-0"></div>

          {selectedLog ? (
            <>
              <div className="p-4 border-b border-[#353535] bg-[#1c1b1b] flex justify-between items-center z-10 relative">
                <div className="flex items-center gap-3">
                  <div className="bg-[#00DAF3] p-1.5 rounded-sm">
                    <Terminal className="w-5 h-5 text-[#131313]" />
                  </div>
                  <div>
                    <h2 className="font-headline font-bold text-white tracking-widest">{selectedLog.type}</h2>
                    <div className="flex gap-2 text-[10px] font-mono mt-0.5">
                      <span className="bg-[#353535] text-[#00DAF3] px-1 rounded shadow-inner">ID:{selectedLog.id}</span>
                      <span className="bg-[#353535] text-[#959177] px-1 rounded shadow-inner">MDL:{selectedLog.model || 'UNKNOWN'}</span>
                    </div>
                  </div>
                </div>
                <div className="font-mono text-xs text-[#959177] bg-[#131313] py-1.5 px-3 border border-[#353535] shadow-inner">
                  {new Date(selectedLog.timestamp).toLocaleString('zh-CN')}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6 z-10 relative">
                {/* Prompt Section */}
                <div className="flex flex-col gap-2 flex-1">
                  <h3 className="text-[#00DAF3] font-bold font-headline tracking-widest flex items-center gap-2 text-sm border-b border-[#353535] pb-2">
                    <FileJson className="w-4 h-4" /> [INPUT] 完整提示词 (System + Context)
                  </h3>
                  <div className="bg-[#0a0a0a] border border-[#353535] p-4 text-[#e5e2e1] font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap rounded-sm shadow-inner selection:bg-[#00DAF3] selection:text-black flex-1 min-h-[150px]">
                    {selectedLog.prompt}
                  </div>
                </div>

                {/* Response Section */}
                <div className="flex flex-col gap-2 flex-none">
                  <h3 className="text-[#FFF000] font-bold font-headline tracking-widest flex items-center gap-2 text-sm border-b border-[#353535] pb-2 mt-4">
                    <Zap className="w-4 h-4" /> [OUTPUT] 模型原始回复
                  </h3>
                  <div className="bg-[#0a0a0a] border border-[#353535] p-4 text-[#FFF000] font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap rounded-sm shadow-inner selection:bg-[#FFF000] selection:text-black min-h-[100px]">
                    {selectedLog.response}
                  </div>
                </div>
              </div>
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-[#959177] p-8 text-center space-y-4">
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