/**
 * Root layout shell for the Zenless Tavern.
 *
 * All pages rendered inside <Layout /> share:
 *   - Top navigation bar
 *   - Left sidebar (desktop)
 *   - Bottom system panel
 *   - Background overlay effects (noise + CRT)
 *
 * Per the project charter, new pages only replace the <Outlet /> content
 * inside this skeleton — they must NOT redefine the outer structure.
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Cpu,
  Radio,
  UserCircle2,
  ShieldCheck,
  Network,
  TerminalSquare,
  Settings,
  LogOut,
} from 'lucide-react';
import { OverlayEffects, NavLink, SystemPanel } from '../ui';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="bg-[var(--zt-bg)] text-[var(--zt-text)] font-sans overflow-hidden selection:bg-[var(--zt-accent-primary)] selection:text-[var(--zt-accent-primary-fg)] min-h-screen relative flex">
      <OverlayEffects />

      {/* ── Top Navigation Bar ─────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 bg-[var(--zt-bg)]/90 backdrop-blur-md border-b-4 border-[var(--zt-line)]">
        <div className="flex items-center gap-4">
          <div className="text-xl font-black italic text-[var(--zt-accent-primary)] font-headline tracking-tighter">
            新艾利都代理人
          </div>
          <div className="h-4 w-[2px] bg-[var(--zt-line)]" />
          <div className="font-headline tracking-widest uppercase text-xs flex gap-6">
            <NavLink to="/" active={location.pathname === '/'}>区域</NavLink>
            <NavLink to="/time-sync" active={location.pathname === '/time-sync'}>时间同步</NavLink>
            <a href="#" className="text-[var(--zt-muted)] hover:bg-[var(--zt-accent-primary)] hover:text-[var(--zt-bg)] transition-all duration-75 hover:skew-x-2">
              信号
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4">
            <Cpu className="w-5 h-5 text-[var(--zt-muted)] hover:text-[var(--zt-accent-primary)] cursor-pointer" />
            <Radio className="w-5 h-5 text-[var(--zt-muted)] hover:text-[var(--zt-accent-primary)] cursor-pointer" />
            <UserCircle2 className="w-5 h-5 text-[var(--zt-accent-primary)] cursor-pointer" />
          </div>
        </div>
      </nav>

      {/* ── Left Sidebar (desktop) ─────────────────────────── */}
      <aside className="fixed left-0 top-0 h-screen flex flex-col pt-20 bg-[var(--zt-surface-alt)] w-64 border-r-4 border-[var(--zt-line)] z-40 hidden md:flex">
        <div className="px-6 mb-8">
          <div className="text-2xl font-black text-[var(--zt-accent-secondary)] font-headline mb-1">ZENLESS_ID</div>
          <div className="font-headline font-bold text-sm tracking-tighter text-[var(--zt-muted)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            [RANK: S]
          </div>
        </div>

        <nav className="flex-1 px-2">
          <NavLink to="/" active={location.pathname === '/'} variant="sidebar" icon={<Network className="w-5 h-5" />}>
            代理人网络
          </NavLink>
          <NavLink to="/inter-knot" active={location.pathname === '/inter-knot'} variant="sidebar" icon={<TerminalSquare className="w-5 h-5" />}>
            绳网
          </NavLink>
        </nav>

        <div className="mt-auto border-t border-[var(--zt-line)] p-4 space-y-2">
          <Link to="/settings" className="text-[var(--zt-muted)] p-2 flex items-center gap-3 hover:text-white transition-colors cursor-pointer text-xs font-bold w-full">
            <Settings className="w-4 h-4" /> 系统设置
          </Link>
          <div className="text-[var(--zt-muted)] p-2 flex items-center gap-3 hover:text-red-500 transition-colors cursor-pointer text-xs font-bold">
            <LogOut className="w-4 h-4" /> 退出登录
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────── */}
      <main className="md:ml-64 pt-24 pb-20 px-8 min-h-screen relative flex flex-col w-full overflow-y-auto">
        <Outlet />
      </main>

      {/* ── Bottom System Panel ────────────────────────────── */}
      <SystemPanel />
    </div>
  );
}
