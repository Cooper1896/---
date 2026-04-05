import { Terminal, Activity, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Log {
  id: number;
  time: string;
  method: string;
  path: string;
  status: number;
  latency: string;
  ip: string;
}

export default function InterKnot() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/logs')
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch logs:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto w-full relative z-10 flex-1 flex flex-col py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-1 w-12 bg-[#00DAF3]"></div>
          <span className="font-headline text-[#00DAF3] text-xs tracking-[0.3em] font-bold uppercase">Inter-Knot API Gateway</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black font-headline text-white leading-none tracking-tighter">
          绳网 // 访问日志
        </h1>
        <p className="text-[#959177] font-headline mt-4 text-lg max-w-xl">
          [ 实时监控 ] // 正在记录酒馆节点 API 流量...
        </p>
      </div>

      <div className="bg-[#1c1b1b] border-2 border-[#353535] clip-path-chamfer p-6 relative flex-1 flex flex-col">
        <div className="flex flex-wrap items-center justify-between mb-6 border-b border-[#353535] pb-4 gap-4">
          <div className="flex items-center gap-4">
            <Terminal className="text-[#00DAF3] w-6 h-6" />
            <span className="font-headline font-bold text-white tracking-widest">TAVERN_API_LOGS</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-[#959177] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="过滤日志..." 
                className="bg-[#131313] border border-[#353535] text-[#e5e2e1] text-sm font-mono py-1.5 pl-9 pr-4 focus:outline-none focus:border-[#00DAF3] transition-colors w-64"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-headline text-[#00DAF3] bg-[#00DAF3]/10 px-3 py-1.5 rounded-full border border-[#00DAF3]/30">
              <Activity className="w-4 h-4 animate-pulse" /> 实时同步中
            </div>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left font-mono text-sm whitespace-nowrap">
            <thead>
              <tr className="text-[#959177] border-b border-[#353535]">
                <th className="pb-3 font-normal px-4">TIMESTAMP</th>
                <th className="pb-3 font-normal px-4">METHOD</th>
                <th className="pb-3 font-normal px-4">ENDPOINT</th>
                <th className="pb-3 font-normal px-4">STATUS</th>
                <th className="pb-3 font-normal px-4">IP_ADDR</th>
                <th className="pb-3 font-normal px-4 text-right">LATENCY</th>
              </tr>
            </thead>
            <tbody className="text-[#e5e2e1]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#959177]">正在加载日志数据...</td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-[#353535]/50 hover:bg-[#353535]/50 transition-colors group">
                  <td className="py-3 px-4 text-[#959177] group-hover:text-white transition-colors">{log.time}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-xs font-bold ${
                      log.method === 'GET' ? 'text-[#00DAF3] bg-[#00DAF3]/10 border border-[#00DAF3]/20' :
                      log.method === 'POST' ? 'text-[#FFF000] bg-[#FFF000]/10 border border-[#FFF000]/20' :
                      log.method === 'PUT' ? 'text-[#FA5C1C] bg-[#FA5C1C]/10 border border-[#FA5C1C]/20' :
                      'text-red-400 bg-red-400/10 border border-red-400/20'
                    }`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#00DAF3] group-hover:text-[#9cf0ff] transition-colors">{log.path}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {log.status < 300 ? <CheckCircle2 className="w-4 h-4 text-green-400" /> :
                       log.status < 400 ? <Activity className="w-4 h-4 text-[#FFF000]" /> :
                       <AlertCircle className="w-4 h-4 text-red-400" />}
                      <span className={log.status >= 400 ? 'text-red-400' : 'text-green-400'}>{log.status}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#959177]">{log.ip}</td>
                  <td className="py-3 px-4 text-right text-[#959177]">{log.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
