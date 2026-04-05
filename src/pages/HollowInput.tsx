import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Terminal, Zap, Crosshair } from 'lucide-react';

export default function HollowInput() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'searching' | 'connecting'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== 'idle') return;

    setStatus('searching');
    setLogs(['> 正在解析目标坐标...', `> 目标: ${input}`]);

    setTimeout(() => {
      setLogs(prev => [...prev, '> 坐标锁定成功。', '> 正在请求以太连接...']);
      setStatus('connecting');

      setTimeout(() => {
        setLogs(prev => [...prev, '> 连接已建立。', '> 正在潜入深度空洞...']);
        setTimeout(() => {
          navigate('/hollow');
        }, 1000);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-[#e5e2e1] font-sans overflow-hidden flex flex-col z-[200]">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-50 z-0"></div>
      <div className="absolute inset-0 crt-scanlines pointer-events-none z-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-[#FFF000]/5 blur-[150px] pointer-events-none z-0"></div>

      {/* Top Navigation Bar */}
      <div className="relative z-20 flex justify-between items-center px-6 py-4 border-b border-[#353535] bg-[#0a0a0a]/80 backdrop-blur-md">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#FFF000] hover:text-white transition-colors font-headline font-bold"
        >
          <ChevronLeft className="w-6 h-6" />
          <span>断开连接 (EXIT)</span>
        </button>
        <div className="flex items-center gap-2 text-xs font-headline text-[#FFF000] bg-[#FFF000]/10 px-3 py-1.5 rounded-full border border-[#FFF000]/30">
          <Terminal className="w-4 h-4" /> HDD 寻路系统
        </div>
      </div>

      {/* Main Input Area */}
      <div className="flex-1 relative z-20 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <div className="mb-12 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[#FFF000] blur-xl opacity-20 rounded-full"></div>
              <Crosshair className="w-20 h-20 text-[#FFF000] relative z-10 animate-[spin_10s_linear_infinite]" />
              <Zap className="w-8 h-8 text-[#131313] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-headline text-white tracking-widest mb-4">
              空洞坐标检索
            </h1>
            <p className="text-[#959177] font-mono text-sm tracking-[0.2em]">
              PLEASE ENTER HOLLOW COORDINATES OR COMMISSION CODE
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
              <span className={`font-black text-2xl font-mono transition-colors ${status !== 'idle' ? 'text-[#00DAF3]' : 'text-[#FFF000]'}`}>{'>'}</span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status !== 'idle'}
              className={`w-full bg-[#131313]/80 backdrop-blur-md border-2 text-white text-2xl md:text-3xl font-mono py-6 pl-16 pr-6 focus:outline-none transition-colors clip-path-chamfer disabled:opacity-50 relative z-0 ${status !== 'idle' ? 'border-[#00DAF3] shadow-[0_0_30px_rgba(0,218,243,0.2)]' : 'border-[#353535] focus:border-[#FFF000] focus:shadow-[0_0_30px_rgba(255,240,0,0.1)]'}`}
              placeholder="输入坐标..."
              spellCheck={false}
            />
            <div className="absolute inset-y-0 right-0 pr-6 flex items-center z-10">
              <div className={`font-mono text-xs hidden md:block transition-colors ${status !== 'idle' ? 'text-[#00DAF3]' : 'text-[#353535] group-focus-within:text-[#FFF000]'}`}>
                [PRESS ENTER TO EXECUTE]
              </div>
            </div>
          </form>

          {/* Terminal Logs */}
          <div className="mt-12 h-48 font-mono text-sm flex flex-col gap-3 bg-[#131313]/50 p-6 border border-[#353535] clip-path-chamfer-small">
            {logs.length === 0 ? (
              <div className="text-[#353535] animate-pulse">等待输入...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`${i === logs.length - 1 ? (status === 'connecting' ? 'text-[#00DAF3] animate-pulse' : 'text-[#FFF000] animate-pulse') : 'text-[#959177]'}`}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
