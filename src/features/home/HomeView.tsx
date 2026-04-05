/**
 * Home page – View (pure presentation)
 *
 * Uses shared PageHeader and theme tokens.
 * MVU: model is trivial for the home page (static content).
 */
import { Zap, ChevronsRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../ui';

export default function HomeView() {
  return (
    <>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--zt-accent-primary)]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10 flex-1 flex flex-col justify-center">
        <PageHeader
          label="System Operator Terminal"
          title="新艾利都代理人终端"
          subtitle="[ 连接已建立 ] // 正在访问空洞数据流..."
          accent="var(--zt-accent-secondary)"
        />

        <div className="grid grid-cols-12 gap-6 h-[450px]">
          {/* Big Card: 进入空洞 (Hollow Exploration) */}
          <div className="col-span-12 md:col-span-5 relative group cursor-pointer overflow-hidden clip-path-chamfer bg-[var(--zt-surface)] border-r-4 border-b-4 border-[var(--zt-line)] hover:border-[var(--zt-accent-secondary)] transition-colors">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeyYeZLuGjD2OM4I_qY5FV0ifbOKbOTPJK4P1ms87zYvSNaIzLFOuiWo5Z1rXTo9JPWGMJ8lftm84qRw6L64g2ThjUY2vb39t0GHSjBuSR1zGAGi5vkDKrH9kPSj4bwjpUCB1zB1CZMz_msetMarNb_nbSwk2AEaGJcpQx1M6jW6jiFxu43Gh548J6Q1g66KFca1q6L9H_OvLtW7zh4YCi2bfK4y4PiRWr0FXKJSAw2ZqgJmqQSILY6NBSJ0958digwQq1Lkdveg"
              alt="Terminal"
              className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 w-full">
              <div className="mb-2 text-[var(--zt-accent-secondary)] font-headline text-xs font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 fill-current animate-pulse" /> 空洞直连模式
              </div>
              <div className="text-4xl font-black font-headline text-white mb-6">大世界探索</div>
              <Link
                to="/hollow"
                className="w-full bg-[var(--zt-accent-secondary)] text-[var(--zt-bg)] py-4 px-6 font-headline font-black text-xl clip-path-chamfer-small flex justify-between items-center hover:bg-white transition-colors group/btn block"
              >
                进入空洞
                <ChevronsRight className="w-6 h-6 transition-transform group-hover/btn:translate-x-2" />
              </Link>
            </div>
          </div>

          <div className="col-span-12 md:col-span-7 grid gap-6 grid-cols-1">
            {/* Small Card 1: 代理人网络 (Single Character Chat) */}
            <Link
              to="/proxy"
              className="bg-[var(--zt-line)] p-6 relative group cursor-pointer border-l-2 border-[var(--zt-accent-tertiary)]/30 hover:border-[var(--zt-accent-tertiary)] transition-colors overflow-hidden block"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--zt-accent-tertiary)]/5 rounded-full blur-2xl group-hover:bg-[var(--zt-accent-tertiary)]/10 transition-colors" />
              <div className="flex flex-col h-full justify-between relative z-10">
                <div>
                  <div className="text-[var(--zt-muted)] text-[10px] font-headline font-bold mb-1">[ 模块: 01 ]</div>
                  <div className="text-2xl font-black font-headline text-white group-hover:text-[var(--zt-accent-tertiary)] transition-colors">代理人网络</div>
                </div>
                <div className="flex items-center justify-between mt-8">
                  <span className="text-[var(--zt-muted)] text-xs font-bold">PROXY_NET_V2.0 (单人攻略)</span>
                  <Users className="w-6 h-6 text-[var(--zt-accent-tertiary)]" />
                </div>
              </div>
            </Link>

            {/* Small Card 2: 时间同步 (Time Sync) */}
            <Link
              to="/time-sync"
              className="bg-[var(--zt-line)] p-6 relative group cursor-pointer border-l-2 border-[var(--zt-accent-secondary)]/30 hover:border-[var(--zt-accent-primary)] transition-colors overflow-hidden block"
            >
              <div className="flex flex-col h-full justify-between relative z-10">
                <div>
                  <div className="text-[var(--zt-muted)] text-[10px] font-headline font-bold mb-1">[ 模块: 02 ]</div>
                  <div className="text-2xl font-black font-headline text-white group-hover:text-[var(--zt-accent-primary)] transition-colors">时间同步</div>
                </div>
                <div className="flex items-center justify-between mt-8">
                  <span className="text-[var(--zt-muted)] text-xs font-bold">CLOUD_SYNC_ACTIVE</span>
                  <Zap className="w-6 h-6 text-[var(--zt-accent-primary)]" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
