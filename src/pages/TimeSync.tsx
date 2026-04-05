import { useState, useEffect } from 'react';
import { Github, Cloud, CloudUpload, CloudDownload, AlertCircle, CheckCircle2, RefreshCw, Key, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';

export default function TimeSync() {
  const [token, setToken] = useState('');
  const [isBound, setIsBound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    const lastSync = localStorage.getItem('github_last_sync');
    if (lastSync) setLastSyncTime(lastSync);
  }, []);

  const handleBind = async () => {
    const normalizedToken = token.trim();
    if (!normalizedToken) return;

    setLoading(true);
    try {
      await api.validateGitHubToken(normalizedToken);
      setToken(normalizedToken);
      setIsBound(true);
    } catch (err) {
      alert('GitHub Token 验证失败，请检查 Token 是否有效。');
    } finally {
      setLoading(false);
    }
  };

  const handleUnbind = () => {
    if (confirm('确定要解除 GitHub 绑定吗？未同步的数据可能会丢失。')) {
      localStorage.removeItem('github_last_sync');
      setToken('');
      setIsBound(false);
      setLastSyncTime(null);
    }
  };

  const handleSync = async (direction: 'up' | 'down') => {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      alert('请先输入并验证 GitHub Token。');
      return;
    }

    setSyncStatus('syncing');
    try {
      await api.syncData(direction, normalizedToken);

      setSyncStatus('success');
      const now = new Date().toLocaleString();
      setLastSyncTime(now);
      localStorage.setItem('github_last_sync', now);
      
      if (direction === 'down') {
        alert('下行同步成功！页面即将刷新以加载最新数据。');
        window.location.reload();
      } else {
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      alert(`同步失败: ${err.message}`);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full relative z-10 flex-1 flex flex-col py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-1 w-12 bg-[#00DAF3]"></div>
          <span className="font-headline text-[#00DAF3] text-xs tracking-[0.3em] font-bold uppercase">Cloud Synchronization</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black font-headline text-white leading-none tracking-tighter">
          时间同步 // 云端
        </h1>
        <p className="text-[#959177] font-headline mt-4 text-lg max-w-xl">
          [ 数据保险箱 ] // 将您的代理人档案、世界书和通讯记录同步至 GitHub Gist。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Status & Actions */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#1c1b1b] border-2 border-[#353535] clip-path-chamfer p-6 relative">
            <div className="flex items-center justify-between mb-6 border-b border-[#353535] pb-4">
              <div className="flex items-center gap-3">
                <Cloud className="text-[#00DAF3] w-6 h-6" />
                <span className="font-headline font-bold text-white tracking-widest">同步状态</span>
              </div>
              {isBound ? (
                <div className="flex items-center gap-2 text-xs font-headline text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/30">
                  <CheckCircle2 className="w-4 h-4" /> 已连接
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-headline text-[#FA5C1C] bg-[#FA5C1C]/10 px-3 py-1.5 rounded-full border border-[#FA5C1C]/30">
                  <AlertCircle className="w-4 h-4" /> 未连接
                </div>
              )}
            </div>

            {isBound ? (
              <div className="space-y-6">
                <div className="bg-[#131313] p-4 border border-[#353535] rounded-sm">
                  <div className="text-[#959177] text-xs font-bold mb-1">最后同步时间</div>
                  <div className="text-[#e5e2e1] font-mono">{lastSyncTime || '从未同步'}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleSync('up')}
                    disabled={syncStatus === 'syncing'}
                    className="bg-[#00DAF3]/10 border border-[#00DAF3]/50 text-[#00DAF3] hover:bg-[#00DAF3] hover:text-[#131313] transition-colors p-4 flex flex-col items-center justify-center gap-3 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <CloudUpload className={`w-8 h-8 ${syncStatus === 'syncing' ? 'animate-bounce' : 'group-hover:-translate-y-1 transition-transform'}`} />
                    <span className="font-bold font-headline tracking-widest">上行同步</span>
                    <span className="text-[10px] opacity-70">备份本地数据至云端</span>
                  </button>
                  
                  <button 
                    onClick={() => handleSync('down')}
                    disabled={syncStatus === 'syncing'}
                    className="bg-[#FFF000]/10 border border-[#FFF000]/50 text-[#FFF000] hover:bg-[#FFF000] hover:text-[#131313] transition-colors p-4 flex flex-col items-center justify-center gap-3 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <CloudDownload className={`w-8 h-8 ${syncStatus === 'syncing' ? 'animate-bounce' : 'group-hover:translate-y-1 transition-transform'}`} />
                    <span className="font-bold font-headline tracking-widest">下行同步</span>
                    <span className="text-[10px] opacity-70">从云端恢复本地数据</span>
                  </button>
                </div>

                {syncStatus === 'syncing' && (
                  <div className="flex items-center justify-center gap-2 text-[#00DAF3] text-sm font-bold animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" /> 正在与 GitHub Gist 交换数据...
                  </div>
                )}
                {syncStatus === 'success' && (
                  <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" /> 同步完成
                  </div>
                )}

                <div className="pt-4 border-t border-[#353535] text-right">
                  <button 
                    onClick={handleUnbind}
                    className="text-xs text-[#959177] hover:text-red-400 transition-colors underline underline-offset-4"
                  >
                    解除 GitHub 绑定
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Github className="w-16 h-16 text-[#353535] mx-auto mb-4" />
                <p className="text-[#959177] mb-6">绑定 GitHub 账号以启用云端同步功能。<br/>您的数据将安全地存储在私有 Gist 中。</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Binding Setup */}
        {!isBound && (
          <div className="bg-[#1c1b1b] border-2 border-[#353535] clip-path-chamfer p-6 relative flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-[#353535] pb-4">
              <Key className="text-[#FFF000] w-6 h-6" />
              <span className="font-headline font-bold text-white tracking-widest">认证配置</span>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <label className="block text-[#959177] text-xs font-bold mb-2">
                  GITHUB PERSONAL ACCESS TOKEN (PAT)
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-[#131313] border border-[#353535] text-white p-3 focus:border-[#FFF000] outline-none font-mono text-sm transition-colors"
                />
              </div>

              <div className="bg-[#353535]/30 p-4 border-l-2 border-[#00DAF3] text-sm text-[#e5e2e1] space-y-2">
                <p className="font-bold text-[#00DAF3]">如何获取 Token？</p>
                <ol className="list-decimal list-inside space-y-1 text-[#959177] ml-1">
                  <li>访问 GitHub <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-[#00DAF3] hover:underline inline-flex items-center gap-1">Developer Settings <ExternalLink className="w-3 h-3" /></a></li>
                  <li>点击 "Generate new token (classic)"</li>
                  <li>勾选 <code className="bg-[#131313] px-1 py-0.5 rounded text-[#FFF000]">gist</code> 权限</li>
                  <li>生成并复制 Token 粘贴至上方</li>
                </ol>
              </div>
            </div>

            <button
              onClick={handleBind}
              disabled={!token.trim() || loading}
              className="mt-6 w-full bg-[#FFF000] text-[#131313] font-black font-headline tracking-widest py-4 hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-[#FFF000] flex justify-center items-center gap-2 clip-path-chamfer-small"
            >
              {loading ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> 验证中...</>
              ) : (
                <><Github className="w-5 h-5" /> 建立连接</>
              )}
            </button>
          </div>
        )}
        
        {isBound && (
           <div className="bg-[#1c1b1b] border-2 border-[#353535] clip-path-chamfer p-6 relative flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-[#353535] pb-4">
              <Github className="text-[#FFF000] w-6 h-6" />
              <span className="font-headline font-bold text-white tracking-widest">GITHUB GIST 信息</span>
            </div>
            
            <div className="space-y-4">
              <div className="bg-[#131313] p-4 border border-[#353535] rounded-sm">
                <div className="text-[#959177] text-xs font-bold mb-1">Gist ID</div>
                <div className="text-[#e5e2e1] font-mono text-sm">自动分配 (Private)</div>
              </div>
              <div className="bg-[#131313] p-4 border border-[#353535] rounded-sm">
                <div className="text-[#959177] text-xs font-bold mb-1">同步内容</div>
                <ul className="text-[#e5e2e1] text-sm space-y-2 mt-2">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#00DAF3]" /> 代理人预设 (Characters)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#00DAF3]" /> 世界书词条 (Lorebooks)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#00DAF3]" /> 私信通讯记录 (Chat History)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#00DAF3]" /> 终端设置 (Settings)</li>
                </ul>
              </div>
            </div>
           </div>
        )}
      </div>
    </div>
  );
}
