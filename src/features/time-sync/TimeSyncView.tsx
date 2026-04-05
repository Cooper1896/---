/**
 * TimeSync page – View
 *
 * Cloud synchronization via GitHub Gist.
 * Uses MVU architecture with shared UI components and theme tokens.
 */
import { useEffect } from 'react';
import { Github, Cloud, CloudUpload, CloudDownload, AlertCircle, CheckCircle2, RefreshCw, Key, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import { useMvu } from '../../mvu';
import { PageHeader } from '../../ui';
import { initTimeSyncModel } from './model';
import { timeSyncUpdate } from './update';
import type { TimeSyncMsg } from './update';

export default function TimeSyncView() {
  const { model, dispatch } = useMvu(timeSyncUpdate, initTimeSyncModel);
  const send = (msg: TimeSyncMsg) => dispatch(msg);

  useEffect(() => {
    const lastSync = localStorage.getItem('github_last_sync');
    if (lastSync) send({ type: 'SET_LAST_SYNC', time: lastSync });
  }, []);

  const handleBind = async () => {
    const normalizedToken = model.token.trim();
    if (!normalizedToken) return;
    send({ type: 'SET_LOADING', loading: true });
    try {
      await api.validateGitHubToken(normalizedToken);
      send({ type: 'SET_TOKEN', token: normalizedToken });
      send({ type: 'SET_BOUND', bound: true });
    } catch {
      alert('GitHub Token 验证失败，请检查 Token 是否有效。');
    } finally {
      send({ type: 'SET_LOADING', loading: false });
    }
  };

  const handleUnbind = () => {
    if (confirm('确定要解除 GitHub 绑定吗？未同步的数据可能会丢失。')) {
      localStorage.removeItem('github_last_sync');
      send({ type: 'SET_TOKEN', token: '' });
      send({ type: 'SET_BOUND', bound: false });
      send({ type: 'SET_LAST_SYNC', time: null });
    }
  };

  const handleSync = async (direction: 'up' | 'down') => {
    const normalizedToken = model.token.trim();
    if (!normalizedToken) {
      alert('请先输入并验证 GitHub Token。');
      return;
    }
    send({ type: 'SET_SYNC_STATUS', status: 'syncing' });
    try {
      await api.syncData(direction, normalizedToken);
      send({ type: 'SET_SYNC_STATUS', status: 'success' });
      const now = new Date().toLocaleString();
      send({ type: 'SET_LAST_SYNC', time: now });
      localStorage.setItem('github_last_sync', now);
      if (direction === 'down') {
        alert('下行同步成功！页面即将刷新以加载最新数据。');
        window.location.reload();
      } else {
        setTimeout(() => send({ type: 'SET_SYNC_STATUS', status: 'idle' }), 3000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Sync error:', err);
      alert(`同步失败: ${message}`);
      send({ type: 'SET_SYNC_STATUS', status: 'error' });
      setTimeout(() => send({ type: 'SET_SYNC_STATUS', status: 'idle' }), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full relative z-10 flex-1 flex flex-col py-8">
      <PageHeader
        label="Cloud Synchronization"
        title="时间同步 // 云端"
        subtitle="[ 数据保险箱 ] // 将您的代理人档案、世界书和通讯记录同步至 GitHub Gist。"
        accent="var(--zt-accent-tertiary)"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Status & Actions */}
        <div className="flex flex-col gap-6">
          <div className="bg-[var(--zt-surface)] border-2 border-[var(--zt-line)] clip-path-chamfer p-6 relative">
            <div className="flex items-center justify-between mb-6 border-b border-[var(--zt-line)] pb-4">
              <div className="flex items-center gap-3">
                <Cloud className="text-[var(--zt-accent-tertiary)] w-6 h-6" />
                <span className="font-headline font-bold text-white tracking-widest">同步状态</span>
              </div>
              {model.isBound ? (
                <div className="flex items-center gap-2 text-xs font-headline text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/30">
                  <CheckCircle2 className="w-4 h-4" /> 已连接
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-headline text-[var(--zt-accent-secondary)] bg-[var(--zt-accent-secondary)]/10 px-3 py-1.5 rounded-full border border-[var(--zt-accent-secondary)]/30">
                  <AlertCircle className="w-4 h-4" /> 未连接
                </div>
              )}
            </div>

            {model.isBound ? (
              <div className="space-y-6">
                <div className="bg-[var(--zt-bg)] p-4 border border-[var(--zt-line)] rounded-sm">
                  <div className="text-[var(--zt-muted)] text-xs font-bold mb-1">最后同步时间</div>
                  <div className="text-[var(--zt-text)] font-mono">{model.lastSyncTime || '从未同步'}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleSync('up')}
                    disabled={model.syncStatus === 'syncing'}
                    className="bg-[var(--zt-accent-tertiary)]/10 border border-[var(--zt-accent-tertiary)]/50 text-[var(--zt-accent-tertiary)] hover:bg-[var(--zt-accent-tertiary)] hover:text-[var(--zt-bg)] transition-colors p-4 flex flex-col items-center justify-center gap-3 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <CloudUpload className={`w-8 h-8 ${model.syncStatus === 'syncing' ? 'animate-bounce' : 'group-hover:-translate-y-1 transition-transform'}`} />
                    <span className="font-bold font-headline tracking-widest">上行同步</span>
                    <span className="text-[10px] opacity-70">备份本地数据至云端</span>
                  </button>

                  <button
                    onClick={() => handleSync('down')}
                    disabled={model.syncStatus === 'syncing'}
                    className="bg-[var(--zt-accent-primary)]/10 border border-[var(--zt-accent-primary)]/50 text-[var(--zt-accent-primary)] hover:bg-[var(--zt-accent-primary)] hover:text-[var(--zt-bg)] transition-colors p-4 flex flex-col items-center justify-center gap-3 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <CloudDownload className={`w-8 h-8 ${model.syncStatus === 'syncing' ? 'animate-bounce' : 'group-hover:translate-y-1 transition-transform'}`} />
                    <span className="font-bold font-headline tracking-widest">下行同步</span>
                    <span className="text-[10px] opacity-70">从云端恢复本地数据</span>
                  </button>
                </div>

                {model.syncStatus === 'syncing' && (
                  <div className="flex items-center justify-center gap-2 text-[var(--zt-accent-tertiary)] text-sm font-bold animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" /> 正在与 GitHub Gist 交换数据...
                  </div>
                )}
                {model.syncStatus === 'success' && (
                  <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" /> 同步完成
                  </div>
                )}

                <div className="pt-4 border-t border-[var(--zt-line)] text-right">
                  <button
                    onClick={handleUnbind}
                    className="text-xs text-[var(--zt-muted)] hover:text-red-400 transition-colors underline underline-offset-4"
                  >
                    解除 GitHub 绑定
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Github className="w-16 h-16 text-[var(--zt-line)] mx-auto mb-4" />
                <p className="text-[var(--zt-muted)] mb-6">绑定 GitHub 账号以启用云端同步功能。<br/>您的数据将安全地存储在私有 Gist 中。</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Binding Setup */}
        {!model.isBound && (
          <div className="bg-[var(--zt-surface)] border-2 border-[var(--zt-line)] clip-path-chamfer p-6 relative flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-[var(--zt-line)] pb-4">
              <Key className="text-[var(--zt-accent-primary)] w-6 h-6" />
              <span className="font-headline font-bold text-white tracking-widest">认证配置</span>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <label className="block text-[var(--zt-muted)] text-xs font-bold mb-2">
                  GITHUB PERSONAL ACCESS TOKEN (PAT)
                </label>
                <input
                  type="password"
                  value={model.token}
                  onChange={(e) => send({ type: 'SET_TOKEN', token: e.target.value })}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-[var(--zt-bg)] border border-[var(--zt-line)] text-white p-3 focus:border-[var(--zt-accent-primary)] outline-none font-mono text-sm transition-colors"
                />
              </div>

              <div className="bg-[var(--zt-line)]/30 p-4 border-l-2 border-[var(--zt-accent-tertiary)] text-sm text-[var(--zt-text)] space-y-2">
                <p className="font-bold text-[var(--zt-accent-tertiary)]">如何获取 Token？</p>
                <ol className="list-decimal list-inside space-y-1 text-[var(--zt-muted)] ml-1">
                  <li>访问 GitHub <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-[var(--zt-accent-tertiary)] hover:underline inline-flex items-center gap-1">Developer Settings <ExternalLink className="w-3 h-3" /></a></li>
                  <li>点击 &quot;Generate new token (classic)&quot;</li>
                  <li>勾选 <code className="bg-[var(--zt-bg)] px-1 py-0.5 rounded text-[var(--zt-accent-primary)]">gist</code> 权限</li>
                  <li>生成并复制 Token 粘贴至上方</li>
                </ol>
              </div>
            </div>

            <button
              onClick={handleBind}
              disabled={!model.token.trim() || model.loading}
              className="mt-6 w-full bg-[var(--zt-accent-primary)] text-[var(--zt-bg)] font-black font-headline tracking-widest py-4 hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-[var(--zt-accent-primary)] flex justify-center items-center gap-2 clip-path-chamfer-small"
            >
              {model.loading ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> 验证中...</>
              ) : (
                <><Github className="w-5 h-5" /> 建立连接</>
              )}
            </button>
          </div>
        )}

        {model.isBound && (
          <div className="bg-[var(--zt-surface)] border-2 border-[var(--zt-line)] clip-path-chamfer p-6 relative flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-[var(--zt-line)] pb-4">
              <Github className="text-[var(--zt-accent-primary)] w-6 h-6" />
              <span className="font-headline font-bold text-white tracking-widest">GITHUB GIST 信息</span>
            </div>

            <div className="space-y-4">
              <div className="bg-[var(--zt-bg)] p-4 border border-[var(--zt-line)] rounded-sm">
                <div className="text-[var(--zt-muted)] text-xs font-bold mb-1">Gist ID</div>
                <div className="text-[var(--zt-text)] font-mono text-sm">自动分配 (Private)</div>
              </div>
              <div className="bg-[var(--zt-bg)] p-4 border border-[var(--zt-line)] rounded-sm">
                <div className="text-[var(--zt-muted)] text-xs font-bold mb-1">同步内容</div>
                <ul className="text-[var(--zt-text)] text-sm space-y-2 mt-2">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--zt-accent-tertiary)]" /> 代理人预设 (Characters)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--zt-accent-tertiary)]" /> 世界书词条 (Lorebooks)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--zt-accent-tertiary)]" /> 私信通讯记录 (Chat History)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--zt-accent-tertiary)]" /> 终端设置 (Settings)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
